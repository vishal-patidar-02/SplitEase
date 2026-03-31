// ============================================
// EXPORT UTILITIES
// WhatsApp text + PDF generation
// ============================================

import { Session, Settlement, MemberBalance } from './types';
import { calculateBalances, computeSettlements } from './settlement';
import { copyToClipboard } from './utils';

/**
 * Generate WhatsApp-friendly settlement text
 */
export function generateWhatsAppText(session: Session): string {
  const settlements = computeSettlements(session.members, session.expenses);
  const balances = calculateBalances(session.members, session.expenses);
  const totalSpent = session.expenses.reduce((sum, e) => sum + e.amount, 0);

  const memberName = (id: string) =>
    session.members.find((m) => m.id === id)?.name || 'Unknown';

  let text = `💰 *${session.name}* — Settlement Summary\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  text += `👥 *${session.members.length} members* · 📝 *${session.expenses.length} expenses* · 💸 *₹${totalSpent.toLocaleString('en-IN')}* total\n\n`;

  if (settlements.length === 0) {
    text += `✅ All settled up! No payments needed.\n`;
  } else {
    text += `🔄 *Settlements (${settlements.length} transactions):*\n\n`;
    settlements.forEach((s) => {
      text += `  ${memberName(s.from)} → ${memberName(s.to)}  ₹${s.amount.toLocaleString('en-IN')}\n`;
    });
  }

  text += `\n━━━━━━━━━━━━━━━━━━━━━━\n`;
  text += `📊 *Individual Summary:*\n\n`;
  balances.forEach((b) => {
    const status =
      b.netBalance > 0.01
        ? `gets back ₹${b.netBalance.toLocaleString('en-IN')}`
        : b.netBalance < -0.01
        ? `owes ₹${Math.abs(b.netBalance).toLocaleString('en-IN')}`
        : `all settled ✅`;
    text += `  ${b.memberName}: ${status}\n`;
  });

  text += `\n_Sent via SplitEase_ ✨`;

  return text;
}

/**
 * Share via WhatsApp
 */
export function shareToWhatsApp(session: Session): void {
  const text = generateWhatsAppText(session);
  const encoded = encodeURIComponent(text);
  window.open(`https://wa.me/?text=${encoded}`, '_blank');
}

/**
 * Generate and download PDF
 */
export async function generatePDF(session: Session): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');

  const doc = new jsPDF();
  const balances = calculateBalances(session.members, session.expenses);
  const settlements = computeSettlements(session.members, session.expenses);
  const totalSpent = session.expenses.reduce((sum, e) => sum + e.amount, 0);
  const memberName = (id: string) =>
    session.members.find((m) => m.id === id)?.name || 'Unknown';

  // Title
  doc.setFontSize(22);
  doc.setTextColor(67, 56, 202);
  doc.text(session.name.replace(/[^\w\s-]/g, '').trim() || 'Trip Expenses', 14, 25);

  // Subtitle
  doc.setFontSize(10);
  doc.setTextColor(107, 114, 128);
  doc.text(
    `${session.members.length} members · ${session.expenses.length} expenses · Total: Rs ${totalSpent.toLocaleString('en-IN')}`,
    14,
    33
  );

  doc.setDrawColor(229, 231, 235);
  doc.line(14, 37, 196, 37);

  // Members
  doc.setFontSize(14);
  doc.setTextColor(31, 41, 55);
  doc.text('Members', 14, 46);
  doc.setFontSize(10);
  doc.setTextColor(75, 85, 99);
  doc.text(session.members.map((m) => m.name).join(', '), 14, 53);

  // Expenses Table
  doc.setFontSize(14);
  doc.setTextColor(31, 41, 55);
  doc.text('Expenses', 14, 65);

  autoTable(doc, {
    startY: 69,
    head: [['#', 'Title', 'Amount', 'Paid By', 'Split Among']],
    body: session.expenses.map((e, i) => [
      (i + 1).toString(),
      e.title,
      `Rs ${e.amount.toLocaleString('en-IN')}`,
      e.payers.map((p) => memberName(p.memberId)).join(', '),
      e.splits.length === session.members.length
        ? 'Everyone'
        : e.splits.map((s) => memberName(s.memberId)).join(', '),
    ]),
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [67, 56, 202], textColor: 255 },
    alternateRowStyles: { fillColor: [245, 243, 255] },
  });

  // Balance Summary
  const finalY = (doc as any).lastAutoTable?.finalY || 140;
  doc.setFontSize(14);
  doc.setTextColor(31, 41, 55);
  doc.text('Balance Summary', 14, finalY + 15);

  autoTable(doc, {
    startY: finalY + 19,
    head: [['Member', 'Total Paid', 'Total Owed', 'Net Balance']],
    body: balances.map((b) => [
      b.memberName,
      `Rs ${b.totalPaid.toLocaleString('en-IN')}`,
      `Rs ${b.totalOwed.toLocaleString('en-IN')}`,
      b.netBalance >= 0
        ? `+Rs ${b.netBalance.toLocaleString('en-IN')}`
        : `-Rs ${Math.abs(b.netBalance).toLocaleString('en-IN')}`,
    ]),
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [67, 56, 202], textColor: 255 },
    alternateRowStyles: { fillColor: [245, 243, 255] },
  });

  // Settlements
  const balanceY = (doc as any).lastAutoTable?.finalY || 200;
  doc.setFontSize(14);
  doc.setTextColor(31, 41, 55);
  doc.text('Settlement Plan', 14, balanceY + 15);

  if (settlements.length === 0) {
    doc.setFontSize(10);
    doc.setTextColor(34, 197, 94);
    doc.text('All settled up! No payments needed.', 14, balanceY + 23);
  } else {
    autoTable(doc, {
      startY: balanceY + 19,
      head: [['From', 'To', 'Amount']],
      body: settlements.map((s) => [
        memberName(s.from),
        memberName(s.to),
        `Rs ${s.amount.toLocaleString('en-IN')}`,
      ]),
      styles: { fontSize: 10, cellPadding: 4 },
      headStyles: { fillColor: [34, 197, 94], textColor: 255 },
      alternateRowStyles: { fillColor: [240, 253, 244] },
    });
  }

  // Footer
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(8);
  doc.setTextColor(156, 163, 175);
  doc.text('Generated by SplitEase', 14, pageHeight - 10);
  doc.text(new Date().toLocaleDateString(), 196, pageHeight - 10, { align: 'right' });

  doc.save(`${session.name.replace(/[^\w\s-]/g, '').trim() || 'settlement'}.pdf`);
}
