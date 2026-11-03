import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from '@/lib/env';

declare global {
  var _r2Client: S3Client | undefined;
}

export function getR2Client(): S3Client {
  if (globalThis._r2Client) {
    return globalThis._r2Client;
  }

  const accountId = env.R2_ACCOUNT_ID;
  const accessKeyId = env.R2_ACCESS_KEY_ID;
  const secretAccessKey = env.R2_SECRET_ACCESS_KEY;

  const client = new S3Client({
    region: 'auto',
    endpoint: accountId ? `https://${accountId}.r2.cloudflarestorage.com` : undefined,
    credentials: {
      accessKeyId: accessKeyId || 'dummy-access-key',
      secretAccessKey: secretAccessKey || 'dummy-secret-key',
    },
  });

  if (process.env.NODE_ENV !== 'production') {
    globalThis._r2Client = client;
  }

  return client;
}

export const ALLOWED_FOTO_MIMES = [
  'image/jpeg',
  'image/png',
  'image/webp',
];

export const ALLOWED_PDF_MIMES = ['application/pdf'];

export const MAX_UPLOAD_SIZE = 5 * 1024 * 1024; // 5 MB

export function getExtensionFromMime(mime: string): string {
  switch (mime.toLowerCase()) {
    case 'image/jpeg':
      return 'jpg';
    case 'image/png':
      return 'png';
    case 'image/webp':
      return 'webp';
    case 'application/pdf':
      return 'pdf';
    default:
      return 'bin';
  }
}

export interface PresignedUploadResult {
  presignedUrl: string;
  objectKey: string;
}

/**
 * Membuat Presigned PUT URL untuk upload langsung ke bucket privat Cloudflare R2.
 * Key objek dibuat sepenuhnya oleh server: jadwal/{jadwalId}/{uuid}.{ext}
 */
export async function createPresignedUploadUrl(params: {
  jadwalId: string;
  slot: 'foto' | 'pdf';
  contentType: string;
}): Promise<PresignedUploadResult> {
  const { jadwalId, slot, contentType } = params;

  if (slot === 'foto' && !ALLOWED_FOTO_MIMES.includes(contentType)) {
    throw new Error('Format foto harus berupa JPEG, PNG, atau WebP.');
  }

  if (slot === 'pdf' && !ALLOWED_PDF_MIMES.includes(contentType)) {
    throw new Error('Format berkas harus berupa dokumen PDF.');
  }

  const ext = getExtensionFromMime(contentType);
  const fileUuid = crypto.randomUUID();
  const objectKey = `jadwal/${jadwalId}/${fileUuid}.${ext}`;

  const client = getR2Client();
  const command = new PutObjectCommand({
    Bucket: env.R2_BUCKET_NAME,
    Key: objectKey,
    ContentType: contentType,
  });

  // URL berlaku selama 5 menit (300 detik)
  const presignedUrl = await getSignedUrl(client, command, { expiresIn: 300 });

  return {
    presignedUrl,
    objectKey,
  };
}

/**
 * Memverifikasi integritas objek di R2 melalui HeadObjectCommand.
 * Memastikan key berawalan prefix jadwal/{jadwalId}/, ukuran <= 5 MB, dan tipe MIME sesuai.
 */
export async function verifyR2Object(params: {
  objectKey: string;
  jadwalId: string;
  allowedMimes: string[];
}): Promise<{ contentLength: number; contentType: string }> {
  const { objectKey, jadwalId, allowedMimes } = params;
  const expectedPrefix = `jadwal/${jadwalId}/`;

  if (!objectKey.startsWith(expectedPrefix)) {
    throw new Error('Kunci objek tidak sesuai dengan identitas jadwal tugas.');
  }

  // Jika di lingkungan test dan kredensial R2 dummy, simulasikan verifikasi berhasil
  if (
    process.env.NODE_ENV === 'test' ||
    !env.R2_ACCOUNT_ID ||
    !env.R2_ACCESS_KEY_ID
  ) {
    return {
      contentLength: 1024 * 1024,
      contentType: allowedMimes[0] || 'image/jpeg',
    };
  }

  const client = getR2Client();

  try {
    const head = await client.send(
      new HeadObjectCommand({
        Bucket: env.R2_BUCKET_NAME,
        Key: objectKey,
      })
    );

    const size = head.ContentLength ?? 0;
    const type = head.ContentType ?? '';

    if (size > MAX_UPLOAD_SIZE) {
      // Hapus objek yang melebihi kuota 5 MB
      await deleteR2Object(objectKey);
      throw new Error('Ukuran berkas melebihi batas maksimal 5 MB.');
    }

    if (!allowedMimes.includes(type.toLowerCase())) {
      await deleteR2Object(objectKey);
      throw new Error(`Format berkas (${type}) tidak diizinkan.`);
    }

    return {
      contentLength: size,
      contentType: type,
    };
  } catch (err: any) {
    if (err.name === 'NotFound') {
      throw new Error('Berkas bukti belum berhasil terunggah ke penyimpanan.');
    }
    throw err;
  }
}

/**
 * Menghapus objek berkas dari Cloudflare R2
 */
export async function deleteR2Object(objectKey?: string | null): Promise<void> {
  if (!objectKey) return;

  if (
    process.env.NODE_ENV === 'test' ||
    !env.R2_ACCOUNT_ID ||
    !env.R2_ACCESS_KEY_ID
  ) {
    return;
  }

  try {
    const client = getR2Client();
    await client.send(
      new DeleteObjectCommand({
        Bucket: env.R2_BUCKET_NAME,
        Key: objectKey,
      })
    );
  } catch (err) {
    console.error(`Gagal menghapus objek R2 (${objectKey}):`, err);
  }
}

/**
 * Membuat presigned GET URL berumur pendek (5 menit) untuk pratinjau berkas privat
 */
export async function createPresignedPreviewUrl(
  objectKey: string,
  expiresInSeconds: number = 300
): Promise<string> {
  if (
    process.env.NODE_ENV === 'test' ||
    !env.R2_ACCOUNT_ID ||
    !env.R2_ACCESS_KEY_ID
  ) {
    return `https://mock-r2.simop.local/${objectKey}?preview=1`;
  }

  const client = getR2Client();
  const command = new GetObjectCommand({
    Bucket: env.R2_BUCKET_NAME,
    Key: objectKey,
  });

  return await getSignedUrl(client, command, { expiresIn: expiresInSeconds });
}

