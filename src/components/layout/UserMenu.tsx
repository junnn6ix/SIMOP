'use client';

import * as React from 'react';
import Link from 'next/link';
import { LogOut, User as UserIcon } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar } from '@/components/shared/Avatar';

export interface UserMenuProps {
  user: {
    name: string;
    username: string;
    role: string;
    bidang?: string;
  };
  onSignOut?: () => void;
}

export function UserMenu({ user, onSignOut }: UserMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex items-center gap-2 rounded-full p-0.5 transition-opacity hover:opacity-80 focus-ring"
          aria-label="Menu Pengguna"
        >
          <Avatar name={user.name} size="md" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-semibold text-text-primary leading-none">
              {user.name}
            </p>
            <p className="text-xs text-text-secondary leading-none">
              @{user.username} &bull; {user.role}
            </p>
            {user.bidang && (
              <p className="text-[11px] text-text-secondary uppercase tracking-wider font-mono">
                {user.bidang}
              </p>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link
            href={user.role === 'ADMIN' ? '/dashboard' : '/pegawai/profil'}
            className="cursor-pointer"
          >
            <UserIcon className="mr-2 h-4 w-4 text-text-secondary" />
            <span>Profil Pengguna</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          destructive
          onClick={onSignOut}
          className="cursor-pointer"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Keluar</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

