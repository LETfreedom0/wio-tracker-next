import "./globals.css";
import { LanguageProvider } from "./context/LanguageContext";
import GoogleAdsense from './components/GoogleAdsense';
import { SITE_URL } from '../lib/constants';

export const metadata = {
  metadataBase: new URL(SITE_URL),
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
    "WIO Calculator", "Work In Office", "Hybrid Work Tracker", "Attendance Management", "Leave Tracker", "Remote Work Log", "RTO Tracker", "Office Days Calculator", "WIO Target Calculator"
    , "WIO", "WIO Tracker", "wio tracker", "Office Attendance", "Office Days", "WIO Target",
    "How to track office days", "WIO percentage calculator", "Hybrid work schedule tool", "Calculate work in office days",
    "Best app for hybrid work tracking", "Track remote vs office days", "RTO compliance tracker", "Work from home log",
    "Hybrid work calendar planner", "Office attendance percentage calculator", "Free WIO tracker",
    // Chinese (Simplified & Traditional)
    "WIO 计算器", "混合办公", "办公室打卡", "考勤管理", "远程办公记录", "年假计算器", "混合办公追踪", "在家办公", "回办公室", "打卡记录",
    "混合辦公", "辦公室打卡", "考勤管理", "遠程辦公記錄", "年假計算器", "居家办公", "回辦公室", "wio 符合标准了吗",
    "如何计算 WIO", "混合办公天数计算", "办公室出勤率计算器",
    "最好用的混合办公记录工具", "记录居家办公天数", "办公室出勤达标计算", "远程办公日历", "免费考勤打卡软件",
    "如何规划混合办公日程", "RTO 返岗合规追踪", "在家工作记录表", "出勤百分比怎么算",
    // Japanese
    "出社管理", "リモートワーク", "ハイブリッドワーク", "勤怠管理", "出社日数",
    "出社率 計算", "在宅勤務 記録 アプリ", "ハイブリッドワーク カレンダー", "出社ノルマ 管理", "無料 勤怠管理ツール", "出社頻度 計算方法",
    // Korean
    "재택근무", "하이브리드 근무", "출근 기록", "연차 관리",
    "재택근무 일수 계산", "사무실 출근율 계산기", "하이브리드 워크 스케줄 관리", "주 3회 출근 기록", "무료 근태관리 앱",
    // European
    "Télétravail", "Travail Hybride", "Suivi Présence", // French
    "Calculer taux de présence bureau", "Application suivi télétravail gratuit", "Comment gérer le travail hybride", "Calendrier présence bureau",
    "Büroanwesenheit", "Homeoffice Rechner", "Hybrides Arbeiten", // German
    "Büroquote berechnen", "Homeoffice Tage zählen", "Anwesenheit im Büro erfassen", "Kostenloser Hybrid Work Planer",
    "Trabajo Híbrido", "Control de Asistencia", // Spanish
    "Calcular porcentaje de asistencia", "App para registrar teletrabajo", "Calendario trabajo híbrido gratis", "Controlar días de oficina"
  ],
  authors: [{ name: "WIO Team" }],
  creator: "WIO Team",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    title: "WIO Calculator - Smart Attendance Tracking",
    description: "Track your office days, manage leaves, and monitor WIO targets effortlessly.",
    siteName: "WIO Calculator",
    images: [
      {
        url: `${SITE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'WIO Calculator Preview',
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "WIO Calculator",
    description: "Track your office days, manage leaves, and monitor WIO targets effortlessly.",
    images: [`${SITE_URL}/og-image.png`],
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
        {/* <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;900&display=optional" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined&display=optional" rel="stylesheet" /> */}
      </head>
      <body
        className={`antialiased`}
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
            __html: JSON.stringify([
              {
                "@context": "https://schema.org",
                "@type": "SoftwareApplication",
                "name": "WIO Calculator",
                "url": SITE_URL,
                "applicationCategory": "ProductivityApplication",
                "operatingSystem": "Web Browser",
                "offers": {
                  "@type": "Offer",
                  "price": "0",
                  "priceCurrency": "USD"
                },
                "description": "Efficiently manage and track your Work In Office (WIO) days, remote work, leaves, and overtime. The best tool for hybrid work scheduling.",
                "featureList": "Attendance tracking, Leave management, WIO percentage calculation, Overtime monitoring",
                "screenshot": `${SITE_URL}/og-image.png`,
                "author": {
                  "@type": "Organization",
                  "name": "WIO Team",
                  "url": SITE_URL
                }
              },
              {
                "@context": "https://schema.org",
                "@type": "FAQPage",
                "mainEntity": [
                  {
                    "@type": "Question",
                    "name": "Is WIO Calculator free?",
                    "acceptedAnswer": {
                      "@type": "Answer",
                      "text": "Yes, the basic features of WIO Calculator are completely free to use for tracking office attendance and hybrid work schedules."
                    }
                  },
                  {
                    "@type": "Question",
                    "name": "Is my data secure?",
                    "acceptedAnswer": {
                      "@type": "Answer",
                      "text": "Absolutely. By default, your data is stored in your browser's local storage for maximum privacy. If you choose to login, data is encrypted and securely synced."
                    }
                  },
                  {
                    "@type": "Question",
                    "name": "How is the WIO percentage calculated?",
                    "acceptedAnswer": {
                      "@type": "Answer",
                      "text": "WIO Percentage is calculated by dividing your Office Days by (Total Working Days minus Leaves and Public Holidays). This ensures that taking leave does not negatively impact your office attendance score."
                    }
                  }
                ]
              }
            ])
          }}
        />
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
