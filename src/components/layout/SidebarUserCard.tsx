'use client';

import * as React from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import {
  LogOut,
  User as UserIcon,
  ChevronsUpDown,
  Sun,
  Moon,
  Laptop,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar } from '@/components/shared/Avatar';
import { UserRole } from '@/config/navigation';
import { cn } from '@/lib/cn';

export interface SidebarUserCardProps {
  user?: {
    name: string;
    username: string;
    role: UserRole;
    bidang?: string;
  } | null;
  collapsed?: boolean;
  onSignOut?: () => void;
  className?: string;
}

export function SidebarUserCard({
  user,
  collapsed = false,
  onSignOut,
  className,
}: SidebarUserCardProps) {
  const { setTheme, theme } = useTheme();

  if (!user) return null;

  const profileHref = user.role === 'ADMIN' ? '/dashboard' : '/pegawai/profil';

  return (
    <div className={cn('p-2 border-t border-border select-none', className)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className={cn(
              'group flex items-center rounded-btn text-left transition-colors duration-150 focus-ring',
              collapsed
                ? 'h-9 w-9 mx-auto justify-center hover:bg-muted/80'
                : 'w-full px-2 py-1.5 gap-2.5 hover:bg-muted/60'
            )}
            aria-label={`Menu Akun: ${user.name}`}
            title={collapsed ? user.name : undefined}
          >
            <Avatar name={user.name} size="sm" />

            {!collapsed && (
              <>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-xs font-semibold text-text-primary truncate leading-tight">
                    {user.name}
                  </span>
                  <span className="text-2xs text-text-secondary truncate leading-tight">
                    @{user.username} &bull; {user.role}
                  </span>
                </div>
                <ChevronsUpDown className="h-3.5 w-3.5 text-text-neutral shrink-0" />
              </>
            )}
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align={collapsed ? 'end' : 'start'}
          side={collapsed ? 'right' : 'top'}
          sideOffset={8}
          className="w-56 p-1 z-50"
        >
          <DropdownMenuLabel className="font-normal px-2 py-1.5">
            <div className="flex flex-col space-y-0.5">
              <p className="text-xs font-bold text-text-primary leading-none truncate">
                {user.name}
              </p>
              <p className="text-2xs text-text-secondary leading-none truncate">
                @{user.username} &bull; {user.role}
              </p>
              {user.bidang && (
                <p className="text-[10px] text-text-secondary uppercase tracking-wider font-mono pt-1">
                  {user.bidang}
                </p>
              )}
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          <DropdownMenuItem asChild>
            <Link href={profileHref} className="cursor-pointer text-xs">
              <UserIcon className="mr-2 h-3.5 w-3.5 text-text-secondary" />
              <span>Profil Pengguna</span>
            </Link>
          </DropdownMenuItem>

          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="cursor-pointer text-xs">
              {theme === 'dark' ? (
                <Moon className="mr-2 h-3.5 w-3.5 text-text-secondary" />
              ) : theme === 'light' ? (
                <Sun className="mr-2 h-3.5 w-3.5 text-text-secondary" />
              ) : (
                <Laptop className="mr-2 h-3.5 w-3.5 text-text-secondary" />
              )}
              <span>Tema Tampilan</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="w-36 p-1">
              <DropdownMenuItem
                onClick={() => setTheme('light')}
                className="cursor-pointer text-xs"
              >
                <Sun className="mr-2 h-3.5 w-3.5" />
                <span>Terang</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setTheme('dark')}
                className="cursor-pointer text-xs"
              >
                <Moon className="mr-2 h-3.5 w-3.5" />
                <span>Gelap</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setTheme('system')}
                className="cursor-pointer text-xs"
              >
                <Laptop className="mr-2 h-3.5 w-3.5" />
                <span>Sistem</span>
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          <DropdownMenuSeparator />
          <DropdownMenuItem
            destructive
            onClick={onSignOut}
            className="cursor-pointer text-xs"
          >
            <LogOut className="mr-2 h-3.5 w-3.5" />
            <span>Keluar</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

