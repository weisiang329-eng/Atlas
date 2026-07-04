import type { Metadata, Viewport } from "next";
import {
  IBM_Plex_Sans,
  IBM_Plex_Mono,
  IBM_Plex_Serif,
} from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui/toast";

const sans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
  display: "swap",
});

const serif = IBM_Plex_Serif({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Atlas Intelligence",
    template: "%s · Atlas Intelligence",
  },
  description:
    "Atlas is an AI-native Decision Intelligence Platform for investment, industry, and board-level decision support.",
};

export const viewport: Viewport = {
  themeColor: "#080b11",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${sans.variable} ${mono.variable} ${serif.variable}`}
    >
      <body className="font-sans antialiased">
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var e=document.documentElement;if(localStorage.getItem('atlas-theme')==='light')e.classList.add('light');if(localStorage.getItem('atlas-density')==='compact')e.setAttribute('data-density','compact');}catch(_){}})();",
          }}
        />
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
