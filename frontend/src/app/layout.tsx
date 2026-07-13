import type { Metadata } from "next";
import { Inter, Space_Grotesk, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-space-grotesk",
  weight: ["500", "600", "700"],
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-ibm-plex-mono",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "OptiScreen | Precision Clinical Diagnostic Instrumentation",
  description:
    "AI-powered clinical cataract screening tool for clinicians. Precision optics instrumentation with Grad-CAM activation mapping.",
  keywords: ["cataract", "detection", "ophthalmology", "AI", "deep learning", "eye screening"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable} ${ibmPlexMono.variable}`}>
      <body className="min-h-screen bg-[#090C10] text-[#E8ECF1] antialiased">{children}</body>
    </html>
  );
}
