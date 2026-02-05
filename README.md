# ⚡ VibeFocus

**Gen Z Professional Habit Tracker**

VibeFocus is a mobile-first Progressive Web App (PWA) designed for the modern professional. It combines robust task management with energy auditing and deep work tools to help you maintain momentum and avoid burnout.

## ✨ Features

- **🎯 Focus Mode**: Dedicated timer interface for deep work sessions with audio ambiance.
- **🔋 Energy Audit**: Unique task tagging system (Green 🟢, Yellow 🟡, Red 🔴) to manage energy expenditure.
- **📊 Dashboard Hub**: Centralized view for daily progress, gamified streaks, and quick actions.
- **📝 Task Management**:
  - **Task Feed**: Dynamic feed of pending tasks.
  - **Smart Filtering**: Automatic filtering of completed tasks (accessible via distinct views).
  - **Secure Data**: Row Level Security (RLS) ensuring privacy.
- **📱 PWA Ready**: Installable on mobile devices with native app-like feel.
- **🌗 Dark Mode**: Sleek, battery-friendly dark interface.

## 🛠 Explore the Stack

- **Framework**: [Next.js 16 (App Router)](https://nextjs.org/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **UI Components**: [Radix UI](https://www.radix-ui.com/) & [Lucide React](https://lucide.dev/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Backend & Auth**: [Supabase](https://supabase.com/)
- **Charts**: [Recharts](https://recharts.org/)

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm, pnpm, or bun

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/yourusername/vibefocus.git
    cd vibefocus
    ```

2.  **Install dependencies**
    ```bash
    npm install
    # or
    pnpm install
    ```

3.  **Environment Setup**
    Create a `.env.local` file in the root directory and add your Supabase credentials:

    ```env
    NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
    ```

4.  **Run the development server**
    ```bash
    npm run dev
    ```

    Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 📂 Project Structure

```bash
vibefocus/
├── app/                  # Next.js App Router pages and layouts
│   ├── dashboard/        # Main authenticated application views
│   ├── login/            # Authentication pages
│   └── api/              # API routes (if any)
├── components/           # Reusable UI components
│   ├── dashboard/        # Dashboard-specific widgets (Streak, EnergyChart)
│   ├── features/         # Feature components (FocusMode, EnergyAudit)
│   └── ui/               # Generic UI primitives (Buttons, Inputs)
├── context/              # React Context (VibeContext, ThemeProvider)
├── utils/                # Helper functions and Supabase client
└── public/               # Static assets
```

## 📄 License

This project is licensed under the MIT License.
