export interface NavItem {
  title: string;
  href: string;
  iconName: 'LayoutDashboard' | 'Users' | 'Calendar' | 'CheckSquare' | 'Package' | 'ReceiptText' | 'Ticket' | 'User';
  badge?: string;
}

export type UserRole = 'ADMIN' | 'PEGAWAI';

export const ADMIN_NAV_ITEMS: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    iconName: 'LayoutDashboard',
  },
  {
    title: 'Pegawai',
    href: '/admin/pegawai',
    iconName: 'Users',
  },
  {
    title: 'Jadwal',
    href: '/admin/jadwal',
    iconName: 'Calendar',
  },
  {
    title: 'Verifikasi',
    href: '/admin/verifikasi',
    iconName: 'CheckSquare',
  },
  {
    title: 'Inventaris',
    href: '/admin/inventaris',
    iconName: 'Package',
  },
  {
    title: 'PBG',
    href: '/admin/pbg',
    iconName: 'ReceiptText',
  },
];

export const PEGAWAI_NAV_ITEMS: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    iconName: 'LayoutDashboard',
  },
  {
    title: 'Jadwal Saya',
    href: '/pegawai/jadwal',
    iconName: 'Calendar',
  },
  {
    title: 'Tiket',
    href: '/pegawai/tiket',
    iconName: 'Ticket',
  },
  {
    title: 'Profil',
    href: '/pegawai/profil',
    iconName: 'User',
  },
];

export function getNavigationForRole(role?: UserRole | null): NavItem[] {
  if (role === 'ADMIN') {
    return ADMIN_NAV_ITEMS;
  }
  return PEGAWAI_NAV_ITEMS;
}

