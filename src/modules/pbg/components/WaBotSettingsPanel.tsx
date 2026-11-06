'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { Bot, Save, RotateCcw, Send, CheckCircle2, AlertTriangle, Eye, ShieldCheck, Loader2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import {
  DEFAULT_WA_TEMPLATE_REMINDER,
  renderWaReminderTemplate,
} from '../lib/template';
import { saveWaBotSettingsAction, triggerPbgReminderAction } from '../actions';

export interface WaBotSettingsPanelProps {
  initialBotAktif: boolean;
  initialTemplate: string;
  hasFonnteToken: boolean;
  pendingReminderCount: number;
}

const PLACEHOLDERS = [
  { key: '{pemohon}', label: 'Nama Pemohon' },
  { key: '{nominal}', label: 'Nominal Rupiah' },
  { key: '{jatuh_tempo}', label: 'Tgl Jatuh Tempo' },
  { key: '{no_skrd}', label: 'Nomor SKRD' },
];

const SAMPLE_DATA = {
  pemohon: 'Ir. H. Budi Santoso',
  nominal: 18500000,
  jatuhTempo: '2026-11-15',
  noSkrd: 'SKRD/PBG/2026/0142',
};

export function WaBotSettingsPanel({
  initialBotAktif,
  initialTemplate,
  hasFonnteToken,
  pendingReminderCount,
}: WaBotSettingsPanelProps) {
  const [botAktif, setBotAktif] = React.useState(initialBotAktif);
  const [template, setTemplate] = React.useState(initialTemplate || DEFAULT_WA_TEMPLATE_REMINDER);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isSending, setIsSending] = React.useState(false);
  const [isConfirmBulkOpen, setIsConfirmBulkOpen] = React.useState(false);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const previewMessage = React.useMemo(() => {
    return renderWaReminderTemplate(template, SAMPLE_DATA);
  }, [template]);

  const handleInsertPlaceholder = (ph: string) => {
    const el = textareaRef.current;
    if (!el) {
      setTemplate((prev) => prev + ph);
      return;
    }

    const start = el.selectionStart;
    const end = el.selectionEnd;
    const current = template;
    const next = current.substring(0, start) + ph + current.substring(end);
    setTemplate(next);

    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + ph.length, start + ph.length);
    }, 0);
  };

  const handleResetTemplate = () => {
    setTemplate(DEFAULT_WA_TEMPLATE_REMINDER);
    toast.info('Template dikembalikan ke format bawaan.');
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      const res = await saveWaBotSettingsAction({
        botAktif,
        templateReminder: template,
      });
      toast.success(res.message);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menyimpan pengaturan.';
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTriggerBulkReminder = async () => {
    setIsSending(true);
    try {
      const res = await triggerPbgReminderAction({ trigger: 'MANUAL' });
      toast.success(res.message);
      setIsConfirmBulkOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal mengirim pengingat massal.';
      toast.error(msg);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Kartu Status & Sakelar Bot */}
      <div className="rounded-card border border-border bg-surface p-5 sm:p-6 shadow-card transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="rounded-btn p-2.5 bg-primary-tint text-primary shrink-0">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-semibold text-text-primary">
                  Status Otomatisasi Bot WhatsApp
                </h3>
                {hasFonnteToken ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-success-tint text-success-dark border border-success/30">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Token Terpasang
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-warning-tint text-warning-dark border border-warning/30">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Token Belum Diatur (.env)
                  </span>
                )}
              </div>
              <p className="text-xs text-text-secondary mt-1 leading-relaxed">
                Ketika bot nonaktif atau token belum terpasang di sistem, pengiriman pesan tetap berjalan aman dalam mode <span className="font-semibold text-text-primary">Dry-Run</span> (pencatatan simulasi tanpa memotong kuota gateway).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
            <span className="text-xs font-medium text-text-secondary">
              {botAktif ? 'Bot Aktif' : 'Bot Nonaktif'}
            </span>
            <Switch
              checked={botAktif}
              onCheckedChange={setBotAktif}
              aria-label="Toggle aktifkan bot WhatsApp"
            />
          </div>
        </div>
      </div>

      {/* Editor Template Pesan & Pratinjau */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Kolom Editor */}
        <div className="rounded-card border border-border bg-surface p-5 sm:p-6 shadow-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold text-text-primary">
                Template Pesan Pengingat
              </h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetTemplate}
                className="h-7 text-xs text-text-secondary hover:text-text-primary"
              >
                <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                Pulihkan Default
              </Button>
            </div>
            <p className="text-xs text-text-secondary mb-3">
              Klik tag placeholder berikut untuk menyisipkan variabel dinamis:
            </p>

            <div className="flex flex-wrap gap-1.5 mb-3">
              {PLACEHOLDERS.map((ph) => (
                <button
                  key={ph.key}
                  type="button"
                  onClick={() => handleInsertPlaceholder(ph.key)}
                  className="inline-flex items-center px-2 py-1 rounded-btn text-xs font-mono bg-surface-2 text-primary border border-border hover:border-primary/50 transition-colors"
                  title={`Sisipkan ${ph.label}`}
                >
                  {ph.key}
                </button>
              ))}
            </div>

            <Textarea
              ref={textareaRef}
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              rows={8}
              className="font-sans text-xs leading-relaxed resize-y"
              placeholder="Tuliskan format pesan pengingat retribusi..."
            />
          </div>

          <div className="pt-4 mt-4 border-t border-border flex justify-end">
            <Button
              variant="primary"
              size="sm"
              onClick={handleSaveSettings}
              disabled={isSaving}
              className="gap-2"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Simpan Pengaturan
            </Button>
          </div>
        </div>

        {/* Kolom Pratinjau & Aksi Cepat */}
        <div className="space-y-6 flex flex-col">
          <div className="rounded-card border border-border bg-surface p-5 sm:p-6 shadow-card flex-1 flex flex-col">
            <div className="flex items-center gap-2 mb-3">
              <Eye className="h-4 w-4 text-primary" />
              <h4 className="text-sm font-semibold text-text-primary">
                Pratinjau Pesan Terkirim
              </h4>
            </div>

            <div className="flex-1 rounded-btn border border-border bg-surface-2/60 p-4 font-sans text-xs text-text-primary whitespace-pre-wrap leading-relaxed">
              {previewMessage}
            </div>
          </div>

          {/* Trigger Pengingat Manual */}
          <div className="rounded-card border border-border bg-surface p-5 sm:p-6 shadow-card">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-semibold text-text-primary">
                  Pengiriman Pengingat Manual
                </h4>
                <p className="text-xs text-text-secondary mt-0.5">
                  Terdapat <span className="font-semibold text-text-primary">{pendingReminderCount} tagihan</span> mendekati jatuh tempo (rentang H-3).
                </p>
              </div>

              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsConfirmBulkOpen(true)}
                disabled={isSending || pendingReminderCount === 0}
                className="gap-2 shrink-0"
              >
                <Send className="h-4 w-4 text-primary" />
                Kirim Sekarang ({pendingReminderCount})
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Dialog Konfirmasi Pengiriman Manual Massal */}
      <ConfirmDialog
        open={isConfirmBulkOpen}
        onOpenChange={setIsConfirmBulkOpen}
        title="Kirim Pengingat Retribusi Massal"
        description={`Sistem akan memproses notifikasi WhatsApp untuk ${pendingReminderCount} tagihan PBG yang berstatus Belum Bayar dan mendekati jatuh tempo. Tagihan yang sudah pernah dikirimi pesan dalam kurun waktu 1 jam terakhir akan dilewati secara otomatis. Lanjutkan pengiriman?`}
        confirmLabel="Ya, Kirim Sekarang"
        variant="primary"
        isLoading={isSending}
        onConfirm={handleTriggerBulkReminder}
      />
    </div>
  );
}

