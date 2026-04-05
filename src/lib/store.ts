// ============================================
// ZUSTAND STORE — Session State Management
// Persisted to localStorage & Synced to Supabase
// ============================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { nanoid } from 'nanoid';
import { Session, Member, Expense, Payer, Split, ExpenseCategory } from './types';
import { supabase } from './supabase';

interface SessionStore {
  // State
  sessions: Record<string, Session>;
  currentSessionId: string | null;

  // Session actions
  createSession: (name: string) => string;
  joinSession: (sessionId: string, memberName: string) => Promise<boolean>;
  fetchSessionFromDb: (sessionId: string) => Promise<boolean>;
  subscribeToSession: (sessionId: string) => () => void;
  setCurrentSession: (sessionId: string | null) => void;
  getCurrentSession: () => Session | null;

  // Member actions
  addMember: (sessionId: string, name: string) => Member;
  removeMember: (sessionId: string, memberId: string) => void;

  // Expense actions
  addExpense: (
    sessionId: string,
    title: string,
    amount: number,
    payers: Payer[],
    splits: Split[],
    category: ExpenseCategory,
    notes: string
  ) => void;
  editExpense: (sessionId: string, expenseId: string, updates: Partial<Omit<Expense, 'id' | 'createdAt'>>) => void;
  deleteExpense: (sessionId: string, expenseId: string) => void;

}

const pushToSupabase = async (sessionId: string, session: Session) => {
  if (supabase) {
    try {
      await supabase.from('sessions').upsert({ id: sessionId, data: session as any });
    } catch (err) {
      console.error("Supabase sync failed:", err);
    }
  }
};

export const useSessionStore = create<SessionStore>()(
  persist(
    (set, get) => ({
      sessions: {},
      currentSessionId: null,

      createSession: (name: string) => {
        const id = nanoid(10);
        const session: Session = {
          id,
          name: name || 'Untitled Session',
          createdAt: new Date().toISOString(),
          members: [],
          expenses: [],
        };
        set((state) => ({
          sessions: { ...state.sessions, [id]: session },
          currentSessionId: id,
        }));
        pushToSupabase(id, session);
        return id;
      },

      fetchSessionFromDb: async (sessionId: string) => {
        if (!supabase) return false;
        try {
          const { data } = await supabase.from('sessions').select('data').eq('id', sessionId).single();
          if (data && data.data) {
            set((state) => ({
              sessions: { ...state.sessions, [sessionId]: data.data },
            }));
            return true;
          }
        } catch (e) {
          console.error("Failed to fetch session from Supabase", e);
        }
        return false;
      },

      subscribeToSession: (sessionId: string) => {
        if (!supabase) return () => {};
        
        const channel = supabase.channel(`room-${sessionId}`)
          .on('postgres_changes', { event: '*', schema: 'public', table: 'sessions', filter: `id=eq.${sessionId}` }, (payload) => {
            const newPayload = payload.new as Record<string, any>;
            if (newPayload && newPayload.data) {
              set((state) => {
                // Only write if there's actually a session change to avoid re-renders
                if (JSON.stringify(state.sessions[sessionId]) !== JSON.stringify(newPayload.data)) {
                  return { sessions: { ...state.sessions, [sessionId]: newPayload.data as Session } };
                }
                return state;
              });
            }
          })
          .subscribe();

        return () => {
          supabase?.removeChannel(channel);
        };
      },

      joinSession: async (sessionId: string, memberName: string) => {
        let session = get().sessions[sessionId];

        // Fetch from DB if not local
        if (!session && supabase) {
          await get().fetchSessionFromDb(sessionId);
          session = get().sessions[sessionId];
        }

        if (!session) return false;

        const existingMember = session.members.find(
          (m) => m.name.toLowerCase() === memberName.toLowerCase()
        );
        if (existingMember) {
          set({ currentSessionId: sessionId });
          return true;
        }

        const newMember: Member = {
          id: nanoid(8),
          name: memberName,
        };

        const updatedSession = { ...session, members: [...session.members, newMember] };

        set((state) => ({
          sessions: { ...state.sessions, [sessionId]: updatedSession },
          currentSessionId: sessionId,
        }));
        
        pushToSupabase(sessionId, updatedSession);
        return true;
      },

      setCurrentSession: (sessionId) => {
        set({ currentSessionId: sessionId });
      },

      getCurrentSession: () => {
        const state = get();
        if (!state.currentSessionId) return null;
        return state.sessions[state.currentSessionId] || null;
      },

      addMember: (sessionId: string, name: string) => {
        const member: Member = {
          id: nanoid(8),
          name,
        };
        let updatedSession: Session | null = null;
        set((state) => {
          const session = state.sessions[sessionId];
          if (!session) return state;
          updatedSession = { ...session, members: [...session.members, member] };
          return {
            sessions: { ...state.sessions, [sessionId]: updatedSession },
          };
        });
        if (updatedSession) pushToSupabase(sessionId, updatedSession);
        return member;
      },

      removeMember: (sessionId: string, memberId: string) => {
        let updatedSession: Session | null = null;
        set((state) => {
          const session = state.sessions[sessionId];
          if (!session) return state;
          updatedSession = { ...session, members: session.members.filter((m) => m.id !== memberId) };
          return {
            sessions: { ...state.sessions, [sessionId]: updatedSession },
          };
        });
        if (updatedSession) pushToSupabase(sessionId, updatedSession);
      },

      addExpense: (sessionId, title, amount, payers, splits, category, notes) => {
        let updatedSession: Session | null = null;
        set((state) => {
          const session = state.sessions[sessionId];
          if (!session) return state;
          const expense: Expense = {
            id: nanoid(8), title, amount, payers, splits, category, notes, createdAt: new Date().toISOString(),
          };
          updatedSession = { ...session, expenses: [expense, ...session.expenses] };
          return {
            sessions: { ...state.sessions, [sessionId]: updatedSession },
          };
        });
        if (updatedSession) pushToSupabase(sessionId, updatedSession);
      },

      editExpense: (sessionId, expenseId, updates) => {
        let updatedSession: Session | null = null;
        set((state) => {
          const session = state.sessions[sessionId];
          if (!session) return state;
          updatedSession = {
            ...session,
            expenses: session.expenses.map((e) => e.id === expenseId ? { ...e, ...updates } : e),
          };
          return {
            sessions: { ...state.sessions, [sessionId]: updatedSession },
          };
        });
        if (updatedSession) pushToSupabase(sessionId, updatedSession);
      },

      deleteExpense: (sessionId, expenseId) => {
        let updatedSession: Session | null = null;
        set((state) => {
          const session = state.sessions[sessionId];
          if (!session) return state;
          updatedSession = {
            ...session,
            expenses: session.expenses.filter((e) => e.id !== expenseId),
          };
          return {
            sessions: { ...state.sessions, [sessionId]: updatedSession },
          };
        });
        if (updatedSession) pushToSupabase(sessionId, updatedSession);
      },

    }),

    {
      name: 'splitwise-storage',
    }
  )
);
