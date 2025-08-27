import type { Metadata, Viewport } from 'next';
import { AuthProvider } from '@/contexts/AuthContext';
import { SnackbarProvider } from '@/contexts/SnackbarContext';
import ClientThemeProvider from '@/components/providers/ThemeProvider';

export const metadata: Metadata = {
  title: 'CRAFT Permission System',
  description: 'Attribute-Based Access Control (ABAC) System',
  keywords: ['ABAC', 'Permission System', 'Access Control', 'Security'],
  authors: [{ name: 'Zero Pixels Technologies Private Limited' }],
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '16x16', type: 'image/x-icon' },
      { url: '/favicon.svg', type: 'image/svg+xml' }
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }
    ],
  },
  manifest: '/site.webmanifest',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ClientThemeProvider>
          <SnackbarProvider>
            <AuthProvider>
              {children}
            </AuthProvider>
          </SnackbarProvider>
        </ClientThemeProvider>
      </body>
    </html>
  );
}