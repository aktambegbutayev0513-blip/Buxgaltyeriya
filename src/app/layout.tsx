import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Yagona Buxgalteriya Platformasi | Multi-Tenant SaaS O\'zbekiston',
  description: 'O\'zbekiston korxonalari uchun yagona bulutli buxgalteriya, E-IMZO va Didox/Soliq boshqaruv tizimi',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="uz">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}
