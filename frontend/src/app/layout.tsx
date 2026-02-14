import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: 'Familia — Real People. Real Bonds. No Borders.',
  description: 'Connect with real people across cultures. Build meaningful relationships through AI-powered translation, bonding contests & cultural games. No bots, just genuine human connection.',
  keywords: 'cross-cultural, human connection, translation, family, mentor, global friendship, penpal, cultural exchange',
  openGraph: {
    title: 'Familia — Real People. Real Bonds. No Borders.',
    description: 'Build a global family through real human connection. AI translates, humans bond.',
    type: 'website',
  },
};

export const viewport: Viewport = {
  themeColor: '#0A0A1A',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased min-h-screen">
        {/* ── Layered animated background ── */}
        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none" aria-hidden="true">
          {/* Base mesh gradient */}
          <div className="bg-mesh absolute inset-0 opacity-40" />

          {/* Subtle dot pattern overlay */}
          <div className="bg-dot-pattern absolute inset-0 opacity-[0.03]" />

          {/* Animated orbs */}
          <div className="orb orb-primary" />
          <div className="orb orb-secondary" />
          <div className="orb orb-accent" />

          {/* Meteors */}
          <div className="meteor" style={{ top: '15%', left: '85%', animationDelay: '0s' }} />
          <div className="meteor" style={{ top: '45%', left: '70%', animationDelay: '3s' }} />
          <div className="meteor" style={{ top: '70%', left: '90%', animationDelay: '7s' }} />
        </div>

        <main className="relative z-10">
          {children}
        </main>

        <Toaster
          position="bottom-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'rgba(26, 26, 46, 0.95)',
              backdropFilter: 'blur(16px)',
              color: '#F8FAFC',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '0.875rem',
              fontSize: '0.875rem',
              padding: '0.75rem 1rem',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
            },
            success: {
              iconTheme: { primary: '#4ADE80', secondary: '#1A1A2E' },
            },
            error: {
              iconTheme: { primary: '#F43F5E', secondary: '#1A1A2E' },
            },
          }}
        />
      </body>
    </html>
  );
}
