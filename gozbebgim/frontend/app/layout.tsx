import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./global.css";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// ────────────────────────────────────────────────────────────
// 🌐 GLOBAL SEO METADATA
// ────────────────────────────────────────────────────────────
export const metadata: Metadata = {
  metadataBase: new URL("https://www.pythonmulakat.com"),

  title: {
    default:
      "Python Mülakat Hazırlığı | Yeni Başlayanlar İçin Ücretsiz Pratik",
    template: "%s | Python Mülakat",
  },

  description:
    "Sıfırdan Python öğrenenler için Türkçe interaktif mülakat platformu. Veri tipleri, OOP, SQLite, Pandas ve algoritmik düşünme sorularını tarayıcıda kodlayarak çöz, yapay zekâdan anında geri bildirim al. Ücretsiz, kurulum gerektirmez.",

  keywords: [
    // Temel / Yeni başlayan
    "python yeni başlayanlar",
    "python temel konular",
    "python öğreniyorum",
    "sıfırdan python",
    "python başlangıç seviye",
    "python kolay öğren",
    "python dersleri türkçe",

    // Veri tipleri
    "python veri tipleri sorular",
    "python list dict tuple set soruları",
    "python string manipülasyon örnekleri",

    // OOP
    "nesne yönelimli programlama python türkçe",
    "python oop alıştırma",
    "python class inheritance örnekleri",
    "python encapsulation polymorphism",

    // Uygulama / Mülakat
    "python mülakat soruları yeni başlayan",
    "python mülakat hazırlık",
    "python basit uygulama örnekleri",
    "python beyin fırtınası soruları",
    "python kodlama mülakatı",
    "junior python developer mülakat soruları",

    // Veritabanı / Kütüphaneler
    "python sqlite3 soruları",
    "python sqlite3 alıştırma",
    "python pandas alıştırma soruları",
    "python veri bilimi mülakat",

    // Platform odaklı (marka)
    "python online sandbox türkçe",
    "python interaktif öğrenme",
    "yapay zeka destekli python pratiği",
  ],

  authors: [{ name: "Python Mülakat", url: "https://www.pythonmulakat.com" }],
  creator: "Python Mülakat",
  publisher: "Python Mülakat",

  category: "education",

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  // ── Open Graph ──────────────────────────────────────────────
  openGraph: {
    type: "website",
    locale: "tr_TR",
    url: "https://www.pythonmulakat.com",
    siteName: "Python Mülakat",
    title: "Python Mülakat Hazırlığı | Yeni Başlayanlar İçin Ücretsiz Pratik",
    description:
      "Sıfırdan Python öğrenenler için Türkçe interaktif mülakat soruları. OOP, SQLite, Pandas, sandbox ve anlık AI geri bildirimi.",
    images: [
      {
        url: "https://www.pythonmulakat.com/og-default.png",
        width: 1200,
        height: 630,
        alt: "Python Mülakat Hazırlığı — pythonmulakat.com",
      },
    ],
  },

  // ── Twitter / X ─────────────────────────────────────────────
  twitter: {
    card: "summary_large_image",
    title: "Python Mülakat Hazırlığı | Yeni Başlayanlar İçin",
    description:
      "Türkçe interaktif Python mülakat soruları. OOP, veri tipleri, SQLite, sandbox ve anlık AI geri bildirimi.",
    images: ["https://www.pythonmulakat.com/og-default.png"],
    creator: "@pythonmulakat",
  },

  // ── Canonical & Alternates ──────────────────────────────────
  alternates: {
    canonical: "https://www.pythonmulakat.com",
    languages: { "tr-TR": "https://www.pythonmulakat.com" },
  },

  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },

  manifest: "/site.webmanifest",

  verification: {
    google: "Kb5VdxiZ4LBLZzun5jYJHBJ--GB1ydxdfMbSwaVuFbw",
  },

  // ── Ek SEO meta etiketleri ─────────────────────────────────
  other: {
    "revisit-after": "3 days",
    "rating": "general",
    "distribution": "global",
  },
};

// ────────────────────────────────────────────────────────────
// 🔗 JSON-LD STRUCTURED DATA
// ────────────────────────────────────────────────────────────
const siteJsonLd = {
  "@context": "https://schema.org",

  "@graph": [
    // ── Organization ──────────────────────────────────────────
    {
      "@type": "Organization",
      "@id": "https://www.pythonmulakat.com/#organization",
      name: "Python Mülakat",
      url: "https://www.pythonmulakat.com",
      logo: {
        "@type": "ImageObject",
        url: "https://www.pythonmulakat.com/og-default.png",
        width: 1200,
        height: 630,
      },
      description:
        "Python öğrenmeye yeni başlayanlar için Türkçe interaktif mülakat hazırlık platformu.",
      sameAs: [],
    },

    // ── WebSite + SearchAction ────────────────────────────────
    {
      "@type": "WebSite",
      "@id": "https://www.pythonmulakat.com/#website",
      url: "https://www.pythonmulakat.com",
      name: "Python Mülakat",
      description:
        "Python öğrenmeye yeni başlayanlar için gerçek dünya mülakat soruları, interaktif sandbox ve AI geri bildirimi.",
      publisher: { "@id": "https://www.pythonmulakat.com/#organization" },
      inLanguage: "tr-TR",
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate:
            "https://www.pythonmulakat.com/interviews/{search_term_string}",
        },
        "query-input": "required name=search_term_string",
      },
    },

    // ── Course (Yeni: Eğitim içeriği olarak işaretle) ─────────
    {
      "@type": "Course",
      "@id": "https://www.pythonmulakat.com/#course",
      name: "Yeni Başlayanlar İçin Python Mülakat Hazırlığı",
      description:
        "Python'a yeni başlayanlar için veri tipleri, OOP, SQLite, Pandas ve algoritmik düşünme konularını kapsayan interaktif mülakat hazırlık kursu.",
      provider: { "@id": "https://www.pythonmulakat.com/#organization" },
      url: "https://www.pythonmulakat.com",
      inLanguage: "tr-TR",
      educationalLevel: "Beginner",
      teaches:
        "Python temel konular, nesne yönelimli programlama, SQLite, Pandas, algoritmik düşünme",
      audience: {
        "@type": "EducationalAudience",
        educationalRole: "student",
      },
      hasCourseInstance: {
        "@type": "CourseInstance",
        courseMode: "online",
        location: {
          "@type": "VirtualLocation",
          url: "https://www.pythonmulakat.com",
        },
      },
    },

    // ── LearningResource (Yeni: Öğrenme kaynağı) ──────────────
    {
      "@type": "LearningResource",
      "@id": "https://www.pythonmulakat.com/#learning-resource",
      name: "Python Mülakat Soruları - İnteraktif Sandbox",
      description:
        "Tarayıcıda kod yazarak Python mülakat sorularını çözebileceğin, yapay zekâ destekli geri bildirim veren interaktif öğrenme platformu.",
      url: "https://www.pythonmulakat.com",
      educationalUse: "practice",
      learningResourceType: "interactive tutorial",
      audience: {
        "@type": "Audience",
        audienceType: "Python'a yeni başlayanlar",
      },
      teaches: [
        "Python veri tipleri",
        "OOP temelleri",
        "SQLite3 ile veritabanı",
        "Pandas ile veri analizi",
        "Algoritmik düşünme",
      ],
      isAccessibleForFree: true,
    },

    // ── BreadcrumbList (Yeni: Gezinti yapısı) ─────────────────
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Ana Sayfa",
          item: "https://www.pythonmulakat.com",
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Mülakat Soruları",
          item: "https://www.pythonmulakat.com/interviews",
        },
      ],
    },

    // ── FAQPage ───────────────────────────────────────────────
    {
      "@type": "FAQPage",
      "@id": "https://www.pythonmulakat.com/#faq",
      mainEntity: [
        {
          "@type": "Question",
          name: "Python'a yeni başlayanlar mülakatta hangi konulardan soru alır?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yeni başlayanlar için en sık sorulan konular şunlardır: veri tipleri (list, dict, tuple, set, string), nesne yönelimli programlama temelleri (class, __init__, inheritance, encapsulation, polymorphism), temel Python uygulamaları, SQLite ile veritabanı işlemleri (CRUD, JOIN) ve algoritmik düşünme (beyin fırtınası) sorularıdır.",
          },
        },
        {
          "@type": "Question",
          name: "Python OOP alıştırma soruları nasıl çalışılır?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Class tanımlama, __init__ metodu, kalıtım (inheritance), polimorfizm ve kapsülleme (encapsulation) konularında interaktif sandbox'ta kod yazarak pratik yapabilirsiniz. Her çözümün ardından yapay zekâdan anında geri bildirim alırsınız.",
          },
        },
        {
          "@type": "Question",
          name: "Python sqlite3 alıştırma soruları nasıl çözülür?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Python sqlite3 modülü ile veritabanı bağlantısı kurma, tablo oluşturma, CRUD işlemleri (INSERT, SELECT, UPDATE, DELETE) ve basit JOIN sorguları en çok sorulan konulardır. Tüm bu işlemleri platformdaki sandbox ortamında pratik edebilirsiniz.",
          },
        },
        {
          "@type": "Question",
          name: "Pandas alıştırma soruları ile nasıl pratik yapılır?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Gerçek veri setleri üzerinde veri temizleme (cleaning), gruplama (groupby), birleştirme (merge) ve görselleştirme pratikleri yaparak interaktif sandbox'ta kod çalıştırarak hazırlanabilirsiniz.",
          },
        },
        {
          "@type": "Question",
          name: "Python veri bilimi mülakatına nasıl hazırlanılır?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Pandas (veri temizleme, groupby, merge), Scikit-learn (pipeline, cross-validation, feature engineering), istatistik (A/B testi, dağılım), SQL ve zaman serisi analizi en sık sorulan ileri düzey konulardır. Platformumuzda bu konuların her biri için interaktif sorular mevcuttur.",
          },
        },
        {
          "@type": "Question",
          name: "Python mülakat hazırlığı için kurulum gerekiyor mu?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Hayır. pythonmulakat.com tamamen tarayıcı tabanlıdır. Python, Pyodide veya herhangi bir kütüphane kurmanıza gerek yoktur. Hesap açıp hemen kodlamaya başlayabilirsiniz.",
          },
        },
      ],
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="tr" className="dark">
      <head>
        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(siteJsonLd) }}
        />

        {/* Google Tag Manager */}
        <Script id="google-tag-manager" strategy="afterInteractive">
          {`
            (function(w,d,s,l,i){
                w[l]=w[l]||[];
                w[l].push({'gtm.start': new Date().getTime(), event:'gtm.js'});
                var f=d.getElementsByTagName(s)[0],
                    j=d.createElement(s),
                    dl=l!='dataLayer'?'&l='+l:'';
                j.async=true;
                j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;
                f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','GTM-NJMG2G2F');
          `}
        </Script>

        {/* Preconnect & Preload (performans + SEO) */}
        <link rel="preconnect" href="https://cdn.jsdelivr.net" />
        <link
          rel="preload"
          href="https://cdn.jsdelivr.net/pyodide/v0.27.7/full/pyodide.js"
          as="script"
        />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://www.google-analytics.com" />
      </head>

      <body
        className={`${geistSans.variable} ${geistMono.variable} bg-slate-950 text-white antialiased`}
      >
        <Analytics />

        {/* GTM noscript fallback */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-NJMG2G2F"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>

        <Toaster position="top-right" theme="dark" richColors closeButton />
        {children}
      </body>
    </html>
  );
}