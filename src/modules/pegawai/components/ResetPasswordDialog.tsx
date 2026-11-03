'use client';

import * as React from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/shared/FormField';
import { PasswordInput } from '@/components/shared/PasswordInput';
import { resetPegawaiPasswordAction } from '../actions';

export interface ResetPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: {
    id: string;
    name: string;
    username: string;
  } | null;
}

interface ResetPasswordFormProps {
  user: {
    id: string;
    name: string;
    username: string;
  };
  onClose: () => void;
}

function ResetPasswordFormContent({ user, onClose }: ResetPasswordFormProps) {
  const [newPassword, setNewPassword] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsLoading(true);
    try {
      await resetPegawaiPasswordAction({
        userId: user.id,
        newPassword,
      });
      toast.success(`Kata sandi akun @${user.username} berhasil direset.`);
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Gagal mereset kata sandi.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-2">
      <FormField label="Kata Sandi Baru" required description="Minimal 8 karakter">
        <PasswordInput
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="Masukkan kata sandi baru..."
          required
          disabled={isLoading}
        />
      </FormField>

      <DialogFooter className="gap-2 sm:gap-0 pt-2">
        <Button
          type="button"
          variant="secondary"
          onClick={onClose}
          disabled={isLoading}
        >
          Batal
        </Button>
        <Button
          type="submit"
          variant="primary"
          disabled={isLoading || newPassword.length < 8}
        >
          {isLoading ? 'Menyimpan...' : 'Simpan Kata Sandi'}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function ResetPasswordDialog({
  open,
  onOpenChange,
  user,
}: ResetPasswordDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Reset Kata Sandi</DialogTitle>
          <DialogDescription>
            Tentukan kata sandi baru untuk akun pegawai <strong>{user?.name}</strong> (@{user?.username}).
          </DialogDescription>
        </DialogHeader>

        {open && user ? (
          <ResetPasswordFormContent
            key={user.id}
            user={user}
            onClose={() => onOpenChange(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
