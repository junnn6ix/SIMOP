import * as React from 'react';
import { AuthLayout } from '@/components/layout/AuthLayout';

export default function Layout({ children }: { children: React.ReactNode }) {
  return <AuthLayout>{children}</AuthLayout>;
}

