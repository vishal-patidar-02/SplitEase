'use client';

import { useMemo } from 'react';
import { TrendingUp, TrendingDown, Target, Wallet } from 'lucide-react';
import { Member, Expense } from '@/lib/types';
import { calculateBalances } from '@/lib/settlement';
import { cn, formatCurrency, getInitials, getAvatarColor } from '@/lib/utils';

interface BalanceSummaryCardProps {
  members: Member[];
  expenses: Expense[];
}

export default function BalanceSummaryCard({ members, expenses }: BalanceSummaryCardProps) {
  const balances   = useMemo(() => calculateBalances(members, expenses), [members, expenses]);
  const totalSpent = useMemo(() => expenses.reduce((s, e) => s + e.amount, 0), [expenses]);
  const avgPerson  = members.length > 0 ? totalSpent / members.length : 0;
  const maxAbs     = useMemo(
    () => Math.max(...balances.map(b => Math.abs(b.netBalance)), 1),
    [balances],
  );

  return (
    <div className="card p-5 animate-[fade-in_0.25s_ease-out]">
      <h3 className="font-heading font-bold text-slate-800 dark:text-slate-100 mb-5 flex items-center gap-2">
        <span className="text-lg">📊</span> Balances
        <span className="badge badge-neutral">Overview</span>
      </h3>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-gradient-to-br from-sky-50 to-blue-50 dark:from-sky-900/30 dark:to-blue-900/20
                        p-4 rounded-2xl border border-sky-100/70 dark:border-sky-900/40 shadow-sm">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-sky-500 dark:text-sky-400 uppercase tracking-wider mb-1.5">
            <Wallet size={12} strokeWidth={2.5} /> Total Spend
          </div>
          <div className="text-xl font-heading font-black text-sky-700 dark:text-sky-300">
            {formatCurrency(totalSpent)}
          </div>
        </div>
        <div className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/30 dark:to-green-900/20
                        p-4 rounded-2xl border border-emerald-100/70 dark:border-emerald-900/40 shadow-sm">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-500 dark:text-emerald-400 uppercase tracking-wider mb-1.5">
            <Target size={12} strokeWidth={2.5} /> Avg / Person
          </div>
          <div className="text-xl font-heading font-black text-emerald-700 dark:text-emerald-300">
            {formatCurrency(avgPerson)}
          </div>
        </div>
      </div>

      {/* Balances */}
      <div className="space-y-3">
        {balances.map(b => {
          const mIdx       = members.findIndex(m => m.id === b.memberId);
          const isPositive = b.netBalance > 0.01;
          const isNegative = b.netBalance < -0.01;
          const barPct     = Math.min(100, (Math.abs(b.netBalance) / maxAbs) * 100);

          return (
            <div
              key={b.memberId}
              className="flex items-center gap-4 p-3 rounded-2xl
                         bg-white/60 dark:bg-slate-800/50
                         border border-white/80 dark:border-slate-700/50
                         hover:bg-white/85 dark:hover:bg-slate-800/70
                         transition-all backdrop-blur-sm"
            >
              <div className={cn('avatar w-10 h-10 text-xs font-black shadow-sm', getAvatarColor(mIdx))}>
                {getInitials(b.memberName)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="font-heading font-bold text-slate-800 dark:text-slate-100 truncate">
                    {b.memberName}
                  </span>
                  <span className={cn(
                    'text-sm font-black tabular-nums',
                    isPositive ? 'text-emerald-500 dark:text-emerald-400'
                               : isNegative ? 'text-rose-500 dark:text-rose-400'
                               : 'text-slate-400 dark:text-slate-500'
                  )}>
                    {isPositive ? '+' : ''}{formatCurrency(b.netBalance)}
                  </span>
                </div>

                {/* Bar */}
                <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  {(isPositive || isNegative) && (
                    <div
                      className={cn(
                        'h-full rounded-full transition-all duration-700',
                        isPositive
                          ? 'bg-gradient-to-r from-emerald-400 to-green-500'
                          : 'bg-gradient-to-r from-rose-400 to-red-500'
                      )}
                      style={{ width: `${barPct}%` }}
                    />
                  )}
                </div>

                {/* Labels */}
                <div className="flex items-center justify-between mt-1.5">
                  <div className="flex items-center gap-1 text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">
                    <TrendingUp size={10} className="text-emerald-400" strokeWidth={2.5} />
                    Paid {formatCurrency(b.totalPaid)}
                  </div>
                  <div className="flex items-center gap-1 text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">
                    Owes {formatCurrency(b.totalOwed)}
                    <TrendingDown size={10} className="text-rose-400" strokeWidth={2.5} />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {members.length === 0 && (
        <div className="text-center py-8 text-slate-400 dark:text-slate-600 text-sm font-medium italic">
          No balance data yet.
        </div>
      )}
    </div>
  );
}