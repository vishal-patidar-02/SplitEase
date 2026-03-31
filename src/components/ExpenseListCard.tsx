'use client';

import { Edit2, Trash2, Calendar, Tag, Plus, Receipt } from 'lucide-react';
import { Expense, Member } from '@/lib/types';
import { cn, formatCurrency, formatDate, getCategoryInfo, getInitials, getAvatarColor } from '@/lib/utils';
import { useSessionStore } from '@/lib/store';
import { useToast } from './Toast';

interface ExpenseListCardProps {
  sessionId: string;
  expenses: Expense[];
  members: Member[];
  onEdit: (expense: Expense) => void;
  onAdd?: () => void;
}

export default function ExpenseListCard({ sessionId, expenses, members, onEdit, onAdd }: ExpenseListCardProps) {
  const { deleteExpense } = useSessionStore();
  const { showToast }     = useToast();

  const getName = (id: string) => members.find(m => m.id === id)?.name || 'Unknown';

  const handleDelete = (id: string, title: string) => {
    if (window.confirm(`Delete "${title}"?`)) {
      deleteExpense(sessionId, id);
      showToast('Expense deleted');
    }
  };

  return (
    <div className="card p-4 animate-[fade-in_0.25s_ease-out]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-heading font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <span className="text-lg">📜</span> Expenses
          <span className="badge badge-neutral ml-0.5">{expenses.length}</span>
        </h3>
        {onAdd && members.length > 0 && (
          <button
            onClick={onAdd}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white
                       bg-gradient-to-br from-sky-500 to-blue-600
                       shadow-md shadow-sky-400/30
                       hover:from-sky-400 hover:to-blue-500 hover:shadow-sky-400/50
                       active:scale-95 transition-all"
            id="add-expense-inline-btn"
          >
            <Plus size={14} strokeWidth={3} /> Add Expense
          </button>
        )}
      </div>

      {/* List */}
      <div className="space-y-3">
        {expenses.map(expense => {
          const cat     = getCategoryInfo(expense.category);
          const payerId = expense.payers[0]?.memberId;

          return (
            <div
              key={expense.id}
              className="group p-3.5 rounded-2xl
                         border border-white/80 dark:border-slate-700/50
                         bg-gradient-to-br from-white/70 to-slate-50/50
                         dark:from-slate-800/70 dark:to-slate-900/50
                         hover:from-white hover:to-sky-50/30
                         dark:hover:from-slate-800 dark:hover:to-sky-900/20
                         hover:border-sky-100 dark:hover:border-sky-900/50
                         hover:shadow-md hover:shadow-sky-100/40 dark:hover:shadow-sky-900/30
                         backdrop-blur-sm transition-all duration-200"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center text-xl shadow-sm flex-shrink-0">
                    {cat.emoji}
                  </div>
                  <div>
                    <h4 className="font-heading font-bold text-slate-900 dark:text-slate-100 leading-tight">
                      {expense.title}
                    </h4>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        <Tag size={10} /> {cat.label}
                      </div>
                      <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        <Calendar size={10} /> {formatDate(expense.createdAt)}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="font-extrabold text-sky-600 dark:text-sky-400 text-base">
                    {formatCurrency(expense.amount)}
                  </div>
                  <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-0.5">
                    PAID BY {getName(payerId).toUpperCase()}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-dashed border-slate-200/70 dark:border-slate-700/50">
                <div className="flex -space-x-1.5 overflow-hidden">
                  {expense.splits.slice(0, 5).map(split => {
                    const mIdx = members.findIndex(m => m.id === split.memberId);
                    return (
                      <div
                        key={split.memberId}
                        className={cn('avatar w-6 h-6 text-[9px] border-2 border-white dark:border-slate-800 ring-1 ring-slate-100 dark:ring-slate-700', getAvatarColor(mIdx))}
                        title={getName(split.memberId)}
                      >
                        {getInitials(getName(split.memberId))}
                      </div>
                    );
                  })}
                  {expense.splits.length > 5 && (
                    <div className="avatar w-6 h-6 text-[8px] border-2 border-white dark:border-slate-800 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                      +{expense.splits.length - 5}
                    </div>
                  )}
                </div>

                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => onEdit(expense)}
                    className="p-1.5 text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-900/30 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(expense.id, expense.title)}
                    className="p-1.5 text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {/* Empty state */}
        {expenses.length === 0 && (
          <div className="empty-state py-10">
            <div className="w-20 h-20 bg-gradient-to-br from-sky-50 to-blue-100 dark:from-sky-900/30 dark:to-blue-900/20 rounded-2xl flex items-center justify-center text-4xl mb-4 shadow-inner">
              💸
            </div>
            <p className="text-sm font-bold text-slate-600 dark:text-slate-400 mb-1">No expenses yet</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mb-5">
              {members.length === 0 ? 'Add members first, then log your first expense!' : 'Start tracking your shared expenses.'}
            </p>
            {onAdd && members.length > 0 && (
              <button
                onClick={onAdd}
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold text-white
                           bg-gradient-to-br from-sky-500 to-blue-600
                           shadow-lg shadow-sky-300/40 hover:shadow-sky-400/50
                           hover:from-sky-400 hover:to-blue-500
                           active:scale-95 transition-all"
                id="add-expense-empty-btn"
              >
                <Plus size={16} strokeWidth={3} /> Add First Expense
              </button>
            )}
          </div>
        )}
      </div>

      {/* Footer summary */}
      {expenses.length > 0 && (
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500 font-semibold">
            <Receipt size={12} />
            {expenses.length} expense{expenses.length !== 1 ? 's' : ''}
          </div>
          <div className="text-xs font-black text-sky-600 dark:text-sky-400">
            Total: {formatCurrency(expenses.reduce((s, e) => s + e.amount, 0))}
          </div>
        </div>
      )}
    </div>
  );
}