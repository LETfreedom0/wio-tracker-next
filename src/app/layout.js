import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "./context/LanguageContext";
import GoogleAdsense from './components/GoogleAdsense';

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
  metadataBase: new URL('https://wiotracker.xyz'),
  alternates: {
    canonical: '/',
  },
  title: {
    default: "WIO Calculator - Track Your Office Attendance",
    template: "%s | WIO Calculator"
  },
  description: "Efficiently manage and track your Work In Office (WIO) days, remote work, leaves, and overtime. The best tool for hybrid work scheduling.",
  keywords: [
    // English
    "WIO Calculator", "Work In Office", "Hybrid Work Tracker", "Attendance Management", "Leave Tracker", "Remote Work Log", "RTO Tracker", "Office Days Calculator",
    // Chinese (Simplified & Traditional)
    "WIO 计算器", "混合办公", "办公室打卡", "考勤管理", "远程办公记录", "年假计算器", "混合办公追踪", "在家办公", "回办公室", "打卡记录",
    "混合辦公", "辦公室打卡", "考勤管理", "遠程辦公記錄", "年假計算器",
    // Japanese
    "出社管理", "リモートワーク", "ハイブリッドワーク", "勤怠管理", "出社日数",
    // Korean
    "재택근무", "하이브리드 근무", "출근 기록", "연차 관리",
    // European
    "Télétravail", "Travail Hybride", "Suivi Présence", // French
    "Büroanwesenheit", "Homeoffice Rechner", "Hybrides Arbeiten", // German
    "Trabajo Híbrido", "Control de Asistencia" // Spanish
  ],
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
    google: "mRLgDKnHjX85NRnGUbYcBahVs527QtCUlNwo5kmj2BQ",
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
        {/* 
          Google AdSense 集成:
          1. 去 Google AdSense 申请账号并获取发布商 ID (例如 ca-pub-1234567890)。
          2. 取消下面这行代码的注释，并填入你的 ID。
        */}
        {/* <GoogleAdsense pId="ca-pub-XXXXXXXXXXXXXXXX" /> */}

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              "name": "WIO Calculator",
              "url": "https://wiotracker.xyz",
              "applicationCategory": "Productivity",
              "operatingSystem": "Web",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD"
              },
              "description": "Efficiently manage and track your Work In Office (WIO) days, remote work, leaves, and overtime."
            })
          }}
        />
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
