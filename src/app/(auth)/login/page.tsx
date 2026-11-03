import { Metadata } from 'next';
import { LoginForm } from '@/modules/auth/components/LoginForm';

export const metadata: Metadata = {
  title: 'Masuk ke Sistem',
  description: 'Halaman masuk SIMOP DPMPTSP Kabupaten Karawang.',
};

export default function LoginPage() {
  return <LoginForm />;
}

