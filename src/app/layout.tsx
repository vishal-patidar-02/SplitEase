import type { Metadata, Viewport } from "next";
import "./globals.css";

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
  themeColor: "#4f46e5",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
