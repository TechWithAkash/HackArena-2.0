import type { Metadata } from "next";
import { DM_Sans, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import AuraChat from "@/components/AuraChat";

const dmSans = DM_Sans({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const ibmPlexSans = IBM_Plex_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "DarpanAI | Cognitive Health Twin",
  description: "Dynamic Analysis and Replica for Predicting Actionable Needs",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className={`${dmSans.variable} ${ibmPlexSans.variable} ${ibmPlexMono.variable} antialiased min-h-[100dvh] flex flex-col bg-bg-base text-text-primary`}>
        <main className="flex-1 h-full w-full flex flex-col">
          {children}
        </main>
        <AuraChat />
      </body>
    </html>
  );
}
