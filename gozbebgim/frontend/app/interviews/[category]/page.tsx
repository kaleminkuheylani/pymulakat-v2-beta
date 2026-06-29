// app/interviews/[category]/page.tsx
// Kategori listeleme + TABLO + v2 API

import { headers } from "next/headers";
import Link from "next/link";
import CategoryTable from "../../../components/CategoryTable";

// ─── Sadece QUESTIONS.py'de gerçekten olan kategoriler ─────
const CATEGORY_LABELS: Record<string, string> = {
  "python-basics": "🐍 Python Temelleri",
  strings: "🔤 String İşlemleri",
  "list-dict": "📋 Liste & Sözlük",
  pandas: "🐼 Pandas",
  algorithms: "🧮 Algoritmalar",
};

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  "python-basics": "Döngüler, koşullar, fonksiyonlar ve temel syntax alıştırmaları.",
  strings: "String işleme, slicing, formatlama ve metotlar.",
  "list-dict": "Liste, sözlük ve tuple işlemleri.",
  pandas: "Veri temizleme, groupby, merge ve zaman serisi.",
  algorithms: "Algoritmik düşünme ve optimizasyon.",
};

interface PageProps {
  params: Promise<{ category: string }>;
}

interface QuestionItem {
  id: number | string;
  title: string;
  description?: string;
  level?: string;
  topic?: string;
  category?: string;
  tags?: string[];
  starter_code?: string;
}

async function fetchQuestions(category: string): Promise<QuestionItem[]> {
  try {
    const h = await headers();
    const host = h.get("host") || "localhost:3000";
    const protocol = host.includes("localhost") ? "http" : "https";
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || `${protocol}://${host}`;

    // ✅ v2 API — limit=100 (max 500)
    const res = await fetch(
      `${apiUrl}/api/v2/questions?category=${encodeURIComponent(category)}&limit=100`,
      {
        cache: "no-store",
        signal: AbortSignal.timeout(5000),
      }
    );

    if (!res.ok) {
      console.warn(`[CategoryPage] /api/v2/questions ${res.status}`);
      return [];
    }

    const data = await res.json();

    // ✅ Güvenli parse
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data)) return data;
    return [];
  } catch (err) {
    console.error("[CategoryPage] fetch error:", err);
    return [];
  }
}

export default async function CategoryPage({ params }: PageProps) {
  const { category } = await params;
  const label = CATEGORY_LABELS[category] ?? category;
  const description = CATEGORY_DESCRIPTIONS[category] ?? "";

  const questions = await fetchQuestions(category);
  const safeQuestions: QuestionItem[] = Array.isArray(questions) ? questions : [];

  // Her soruya category ekle
  const enriched: QuestionItem[] = safeQuestions.map((q) => ({
    ...q,
    category: q.category || category,
  }));

  return (
    <div className="min-h-screen bg-[#050816] text-white">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-white/40 hover:text-white text-sm mb-6 transition-colors"
        >
          ← Ana Sayfa
        </Link>

        <div className="mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4 mb-2">
            <h1 className="text-4xl font-bold">{label}</h1>
            <span className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-xs font-mono text-white/60">
              {category}
            </span>
          </div>
          {description && (
            <p className="text-white/60 text-base">{description}</p>
          )}
          <div className="flex items-center gap-3 mt-4 text-sm text-white/40">
            <span>
              <span className="text-white font-semibold">{safeQuestions.length}</span> soru
            </span>
          </div>
        </div>

        <CategoryTable
          questions={enriched}
          currentCategory={category}
        />
      </div>
    </div>
  );
}

export async function generateMetadata({ params }: PageProps) {
  try {
    const { category } = await params;
    const label = CATEGORY_LABELS[category] ?? category;
    return {
      title: `${label} Soruları | PythonMulakat`,
      description: `${label} kategorisindeki tüm Python mülakat soruları.`,
    };
  } catch {
    return {
      title: "Sorular | PythonMulakat",
      description: "Python mülakat soruları.",
    };
  }
}