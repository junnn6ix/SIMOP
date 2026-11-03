'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Command as CommandPrimitive } from 'cmdk';
import {
  Calendar,
  CheckSquare,
  LayoutDashboard,
  Package,
  ReceiptText,
  Search,
  Ticket,
  User,
  Users,
} from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { getNavigationForRole, UserRole } from '@/config/navigation';

export interface CommandMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role?: UserRole | null;
}

export function CommandMenu({ open, onOpenChange, role = 'PEGAWAI' }: CommandMenuProps) {
  const router = useRouter();
  const navItems = getNavigationForRole(role);

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || e.key === '/') {
        if (
          (e.target instanceof HTMLElement && e.target.isContentEditable) ||
          e.target instanceof HTMLInputElement ||
          e.target instanceof HTMLTextAreaElement ||
          e.target instanceof HTMLSelectElement
        ) {
          return;
        }

        e.preventDefault();
        onOpenChange(!open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [open, onOpenChange]);

  const handleSelect = (href: string) => {
    onOpenChange(false);
    router.push(href);
  };

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'LayoutDashboard':
        return <LayoutDashboard className="mr-2 h-4 w-4 text-text-secondary" />;
      case 'Users':
        return <Users className="mr-2 h-4 w-4 text-text-secondary" />;
      case 'Calendar':
        return <Calendar className="mr-2 h-4 w-4 text-text-secondary" />;
      case 'CheckSquare':
        return <CheckSquare className="mr-2 h-4 w-4 text-text-secondary" />;
      case 'Package':
        return <Package className="mr-2 h-4 w-4 text-text-secondary" />;
      case 'ReceiptText':
        return <ReceiptText className="mr-2 h-4 w-4 text-text-secondary" />;
      case 'Ticket':
        return <Ticket className="mr-2 h-4 w-4 text-text-secondary" />;
      case 'User':
        return <User className="mr-2 h-4 w-4 text-text-secondary" />;
      default:
        return <Search className="mr-2 h-4 w-4 text-text-secondary" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden p-0 rounded-xl shadow-2xl max-w-lg">
        <CommandPrimitive className="flex h-full w-full flex-col overflow-hidden bg-surface text-text-primary">
          <div className="flex items-center border-b border-border px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 text-text-secondary opacity-60" />
            <CommandPrimitive.Input
              placeholder="Ketik perintah atau cari menu..."
              className="flex h-12 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-text-neutral disabled:cursor-not-allowed disabled:opacity-50"
            />
            <kbd className="hidden sm:inline-flex rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-mono text-text-neutral">
              ESC
            </kbd>
          </div>
          <CommandPrimitive.List className="max-h-[300px] overflow-y-auto p-2">
            <CommandPrimitive.Empty className="py-6 text-center text-sm text-text-secondary">
              Tidak ada hasil ditemukan.
            </CommandPrimitive.Empty>
            <CommandPrimitive.Group
              heading="Navigasi Halaman"
              className="px-2 py-1.5 text-xs font-semibold text-text-secondary uppercase tracking-wider"
            >
              {navItems.map((item) => (
                <CommandPrimitive.Item
                  key={item.href}
                  value={item.title}
                  onSelect={() => handleSelect(item.href)}
                  className="relative flex cursor-pointer select-none items-center rounded-btn px-2.5 py-2 text-sm outline-none transition-colors aria-selected:bg-muted aria-selected:text-text-primary"
                >
                  {getIcon(item.iconName)}
                  <span>{item.title}</span>
                </CommandPrimitive.Item>
              ))}
            </CommandPrimitive.Group>
          </CommandPrimitive.List>
        </CommandPrimitive>
      </DialogContent>
    </Dialog>
  );
}

