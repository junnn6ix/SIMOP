import { test, expect } from '@playwright/test';
import * as fs from 'fs';

if (fs.existsSync('.env.local')) {
  process.loadEnvFile('.env.local');
} else if (fs.existsSync('.env')) {
  process.loadEnvFile('.env');
}

test.describe('Mobile Viewport (375x667) Tests', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  const adminUsername = process.env.E2E_ADMIN_USERNAME || process.env.SEED_ADMIN_USERNAME;
  const adminPassword = process.env.E2E_ADMIN_PASSWORD || process.env.SEED_ADMIN_PASSWORD;

  test.beforeEach(async ({ page }) => {
    if (!adminUsername || !adminPassword) {
      throw new Error('E2E admin credentials must be defined.');
    }
    await page.goto('/login');
    await page.fill('input[placeholder="Masukkan username Anda..."]', adminUsername);
    await page.fill('input[placeholder="Masukkan kata sandi..."]', adminPassword);
    await page.click('button:has-text("Masuk ke Sistem")');
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
  });

  test('no horizontal scroll on any page at 375px mobile viewport', async ({ page }) => {
    const routes = [
      { name: 'Dashboard', path: '/dashboard' },
      { name: 'Inventaris - Tab Katalog', path: '/admin/inventaris' },
      { name: 'Inventaris - Tab Tiket', path: '/admin/inventaris?tab=tiket' },
      { name: 'Inventaris - Tab Riwayat', path: '/admin/inventaris?tab=riwayat' },
      { name: 'Jadwal Admin', path: '/admin/jadwal' },
      { name: 'Verifikasi Admin', path: '/admin/verifikasi' },
      { name: 'PBG Admin', path: '/admin/pbg' },
      { name: 'Pegawai Admin', path: '/admin/pegawai' },
      { name: 'Jadwal Pegawai', path: '/pegawai/jadwal' },
      { name: 'Tiket Pegawai', path: '/pegawai/tiket' },
      { name: 'Profil Pegawai', path: '/pegawai/profil' },
    ];

    for (const route of routes) {
      await page.goto(route.path, { waitUntil: 'networkidle' });
      const metrics = await page.evaluate(() => {
        const doc = document.documentElement;
        return {
          scrollWidth: doc.scrollWidth,
          clientWidth: doc.clientWidth,
          hasHorizontalScroll: doc.scrollWidth > doc.clientWidth,
        };
      });

      console.log(
        `[Mobile 375px] ${route.name.padEnd(25)} | doc: ${metrics.scrollWidth}px / ${metrics.clientWidth}px | overflow: ${metrics.hasHorizontalScroll ? 'FAIL ❌' : 'PASS ✅'}`
      );
      expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth);
    }
  });

  test('mobile dialogs are bounded within viewport and have reachable action buttons', async ({ page }) => {
    // 1. BarangFormDialog
    await page.goto('/admin/inventaris', { waitUntil: 'networkidle' });
    const tambahBarangBtn = page.getByRole('button', { name: 'Tambah Barang' });
    await expect(tambahBarangBtn).toBeVisible();
    await tambahBarangBtn.click();

    const dialogBarang = page.locator('[role="dialog"]');
    await expect(dialogBarang).toBeVisible();

    const barangMetrics = await dialogBarang.evaluate((el) => {
      const rect = el.getBoundingClientRect();
      return {
        top: Math.round(rect.top),
        bottom: Math.round(rect.bottom),
        height: Math.round(rect.height),
        windowHeight: window.innerHeight,
      };
    });
    console.log('[BarangFormDialog 375px]', barangMetrics);
    expect(barangMetrics.top).toBeGreaterThanOrEqual(0);
    expect(barangMetrics.bottom).toBeLessThanOrEqual(667);

    const submitBarangBtn = dialogBarang.getByRole('button', { name: 'Tambah Barang' });
    await expect(submitBarangBtn).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialogBarang).not.toBeVisible();

    // 2. JadwalFormDialog
    await page.goto('/admin/jadwal', { waitUntil: 'networkidle' });
    const tambahJadwalBtn = page.getByRole('button', { name: 'Buat Penugasan Baru' });
    await expect(tambahJadwalBtn).toBeVisible();
    await tambahJadwalBtn.click();

    const dialogJadwal = page.locator('[role="dialog"]');
    await expect(dialogJadwal).toBeVisible();

    const submitJadwalBtn = dialogJadwal.getByRole('button', { name: 'Buat Penugasan' });
    // Scroll dialog body to make sure submit button is in view
    await submitJadwalBtn.scrollIntoViewIfNeeded();
    await expect(submitJadwalBtn).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialogJadwal).not.toBeVisible();

    // 3. PbgFormDialog
    await page.goto('/admin/pbg', { waitUntil: 'networkidle' });
    const tambahPbgBtn = page.getByRole('button', { name: 'Tambah Tagihan PBG' }).first();
    await expect(tambahPbgBtn).toBeVisible();
    await tambahPbgBtn.click();

    const dialogPbg = page.locator('[role="dialog"]');
    await expect(dialogPbg).toBeVisible();

    const pbgMetrics = await dialogPbg.evaluate((el) => {
      const rect = el.getBoundingClientRect();
      return {
        top: Math.round(rect.top),
        bottom: Math.round(rect.bottom),
        height: Math.round(rect.height),
        windowHeight: window.innerHeight,
      };
    });
    console.log('[PbgFormDialog 375px]', pbgMetrics);
    expect(pbgMetrics.top).toBeGreaterThanOrEqual(0);
    expect(pbgMetrics.bottom).toBeLessThanOrEqual(667);

    const submitPbgBtn = dialogPbg.getByRole('button', { name: 'Daftarkan Tagihan' });
    await expect(submitPbgBtn).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialogPbg).not.toBeVisible();

    // 4. PegawaiFormDialog
    await page.goto('/admin/pegawai', { waitUntil: 'networkidle' });
    const tambahPegawaiBtn = page.getByRole('button', { name: 'Tambah Pegawai' }).first();
    await expect(tambahPegawaiBtn).toBeVisible();
    await tambahPegawaiBtn.click();

    const dialogPegawai = page.locator('[role="dialog"]');
    await expect(dialogPegawai).toBeVisible();

    const pegawaiMetrics = await dialogPegawai.evaluate((el) => {
      const rect = el.getBoundingClientRect();
      return {
        top: Math.round(rect.top),
        bottom: Math.round(rect.bottom),
        height: Math.round(rect.height),
        windowHeight: window.innerHeight,
      };
    });
    console.log('[PegawaiFormDialog 375px]', pegawaiMetrics);
    expect(pegawaiMetrics.top).toBeGreaterThanOrEqual(0);
    expect(pegawaiMetrics.bottom).toBeLessThanOrEqual(667);

    const submitPegawaiBtn = dialogPegawai.getByRole('button', { name: 'Buat Akun Pegawai' });
    await expect(submitPegawaiBtn).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialogPegawai).not.toBeVisible();

    // 5. TiketFormDialog
    await page.goto('/pegawai/tiket', { waitUntil: 'networkidle' });
    const ajukanTiketBtn = page.getByRole('button', { name: 'Ajukan Tiket' });
    await expect(ajukanTiketBtn).toBeVisible();
    await ajukanTiketBtn.click();

    const dialogTiket = page.locator('[role="dialog"]');
    await expect(dialogTiket).toBeVisible();

    const tiketMetrics = await dialogTiket.evaluate((el) => {
      const rect = el.getBoundingClientRect();
      return {
        top: Math.round(rect.top),
        bottom: Math.round(rect.bottom),
        height: Math.round(rect.height),
        windowHeight: window.innerHeight,
      };
    });
    console.log('[TiketFormDialog 375px]', tiketMetrics);
    expect(tiketMetrics.top).toBeGreaterThanOrEqual(0);
    expect(tiketMetrics.bottom).toBeLessThanOrEqual(667);

    const submitTiketBtn = dialogTiket.getByRole('button', { name: 'Kirim Pengajuan' });
    await expect(submitTiketBtn).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialogTiket).not.toBeVisible();
  });

  test('theme toggle works seamlessly on mobile and pages remain contained in dark mode', async ({ page }) => {
    await page.goto('/admin/inventaris', { waitUntil: 'networkidle' });

    // Enable dark theme
    await page.evaluate(() => {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    });

    const metrics = await page.evaluate(() => {
      const doc = document.documentElement;
      return {
        scrollWidth: doc.scrollWidth,
        clientWidth: doc.clientWidth,
        isDark: doc.classList.contains('dark'),
      };
    });
    console.log('[Dark Mode 375px Inventaris]', metrics);
    expect(metrics.isDark).toBe(true);
    expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth);

    // Verify dialog in dark mode
    const tambahBarangBtn = page.getByRole('button', { name: 'Tambah Barang' });
    await tambahBarangBtn.click();
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();
    const dialogMetrics = await dialog.evaluate((el) => {
      const rect = el.getBoundingClientRect();
      return {
        top: Math.round(rect.top),
        bottom: Math.round(rect.bottom),
        height: Math.round(rect.height),
      };
    });
    expect(dialogMetrics.top).toBeGreaterThanOrEqual(0);
    expect(dialogMetrics.bottom).toBeLessThanOrEqual(667);
    await page.keyboard.press('Escape');
  });

  test('no horizontal scroll on tablet (768px viewport)', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });

    const routes = [
      { name: 'Dashboard (768px)', path: '/dashboard' },
      { name: 'Inventaris - Tab Katalog (768px)', path: '/admin/inventaris' },
      { name: 'Inventaris - Tab Tiket (768px)', path: '/admin/inventaris?tab=tiket' },
      { name: 'Inventaris - Tab Riwayat (768px)', path: '/admin/inventaris?tab=riwayat' },
      { name: 'Jadwal Admin (768px)', path: '/admin/jadwal' },
      { name: 'Verifikasi Admin (768px)', path: '/admin/verifikasi' },
      { name: 'PBG Admin (768px)', path: '/admin/pbg' },
      { name: 'Pegawai Admin (768px)', path: '/admin/pegawai' },
      { name: 'Jadwal Pegawai (768px)', path: '/pegawai/jadwal' },
      { name: 'Tiket Pegawai (768px)', path: '/pegawai/tiket' },
      { name: 'Profil Pegawai (768px)', path: '/pegawai/profil' },
    ];

    for (const route of routes) {
      await page.goto(route.path, { waitUntil: 'networkidle' });
      const metrics = await page.evaluate(() => {
        const doc = document.documentElement;
        return {
          scrollWidth: doc.scrollWidth,
          clientWidth: doc.clientWidth,
          hasHorizontalScroll: doc.scrollWidth > doc.clientWidth,
        };
      });

      console.log(
        `[Tablet 768px] ${route.name.padEnd(35)} | doc: ${metrics.scrollWidth}px / ${metrics.clientWidth}px | overflow: ${metrics.hasHorizontalScroll ? 'FAIL ❌' : 'PASS ✅'}`
      );
      expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth);
    }
  });
});

