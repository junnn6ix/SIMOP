'use client';

import * as React from 'react';
import { MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export interface RowActionItem {
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
  destructive?: boolean;
  separatorBefore?: boolean;
  disabled?: boolean;
}

export interface RowActionsProps {
  actions: RowActionItem[];
  label?: string;
}

export function RowActions({ actions, label = 'Aksi Baris' }: RowActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          className="h-8 w-8 p-0 text-text-secondary hover:text-text-primary"
          aria-label={label}
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        {actions.map((action, index) => (
          <React.Fragment key={index}>
            {action.separatorBefore && <DropdownMenuSeparator />}
            <DropdownMenuItem
              destructive={action.destructive}
              disabled={action.disabled}
              onClick={action.onClick}
              className="cursor-pointer"
            >
              {action.icon && <span className="mr-2 h-4 w-4">{action.icon}</span>}
              <span>{action.label}</span>
            </DropdownMenuItem>
          </React.Fragment>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

