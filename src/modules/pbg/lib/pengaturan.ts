import { db } from '@/db';
import { pengaturan } from '@/db/schema/domain';
import { eq } from 'drizzle-orm';
import {
  KEY_WA_BOT_AKTIF,
  KEY_WA_TEMPLATE_REMINDER,
  DEFAULT_WA_TEMPLATE_REMINDER,
} from './template';

export {
  KEY_WA_BOT_AKTIF,
  KEY_WA_TEMPLATE_REMINDER,
  DEFAULT_WA_TEMPLATE_REMINDER,
};

export async function getPengaturan(key: string, defaultValue = ''): Promise<string> {
  const [row] = await db
    .select({ value: pengaturan.value })
    .from(pengaturan)
    .where(eq(pengaturan.key, key))
    .limit(1);

  if (!row) {
    if (key === KEY_WA_BOT_AKTIF) return 'false';
    if (key === KEY_WA_TEMPLATE_REMINDER) return DEFAULT_WA_TEMPLATE_REMINDER;
    return defaultValue;
  }

  return row.value;
}

export async function setPengaturan(key: string, value: string): Promise<void> {
  await db
    .insert(pengaturan)
    .values({
      key,
      value,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: pengaturan.key,
      set: {
        value,
        updatedAt: new Date(),
      },
    });
}

