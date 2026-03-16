import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'QC Pilot — MULTIPRINT Unified Multi-Pôles',
  description: 'Application de contrôle qualité industriel MULTIPRINT',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600;700&family=DM+Sans:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
