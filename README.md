# SplitEase ✨ — Smart Group Expense Splitter

The ultimate group outing expense manager for hackathon champions! Focus on your trip, let us handle the math.

## 🚀 Mission
SplitEase is a lightweight, **no-login**, mobile-first web app that simplifies group expenses and provides a **smart settlement** plan with the minimum number of transactions.

## ✨ Features
- **Instant Sessions**: Create or join sessions without an account.
- **Smart Settlement**: High-performance algorithm that minimizes bank transfers.
- **Flexible Splits**: Equal or custom amount splits per person.
- **WhatsApp Export**: One-tap share of final settlements with your group.
- **PDF Export**: Generate professional expense reports with one click.
- **Premium UI**: Ultra-clean card-based responsive design with glassmorphism.

## 🧠 Smart Settlement Algorithm
SplitEase uses a **greedy matching approach** based on graph theory to simplify debts:

1. **Calculate Balances**: Compute net position for each member (Total Paid - Total Owed).
2. **Classify**: Separate members into "Creditors" (+ve balance) and "Debtors" (-ve balance).
3. **Sort**: Order both lists by magnitude (largest amounts first).
4. **Iterative Matching**:
   - Pair the largest creditor with the largest debtor.
   - Settle the minimum of their absolute balances.
   - Update those members' outstanding positions.
   - Repeat until all debts are cleared.

This ensures you spend less time transferring money and more time enjoying your trip! 🌊

## 🛠️ Tech Stack
- **Framework**: Next.js 15 (App Router)
- **State**: Zustand (Persisted in LocalStorage)
- **Styling**: Tailwind CSS v4 + Responsive Animations
- **Icons**: Lucide React
- **PDF**: jsPDF + jsPDF-AutoTable
- **Language**: TypeScript

## 🎯 Demo Data (Included)
The "Goa Trip 2026" demo features:
- 5 Predefined members
- 10 Realistic trip expenses (Flight, Hotel, Scooters, Clubbing, etc.)
- Complex mixed equal/selected splits
- Calculated multi-step settlements for instant review

## 📦 Getting Started
1. Install dependencies: `npm install`
2. Run development: `npm run dev`
3. Hit the **"Try Demo"** button on the home page!

---
Built with ❤️ by the SplitEase Team (4 Agent Coordination)
