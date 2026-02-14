import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Ritual Rooms MVP',
  description: 'Sprint 1 MVP: auth + onboarding + dashboard',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
