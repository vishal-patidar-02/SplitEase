import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import GlobalBackground from "@/components/GlobalBackground";

export const metadata: Metadata = {
  title: "SplitEase — Smart Group Expense Splitter",
  description:
    "Split group expenses effortlessly. Create a session, add expenses, and get smart settlement with minimal transactions. No login required.",
  keywords: ["expense splitter", "group expenses", "trip splitter", "bill split", "settlement"],
  openGraph: {
    title: "SplitEase — Smart Group Expense Splitter",
    description: "Split group expenses effortlessly with minimal transactions.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0ea5e9",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Anti-flash: apply saved / system theme before paint */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var saved = localStorage.getItem('splitease-theme');
                var system = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                var theme = saved || system;
                if (theme === 'dark') document.documentElement.classList.add('dark');
              } catch(e){}
            `,
          }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        <ThemeProvider>
          <GlobalBackground />
          <main className="relative z-10 flex flex-col min-h-screen">
            {children}
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}