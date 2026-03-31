'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Plus, Share2, ArrowLeft, Copy, Clock, SlidersHorizontal, Settings } from 'lucide-react';
import { useSessionStore } from '@/lib/store';
import { ToastProvider, useToast } from '@/components/Toast';
import { ThemeToggle } from '@/components/ThemeProvider';
import { cn, getShareableLink, copyToClipboard } from '@/lib/utils';
import { Expense } from '@/lib/types';

import MembersCard      from '@/components/MembersCard';
import ExpenseListCard  from '@/components/ExpenseListCard';
import BalanceSummaryCard from '@/components/BalanceSummaryCard';
import SettlementCard   from '@/components/SettlementCard';
import AddExpenseModal  from '@/components/AddExpenseModal';

export default function SessionPage() {
  return (
    <ToastProvider>
      <SessionContent />
    </ToastProvider>
  );
}

function SessionContent() {
  const params    = useParams();
  const router    = useRouter();
  const sessionId = params.id as string;
  const { sessions, setCurrentSession } = useSessionStore();
  const { showToast } = useToast();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<'expenses' | 'balances' | 'settlement'>('expenses');

  const session = useMemo(() => sessions[sessionId], [sessions, sessionId]);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      let s = useSessionStore.getState().sessions[sessionId];
      if (!s) {
        const exists = await useSessionStore.getState().fetchSessionFromDb(sessionId);
        if (!exists && mounted) { router.replace('/'); return; }
      }
      if (mounted) setCurrentSession(sessionId);
    };

    load();
    const unsub = useSessionStore.getState().subscribeToSession(sessionId);
    return () => { mounted = false; unsub(); };
  }, [sessionId, setCurrentSession, router]);

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-blob-layer" />
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-sky-100 dark:border-sky-900 border-t-sky-600 rounded-full animate-spin" />
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Loading session…</p>
        </div>
      </div>
    );
  }

  /* ── handlers ── */

  const handleShare = async () => {
    const link = getShareableLink(sessionId);
    if (navigator.share) {
      try {
        await navigator.share({ title: `Join ${session.name}`, text: `Split with me — ${session.name}!`, url: link });
      } catch {
        if (await copyToClipboard(link)) showToast('Link copied! 📋');
      }
    } else {
      if (await copyToClipboard(link)) showToast('Link copied! 📋');
    }
  };

  const openAddModal = () => {
    if (session.members.length === 0) { showToast('Add at least one member first', 'warning'); return; }
    setEditingExpense(undefined);
    setIsAddModalOpen(true);
  };

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setIsAddModalOpen(true);
  };

  const TABS = [
    { id: 'expenses',   label: 'Expenses', icon: Clock           },
    { id: 'balances',   label: 'Balances', icon: SlidersHorizontal },
    { id: 'settlement', label: 'Settle',   icon: Settings         },
  ] as const;

  return (
    <main className="min-h-screen app-container p-4 pb-28 animate-[fade-in_0.25s_ease-out]">
      <div className="bg-blob-layer" />

      {/* ── Header ── */}
      <header className="flex items-center justify-between py-4 mb-2 gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => router.push('/')}
            className="btn-ghost p-2 rounded-2xl
                       bg-white/60 dark:bg-slate-800/60
                       border border-white/80 dark:border-slate-700/50
                       hover:bg-white dark:hover:bg-slate-800
                       backdrop-blur-sm shadow-sm flex-shrink-0"
          >
            <ArrowLeft size={20} />
          </button>

          <div className="min-w-0">
            <h1 className="text-2xl font-heading font-black text-slate-900 dark:text-white leading-tight truncate max-w-[160px]">
              {session.name}
            </h1>
            <button
              onClick={async () => {
                if (await copyToClipboard(sessionId)) showToast('Copied! 📋', 'success');
              }}
              className="flex items-center gap-1 mt-0.5
                         text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest
                         bg-white/60 dark:bg-slate-800/50
                         hover:bg-white dark:hover:bg-slate-800
                         px-2 py-0.5 rounded-full border border-white/70 dark:border-slate-700/50
                         transition-colors cursor-pointer group"
              title="Copy Session Code"
            >
              CODE: <span className="text-slate-700 dark:text-slate-200">{sessionId}</span>
              <Copy size={10} className="text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 ml-0.5" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <ThemeToggle />
          <button
            onClick={handleShare}
            className="btn-secondary px-3 py-2 rounded-2xl shadow-sm text-sm font-bold gap-2
                       text-sky-600 dark:text-sky-400
                       bg-white/70 dark:bg-slate-800/70
                       border-white/80 dark:border-slate-700/50
                       hover:bg-white dark:hover:bg-slate-800"
          >
            <Share2 size={16} /> Share
          </button>
        </div>
      </header>

      {/* ── Tab nav ── */}
      <nav className="sticky top-2 z-30 mb-6 glass-nav p-1.5 rounded-2xl flex">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex-1 h-10 flex items-center justify-center gap-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all',
              activeTab === tab.id
                ? 'bg-sky-600 text-white shadow-md shadow-sky-400/30'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-white/30 dark:hover:bg-white/10'
            )}
          >
            <tab.icon size={14} strokeWidth={3} />
            <span className={cn(activeTab === tab.id ? 'block' : 'hidden sm:block')}>
              {tab.label}
            </span>
          </button>
        ))}
      </nav>

      {/* ── Content ── */}
      <div className="space-y-6">
        {activeTab === 'expenses' && (
          <>
            <MembersCard sessionId={sessionId} members={session.members} />
            <ExpenseListCard
              sessionId={sessionId}
              expenses={session.expenses}
              members={session.members}
              onEdit={handleEdit}
              onAdd={openAddModal}
            />
          </>
        )}
        {activeTab === 'balances' && (
          <BalanceSummaryCard members={session.members} expenses={session.expenses} />
        )}
        {activeTab === 'settlement' && (
          <SettlementCard session={session} members={session.members} expenses={session.expenses} />
        )}
      </div>

      {/* ── FAB ── */}
      <button
        onClick={openAddModal}
        className="fab w-16 h-16 rounded-2xl bottom-6 right-6"
        title="Add Expense"
        id="add-expense-fab"
      >
        <Plus size={32} strokeWidth={3} />
      </button>

      {/* ── Modal ── */}
      {isAddModalOpen && (
        <AddExpenseModal
          sessionId={sessionId}
          members={session.members}
          onClose={() => setIsAddModalOpen(false)}
          editExpense={editingExpense}
        />
      )}
    </main>
  );
}