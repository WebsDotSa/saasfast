import type { Metadata } from 'next';
import { IBM_Plex_Sans_Arabic } from 'next/font/google';
import { Toaster } from '@/components/ui/toaster';
import AuthProvider from '@/components/auth-provider';
import './globals.css';

// ═══════════════════════════════════════════════════════════════════════════════
// Root Layout — SaaS Core Platform
// ═══════════════════════════════════════════════════════════════════════════════

const ibmPlexSansArabic = IBM_Plex_Sans_Arabic({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['arabic', 'latin'],
  display: 'swap',
  variable: '--font-ibm-plex',
});

export const metadata: Metadata = {
  title: {
    default: 'SaaS Core Platform',
    template: '%s | SaaS Core',
  },
  description: 'منصة SaaS قابلة للتحويل لأي مشروع — متاجر، مواقع، محاسبة، موارد بشرية، وأكثر',
  keywords: [
    'SaaS',
    'متجر إلكتروني',
    'بناء مواقع',
    'محاسبة',
    'موارد بشرية',
    'ZATCA',
    'Saudi Arabia',
  ],
  authors: [{ name: 'SaaS Core Team', url: 'https://labs.sa' }],
  creator: 'SaaS Core Team',
  publisher: 'SaaS Core',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  metadataBase: new URL(process.env.APP_URL || 'http://localhost:3000'),

  // Open Graph
  openGraph: {
    type: 'website',
    locale: 'ar_SA',
    alternateLocale: ['en_US'],
    title: 'SaaS Core Platform',
    description: 'منصة SaaS قابلة للتحويل لأي مشروع',
    siteName: 'SaaS Core',
    url: process.env.APP_URL || 'http://localhost:3000',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'SaaS Core Platform',
      },
    ],
  },

  // Twitter
  twitter: {
    card: 'summary_large_image',
    title: 'SaaS Core Platform',
    description: 'منصة SaaS قابلة للتحويل لأي مشروع',
    images: ['/og-image.png'],
    creator: '@saascore',
  },

  // Canonical
  alternates: {
    canonical: '/',
    languages: {
      'ar-SA': '/ar-SA',
      'en-US': '/en-US',
    },
  },

  // Icons
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },

  // Manifest
  manifest: '/site.webmanifest',

  // Verification
  verification: {
    google: 'your-google-verification-code',
    yandex: 'your-yandex-verification-code',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body className={ibmPlexSansArabic.variable}>
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
