import './globals.css';
import type { Metadata } from 'next';
import { ToastProvider } from '@/components/ui';

export const metadata: Metadata = { title: 'Student Management', description: 'Student, batch, attendance and marks management' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body><ToastProvider>{children}</ToastProvider></body>
    </html>
  );
}
