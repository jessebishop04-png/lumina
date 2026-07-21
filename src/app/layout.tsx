import type { Metadata } from "next";
import { DM_Sans, Space_Grotesk } from "next/font/google";
import { DialRoot } from "dialkit";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { PageTransitionShell } from "@/components/layout/PageTransitionShell";
import "dialkit/styles.css";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-dm-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Lumina — Photo Editor",
  description: "Instagram-style photo editor with Lightroom editing tools.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${dmSans.variable}`} data-theme="dark" style={{ height: "100%", colorScheme: "dark" }} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var s=localStorage.getItem('lumina-appearance');var a='dark';if(s){var p=JSON.parse(s);if(p&&p.state&&p.state.appearance)a=p.state.appearance;}var r=a==='system'?(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):a;document.documentElement.setAttribute('data-theme',r);document.documentElement.style.colorScheme=r;}catch(e){}})();`,
          }}
        />
      </head>
      <body style={{ height: "100%", margin: 0 }}>
        <ThemeProvider>
          <AuthProvider>
            <PageTransitionShell>{children}</PageTransitionShell>
          </AuthProvider>
        </ThemeProvider>
        <DialRoot />
      </body>
    </html>
  );
}
