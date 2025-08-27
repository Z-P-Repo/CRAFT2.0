import type { Metadata, Viewport } from 'next';
import { AuthProvider } from '@/contexts/AuthContext';
import ClientThemeProvider from '@/components/providers/ThemeProvider';

export const metadata: Metadata = {
  title: 'CRAFT Permission System',
  description: 'Attribute-Based Access Control (ABAC) System',
  keywords: ['ABAC', 'Permission System', 'Access Control', 'Security'],
  authors: [{ name: 'Zero Pixels Technologies Private Limited' }],
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
          <AuthProvider>
            {children}
          </AuthProvider>
        </ClientThemeProvider>
      </body>
    </html>
  );
}