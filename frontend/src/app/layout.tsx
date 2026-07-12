import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "OptiScreen | Clinical-Grade Cataract Detection",
  description:
    "AI-powered cataract screening tool for ophthalmologists. Upload fundus images for instant diagnostic analysis with Grad-CAM visualization.",
  keywords: ["cataract", "detection", "ophthalmology", "AI", "deep learning", "eye screening"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
