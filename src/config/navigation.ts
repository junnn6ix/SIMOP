export interface NavItem {
  title: string;
  href: string;
  iconName:
  | 'LayoutDashboard'
  | 'Users'
  | 'Calendar'
  | 'CheckSquare'
  | 'Package'
  | 'ReceiptText'
  | 'Ticket'
  | 'User';
  badge?: string | number;
}

export interface NavGroup {
  label?: string;
  items: NavItem[];
}

export type UserRole = 'ADMIN' | 'PEGAWAI';

export interface QuickActionItem {
  title: string;
  description: string;
  href: string;
  iconName:
  | 'Calendar'
  | 'Package'
  | 'ReceiptText'
  | 'Users'
  | 'CheckSquare'
  | 'Ticket';
}

export const ADMIN_NAV_GROUPS: NavGroup[] = [
  {
    items: [
      {
        title: 'Dashboard',
        href: '/dashboard',
        iconName: 'LayoutDashboard',
      },
    ],
  },
  {
    label: 'Operasional',
    items: [
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
    ],
  },
  {
    label: 'Layanan',
    items: [
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
    ],
  },
  {
    label: 'Administrasi',
    items: [
      {
        title: 'Pegawai',
        href: '/admin/pegawai',
        iconName: 'Users',
      },
    ],
  },
];

export const PEGAWAI_NAV_GROUPS: NavGroup[] = [
  {
    items: [
      {
        title: 'Dashboard',
        href: '/dashboard',
        iconName: 'LayoutDashboard',
      },
    ],
  },
  {
    label: 'Tugas',
    items: [
      {
        title: 'Jadwal Saya',
        href: '/pegawai/jadwal',
        iconName: 'Calendar',
      },
    ],
  },
  {
    label: 'Layanan',
    items: [
      {
        title: 'Tiket Saya',
        href: '/pegawai/tiket',
        iconName: 'Ticket',
      },
    ],
  },
  {
    label: 'Akun',
    items: [
      {
        title: 'Profil',
        href: '/pegawai/profil',
        iconName: 'User',
      },
    ],
  },
];

export const ADMIN_QUICK_ACTIONS: QuickActionItem[] = [
  {
    title: 'Jadwal Baru',
    description: 'Buat penugasan kedinasan baru',
    href: '/admin/jadwal',
    iconName: 'Calendar',
  },
  {
    title: 'Barang Baru',
    description: 'Tambah item inventaris / ATK',
    href: '/admin/inventaris',
    iconName: 'Package',
  },
  {
    title: 'Tagihan PBG Baru',
    description: 'Catat ketetapan retribusi PBG',
    href: '/admin/pbg',
    iconName: 'ReceiptText',
  },
  {
    title: 'Pegawai Baru',
    description: 'Registrasi aparatur dinas',
    href: '/admin/pegawai',
    iconName: 'Users',
  },
];

export const PEGAWAI_QUICK_ACTIONS: QuickActionItem[] = [
  {
    title: 'Kirim Laporan',
    description: 'Unggah bukti tugas kedinasan',
    href: '/pegawai/jadwal',
    iconName: 'CheckSquare',
  },
  {
    title: 'Ajukan Tiket',
    description: 'Permintaan ATK / laporan kerusakan',
    href: '/pegawai/tiket',
    iconName: 'Ticket',
  },
];

export function getNavGroupsForRole(role?: UserRole | null): NavGroup[] {
  if (role === 'ADMIN') return ADMIN_NAV_GROUPS;
  return PEGAWAI_NAV_GROUPS;
}

export function getQuickActionsForRole(role?: UserRole | null): QuickActionItem[] {
  if (role === 'ADMIN') return ADMIN_QUICK_ACTIONS;
  return PEGAWAI_QUICK_ACTIONS;
}

export function getNavigationForRole(role?: UserRole | null): NavItem[] {
  const groups = getNavGroupsForRole(role);
  return groups.flatMap((g) => g.items);
}
