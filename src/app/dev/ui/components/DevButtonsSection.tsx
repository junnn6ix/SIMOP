import * as React from 'react';
import { Plus, Trash2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Section } from '@/components/layout/Section';
import { Card } from '@/components/shared/Card';

export function DevButtonsSection() {
  return (
    <Section
      title="1. Primitif Tombol (Button)"
      description="Varian tombol, ukuran 32px (sm), 38px (md), 44px (lg), efek hover lift -1px, dan primary glow."
    >
      <Card className="p-6 space-y-6">
        <div className="space-y-3">
          <h4 className="text-xs font-sans font-medium uppercase tracking-wider text-text-secondary">
            Varian Utama
          </h4>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="primary">
              <Plus className="h-4 w-4" />
              <span>Primary Button</span>
            </Button>
            <Button variant="secondary">
              <span>Secondary Button</span>
            </Button>
            <Button variant="ghost">
              <span>Ghost Button</span>
            </Button>
            <Button variant="destructive">
              <Trash2 className="h-4 w-4" />
              <span>Destructive</span>
            </Button>
            <Button variant="link">
              <span>Link Action</span>
              <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>
        </div>

        <div className="space-y-3 pt-4 border-t border-border">
          <h4 className="text-xs font-sans font-medium uppercase tracking-wider text-text-secondary">
            Ukuran (Sizes)
          </h4>
          <div className="flex flex-wrap items-center gap-3">
            <Button size="sm" variant="secondary">
              Small (32px)
            </Button>
            <Button size="md" variant="secondary">
              Medium (38px)
            </Button>
            <Button size="lg" variant="secondary">
              Large (44px)
            </Button>
            <Button size="icon-sm" variant="secondary" aria-label="Ikon kecil">
              <Plus className="h-3.5 w-3.5" />
            </Button>
            <Button size="icon" variant="secondary" aria-label="Ikon sedang">
              <Plus className="h-4 w-4" />
            </Button>
            <Button size="icon-lg" variant="secondary" aria-label="Ikon besar">
              <Plus className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </Card>
    </Section>
  );
}

