// app/interviews/layout.tsx
import { Metadata } from "next";
import Script from "next/script";

export const metadata: Metadata = {
  title: {
    default: "Python Alıştırma Soruları | Yeni Başlayanlar İçin İnteraktif Liste",
    template: "%s Soruları | Python Alıştırma Soruları",
  },
  description:
    "Python öğrenmeye yeni başlayanlar için interaktif python soruları. OOP, veri tipleri, SQLite3, basit uygulamalar, beyin fırtınası ve sklearn gibi modüllerle seviye bazlı hazırlan.",
  keywords: [
    // Yeni başlayan odaklı — tüm modüller
    "python yeni başlayanlar python",
    "employee app python",
    "project euler çözümleri python",
    "inheritance vs encapsulation",
    "python palindrome soruları",
    "python word count soruları",
    "python egzersiz soruları",
    "python blogları",
    "python basit uygulama soruları",
    "python fizz buzz problemi",
    "simple calculator app python",
    "python sklearn soruları",
    "python interaktif sandbox",
    "pythonda kendini geliştirmek isteyenler için alıştırmalar",
    "python fundamentals",
    "python pandas soruları",
    "sklearn mülakat soruları başlangıç",
    // Genel
    "python öğren",
    "python sandbox online",
  ],
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-snippet": -1 },
  },
  openGraph: {
    type: "website",
    locale: "tr_TR",
    title: "Python Alıştırma Soruları | Yeni Başlayanlar İçin İnteraktif Liste",
    description:
      "Python öğrenmeye yeni başlayanlar için interaktif alıştırma soruları. OOP, veri tipleri, SQLite3 ve daha fazlası.",
    siteName: "Python Alıştırma Soruları",
  },
  twitter: {
    card: "summary_large_image",
    title: "Python Alıştırma Soruları | Yeni Başlayanlar İçin",
    description:
      "OOP, veri tipleri, SQLite3, beyin fırtınası ve daha fazlası. Seviye bazlı Python soruları ile mülakatlara hazırlanın.",
  },
  alternates: { canonical: "/interviews" },
};

export default function InterviewsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://www.pythonmulakat.com";

  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Python Alıştırma Soruları",
    description: metadata.description,
    inLanguage: "tr",
    url: `${siteUrl}/interviews`,
    mainEntity: {
      "@type": "ItemList",
      name: "Modül Bazlı Python Soru Listeleri",
      description:
        "Yeni başlayanlardan ileri seviyeye Python modülleri: OOP, veri tipleri, SQLite3, basit uygulamalar, beyin fırtınası, sklearn, pandas ve daha fazlası.",
      itemListElement: [
        // ── Yeni başlayan / temel modüller ──────────────────
        {
          "@type": "ListItem",
          position: 1,
          name: "Python OOP Alıştırma Soruları",
          url: `${siteUrl}/interviews/oop`,
          description:
            "Class, inheritance, encapsulation ve polimorfizm konularında başlangıç düzeyi interaktif sorular.",
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Python Veri Tipleri Alıştırma Soruları",
          url: `${siteUrl}/interviews/data-types`,
          description:
            "List, dict, tuple, set ve string operasyonları. Yeni başlayanlar için temel Python veri tipleri soruları.",
        },
        {
          "@type": "ListItem",
          position: 3,
          name: "Python Temel Konular Alıştırma Soruları",
          url: `${siteUrl}/interviews/python-basics`,
          description:
            "Döngüler, koşullar, fonksiyonlar ve Python sözdizimi. Sıfırdan başlayanlar için temel sorular.",
        },
        {
          "@type": "ListItem",
          position: 4,
          name: "Python Basit Uygulama Alıştırma Soruları",
          url: `${siteUrl}/interviews/simple-apps`,
          description:
            "Küçük Python uygulamaları yazarak problem çözme becerisi kazanma. Başlangıç düzeyi projeler.",
        },
        {
          "@type": "ListItem",
          position: 5,
          name: "SQLite3 Python Alıştırma Soruları",
          url: `${siteUrl}/interviews/sqlite3`,
          description:
            "Python sqlite3 modülü ile bağlantı, CRUD işlemleri ve temel SQL sorguları.",
        },
        {
          "@type": "ListItem",
          position: 6,
          name: "Python Beyin Fırtınası Alıştırma Soruları",
          url: `${siteUrl}/interviews/beyin-firtinasi`,
          description:
            "Algoritmik düşünme ve yaratıcı problem çözme egzersizleri. Mülakat öncesi ısınma soruları.",
        },
        // ── Orta / ileri modüller ───────────────────────────
        {
          "@type": "ListItem",
          position: 7,
          name: "Scikit-learn (Sklearn) Alıştırma Soruları",
          url: `${siteUrl}/interviews/sklearn`,
          description:
            "Pipeline, cross-validation, feature engineering ve model seçimi. Makine öğrenmesi hazırlığı.",
        },
        {
          "@type": "ListItem",
          position: 8,
          name: "Pandas Alıştırma Soruları",
          url: `${siteUrl}/interviews/pandas`,
          description:
            "Veri temizleme, groupby, merge, pivot table ve zaman serisi. Türkçe interaktif sandbox.",
        },
      ],
    },
  };

  return (
    <>
      <Script
        id="interviews-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
        strategy="afterInteractive"
      />
      {/* page.tsx'in tam ekran yapısını bozmamak için ekstra wrapper yok */}
      {children}
    </>
  );
}