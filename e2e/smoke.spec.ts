import { test, expect } from '@playwright/test';
import * as fs from 'fs';

if (fs.existsSync('.env.local')) {
  process.loadEnvFile('.env.local');
} else if (fs.existsSync('.env')) {
  process.loadEnvFile('.env');
}

test.describe('SIMOP DPMPTSP - End-to-End Smoke Tests', () => {
  test('redirects unauthenticated user from /dashboard to /login', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByText('SIMOP DPMPTSP', { exact: false })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Masuk ke Sistem' })).toBeVisible();
  });

  test('redirects unauthenticated user from /admin/pegawai to /login', async ({ page }) => {
    await page.goto('/admin/pegawai');
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByText('Pendaftaran publik dinonaktifkan')).toBeVisible();
  });

  test('admin logs in successfully and lands on dashboard', async ({ page }) => {
    const adminUsername = process.env.E2E_ADMIN_USERNAME || process.env.SEED_ADMIN_USERNAME;
    const adminPassword = process.env.E2E_ADMIN_PASSWORD || process.env.SEED_ADMIN_PASSWORD;

    if (!adminUsername || !adminPassword) {
      throw new Error(
        'Kredensial E2E_ADMIN_USERNAME dan E2E_ADMIN_PASSWORD harus didefinisikan di environment.'
      );
    }

    await page.goto('/login');

    await page.fill('input[placeholder="Masukkan username Anda..."]', adminUsername);
    await page.fill('input[placeholder="Masukkan kata sandi..."]', adminPassword);
    await page.click('button:has-text("Masuk ke Sistem")');

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
    await expect(page.getByText('Pusat Kendali Operasional')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Pegawai Aktif')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Distribusi Penugasan')).toBeVisible({ timeout: 15000 });
  });

  test('employee logs in successfully and is strictly redirected to /dashboard when accessing /admin/pegawai', async ({
    page,
  }) => {
    const pegawaiUsername =
      process.env.E2E_PEGAWAI_USERNAME || 'pegawai_ptsp';
    const pegawaiPassword =
      process.env.E2E_PEGAWAI_PASSWORD || process.env.SEED_PEGAWAI_PASSWORD;

    if (!pegawaiUsername || !pegawaiPassword) {
      throw new Error(
        'Kredensial E2E_PEGAWAI_USERNAME dan E2E_PEGAWAI_PASSWORD harus didefinisikan di environment.'
      );
    }

    await page.goto('/login');

    await page.fill('input[placeholder="Masukkan username Anda..."]', pegawaiUsername);
    await page.fill('input[placeholder="Masukkan kata sandi..."]', pegawaiPassword);
    await page.click('button:has-text("Masuk ke Sistem")');

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
    await expect(page.getByText('Dashboard Tugas Pegawai')).toBeVisible({ timeout: 15000 });

    // Pegawai mencoba mengakses rute khusus administrator
    await page.goto('/admin/pegawai');

    // AdminLayout harus menolak dan mengalihkan kembali ke /dashboard
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
    await expect(page.getByText('Dashboard Tugas Pegawai')).toBeVisible({ timeout: 15000 });
  });

  test('theme toggle switches html class and persists across reload', async ({ page }) => {
    const adminUsername = process.env.E2E_ADMIN_USERNAME || process.env.SEED_ADMIN_USERNAME;
    const adminPassword = process.env.E2E_ADMIN_PASSWORD || process.env.SEED_ADMIN_PASSWORD;

    if (!adminUsername || !adminPassword) {
      throw new Error(
        'Kredensial E2E_ADMIN_USERNAME dan E2E_ADMIN_PASSWORD harus didefinisikan di environment.'
      );
    }

    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/login');
    await page.fill('input[placeholder="Masukkan username Anda..."]', adminUsername);
    await page.fill('input[placeholder="Masukkan kata sandi..."]', adminPassword);
    await page.click('button:has-text("Masuk ke Sistem")');

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });

    // Cari tombol ThemeToggle berdasarkan aria-label
    const themeBtn = page.getByRole('button', { name: 'Pilih tema tampilan' });
    await expect(themeBtn).toBeVisible({ timeout: 10000 });
    await themeBtn.click();

    // Pilih opsi "Gelap"
    await page.getByRole('menuitem', { name: 'Gelap' }).click();

    // Pastikan class "dark" terpasang di elemen <html>
    await expect(page.locator('html')).toHaveClass(/dark/);

    // Muat ulang halaman (reload) dan pastikan preferensi tema gelap bertahan
    await page.reload();
    await expect(page.locator('html')).toHaveClass(/dark/);

    // Pastikan tidak ada pelanggaran CSP di konsol browser
    const cspErrors = consoleErrors.filter((err) =>
      err.toLowerCase().includes('content security policy') ||
      err.toLowerCase().includes('violates') ||
      err.toLowerCase().includes('refused to')
    );
    expect(cspErrors).toEqual([]);

    // Kembalikan ke mode Terang
    const themeBtnAfterReload = page.getByRole('button', { name: 'Pilih tema tampilan' });
    await themeBtnAfterReload.click();
    await page.getByRole('menuitem', { name: 'Terang' }).click();
    await expect(page.locator('html')).not.toHaveClass(/dark/);
  });
});
