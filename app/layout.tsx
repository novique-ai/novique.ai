import type { Metadata } from "next";
import { Inter, Inter_Tight } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

// Display/heading face for the redesign — zero new dependency (same next/font
// loader already importing Inter). Tighter, more geometric than body Inter.
const interTight = Inter_Tight({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.novique.ai"),
  title: "Novique.ai - AI Solutions for Your Small Business",
  description: "Unlock AI for your small business without the headache. Custom AI solutions that save time, cut costs, and boost growth. First consultation free.",
  keywords: ["AI consulting", "small business AI", "AI automation", "business automation", "AI chatbots", "AI solutions"],
  authors: [{ name: "Novique.ai" }],
  openGraph: {
    title: "Novique.ai - AI Solutions for Your Small Business",
    description: "Custom AI solutions that save time, cut costs, and boost growth. First consultation free.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${interTight.variable}`}>
      <body className={`${inter.className} antialiased`}>
        {children}
      </body>
    </html>
  );
}
