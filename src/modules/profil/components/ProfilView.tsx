'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
  User,
  Shield,
  KeyRound,
  Building,
  CreditCard,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { Card } from '@/components/shared/Card';
import { Button } from '@/components/ui/button';
import { PasswordInput } from '@/components/shared/PasswordInput';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { changePasswordSchema, ChangePasswordInput } from '../schema';
import { changePasswordAction } from '../actions';

interface ProfilViewProps {
  user: {
    id: string;
    name: string;
    username: string | null;
    role: string;
    nip?: string | null;
    bidang?: string | null;
    aktif?: boolean;
  };
}

export function ProfilView({ user }: ProfilViewProps) {
  const [isPending, startTransition] = React.useTransition();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const onSubmit = (data: ChangePasswordInput) => {
    startTransition(async () => {
      try {
        const result = await changePasswordAction(data);
        toast.success(result.message);
        reset();
      } catch (err: any) {
        toast.error(err.message || 'Gagal mengubah password');
      }
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Kolom Kiri: Informasi Akun (Read-only) */}
      <div className="lg:col-span-1 space-y-6">
        <Card className="p-6">
          <div className="flex items-center gap-4 pb-6 border-b border-border">
            <div className="h-14 w-14 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xl">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="font-display font-bold text-text-primary text-base">
                {user.name}
              </h3>
              <p className="text-xs text-text-secondary font-mono">@{user.username}</p>
              <div className="mt-1">
                <StatusBadge
                  status={user.aktif ? 'SELESAI' : 'DITOLAK'}
                  label={user.aktif ? 'Akun Aktif' : 'Nonaktif'}
                />
              </div>
            </div>
          </div>

          <div className="pt-6 space-y-4">
            <div className="flex items-start gap-3">
              <CreditCard className="h-4 w-4 text-text-secondary mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-text-secondary font-medium">NIP (Nomor Induk Pegawai)</p>
                <p className="text-sm font-semibold text-text-primary font-mono">
                  {user.nip || 'Belum diisi'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Building className="h-4 w-4 text-text-secondary mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-text-secondary font-medium">Bidang Penugasan</p>
                <p className="text-sm font-semibold text-text-primary">
                  {user.bidang || 'Sekretariat'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Shield className="h-4 w-4 text-text-secondary mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-text-secondary font-medium">Hak Akses Sistem</p>
                <p className="text-sm font-semibold text-text-primary">
                  {user.role === 'ADMIN' ? 'Administrator Dinas' : 'Aparatur / Pegawai Pelaksana'}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-border">
            <p className="text-[11px] text-text-neutral leading-relaxed">
              Data identitas pegawai dikelola secara terpusat oleh administrator dinas. Jika terdapat kekeliruan data NIP atau mutasi bidang, hubungi Subbag Kepegawaian.
            </p>
          </div>
        </Card>
      </div>

      {/* Kolom Kanan: Form Ubah Password */}
      <div className="lg:col-span-2">
        <Card className="p-6">
          <div className="pb-4 border-b border-border">
            <div className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-primary" />
              <h3 className="font-display font-bold text-text-primary text-lg">
                Ubah Kata Sandi (Password)
              </h3>
            </div>
            <p className="text-xs text-text-secondary mt-1">
              Perbarui kata sandi akun Anda secara berkala untuk menjaga keamanan data kedinasan.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-5">
            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1.5">
                Password Saat Ini <span className="text-error">*</span>
              </label>
              <PasswordInput
                {...register('currentPassword')}
                placeholder="Masukkan kata sandi saat ini"
                disabled={isPending}
              />
              {errors.currentPassword && (
                <p className="text-xs text-error mt-1">{errors.currentPassword.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1.5">
                Password Baru <span className="text-error">*</span>
              </label>
              <PasswordInput
                {...register('newPassword')}
                placeholder="Minimal 8 karakter kombinasi huruf dan angka"
                disabled={isPending}
              />
              {errors.newPassword && (
                <p className="text-xs text-error mt-1">{errors.newPassword.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1.5">
                Konfirmasi Password Baru <span className="text-error">*</span>
              </label>
              <PasswordInput
                {...register('confirmPassword')}
                placeholder="Ulangi password baru persis sama"
                disabled={isPending}
              />
              {errors.confirmPassword && (
                <p className="text-xs text-error mt-1">{errors.confirmPassword.message}</p>
              )}
            </div>

            <div className="p-3 rounded-card bg-muted/60 border border-border text-xs text-text-secondary space-y-1">
              <p className="font-semibold text-text-primary flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5 text-primary" /> Kebijakan Keamanan Sesi:
              </p>
              <p>
                Setelah kata sandi berhasil diperbarui, seluruh sesi login aktif pada perangkat lain (komputer/ponsel) akan otomatis dicabut. Anda tetap dapat melanjutkan pekerjaan pada sesi ini.
              </p>
            </div>

            <div className="pt-2 flex justify-end">
              <Button type="submit" disabled={isPending} className="gap-2">
                {isPending ? 'Menyimpan...' : 'Perbarui Kata Sandi'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
