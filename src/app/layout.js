import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "./context/LanguageContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata = {
  title: {
    default: "WIO Calculator - Track Your Office Attendance",
    template: "%s | WIO Calculator"
  },
  description: "Efficiently manage and track your Work In Office (WIO) days, remote work, leaves, and overtime. The best tool for hybrid work scheduling.",
  keywords: ["WIO Calculator", "Work In Office", "Hybrid Work Tracker", "Attendance Management", "Leave Tracker", "Remote Work Log"],
  authors: [{ name: "WIO Team" }],
  creator: "WIO Team",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://wiotracker.xyz",
    title: "WIO Calculator - Smart Attendance Tracking",
    description: "Track your office days, manage leaves, and monitor WIO targets effortlessly.",
    siteName: "WIO Calculator",
  },
  twitter: {
    card: "summary_large_image",
    title: "WIO Calculator",
    description: "Track your office days, manage leaves, and monitor WIO targets effortlessly.",
  },
  robots: {
    index: true,
    follow: true,
  },
  verification: {
    google: "mRLgDKnHjX85NRnGUbYcBahVs527QtCUlNwo5kmj2BQ", // 请替换为您的实际验证代码  
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;900&display=optional" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined&display=optional" rel="stylesheet" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} antialiased`}
      >
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
