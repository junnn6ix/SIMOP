import * as React from 'react';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Badge } from '@/components/ui/badge';
import { Section } from '@/components/layout/Section';
import { Card } from '@/components/shared/Card';

export function DevBadgesSection() {
  return (
    <Section
      title="2. StatusBadge & Chips"
      description="Satu-satunya tempat pemetaan status ke warna (Hijau, Kuning, Merah, Abu-abu). Tanpa indigo untuk status. Kontras AA."
    >
      <Card className="p-6 space-y-6">
        <div className="space-y-3">
          <h4 className="text-xs font-mono uppercase tracking-wider text-text-secondary">
            Domain StatusBadge (Pill 9999px)
          </h4>
          <div className="flex flex-wrap items-center gap-2.5">
            <StatusBadge status="SELESAI" />
            <StatusBadge status="LUNAS" />
            <StatusBadge status="ACC" />
            <StatusBadge status="AKTIF" />
            <StatusBadge status="MENUNGGU_VERIFIKASI" />
            <StatusBadge status="MENUNGGU" />
            <StatusBadge status="BELUM_DIKERJAKAN" />
            <StatusBadge status="MAINTENANCE" />
            <StatusBadge status="DITOLAK" />
            <StatusBadge status="BELUM_BAYAR" />
            <StatusBadge status="TERLAMBAT" />
            <StatusBadge status="DRY_RUN" />
          </div>
        </div>

        <div className="space-y-3 pt-4 border-t border-border">
          <h4 className="text-xs font-mono uppercase tracking-wider text-text-secondary">
            General Badges & Tags (4px & Pill)
          </h4>
          <div className="flex flex-wrap items-center gap-2.5">
            <Badge variant="default" shape="tag">Tag Default (4px)</Badge>
            <Badge variant="primary" shape="tag">Primary Tag</Badge>
            <Badge variant="secondary" shape="tag">Secondary</Badge>
            <Badge variant="outline" shape="tag">Outline Tag</Badge>
            <Badge variant="success" shape="pill">Success Pill</Badge>
            <Badge variant="warning" shape="pill">Warning Pill</Badge>
            <Badge variant="error" shape="pill">Error Pill</Badge>
          </div>
        </div>
      </Card>
    </Section>
  );
}

