'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Plus,
  ChevronDown,
  Calendar,
  Package,
  ReceiptText,
  Users,
  CheckSquare,
  Ticket,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { getQuickActionsForRole, UserRole } from '@/config/navigation';
import { cn } from '@/lib/cn';

export interface QuickActionDropdownProps {
  role?: UserRole | null;
  collapsed?: boolean;
  onSelectAction?: () => void;
  className?: string;
}

function getActionIcon(iconName: string) {
  switch (iconName) {
    case 'Calendar':
      return <Calendar className="h-4 w-4 text-primary shrink-0" />;
    case 'Package':
      return <Package className="h-4 w-4 text-warning shrink-0" />;
    case 'ReceiptText':
      return <ReceiptText className="h-4 w-4 text-primary shrink-0" />;
    case 'Users':
      return <Users className="h-4 w-4 text-primary shrink-0" />;
    case 'CheckSquare':
      return <CheckSquare className="h-4 w-4 text-success shrink-0" />;
    case 'Ticket':
      return <Ticket className="h-4 w-4 text-warning shrink-0" />;
    default:
      return <Plus className="h-4 w-4 text-primary shrink-0" />;
  }
}

export function QuickActionDropdown({
  role,
  collapsed = false,
  onSelectAction,
  className,
}: QuickActionDropdownProps) {
  const actions = getQuickActionsForRole(role);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {collapsed ? (
          <Button
            variant="primary"
            size="sm"
            aria-label="Buat Cepat"
            title="Buat Cepat"
            className={cn('h-9 w-9 p-0 mx-auto flex items-center justify-center rounded-btn shadow-sm', className)}
          >
            <Plus className="h-4 w-4 text-primary-foreground" />
          </Button>
        ) : (
          <Button
            variant="primary"
            size="sm"
            className={cn('w-full justify-between gap-2 shadow-sm rounded-btn text-xs font-semibold h-9 px-3', className)}
          >
            <span className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              <span>Buat Cepat</span>
            </span>
            <ChevronDown className="h-3.5 w-3.5 opacity-80" />
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align={collapsed ? 'start' : 'center'}
        side={collapsed ? 'right' : 'bottom'}
        className="w-56 p-1 z-50"
      >
        <DropdownMenuLabel className="text-2xs font-mono uppercase tracking-wider text-text-neutral px-2.5 py-1.5">
          Tindakan Cepat
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {actions.map((act) => (
          <DropdownMenuItem key={act.href} asChild>
            <Link
              href={act.href}
              onClick={onSelectAction}
              className="flex items-start gap-2.5 p-2 rounded-btn cursor-pointer transition-colors hover:bg-muted/60"
            >
              <div className="mt-0.5">{getActionIcon(act.iconName)}</div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-text-primary leading-tight">
                  {act.title}
                </span>
                <span className="text-2xs text-text-secondary leading-tight mt-0.5 truncate">
                  {act.description}
                </span>
              </div>
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

