import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/hooks/useAuth';
import { SidebarProvider } from '@/context/SidebarContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Todo SaaS',
  description: 'Task management system',
};

const themeScript = `
  (function() {
    try {
      var theme = localStorage.getItem('themeMode');
      if (theme) {
        var activeTheme = theme;
        if (theme === 'system') {
          var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          activeTheme = prefersDark ? 'dark' : 'light';
        }
        document.documentElement.setAttribute('data-theme', activeTheme);
      }
      var color = localStorage.getItem('colorMode');
      if (color) {
        var parsed = JSON.parse(color);
        if (parsed && parsed.color) {
          document.documentElement.style.setProperty('--primary-color', parsed.color);
        }
      }
    } catch (e) {}
  })();
`;

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={inter.className}>
        <AuthProvider>
          <SidebarProvider>
            {children}
          </SidebarProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
