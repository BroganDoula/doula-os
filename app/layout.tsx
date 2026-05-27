import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Doula OS",
  description: "Internal ops — Doula Studios",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <nav className="border-b px-8 py-3 flex gap-6 text-sm text-muted-foreground">
            <span className="font-semibold text-foreground mr-2">Doula OS</span>
            <Link href="/companies" className="hover:text-foreground transition-colors">Companies</Link>
            <Link href="/contacts" className="hover:text-foreground transition-colors">Contacts</Link>
          </nav>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
