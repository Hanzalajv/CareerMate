import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "CareerMate — Your AI Career Coach",
  description: "AI-powered career counseling that deeply understands your skills, passions, and constraints to deliver personalized career recommendations with accountability tracking.",
  keywords: "career counseling, AI career coach, career path, job guidance, student career",
  authors: [{ name: "CareerMate" }],
  openGraph: {
    title: "CareerMate — Your AI Career Coach",
    description: "AI-powered career counseling that deeply understands you.",
    type: "website",
  },
  manifest: "/manifest.json",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <meta name="theme-color" content="#070b14" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="CareerMate" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}