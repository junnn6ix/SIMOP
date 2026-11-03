import { describe, it, expect, beforeEach } from 'vitest';
import { betterAuth } from 'better-auth';
import { memoryAdapter } from 'better-auth/adapters/memory';
import { createAuthOptions, getSyntheticEmail } from '@/lib/auth';

describe('Better Auth Security Policies (Production Parity)', () => {
  let memoryDb: {
    user: any[];
    session: any[];
    account: any[];
    verification: any[];
    rateLimit: any[];
  };
  let testAuth: any;

  beforeEach(() => {
    memoryDb = {
      user: [],
      session: [],
      account: [],
      verification: [],
      rateLimit: [],
    };

    // Menggunakan factory createAuthOptions LANGSUNG dari src/lib/auth.ts (Production Config)
    testAuth = betterAuth(createAuthOptions(memoryAdapter(memoryDb)));
  });

  it('1. rejects public email and password sign up', async () => {
    let errorCaught: any = null;
    try {
      await testAuth.api.signUpEmail({
        body: {
          email: 'public_intruder@simop.local',
          password: 'Password123!',
          name: 'Public Intruder',
        },
      });
    } catch (err: any) {
      errorCaught = err;
    }

    expect(errorCaught).toBeDefined();
    expect(errorCaught.body?.code || errorCaught.code || errorCaught.message).toMatch(
      /EMAIL_PASSWORD_SIGN_UP_DISABLED|not enabled/i
    );
  });

  it('2. prevents pegawai from escalating or modifying their own role (input: false)', async () => {
    // 1. Buat admin awal
    await testAuth.api.createUser({
      body: {
        name: 'Super Admin',
        email: getSyntheticEmail('admin_test'),
        password: 'PasswordAdmin123!',
        role: 'ADMIN',
        data: {
          username: 'admin_test',
          bidang: 'SEKRETARIAT',
          aktif: true,
        },
      },
    });

    const adminSignIn = await testAuth.api.signInUsername({
      asResponse: true,
      body: { username: 'admin_test', password: 'PasswordAdmin123!' },
    });
    const adminHeaders = new Headers({
      cookie: adminSignIn.headers.get('set-cookie') || '',
    });

    // 2. Admin membuat pegawai
    const pegawai = await testAuth.api.createUser({
      headers: adminHeaders,
      body: {
        name: 'Pegawai Lapangan',
        email: getSyntheticEmail('pegawai_test'),
        password: 'PasswordPegawai123!',
        role: 'PEGAWAI',
        data: {
          username: 'pegawai_test',
          bidang: 'PTSP',
          aktif: true,
        },
      },
    });

    expect(pegawai.user.role).toBe('PEGAWAI');

    // 3. Pegawai sign in
    const pegSignIn = await testAuth.api.signInUsername({
      asResponse: true,
      body: {
        username: 'pegawai_test',
        password: 'PasswordPegawai123!',
      },
    });

    const pegHeaders = new Headers({
      cookie: pegSignIn.headers.get('set-cookie') || '',
    });

    // 4. Pegawai mencoba mengubah role sendiri via updateUser -> ditolak input: false
    let updateRoleError: any = null;
    try {
      await testAuth.api.updateUser({
        headers: pegHeaders,
        body: {
          role: 'ADMIN',
        },
      });
    } catch (err: any) {
      updateRoleError = err;
    }

    expect(updateRoleError).toBeDefined();
    expect(updateRoleError.body?.code || updateRoleError.message).toMatch(
      /FIELD_NOT_ALLOWED|not allowed/i
    );

    // 5. Pegawai mencoba menembak endpoint setRole -> ditolak 403 FORBIDDEN
    let setRoleError: any = null;
    try {
      await testAuth.api.setRole({
        headers: pegHeaders,
        body: {
          userId: pegawai.user.id,
          role: 'ADMIN',
        },
      });
    } catch (err: any) {
      setRoleError = err;
    }

    expect(setRoleError).toBeDefined();
    expect(setRoleError.statusCode).toBe(403);
    expect(setRoleError.status).toBe('FORBIDDEN');

    // Pastikan role tetap PEGAWAI di database
    const checkUser = memoryDb.user.find((u) => u.id === pegawai.user.id);
    expect(checkUser.role).toBe('PEGAWAI');
  });

  it('3. blocks inactive (aktif = false) or banned user from access', async () => {
    await testAuth.api.createUser({
      body: {
        name: 'Super Admin',
        email: getSyntheticEmail('admin_ban'),
        password: 'PasswordAdmin123!',
        role: 'ADMIN',
        data: { username: 'admin_ban', bidang: 'SEKRETARIAT', aktif: true },
      },
    });

    const adminSignIn = await testAuth.api.signInUsername({
      asResponse: true,
      body: { username: 'admin_ban', password: 'PasswordAdmin123!' },
    });
    const adminHeaders = new Headers({
      cookie: adminSignIn.headers.get('set-cookie') || '',
    });

    // Buat akun pegawai nonaktif
    const pegawai = await testAuth.api.createUser({
      headers: adminHeaders,
      body: {
        name: 'Pegawai Diblokir',
        email: getSyntheticEmail('pegawai_banned'),
        password: 'Password123!',
        role: 'PEGAWAI',
        data: {
          username: 'pegawai_banned',
          bidang: 'PM',
          aktif: false,
        },
      },
    });

    // Admin membanned akun
    await testAuth.api.banUser({
      headers: adminHeaders,
      body: {
        userId: pegawai.user.id,
        banReason: 'Akun dinonaktifkan oleh administrator dinas',
      },
    });

    // Percobaan masuk ditolak
    let signInError: any = null;
    try {
      await testAuth.api.signInUsername({
        body: {
          username: 'pegawai_banned',
          password: 'Password123!',
        },
      });
    } catch (err: any) {
      signInError = err;
    }

    expect(signInError).toBeDefined();
    expect(signInError.statusCode).toBe(403);
    expect(signInError.status).toBe('FORBIDDEN');
  });

  it('4. immediately revokes active sessions when account is deactivated/sessions revoked', async () => {
    await testAuth.api.createUser({
      body: {
        name: 'Super Admin',
        email: getSyntheticEmail('admin_revoke'),
        password: 'PasswordAdmin123!',
        role: 'ADMIN',
        data: { username: 'admin_revoke', bidang: 'SEKRETARIAT', aktif: true },
      },
    });

    const adminSignIn = await testAuth.api.signInUsername({
      asResponse: true,
      body: { username: 'admin_revoke', password: 'PasswordAdmin123!' },
    });
    const adminHeaders = new Headers({
      cookie: adminSignIn.headers.get('set-cookie') || '',
    });

    const activePegawai = await testAuth.api.createUser({
      headers: adminHeaders,
      body: {
        name: 'Pegawai Aktif',
        email: getSyntheticEmail('pegawai_aktif'),
        password: 'Password123!',
        role: 'PEGAWAI',
        data: {
          username: 'pegawai_aktif',
          bidang: 'PENGAWASAN',
          aktif: true,
        },
      },
    });

    const signInRes = await testAuth.api.signInUsername({
      asResponse: true,
      body: {
        username: 'pegawai_aktif',
        password: 'Password123!',
      },
    });

    const pegCookie = signInRes.headers.get('set-cookie') || '';
    const pegHeaders = new Headers({ cookie: pegCookie });

    const sessionBefore = await testAuth.api.getSession({
      headers: pegHeaders,
    });
    expect(sessionBefore?.session).toBeDefined();
    expect(sessionBefore?.user?.id).toBe(activePegawai.user.id);

    // Admin mencabut seluruh sesi pengguna
    await testAuth.api.revokeUserSessions({
      headers: adminHeaders,
      body: {
        userId: activePegawai.user.id,
      },
    });

    // Sesi seketika menjadi null
    const sessionAfter = await testAuth.api.getSession({
      headers: pegHeaders,
    });
    expect(sessionAfter).toBeNull();
  });

  it('5. strictly denies all /api/auth/admin/* endpoints for PEGAWAI role', async () => {
    // 1. Setup Admin dan Pegawai
    await testAuth.api.createUser({
      body: {
        name: 'Super Admin',
        email: getSyntheticEmail('admin_sec'),
        password: 'PasswordAdmin123!',
        role: 'ADMIN',
        data: { username: 'admin_sec', bidang: 'SEKRETARIAT', aktif: true },
      },
    });

    const adminSignIn = await testAuth.api.signInUsername({
      asResponse: true,
      body: { username: 'admin_sec', password: 'PasswordAdmin123!' },
    });
    const adminHeaders = new Headers({
      cookie: adminSignIn.headers.get('set-cookie') || '',
    });

    const pegawai = await testAuth.api.createUser({
      headers: adminHeaders,
      body: {
        name: 'Pegawai Uji',
        email: getSyntheticEmail('pegawai_sec'),
        password: 'PasswordPegawai123!',
        role: 'PEGAWAI',
        data: { username: 'pegawai_sec', bidang: 'PTSP', aktif: true },
      },
    });

    // Pegawai login
    const pegSignIn = await testAuth.api.signInUsername({
      asResponse: true,
      body: { username: 'pegawai_sec', password: 'PasswordPegawai123!' },
    });
    const pegHeaders = new Headers({
      cookie: pegSignIn.headers.get('set-cookie') || '',
    });

    // Verifikasi penolakan pada endpoint admin 1: createUser
    await expect(
      testAuth.api.createUser({
        headers: pegHeaders,
        body: {
          name: 'Hacker User',
          email: 'hacker@simop.local',
          password: 'Password123!',
          role: 'ADMIN',
        },
      })
    ).rejects.toMatchObject({ statusCode: 403, status: 'FORBIDDEN' });

    // Verifikasi penolakan pada endpoint admin 2: banUser
    await expect(
      testAuth.api.banUser({
        headers: pegHeaders,
        body: { userId: pegawai.user.id },
      })
    ).rejects.toMatchObject({ statusCode: 403, status: 'FORBIDDEN' });

    // Verifikasi penolakan pada endpoint admin 3: listUsers
    await expect(
      testAuth.api.listUsers({
        headers: pegHeaders,
        query: {},
      })
    ).rejects.toMatchObject({ statusCode: 403, status: 'FORBIDDEN' });

    // Verifikasi penolakan pada endpoint admin 4: revokeUserSessions
    await expect(
      testAuth.api.revokeUserSessions({
        headers: pegHeaders,
        body: { userId: pegawai.user.id },
      })
    ).rejects.toMatchObject({ statusCode: 403, status: 'FORBIDDEN' });
  });
});
