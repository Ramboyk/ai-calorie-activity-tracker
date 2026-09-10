import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { TrackerProvider } from "@/context";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#006948",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: "NutriTrack AI — Akıllı Kalori ve Aktivite Takip Sistemi",
  description: "Yapay zekâ destekli görsel kalori tahmini, makro besin ve günlük aktivite takip platformu.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "NutriTrack AI",
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className={`${plusJakartaSans.variable} h-full`}>
      <body className="min-h-full flex flex-col font-sans antialiased bg-surface text-app-text selection:bg-primary-light selection:text-primary">
        <TrackerProvider>{children}</TrackerProvider>
      </body>
    </html>
  );
}
