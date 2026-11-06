import { maskWaNumber } from '@/modules/pbg/queries';
import { getPengaturan, KEY_WA_BOT_AKTIF } from '@/modules/pbg/lib/pengaturan';
import { normalizeWaNumber } from '@/modules/pbg/schema';

export interface WaSender {
  send(
    to: string,
    message: string
  ): Promise<{ ok: boolean; raw?: string; error?: string }>;
}

export class FonnteWaSender implements WaSender {
  private readonly token: string;
  private readonly endpoint = 'https://api.fonnte.com/send';

  constructor(token: string) {
    this.token = token;
  }

  async send(
    to: string,
    message: string
  ): Promise<{ ok: boolean; raw?: string; error?: string }> {
    const normalizedTo = normalizeWaNumber(to);
    const maskedTo = maskWaNumber(normalizedTo);

    try {
      const formData = new FormData();
      formData.append('target', normalizedTo);
      formData.append('message', message);
      formData.append('countryCode', '62');

      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          Authorization: this.token,
        },
        body: formData,
        signal: AbortSignal.timeout(10_000),
      });

      const responseText = await response.text();
      let responseJson: Record<string, unknown> | null = null;
      try {
        responseJson = JSON.parse(responseText);
      } catch {
        // Respons bukan JSON terstruktur
      }

      const isStatusTrue = responseJson?.status === true;

      if (!response.ok || !isStatusTrue) {
        const errorReason =
          typeof responseJson?.reason === 'string'
            ? responseJson.reason
            : typeof responseJson?.message === 'string'
              ? responseJson.message
              : `HTTP ${response.status}: Pengiriman pesan WhatsApp gagal`;

        return {
          ok: false,
          error: errorReason,
          raw: JSON.stringify({
            status: false,
            target: maskedTo,
            reason: errorReason,
          }),
        };
      }

      return {
        ok: true,
        raw: JSON.stringify({
          status: true,
          target: maskedTo,
          message: typeof responseJson?.message === 'string' ? responseJson.message : 'Terkirim',
        }),
      };
    } catch (err: unknown) {
      const isTimeout = err instanceof Error && err.name === 'TimeoutError';
      const errorMessage = isTimeout
        ? 'Batas waktu koneksi ke server Fonnte terlampaui (timeout 10 detik)'
        : err instanceof Error
          ? err.message
          : 'Terjadi kegagalan komunikasi jaringan dengan Fonnte API';

      return {
        ok: false,
        error: errorMessage,
        raw: JSON.stringify({
          status: false,
          target: maskedTo,
          reason: errorMessage,
        }),
      };
    }
  }
}

export class ConsoleWaSender implements WaSender {
  async send(
    to: string,
    message: string
  ): Promise<{ ok: boolean; raw?: string; error?: string }> {
    const normalizedTo = normalizeWaNumber(to);
    const maskedTo = maskWaNumber(normalizedTo);

    if (process.env.NODE_ENV !== 'test') {
      console.log(
        `[DRY_RUN WA] Mengirim ke: ${maskedTo} | Karakter: ${message.length}`
      );
    }

    return {
      ok: true,
      raw: JSON.stringify({
        status: true,
        target: maskedTo,
        mode: 'DRY_RUN',
      }),
    };
  }
}

/**
 * Memilih implementasi WaSender:
 * Hanya memakai Fonnte jika FONNTE_TOKEN terisi DAN wa_bot_aktif bernilai 'true'.
 * Selain itu, otomatis fallback ke dry-run (ConsoleWaSender).
 */
export async function resolveWaSender(): Promise<WaSender> {
  const token = process.env.FONNTE_TOKEN || '';
  const botAktif = await getPengaturan(KEY_WA_BOT_AKTIF, 'false');

  if (token.trim().length > 0 && botAktif === 'true') {
    return new FonnteWaSender(token.trim());
  }

  return new ConsoleWaSender();
}

/**
 * Factory fleksibel untuk pengujian dan instansiasi langsung.
 */
export function createWaSender(options?: {
  token?: string;
  botAktif?: boolean | string;
}): WaSender {
  const token = options?.token || process.env.FONNTE_TOKEN || '';
  const isAktif =
    options?.botAktif === true || options?.botAktif === 'true';

  if (token.trim().length > 0 && isAktif) {
    return new FonnteWaSender(token.trim());
  }

  return new ConsoleWaSender();
}

