'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Calendar,
  CheckSquare,
  Package,
  ReceiptText,
  Ticket,
  User,
} from 'lucide-react';
import { NavGroup, NavItem } from '@/config/navigation';
import { cn } from '@/lib/cn';

export interface SidebarNavProps {
  groups: NavGroup[];
  collapsed?: boolean;
  onItemClick?: () => void;
  className?: string;
}

function getNavIcon(name: NavItem['iconName'], active: boolean) {
  const iconClass = cn(
    'h-4 w-4 shrink-0 transition-colors',
    active ? 'text-primary' : 'text-text-secondary group-hover:text-text-primary'
  );

  switch (name) {
    case 'LayoutDashboard':
      return <LayoutDashboard className={iconClass} />;
    case 'Users':
      return <Users className={iconClass} />;
    case 'Calendar':
      return <Calendar className={iconClass} />;
    case 'CheckSquare':
      return <CheckSquare className={iconClass} />;
    case 'Package':
      return <Package className={iconClass} />;
    case 'ReceiptText':
      return <ReceiptText className={iconClass} />;
    case 'Ticket':
      return <Ticket className={iconClass} />;
    case 'User':
      return <User className={iconClass} />;
    default:
      return <LayoutDashboard className={iconClass} />;
  }
}

export function SidebarNav({
  groups,
  collapsed = false,
  onItemClick,
  className,
}: SidebarNavProps) {
  const pathname = usePathname();

  const isItemActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <nav
      className={cn('flex flex-col gap-5 px-3 py-2 select-none', className)}
      aria-label="Navigasi Menu"
    >
      {groups.map((group, groupIdx) => {
        return (
          <div key={group.label || `group-${groupIdx}`} className="flex flex-col gap-1">
            {group.label && !collapsed && (
              <p className="px-2.5 mb-1 text-2xs font-mono uppercase tracking-wider text-text-secondary">
                {group.label}
              </p>
            )}
            {group.label && collapsed && (
              <div
                className="w-4 h-px bg-border mx-auto my-1.5"
                aria-hidden="true"
              />
            )}
            <ul className="flex flex-col gap-0.5 m-0 p-0 list-none">
              {group.items.map((item) => {
                const active = isItemActive(item.href);

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onItemClick}
                      title={collapsed ? item.title : undefined}
                      className={cn(
                        'group relative flex items-center rounded-btn text-xs transition-colors duration-150',
                        collapsed
                          ? 'h-9 w-9 mx-auto justify-center'
                          : 'h-10 md:h-9 px-3 gap-3 justify-start',
                        active
                          ? 'bg-primary/10 text-primary-text font-semibold'
                          : 'text-text-secondary hover:text-text-primary hover:bg-muted/60 font-medium'
                      )}
                      aria-current={active ? 'page' : undefined}
                    >
                      {/* Left indicator bar for active item */}
                      {active && (
                        <span
                          className={cn(
                            'absolute bg-primary rounded-r',
                            collapsed
                              ? 'left-0 top-2 bottom-2 w-[3px]'
                              : 'left-0 top-1.5 bottom-1.5 w-[3px]'
                          )}
                          aria-hidden="true"
                        />
                      )}

                      {getNavIcon(item.iconName, active)}

                      {!collapsed && (
                        <span className="truncate flex-1">{item.title}</span>
                      )}

                      {!collapsed && item.badge !== undefined && (
                        <span className="ml-auto inline-flex items-center px-1.5 py-0.5 rounded-full text-2xs font-mono font-medium bg-muted text-text-secondary">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </nav>
  );
}
