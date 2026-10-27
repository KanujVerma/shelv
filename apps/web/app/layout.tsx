import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Shelv — Personalized Skincare Product Intelligence',
  description:
    'Know whether a skincare product actually makes sense before you put it on your face. Free zero-commit Check.',
  icons: {
    icon: '/brand/shelv-primary.svg',
    apple: '/brand/shelv-primary-1024.png',
  },
  openGraph: {
    title: 'Shelv — Skincare Product Intelligence',
    description: 'Instant evidence-bound product intelligence and routine fit without an account.',
    siteName: 'Shelv',
    type: 'website',
  },
};

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#F6F3EC',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="w-full max-w-full overflow-x-hidden">
      <body className="bg-[#F6F3EC] text-[#171A18] min-h-screen flex flex-col font-sans antialiased selection:bg-[#E2EAE4] selection:text-[#171A18] w-full max-w-full overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}
