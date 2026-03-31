// ============================================
// TYPES — Core Data Models
// ============================================

export interface Session {
  id: string;
  name: string;
  createdAt: string;
  members: Member[];
  expenses: Expense[];
}

export interface Member {
  id: string;
  name: string;
  avatar?: string;
}

export interface Payer {
  memberId: string;
  amount: number;
}

export interface Split {
  memberId: string;
  amount: number;
}

export interface Expense {
  id: string;
  title: string;
  amount: number;
  payers: Payer[];
  splits: Split[];
  category: ExpenseCategory;
  notes: string;
  createdAt: string;
}

export type ExpenseCategory =
  | 'food'
  | 'transport'
  | 'stay'
  | 'shopping'
  | 'activities'
  | 'drinks'
  | 'tickets'
  | 'other';

export interface Settlement {
  from: string; // memberId
  to: string;   // memberId
  amount: number;
}

export interface MemberBalance {
  memberId: string;
  memberName: string;
  totalPaid: number;
  totalOwed: number;
  netBalance: number; // positive = owed money, negative = owes money
}

export type SplitType = 'equal' | 'custom';

export const CATEGORIES: { value: ExpenseCategory; label: string; emoji: string }[] = [
  { value: 'food', label: 'Food', emoji: '🍕' },
  { value: 'transport', label: 'Transport', emoji: '🚗' },
  { value: 'stay', label: 'Stay', emoji: '🏨' },
  { value: 'shopping', label: 'Shopping', emoji: '🛍️' },
  { value: 'activities', label: 'Activities', emoji: '🎯' },
  { value: 'drinks', label: 'Drinks', emoji: '🍻' },
  { value: 'tickets', label: 'Tickets', emoji: '🎫' },
  { value: 'other', label: 'Other', emoji: '📦' },
];
