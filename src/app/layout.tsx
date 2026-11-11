import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SiteFooter, SiteNav } from "@/components/SiteChrome";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "Leak · find the money leaking out of your bank account", template: "%s · Leak" },
  description:
    "Drop in a bank statement and see every subscription and hidden fee, what it costs you a year and how to cancel it. Open-weight models, powered by Mozilla's Otari.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <SiteNav />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
