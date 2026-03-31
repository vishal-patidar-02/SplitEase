# SplitEase ✨ — Smart Group Expense Splitter

The ultimate group outing expense manager for hackathon champions! Focus on your trip, let us handle the math.

Built for speed, SplitEase is a **no-login**, **hybrid-local**, and **cloud-synced** group expense manager.

---

## 🚀 Mission
SplitEase is a lightweight, mobile-first web app that simplifies group expenses and provides a **smart settlement** plan with the minimum number of transactions using a custom greedy matching algorithm.

## ✨ Key Features
- **Cloud Sync (Supabase)**: Your data is automatically backed up to the cloud and synced across devices in real-time.
- **Real-time Collaboration**: See changes from other group members instantly without reloading.
- **Instant Sessions**: Create or join sessions using a simple code. No account creation required.
- **WebGL Animated Background**: A premium, performant WebGL-powered wave gradient for a top-tier aesthetic.
- **Smart Settlement**: High-performance algorithm that minimizes bank transfers.
- **Flexible Splits**: Equal or custom amount splits per person.
- **WhatsApp Export**: One-tap share of final settlements with your group.
- **PDF Export**: Generate professional expense reports for your group.
- **Ultra-Modern UI**: Clean card-based responsive design with glassmorphism and smooth micro-animations.
- **Hybrid Storage**: Fast local-first performance with reliable cloud persistence.

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
- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Backend/Database**: [Supabase](https://supabase.com/) (PostgreSQL + Real-time Sync)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand) (Persisted in LocalStorage)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) + Custom Animations
- **Graphics**: Custom WebGL / MiniGl for animated backgrounds
- **Icons**: [Lucide React](https://lucide.dev/)
- **PDF Generation**: [jsPDF](https://github.com/parallax/jsPDF) + [jsPDF-AutoTable](https://github.com/simonbengtsson/jsPDF-AutoTable)
- **Language**: [TypeScript](https://www.typescriptlang.org/)

## 🏗️ Project Architecture
- `src/app/`: Next.js App Router for session management and layouts.
- `src/components/`: Reusable UI components (MembersCard, ExpenseListCard, SettlementCard, etc.).
- `src/components/ui/`: Low-level design system components like the `GradientWave`.
- `src/lib/store.ts`: The central source of truth powered by Zustand, handling both local and Supabase sync.
- `src/lib/supabase.ts`: Supabase client configuration.
- `src/lib/utils.ts`: Core splitting logic and formatting helpers.

## 🎯 Demo Data
The "Goa Trip 2026" demo features:
- 5 Predefined members
- 10 Realistic trip expenses (Flight, Hotel, Scooters, Clubbing, etc.)
- Complex mixed equal/selected splits
- Calculated multi-step settlements for instant review

## 📦 Getting Started
1. Install dependencies:
   ```bash
   npm install
   ```
2. Configure Environment:
   Create a `.env.local` file with your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
3. Run development server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) and hit the **"Try Demo"** button!

---
Built with ❤️ by the **SplitEase Team** (AI-Powered Coordination)
