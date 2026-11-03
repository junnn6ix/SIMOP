'use client';

import * as React from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon, Laptop, Check } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';

export interface ThemeToggleProps {
  className?: string;
  align?: 'start' | 'end' | 'center';
}

const emptySubscribe = () => () => {};

export function ThemeToggle({ className, align = 'end' }: ThemeToggleProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const isClient = React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  if (!isClient) {
    return (
      <Button
        variant="ghost"
        size="sm"
        aria-label="Pilih tema tampilan"
        className={cn('h-9 w-9 p-0 text-text-secondary rounded-btn', className)}
        disabled
      >
        <span className="h-4 w-4" />
      </Button>
    );
  }

  const isDark = resolvedTheme === 'dark';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          aria-label="Pilih tema tampilan"
          className={cn(
            'h-9 w-9 p-0 text-text-secondary hover:text-text-primary hover:bg-muted/60 rounded-btn transition-colors focus-ring',
            className
          )}
        >
          {isDark ? (
            <Moon className="h-4 w-4 transition-transform" />
          ) : (
            <Sun className="h-4 w-4 transition-transform" />
          )}
          <span className="sr-only">Pilih tema tampilan</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="min-w-[130px] p-1">
        <DropdownMenuItem
          onClick={() => setTheme('light')}
          className="flex items-center justify-between cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Sun className="h-4 w-4 text-text-secondary" />
            <span>Terang</span>
          </div>
          {theme === 'light' && <Check className="h-3.5 w-3.5 text-primary" />}
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => setTheme('dark')}
          className="flex items-center justify-between cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Moon className="h-4 w-4 text-text-secondary" />
            <span>Gelap</span>
          </div>
          {theme === 'dark' && <Check className="h-3.5 w-3.5 text-primary" />}
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => setTheme('system')}
          className="flex items-center justify-between cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Laptop className="h-4 w-4 text-text-secondary" />
            <span>Sistem</span>
          </div>
          {theme === 'system' && <Check className="h-3.5 w-3.5 text-primary" />}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

