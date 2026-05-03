import type { Metadata } from "next";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "ThreatSentinel — Onchain URL Threat Analysis",
  description:
    "Drop any URL. Multiple AI validators reach consensus on whether the site is safe, phishing, or malicious — verdict recorded onchain forever.",
  openGraph: {
    title: "ThreatSentinel",
    description: "Catch the scam before it catches you.",
    siteName: "ThreatSentinel",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700;1,900&family=DM+Sans:wght@400;500&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-[#050505] text-[#e8e8e8] antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
