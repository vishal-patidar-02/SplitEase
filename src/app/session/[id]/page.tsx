'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Plus, Share2, ArrowLeft, Copy, Clock, Filter, SlidersHorizontal, Settings, Trash2 } from 'lucide-react';
import { useSessionStore } from '@/lib/store';
import { ToastProvider, useToast } from '@/components/Toast';
import { cn, getShareableLink, copyToClipboard } from '@/lib/utils';
import { Expense } from '@/lib/types';

// Components
import MembersCard from '@/components/MembersCard';
import ExpenseListCard from '@/components/ExpenseListCard';
import BalanceSummaryCard from '@/components/BalanceSummaryCard';
import SettlementCard from '@/components/SettlementCard';
import AddExpenseModal from '@/components/AddExpenseModal';

export default function SessionPage() {
  return (
    <ToastProvider>
      <SessionContent />
    </ToastProvider>
  );
}

function SessionContent() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;
  const { sessions, currentSessionId, setCurrentSession } = useSessionStore();
  const { showToast } = useToast();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<'expenses' | 'balances' | 'settlement'>('expenses');

  const session = useMemo(() => sessions[sessionId], [sessions, sessionId]);

  useEffect(() => {
    if (!session) {
      // Small timeout to allow re-hydration
      const timer = setTimeout(() => {
        if (!useSessionStore.getState().sessions[sessionId]) {
          router.replace('/');
        }
      }, 500);
      return () => clearTimeout(timer);
    }
    setCurrentSession(sessionId);
  }, [session, sessionId, setCurrentSession, router]);

  if (!session) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
    </div>
  );

  const handleShare = async () => {
    const link = getShareableLink(sessionId);
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join ${session.name} Session`,
          text: `Split expenses with me for ${session.name}!`,
          url: link,
        });
      } catch {
        const success = await copyToClipboard(link);
        if (success) showToast('Link copied! 📋');
      }
    } else {
      const success = await copyToClipboard(link);
      if (success) showToast('Link copied! 📋');
    }
  };

  const openAddModal = () => {
    if (session.members.length === 0) {
      showToast('Add at least one member first', 'warning');
      return;
    }
    setEditingExpense(undefined);
    setIsAddModalOpen(true);
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setIsAddModalOpen(true);
  };

  return (
    <main className="min-h-screen app-container p-4 pb-28 animate-fade-in">
      {/* Header */}
      <header className="flex items-center justify-between py-4 mb-2">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/')}
            className="btn-ghost p-2 rounded-2xl bg-white/50 border border-white hover:bg-white"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-black text-gray-900 leading-tight truncate max-w-[180px]">
              {session.name}
            </h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-100 px-2 py-0.5 rounded-full">
                CODE: {sessionId}
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={handleShare}
          className="btn-secondary px-3 py-2 text-indigo-600 bg-white/70 border-white hover:bg-white rounded-2xl shadow-sm text-sm font-bold gap-2"
        >
          <Share2 size={16} /> Share
        </button>
      </header>

      {/* Tabs */}
      <nav className="sticky top-2 z-30 mb-6 bg-white/40 backdrop-blur-xl p-1.5 rounded-2xl border border-white/50 shadow-lg shadow-indigo-500/5 flex">
        {[
          { id: 'expenses', label: 'Expenses', icon: Clock },
          { id: 'balances', label: 'Balances', icon: SlidersHorizontal },
          { id: 'settlement', label: 'Settle', icon: Settings },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "flex-1 h-10 flex items-center justify-center gap-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
              activeTab === tab.id 
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-200" 
                : "text-gray-500 hover:text-gray-900"
            )}
          >
            <tab.icon size={14} strokeWidth={3} />
            <span className={cn(activeTab === tab.id ? "block" : "hidden sm:block")}>{tab.label}</span>
          </button>
        ))}
      </nav>

      {/* Content Area */}
      <div className="space-y-6">
        {activeTab === 'expenses' && (
          <>
            <MembersCard sessionId={sessionId} members={session.members} />
            <ExpenseListCard 
              sessionId={sessionId} 
              expenses={session.expenses} 
              members={session.members} 
              onEdit={handleEditExpense}
            />
          </>
        )}

        {activeTab === 'balances' && (
          <BalanceSummaryCard 
            members={session.members} 
            expenses={session.expenses} 
          />
        )}

        {activeTab === 'settlement' && (
          <SettlementCard 
            session={session}
            members={session.members} 
            expenses={session.expenses} 
          />
        )}
      </div>

      {/* Floating Action Button */}
      <button
        onClick={openAddModal}
        className="fab w-16 h-16 rounded-2xl shadow-xl shadow-indigo-500/40 bottom-6 right-6"
        title="Add Expense"
        id="add-expense-fab"
      >
        <Plus size={32} strokeWidth={3} />
      </button>

      {/* Modals */}
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
