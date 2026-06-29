import type { Metadata } from "next";

type Props = {
  params: Promise<{ category: string; id: string }>;
};

async function getInterview(
  category: string,
  id: string
): Promise<{
  question?: string;
  topic?: string;
  description?: string;
  level?: string;
} | null> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/interviews/${category}/${id}`,
      { next: { revalidate: 86400 } }
    );
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

const LIB_LABELS: Record<string, string> = {
  // ── Yeni başlayan ─────────────────────────────────────────
  oop: "Python OOP",
  "python-basics": "Python Temelleri",
  "data-types": "Python Veri Tipleri",
  "simple-apps": "Basit Python Uygulamaları",
  "beyin-firtinasi": "Beyin Fırtınası",
  sqlite3: "SQLite3",
  // ── Orta / ileri ─────────────────────────────────────────
  sklearn: "Scikit-learn",
  pandas: "Pandas",
  numpy: "NumPy",
};

const LIB_LEVELS: Record<string, string> = {
  oop: "başlangıç",
  "python-basics": "başlangıç",
  "data-types": "başlangıç",
  "simple-apps": "başlangıç",
  "beyin-firtinasi": "başlangıç",
  sqlite3: "başlangıç",
  sklearn: "orta",
  pandas: "orta",
  numpy: "orta",
  scipy: "orta",
  seaborn: "orta",
  matplotlib: "başlangıç-orta",
  statsmodels: "ileri",
  nltk: "orta",
  dask: "ileri",
  pytorch: "ileri",
  custom: "başlangıç",
};

const LIB_DESCRIPTIONS: Record<string, string> = {
  oop: "Python OOP mülakat soruları: class tanımlama, __init__, kalıtım (inheritance), encapsulation ve polimorfizm. Yeni başlayanlar için Türkçe interaktif sorular ve AI geri bildirimi.",
  "python-basics": "Python temel konuları mülakat soruları: döngüler, koşullar, fonksiyonlar, list comprehension ve Python sözdizimi. Sıfırdan öğrenenler için Türkçe sorular.",
  "data-types": "Python veri tipleri mülakat soruları: list, dict, tuple, set ve string işlemleri. Yeni başlayanlar için interaktif alıştırmalar ve sandbox.",
  "simple-apps": "Python basit uygulama mülakat soruları: küçük projeler yazarak problem çözme becerisi kazan. Başlangıç seviyesi gerçek dünya egzersizleri.",
  "beyin-firtinasi": "Python beyin fırtınası soruları: algoritmik düşünme, yaratıcı problem çözme ve mülakat ısınma egzersizleri. Yeni başlayanlar için eğlenceli sorular.",
  sqlite3: "SQLite3 Python mülakat soruları: bağlantı kurma, tablo oluşturma, CRUD işlemleri ve temel SQL sorguları. Python ile veritabanı temelleri.",
  sklearn: "Scikit-learn mülakat soruları: pipeline, cross-validation, feature engineering, model seçimi. Türkçe açıklamalar ve AI geri bildirimi.",
  pandas: "Pandas mülakat soruları: veri temizleme, groupby, merge, pivot table ve zaman serisi. Türkçe interaktif sandbox ile çalış.",
  numpy: "NumPy mülakat soruları: array operasyonları, broadcasting, linear algebra ve performans optimizasyonu.",
  scipy: "SciPy mülakat soruları: istatistiksel testler, A/B testi, optimizasyon ve sinyal işleme.",
  statsmodels: "Statsmodels mülakat soruları: zaman serisi analizi, ARIMA, regresyon ve istatistiksel modelleme.",
  seaborn: "Seaborn ve veri görselleştirme mülakat soruları: EDA, grafik tasarımı ve matplotlib entegrasyonu.",
  nltk: "NLTK ve NLP mülakat soruları: Türkçe metin işleme, TF-IDF, stopword temizleme.",
  dask: "Dask mülakat soruları: büyük veri paralel işleme, delayed execution ve distributed DataFrame.",
  matplotlib: "Matplotlib mülakat soruları: grafik oluşturma, subplot, özelleştirme ve veri görselleştirme temelleri.",
  pytorch: "PyTorch mülakat soruları: tensor işlemleri, autograd, model tanımlama ve eğitim döngüsü.",
};

// ─── Yardımcı: params'tan libname/category çıkar ───────────
async function resolveCategory(params: Promise<{ category: string; id: string }>) {
  const resolved = await params;
  // Hem `category` hem de eski `libname` desteği (geriye uyumluluk)
  const libname = (resolved as any).libname ?? resolved.category;
  const id = resolved.id;
  const libKey = (libname || "").toString().toLowerCase() || "python-basics";
  return { libname: libname || "python-basics", id, libKey };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  // ✅ Try/catch ile sarmala — undefined crash etmesin
  let libname = "python-basics";
  let id = "";
  let libKey = "python-basics";
  let data: Awaited<ReturnType<typeof getInterview>> = null;

  try {
    const resolved = await resolveCategory(params);
    libname = resolved.libname;
    id = resolved.id;
    libKey = resolved.libKey;
    data = await getInterview(libname, id);
  } catch (e) {
    console.error("generateMetadata error:", e);
  }

  const libLabel = LIB_LABELS[libKey] ?? libname;
  const topic = data?.topic ?? `Soru #${id}`;
  const level = data?.level ?? LIB_LEVELS[libKey] ?? "başlangıç";

  const description =
    data?.description ??
    LIB_DESCRIPTIONS[libKey] ??
    `${libLabel} mülakat sorusu. Güvenli sandbox ortamında Python kodu yaz, anlık AI geri bildirimi al.`;

  const title = `${topic}${level ? ` (${level})` : ""} — ${libLabel} Mülakat Sorusu`;
  const url = `https://www.pythonmulakat.com/interviews/${libKey}/${id}`;

  return {
    title,
    description,
    keywords: [],
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      url,
      title,
      description,
      images: [
        {
          url: "/og-default.png",
          width: 1200,
          height: 630,
          alt: `${topic} — ${libLabel} Alıştırma Sorusu | Python Alıştırma Sorusu`,
        },
      ],
      siteName: "Python Mülakat",
      section: `${libLabel} Mülakat Soruları`,
      tags: [libLabel, "Python", level, topic, "Mülakat"],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/og-default.png"],
    },
  };
}

// ── JSON-LD ────────────────────────────────────────────────────
async function WorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ category: string; id: string }>;
}) {
  // ✅ Try/catch ile sarmala
  let libname = "python-basics";
  let id = "";
  let libKey = "python-basics";
  let data: Awaited<ReturnType<typeof getInterview>> = null;

  try {
    const resolved = await resolveCategory(params);
    libname = resolved.libname;
    id = resolved.id;
    libKey = resolved.libKey;
    data = await getInterview(libname, id);
  } catch (e) {
    console.error("WorkspaceLayout error:", e);
  }

  const libLabel = LIB_LABELS[libKey] ?? libname;
  const topic = data?.topic ?? `Soru #${id}`;
  const level = data?.level ?? LIB_LEVELS[libKey] ?? "başlangıç";

  const description =
    data?.description ??
    LIB_DESCRIPTIONS[libKey] ??
    `${libLabel} mülakat sorusu. Güvenli sandbox ortamında Python kodu yaz.`;

  const url = `https://www.pythonmulakat.com/interviews/${libKey}/${id}`;

  const schemaLevel =
    level === "başlangıç" || level === "beginner"
      ? "Beginner"
      : level === "orta" || level === "intermediate"
        ? "Intermediate"
        : level === "ileri" || level === "advanced"
          ? "Advanced"
          : "Beginner";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LearningResource",
    "@id": `${url}#resource`,
    name: topic,
    description,
    url,
    educationalLevel: schemaLevel,
    learningResourceType: "Interactive Exercise",
    teaches: [libLabel, "Python", level, "Mülakat Hazırlığı"],
    inLanguage: "tr-TR",
    dateModified: new Date().toISOString().split("T")[0],
    isPartOf: {
      "@type": "Course",
      name: `${libLabel} Python Kursu`,
      description: `${libLabel} için Türkçe interaktif alıştırma soruları. Seviye: ${level}.`,
      provider: {
        "@type": "Organization",
        name: "Python Mülakat",
        url: "https://www.pythonmulakat.com",
      },
    },
    breadcrumb: {
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
          name: `${libLabel} Soruları`,
          item: `https://www.pythonmulakat.com/interviews/${libKey}`,
        },
        { "@type": "ListItem", position: 3, name: topic, item: url },
      ],
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {children}
    </>
  );
}

export default WorkspaceLayout;