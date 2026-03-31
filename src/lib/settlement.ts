// ============================================
// SMART SETTLEMENT ALGORITHM
// Greedy approach to minimize transactions
// ============================================

import { Expense, Member, MemberBalance, Settlement } from './types';

/**
 * Calculate net balance for each member across all expenses.
 * Positive balance = member is owed money (creditor)
 * Negative balance = member owes money (debtor)
 */
export function calculateBalances(members: Member[], expenses: Expense[]): MemberBalance[] {
  const balanceMap = new Map<string, { totalPaid: number; totalOwed: number }>();

  // Initialize all members
  members.forEach((m) => {
    balanceMap.set(m.id, { totalPaid: 0, totalOwed: 0 });
  });

  // Process each expense
  expenses.forEach((expense) => {
    // Add what each payer paid
    expense.payers.forEach((payer) => {
      const existing = balanceMap.get(payer.memberId);
      if (existing) {
        existing.totalPaid += payer.amount;
      }
    });

    // Add what each person owes
    expense.splits.forEach((split) => {
      const existing = balanceMap.get(split.memberId);
      if (existing) {
        existing.totalOwed += split.amount;
      }
    });
  });

  return members.map((m) => {
    const data = balanceMap.get(m.id) || { totalPaid: 0, totalOwed: 0 };
    return {
      memberId: m.id,
      memberName: m.name,
      totalPaid: roundToTwo(data.totalPaid),
      totalOwed: roundToTwo(data.totalOwed),
      netBalance: roundToTwo(data.totalPaid - data.totalOwed),
    };
  });
}

/**
 * Smart Settlement Algorithm (Greedy)
 * 
 * 1. Compute net balance per user
 * 2. Separate into creditors (+ve) and debtors (-ve)
 * 3. Sort both by absolute amount (descending)
 * 4. Match largest creditor with largest debtor
 * 5. Settle the minimum of the two amounts
 * 6. Repeat until all balances ≈ 0
 * 
 * This minimizes the number of transactions needed.
 */
export function computeSettlements(members: Member[], expenses: Expense[]): Settlement[] {
  const balances = calculateBalances(members, expenses);
  
  // Create mutable copies
  const creditors: { memberId: string; amount: number }[] = [];
  const debtors: { memberId: string; amount: number }[] = [];

  balances.forEach((b) => {
    if (b.netBalance > 0.01) {
      creditors.push({ memberId: b.memberId, amount: b.netBalance });
    } else if (b.netBalance < -0.01) {
      debtors.push({ memberId: b.memberId, amount: Math.abs(b.netBalance) });
    }
  });

  // Sort descending by amount
  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  const settlements: Settlement[] = [];

  let i = 0;
  let j = 0;

  while (i < creditors.length && j < debtors.length) {
    const settleAmount = Math.min(creditors[i].amount, debtors[j].amount);

    if (settleAmount > 0.01) {
      settlements.push({
        from: debtors[j].memberId,
        to: creditors[i].memberId,
        amount: roundToTwo(settleAmount),
      });
    }

    creditors[i].amount -= settleAmount;
    debtors[j].amount -= settleAmount;

    if (creditors[i].amount < 0.01) i++;
    if (debtors[j].amount < 0.01) j++;
  }

  return settlements;
}

function roundToTwo(num: number): number {
  return Math.round(num * 100) / 100;
}
