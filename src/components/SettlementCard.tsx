'use client';

import { useMemo } from 'react';
import { ArrowRight, Share2, FileText, CheckCircle2, Copy } from 'lucide-react';
import { Member, Expense, Session } from '@/lib/types';
import { computeSettlements } from '@/lib/settlement';
import { shareToWhatsApp, generatePDF, generateWhatsAppText } from '@/lib/export';
import { cn, formatCurrency, getInitials, getAvatarColor, copyToClipboard } from '@/lib/utils';
import { useToast } from './Toast';

interface SettlementCardProps {
  session: Session;
  members: Member[];
  expenses: Expense[];
}

export default function SettlementCard({ session, members, expenses }: SettlementCardProps) {
  const settlements = useMemo(() => computeSettlements(members, expenses), [members, expenses]);
  const { showToast } = useToast();

  const getName    = (id: string) => members.find(m => m.id === id)?.name || 'Unknown';
  const getAvatIdx = (id: string) => members.findIndex(m => m.id === id);

  const handleCopy = async () => {
    const ok = await copyToClipboard(generateWhatsAppText(session));
    if (ok) showToast('Settlement text copied! 📋');
  };

  return (
    <div className="card p-5 animate-[fade-in_0.25s_ease-out] relative overflow-hidden">
      {/* Decorative watermark */}
      <div className="absolute -bottom-4 -right-4 opacity-[0.04] dark:opacity-[0.03] pointer-events-none select-none">
        <ArrowRight size={130} strokeWidth={1} />
      </div>

      <h3 className="font-heading font-bold text-slate-800 dark:text-slate-100 mb-5 flex items-center gap-2">
        <span className="text-lg">🤝</span> Smart Settlement
        <span className="badge badge-neutral">Min. Txn</span>
      </h3>

      {settlements.length > 0 ? (
        <div className="space-y-3 mb-6">
          {settlements.map((s, i) => {
            const fromIdx = getAvatIdx(s.from);
            const toIdx   = getAvatIdx(s.to);
            return (
              <div
                key={`${s.from}-${s.to}-${i}`}
                className="flex items-center gap-3 p-4 rounded-2xl
                           bg-gradient-to-br from-sky-50/60 to-blue-50/40
                           dark:from-sky-900/25 dark:to-blue-900/20
                           border border-sky-100/60 dark:border-sky-900/40
                           shadow-sm hover:shadow-md
                           hover:from-sky-50 hover:to-blue-50
                           dark:hover:from-sky-900/35 dark:hover:to-blue-900/30
                           transition-all"
              >
                {/* From */}
                <div className="flex flex-col items-center gap-1.5 min-w-[60px]">
                  <div className={cn('avatar w-11 h-11 text-sm shadow-md ring-2 ring-white dark:ring-slate-800', getAvatarColor(fromIdx))}>
                    {getInitials(getName(s.from))}
                  </div>
                  <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase truncate max-w-[60px] text-center">
                    {getName(s.from)}
                  </span>
                </div>

                {/* Arrow + amount */}
                <div className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-base font-heading font-black text-sky-700 dark:text-sky-300 tabular-nums">
                    {formatCurrency(s.amount)}
                  </span>
                  <div className="flex items-center gap-1 w-full px-1">
                    <div className="h-0.5 flex-1 bg-gradient-to-r from-sky-300 to-blue-400 dark:from-sky-700 dark:to-blue-600 rounded-full" />
                    <ArrowRight size={14} className="text-sky-400 dark:text-sky-600 flex-shrink-0" />
                  </div>
                  <span className="text-[9px] font-bold text-sky-400 dark:text-sky-600 uppercase tracking-widest">
                    pays
                  </span>
                </div>

                {/* To */}
                <div className="flex flex-col items-center gap-1.5 min-w-[60px]">
                  <div className={cn('avatar w-11 h-11 text-sm shadow-md ring-2 ring-white dark:ring-slate-800', getAvatarColor(toIdx))}>
                    {getInitials(getName(s.to))}
                  </div>
                  <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase truncate max-w-[60px] text-center">
                    {getName(s.to)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="empty-state py-10 mb-4">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-50 to-green-100 dark:from-emerald-900/30 dark:to-green-900/20 rounded-2xl flex items-center justify-center text-3xl mb-3 shadow-inner">
            ✅
          </div>
          <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">All Settled Up!</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-[200px]">
            Everyone is even. Add more expenses to keep splitting!
          </p>
        </div>
      )}

      {/* Export buttons */}
      <div className="grid grid-cols-3 gap-2.5">
        {[
          {
            label: 'WhatsApp', icon: Share2,
            color: 'text-emerald-600 dark:text-emerald-400',
            hover: 'hover:bg-emerald-50 dark:hover:bg-emerald-900/30 hover:border-emerald-200 dark:hover:border-emerald-800',
            border: 'border-emerald-100 dark:border-emerald-900/50',
            onClick: () => shareToWhatsApp(session),
            disabled: settlements.length === 0,
          },
          {
            label: 'Copy Text', icon: Copy,
            color: 'text-amber-600 dark:text-amber-400',
            hover: 'hover:bg-amber-50 dark:hover:bg-amber-900/30 hover:border-amber-200 dark:hover:border-amber-800',
            border: 'border-amber-100 dark:border-amber-900/50',
            onClick: handleCopy,
            disabled: settlements.length === 0,
          },
          {
            label: 'PDF Export', icon: FileText,
            color: 'text-sky-600 dark:text-sky-400',
            hover: 'hover:bg-sky-50 dark:hover:bg-sky-900/30 hover:border-sky-200 dark:hover:border-sky-800',
            border: 'border-sky-100 dark:border-sky-900/50',
            onClick: () => { showToast('Generating PDF… ⏳', 'info'); generatePDF(session); },
            disabled: expenses.length === 0,
          },
        ].map(btn => (
          <button
            key={btn.label}
            onClick={btn.onClick}
            disabled={btn.disabled}
            className={cn(
              'h-12 flex flex-col items-center justify-center gap-1 rounded-2xl',
              'bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm',
              `border ${btn.border}`,
              btn.color, btn.hover,
              'hover:shadow-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all'
            )}
          >
            <btn.icon size={16} />
            <span className="text-[9px] font-black uppercase tracking-wider">{btn.label}</span>
          </button>
        ))}
      </div>

      {/* Notice */}
      <div className="mt-4 flex items-center gap-2 p-3
                      bg-gradient-to-r from-sky-50/60 to-blue-50/40
                      dark:from-sky-900/20 dark:to-blue-900/15
                      rounded-xl border border-sky-100/50 dark:border-sky-900/40">
        <CheckCircle2 size={13} className="text-sky-500 dark:text-sky-400 flex-shrink-0" />
        <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
          Our algorithm minimises the number of transactions to save everyone time. 🚀
        </span>
      </div>
    </div>
  );
}