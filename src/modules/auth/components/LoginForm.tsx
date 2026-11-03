'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/shared/Card';
import { FormField } from '@/components/shared/FormField';
import { FormActions } from '@/components/shared/FormActions';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/shared/PasswordInput';
import { InlineAlert } from '@/components/shared/InlineAlert';
import { signIn } from '@/lib/auth-client';

export function LoginForm() {
  const router = useRouter();
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setErrorMessage('Silakan lengkapi nama pengguna dan kata sandi.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await signIn.username({
        username: username.trim(),
        password,
      });

      if (res.error) {
        const errorText = res.error.message || '';
        const errorCode = res.error.code || '';

        if (errorCode === 'BANNED_USER' || errorText.includes('banned')) {
          setErrorMessage('Akun Anda dinonaktifkan atau diblokir. Silakan hubungi administrator dinas.');
        } else if (res.error.status === 429) {
          setErrorMessage('Terlalu banyak percobaan masuk. Mohon tunggu beberapa saat sebelum mencoba lagi.');
        } else {
          setErrorMessage('Nama pengguna atau kata sandi tidak cocok.');
        }
        return;
      }

      toast.success('Berhasil masuk ke SIMOP DPMPTSP.');
      router.push('/');
      router.refresh();
    } catch {
      setErrorMessage('Terjadi kendala saat menghubungi server. Silakan coba kembali.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full shadow-xl border border-border">
      <CardHeader className="text-center space-y-2 pb-6">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-btn bg-primary text-primary-foreground font-display text-xl font-bold shadow-sm">
          S
        </div>
        <div>
          <CardTitle className="text-2xl font-bold font-display">
            SIMOP DPMPTSP
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm mt-1 text-text-secondary">
            Sistem Informasi Manajemen Operasional DPMPTSP Kabupaten Karawang
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent>
        {errorMessage && (
          <div className="mb-4">
            <InlineAlert variant="error" description={errorMessage} />
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Nama Pengguna (Username)" required>
            <Input
              type="text"
              autoComplete="username"
              placeholder="Masukkan username Anda..."
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isLoading}
              required
            />
          </FormField>

          <FormField label="Kata Sandi (Password)" required>
            <PasswordInput
              autoComplete="current-password"
              placeholder="Masukkan kata sandi..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              required
            />
          </FormField>

          <FormActions
            submitLabel="Masuk ke Sistem"
            isLoading={isLoading}
            className="pt-2 border-t-0 mt-2"
          />

          <p className="text-center text-xs text-text-secondary pt-2">
            Pendaftaran publik dinonaktifkan. Akun dibuat dan dikelola oleh Administrator Dinas.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
