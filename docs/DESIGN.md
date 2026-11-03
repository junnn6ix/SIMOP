# Genesis

## Overview
An editorial precision interface for a community platform where developers discover, share, and download design system files. The aesthetic is quietly confident — bold display typography, generous spacing, and gallery-frame card surfaces. The mood is professional and modern without being sterile. High information density balanced by breathing room. 

## Colors
- **Primary** (#6366F1): CTAs, active states, links, focus rings, interactive highlights — indigo
- **Primary Hover** (#4F46E5): Darker indigo for hover states on primary elements
- **Secondary** (#20970B): Reserved exclusively for the DESIGN.md brand highlight on the homepage — green
- **Neutral** (#9C9C9C): Muted text, placeholders, timestamps, disabled states
- **Background** (#FAFAFA): Page background, light warm gray
- **Surface** (#FFFFFF): Cards, panels, modals, nav backdrop
- **Text Primary** (#0A0A0A): Headings, body text, primary labels — near-black
- **Text Secondary** (#6B6B6B): Descriptions, metadata, secondary labels
- **Border** (#E8E8EC): Card borders, dividers, input borders — subtle and recessive
- **Success** (#10B981): Published status, confirmations, positive indicators
- **Warning** (#F59E0B): Pending states, caution banners
- **Error** (#EF4444): Destructive actions, validation errors, rejected status

## Typography
- **Display Font**: General Sans — loaded from Fontshare
- **Body Font**: DM Sans — loaded from Google Fonts
- **Code Font**: JetBrains Mono — loaded from Google Fonts

Display and heading text uses General Sans at bold weight with tight letter spacing (-0.03em to -0.04em). Body and UI text uses DM Sans at regular and medium weights. The contrast between the geometric display font and the humanist body font creates a refined editorial feel. Code blocks, API keys, and CLI commands use JetBrains Mono at regular weight.

Type scale: Display 72px, Headline 60px, Section heading 32px, Subhead 24px, Body 15px, Small 13px, Caption 12px, Overline 11px uppercase.

## Elevation
This design uses minimal shadows. Cards rest flat with a 1px border and gain a subtle shadow on hover (0 8px 30px rgba(0,0,0,0.08)) combined with a -2px vertical lift. Primary buttons gain a tinted glow shadow on hover (0 4px 12px rgba(99,102,241,0.35)). The nav uses backdrop-blur rather than a shadow to convey elevation. Dropdowns and popovers use shadow-lg. Focus states use a 3px indigo ring (0 0 0 3px rgba(99,102,241,0.12)) rather than a shadow.

## Components
- **Buttons**: Primary uses indigo fill with white text, 6px radius, medium weight. Secondary uses transparent bg with 1px border, same radius. Ghost has no border or bg, just text color change on hover. Destructive uses red text with red border. All buttons shift up 1px on hover. Sizes: small (32px), medium (38px), large (44px).
- **Cards**: White surface, 1px subtle border, 12px radius, overflow hidden. Kit preview cards have a 200px image area on top and a content area below with name, author avatar, and stats. Hover lifts the card 2px and increases shadow. Transition duration 200ms.
- **Inputs**: 1px subtle border, surface background, 6px radius, 10px vertical and 14px horizontal padding, 14px font size. Focus: border turns indigo with a 3px rgba ring. Error: border turns red. Placeholder text uses muted color.
- **Chips**: Tag chips use rounded-full (pill shape), gray-100 background, gray-600 text, 4px vertical and 12px horizontal padding, 12px font size. Active state: indigo background with white text. Status chips follow the same shape but use semantic colors (green for published, yellow for pending, red for rejected).
- **Lists**: Stacked rows with 1px dividers between items. Each row is flex with space-between, 12px vertical and 16px horizontal padding. Hover: subtle background change.
- **Checkboxes**: 20px size, rounded-full, gray-200 unchecked, indigo checked with white checkmark. Used as toggle switches for preferences.
- **Tooltips**: Native browser tooltips via title attributes. No custom tooltip component currently.
- **Navigation & Layout**: 
  - *Sidebar Layout (Revisi Sadar)*: Untuk mendukung kepadatan informasi dan navigasi operasional kedinasan multi-modul, layout SIMOP berevolusi dari top nav horizontal menjadi sidebar kiri yang terstruktur dan dapat dilipat (~256px melebar, ~64px menciut dengan tooltip ikon), dilengkapi bar atas tipis (sticky, backdrop-blur, border bawah) untuk pemicu pencarian ⌘K, ThemeToggle, dan UserMenu. Pada layar seluler (<768px), sidebar bertransisi menjadi drawer samping (Sheet) dengan target sentuh minimal 40px.
- **Search**: Global search triggered by ⌘K. Rendered as a rounded-xl bar with magnifying glass icon and keyboard shortcut badge.

## Dark Theme (Tema Gelap)
Tema gelap dirancang dengan filosofi Genesis yang tetap konsisten: tenang, berwibawa, dan tajam tanpa keletihan mata (*eye strain*):
- **Palet Warna Gelap**:
  - `Background`: `#0A0A0B` (latar utama kanvas)
  - `Surface`: `#111113` (permukaan kartu, panel, dialog)
  - `Surface-2`: `#18181B` (permukaan interaktif sekunder, baris hover, input field)
  - `Border`: `#27272A` (garis batas halus 1px)
  - `Border Strong`: `#3F3F46` (garis batas penegas, pemisah kolom)
  - `Muted`: `#1E1E22` (latar tag dan elemen non-aktif)
- **Tipografi di Mode Gelap**:
  - `Text Primary`: `#FAFAFA` (kontras tajam pada latar gelap, menghindari putih murni `#FFF`)
  - `Text Secondary`: `#A1A1AA` (keterangan, metadata, deskripsi)
  - `Text Neutral`: `#71717A` (placeholder, status non-aktif)
- **Elemen Interaktif & Indigo**:
  - `Primary`: `#6366F1` (tetap sebagai aksen interaktif tunggal)
  - `Primary Hover`: `#818CF8` (satu tingkat lebih terang agar kontrasnya optimal di atas permukaan gelap)
  - `Focus Ring`: `0 0 0 3px rgba(99, 102, 241, 0.25)` (ring fokus dengan intensitas alpha yang ditingkatkan)
- **Warna Semantik & Status (WCAG AA / AAA)**:
  - Pada tema gelap, status badge menggunakan latar belakang tint transparan (alpha 12–16%) yang dipadukan dengan teks versi terang (*high-luminance*):
    - `Success`: Teks `#6EE7B7` dengan latar `rgba(16, 185, 129, 0.15)`
    - `Warning`: Teks `#FDE68A` dengan latar `rgba(245, 158, 11, 0.15)`
    - `Error`: Teks `#FECACA` dengan latar `rgba(239, 68, 68, 0.15)`
    - `Neutral`: Teks `#E4E4E7` dengan latar `rgba(161, 161, 170, 0.15)`
  - Seluruh kombinasi warna status telah divalidasi melampaui rasio kontras WCAG AA (minimal 4.5:1 untuk teks normal).
- **Warna Data Visualisasi (Zero-Indigo Chart Palette)**:
  - Visualisasi data (DonutChart, grafik) dilarang keras memakai warna indigo (`primary`).
  - Disediakan token 4 warna unik yang kontras dan jelas terbedakan satu sama lain:
    - `Chart 1` (Loket Pelayanan): `#10B981` (terang) / `#34D399` (gelap) - Emerald
    - `Chart 2` (Layanan Kecamatan): `#F59E0B` (terang) / `#FBBF24` (gelap) - Amber
    - `Chart 3` (Kantor Dinas): `#64748B` (terang) / `#94A3B8` (gelap) - Slate
    - `Chart 4` (Lainnya / Lapangan): `#0284C7` (terang) / `#38BDF8` (gelap) - Sky
- **Elevasi di Mode Gelap**:
  - Bayangan (*shadow*) dikurangi secara signifikan untuk menghindari efek kotor (*muddy glow*). Elevasi dinyatakan melalui perbedaan lapisan permukaan (`surface` ke `surface-2`) dan penegasan `border`. Efek hover kartu interaktif tetap mempertahankan translasi vertikal `-2px`.

## Sidebar Layout (Struktur Tata Letak)
- **Sidebar Kiri**:
  - Lebar penuh 256px saat dibuka, 64px saat dilipat.
  - Header: Logo identitas dinas dan teks SIMOP DPMPTSP Karawang.
  - Tombol Buat Cepat: Aksi cepat kontekstual berbasis peran aparatur.
  - Menu Navigasi: Dikelompokkan dengan label kategori berukuran kecil, indikator item aktif yang tenang (latar transparan halus dan border penanda, tanpa blok warna solid).
  - Footer: Kartu aparatur terotentikasi, inisial lokal, dan aksi profil / tema / keluar.
- **Bar Atas Tipis**:
  - Ketinggian 52px dengan backdrop-blur dan border bawah 1px.
  - Memuat tombol toggle sidebar, pintasan pencarian global, ThemeToggle, serta avatar pengguna.
- **Responsivitas**:
  - Desktop (>=768px): Sidebar persisten di sisi kiri dengan animasi transisi pelipatan halus.
  - Mobile (<768px): Sidebar disembunyikan dan diakses via tombol drawer Sheet samping dengan area sentuh ramah jari (>= 40px).

## Spacing
- Base unit: 4px
- Scale: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96px
- Component padding: small 8×12, medium 10×16, large 12×24
- Section spacing: 32px mobile, 48px tablet, 64px desktop
- Container max width: 1280px with 24px horizontal padding
- Card grid gap: 20-24px

## Border Radius
- 4px: Tags, chips, badges, inline code
- 6px: Buttons, inputs, selects
- 8px: Metadata cards, dropdowns, panels
- 12px: Kit preview cards, search bar, featured sections
- 9999px: Avatars, status dots, pill badges

## Do's and Don'ts
- Do use indigo (#6366F1) only for interactive elements — never for decoration or static text
- Do maintain the 4px spacing grid for all padding, margins, and gaps
- Do use General Sans for headings and DM Sans for body — never swap them
- Do keep kit cards at 12px radius and buttons/inputs at 6px — don't mix these values
- Do provide sufficient contrast in both light and dark modes — test both
- Don't use pure black (#000000) or pure white (#FFFFFF) for text — use the defined palette values
- Don't add decorative gradients or illustrations — the interactive dot grid is the only decorative element
- Don't use shadows on static elements — reserve shadow elevation for hover and focus states
- Don't use more than two font weights on a single screen
- Don't place more than one primary (filled indigo) button in the same view section

