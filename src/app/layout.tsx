import type { Metadata, Viewport } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import { AuthProvider } from "@/lib/auth-context";
import "../styles/globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "CK Space",
  description: "A private real-time shared notes app for couples.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "CK Space",
  },
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/icon-192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#f7f3ec",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            try {
              var specialThemes = ['spiderman-classic','spiderman-verse','symbiote','barbie-dream','barbie-glam','barbie-night'];
              var saved = localStorage.getItem('our-notes-theme');
              var dark = false;
              if (specialThemes.indexOf(saved) !== -1) {
                document.documentElement.classList.add('theme-' + saved);
                dark = saved === 'symbiote' || saved === 'barbie-night' || saved === 'spiderman-verse';
              } else if (saved === 'dark') {
                dark = true;
              } else if (saved === 'light') {
                dark = false;
              } else {
                dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
              }
              if (dark) {
                document.documentElement.classList.add('dark');
              } else {
                document.documentElement.classList.remove('dark');
              }
            } catch (e) {}
          })()
        `}} />
      </head>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
