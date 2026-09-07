import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import type { ReactNode } from "react";
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
  title: {
    default: "AI Mock Interview",
    template: "%s | AI Mock Interview",
  },
  description:
    "Start a real AI coding interview without signup. English or Hebrew, live conversation, and evidence-based feedback.",
};

export const viewport: Viewport = {
  initialScale: 1,
  width: "device-width",
};

const themeBootstrap = `
  try {
    var preference = localStorage.getItem("theme") || "system";
    var systemIsDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    var resolved = preference === "system" ? (systemIsDark ? "dark" : "light") : preference;
    document.documentElement.dataset.theme = resolved;
    document.documentElement.style.colorScheme = resolved;
  } catch (_) {}
`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <Script id="theme-bootstrap" strategy="beforeInteractive">
          {themeBootstrap}
        </Script>
      </head>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
