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
  Loader2,
} from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { getNavigationForRole, UserRole } from '@/config/navigation';
import { globalSearchAction, SearchResultItem } from '@/modules/search/actions';

export interface CommandMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role?: UserRole | null;
}

export function CommandMenu({ open, onOpenChange, role = 'PEGAWAI' }: CommandMenuProps) {
  const router = useRouter();
  const navItems = getNavigationForRole(role);

  const [query, setQuery] = React.useState('');
  const [searchResults, setSearchResults] = React.useState<SearchResultItem[]>([]);
  const [isSearching, setIsSearching] = React.useState(false);

  const handleOpenChange = React.useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) {
        setQuery('');
        setSearchResults([]);
      }
      onOpenChange(nextOpen);
    },
    [onOpenChange]
  );

  // Shortcut keyboard listener (Cmd+K / Ctrl+K)
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
        handleOpenChange(!open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [open, handleOpenChange]);

  // Debounced search effect
  React.useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await globalSearchAction(trimmed);
        setSearchResults(results);
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (href: string) => {
    handleOpenChange(false);
    router.push(href);
  };

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'LayoutDashboard':
        return <LayoutDashboard className="mr-2.5 h-4 w-4 text-text-secondary shrink-0" />;
      case 'Users':
      case 'User':
        return <Users className="mr-2.5 h-4 w-4 text-primary shrink-0" />;
      case 'Calendar':
        return <Calendar className="mr-2.5 h-4 w-4 text-primary shrink-0" />;
      case 'CheckSquare':
        return <CheckSquare className="mr-2.5 h-4 w-4 text-success shrink-0" />;
      case 'Package':
        return <Package className="mr-2.5 h-4 w-4 text-warning shrink-0" />;
      case 'ReceiptText':
        return <ReceiptText className="mr-2.5 h-4 w-4 text-text-secondary shrink-0" />;
      case 'Ticket':
        return <Ticket className="mr-2.5 h-4 w-4 text-text-secondary shrink-0" />;
      default:
        return <Search className="mr-2.5 h-4 w-4 text-text-secondary shrink-0" />;
    }
  };

  const displayedResults = query.trim().length >= 2 ? searchResults : [];

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="overflow-hidden p-0 rounded-xl shadow-2xl max-w-lg border border-border">
        <CommandPrimitive className="flex h-full w-full flex-col overflow-hidden bg-surface text-text-primary">
          <div className="flex items-center border-b border-border px-3">
            {isSearching ? (
              <Loader2 className="mr-2.5 h-4 w-4 shrink-0 text-primary animate-spin" />
            ) : (
              <Search className="mr-2.5 h-4 w-4 shrink-0 text-text-secondary opacity-60" />
            )}
            <CommandPrimitive.Input
              value={query}
              onValueChange={setQuery}
              placeholder="Cari pegawai, barang, tugas, atau menu... (min 2 huruf)"
              className="flex h-12 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-text-neutral disabled:cursor-not-allowed disabled:opacity-50"
            />
            <kbd className="hidden sm:inline-flex rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-mono text-text-neutral">
              ESC
            </kbd>
          </div>

          <CommandPrimitive.List className="max-h-[340px] overflow-y-auto p-2">
            <CommandPrimitive.Empty className="py-6 text-center text-sm text-text-secondary">
              Tidak ada hasil ditemukan untuk &ldquo;{query}&rdquo;.
            </CommandPrimitive.Empty>

            {/* Jika ada hasil pencarian global (barang, pegawai, jadwal, pbg) */}
            {displayedResults.length > 0 && (
              <CommandPrimitive.Group
                heading="Hasil Pencarian Terkait"
                className="px-2 py-1.5 text-xs font-semibold text-text-secondary uppercase tracking-wider"
              >
                {displayedResults.map((item) => (
                  <CommandPrimitive.Item
                    key={item.id}
                    value={`${item.title} ${item.subtitle}`}
                    onSelect={() => handleSelect(item.href)}
                    className="relative flex cursor-pointer select-none items-center justify-between rounded-btn px-2.5 py-2 text-sm outline-none transition-colors aria-selected:bg-muted aria-selected:text-text-primary"
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      {getIcon(item.iconName)}
                      <div className="flex flex-col truncate">
                        <span className="font-semibold text-text-primary truncate">
                          {item.title}
                        </span>
                        <span className="text-[11px] text-text-secondary truncate">
                          {item.subtitle}
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] text-text-secondary font-mono bg-muted/60 px-1.5 py-0.5 rounded shrink-0 ml-2">
                      {item.category}
                    </span>
                  </CommandPrimitive.Item>
                ))}
              </CommandPrimitive.Group>
            )}

            {/* Menu Navigasi Utama */}
            <CommandPrimitive.Group
              heading="Pintasan Navigasi"
              className="px-2 py-1.5 text-xs font-semibold text-text-secondary uppercase tracking-wider mt-1"
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
