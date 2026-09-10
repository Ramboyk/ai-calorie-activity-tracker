import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { TrackerProvider } from "@/context";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: "NutriTrack AI — Akıllı Kalori ve Aktivite Takip Sistemi",
  description: "Yapay zekâ destekli görsel kalori tahmini, makro besin ve günlük aktivite takip platformu.",
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
