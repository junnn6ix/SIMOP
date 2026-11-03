'use client';

import * as React from 'react';
import { Menu } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { NavLinks } from '@/components/layout/NavLinks';
import { NavItem } from '@/config/navigation';

export interface MobileNavDrawerProps {
  items: NavItem[];
}

export function MobileNavDrawer({ items }: MobileNavDrawerProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          className="md:hidden"
          aria-label="Buka Menu Navigasi"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0 flex flex-col">
        <SheetHeader className="p-6 border-b border-border text-left">
          <SheetTitle className="text-lg font-bold text-text-primary flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-btn bg-primary text-primary-foreground font-display text-sm font-bold">
              S
            </span>
            <span>SIMOP DPMPTSP</span>
          </SheetTitle>
          <p className="text-xs text-text-secondary">Kabupaten Karawang</p>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-4 py-6">
          <NavLinks
            items={items}
            isMobile
            onItemClick={() => setOpen(false)}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}

