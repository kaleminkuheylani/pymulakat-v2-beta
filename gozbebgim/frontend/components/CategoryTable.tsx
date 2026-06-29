"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

interface QuestionItem {
  id: number | string;
  title: string;
  description?: string;
  level?: string;
  difficulty?: string;
  topic?: string;
  category?: string;
  tags?: string[];
}

interface Props {
  questions: QuestionItem[];
  currentCategory: string;
}

const LEVEL_ALIASES: Record<string, string> = {
  beginner: "başlangıç",
  başlangıç: "başlangıç",
  easy: "başlangıç",
  intermediate: "orta",
  orta: "orta",
  medium: "orta",
  advanced: "ileri",
  ileri: "ileri",
  hard: "ileri",
};

const LEVEL_OPTIONS = [
  { value: "all", label: "Tümü" },
  { value: "başlangıç", label: "Başlangıç" },
  { value: "orta", label: "Orta" },
  { value: "ileri", label: "İleri" },
];

const LEVEL_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  başlangıç: { bg: "rgba(74,222,128,0.10)", text: "#4ade80", border: "rgba(74,222,128,0.30)" },
  orta: { bg: "rgba(250,204,21,0.10)", text: "#facc15", border: "rgba(250,204,21,0.30)" },
  ileri: { bg: "rgba(248,113,113,0.10)", text: "#f87171", border: "rgba(248,113,113,0.30)" },
};

const LEVEL_DOT: Record<string, string> = {
  başlangıç: "#4ade80",
  orta: "#facc15",
  ileri: "#f87171",
};

function normalizeLevel(level?: string): string {
  if (!level) return "";
  const key = level.toLowerCase().trim();
  return LEVEL_ALIASES[key] || key;
}

function getLevelStyle(level?: string) {
  const norm = normalizeLevel(level);
  return LEVEL_STYLES[norm] || null;
}

export default function CategoryTable({ questions, currentCategory }: Props) {
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const filteredQuestions = useMemo(() => {
    if (!Array.isArray(questions)) return [];
    return questions.filter((q) => {
      if (difficultyFilter !== "all" && normalizeLevel(q.level) !== difficultyFilter) return false;
      if (searchQuery.trim()) {
        const s = searchQuery.toLowerCase().trim();
        const inTitle = q.title?.toLowerCase().includes(s);
        const inDesc = q.description?.toLowerCase().includes(s);
        const inTopic = q.topic?.toLowerCase().includes(s);
        const inTags = q.tags?.some((t) => t.toLowerCase().includes(s));
        if (!inTitle && !inDesc && !inTopic && !inTags) return false;
      }
      return true;
    });
  }, [questions, difficultyFilter, searchQuery]);

  const counts = useMemo(() => {
    const safe = Array.isArray(questions) ? questions : [];
    return {
      all: safe.length,
      başlangıç: safe.filter((q) => normalizeLevel(q.level) === "başlangıç").length,
      orta: safe.filter((q) => normalizeLevel(q.level) === "orta").length,
      ileri: safe.filter((q) => normalizeLevel(q.level) === "ileri").length,
    };
  }, [questions]);

  const hasFilters = difficultyFilter !== "all" || searchQuery.trim() !== "";

  const resetFilters = () => {
    setDifficultyFilter("all");
    setSearchQuery("");
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
      <div className="px-4 py-3 border-b border-white/10 bg-white/[0.02] flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <svg
            className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Ara..."
            className="w-full pl-8 pr-7 py-1.5 rounded-md bg-black/30 border border-white/10 text-sm text-white placeholder:text-white/30 focus:border-indigo-500/50 focus:outline-none transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
              aria-label="Temizle"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        <div className="flex items-center gap-1 p-0.5 rounded-md bg-black/30 border border-white/10">
          {LEVEL_OPTIONS.map((opt) => {
            const active = difficultyFilter === opt.value;
            const count =
              opt.value === "all"
                ? counts.all
                : counts[opt.value as keyof typeof counts] || 0;
            const dotColor = opt.value === "all" ? "white" : LEVEL_DOT[opt.value] || "white";
            return (
              <button
                key={opt.value}
                onClick={() => setDifficultyFilter(opt.value)}
                className={`flex items-center gap-1.5 px-2 py-1 rounded text-[11px] font-medium transition-all ${
                  active ? "bg-white/10 text-white" : "text-white/50 hover:text-white/80"
                }`}
                title={opt.label}
              >
                {opt.value !== "all" && (
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: dotColor }} />
                )}
                <span className="hidden sm:inline">{opt.label}</span>
                <span className="sm:hidden">{opt.label[0]}</span>
                <span className={`text-[10px] ${active ? "text-white/70" : "text-white/30"}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {hasFilters && (
          <button
            onClick={resetFilters}
            className="text-[11px] text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1 px-2"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Sıfırla
          </button>
        )}

        <div className="ml-auto text-[11px] text-white/40">
          <span className="text-white font-semibold">{filteredQuestions.length}</span>
          {hasFilters && (
            <span> / {Array.isArray(questions) ? questions.length : 0}</span>
          )}
          <span> soru</span>
        </div>
      </div>

      {filteredQuestions.length === 0 ? (
        <div className="p-12 text-center">
          <div className="text-4xl mb-3">🔍</div>
          <p className="text-white/60 text-sm">
            {hasFilters ? "Filtrelere uygun soru bulunamadı." : "Bu kategoride henüz soru yok."}
          </p>
          {hasFilters && (
            <button
              onClick={resetFilters}
              className="mt-3 text-xs text-indigo-400 hover:text-indigo-300"
            >
              Filtreleri temizle
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left px-4 py-2.5 text-[10px] uppercase tracking-wider text-white/30 font-medium w-12">
                  #
                </th>
                <th className="text-left px-4 py-2.5 text-[10px] uppercase tracking-wider text-white/30 font-medium">
                  Soru
                </th>
                <th className="text-left px-4 py-2.5 text-[10px] uppercase tracking-wider text-white/30 font-medium w-28 hidden md:table-cell">
                  Zorluk
                </th>
                <th className="text-right px-4 py-2.5 text-[10px] uppercase tracking-wider text-white/30 font-medium w-12">
                  {/* → */}
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredQuestions.map((q) => {
                const lvlStyle = getLevelStyle(q.level);
                const lvlNorm = normalizeLevel(q.level);
                return (
                  <tr
                    key={q.id}
                    className="border-b border-white/[0.03] hover:bg-white/[0.03] transition-colors group"
                  >
                    <td className="px-4 py-3 align-top">
                      <span className="text-xs font-mono text-white/30">{q.id}</span>
                    </td>

                    <td className="px-4 py-3">
                      <Link
                        href={`/interviews/${q.category || currentCategory}/${q.id}`}
                        className="block group/title"
                      >
                        <div className="text-sm font-medium text-white/90 group-hover/title:text-amber-400 transition-colors">
                          {q.title}
                        </div>
                        {q.description && (
                          <div className="text-xs text-white/40 mt-0.5 line-clamp-1">
                            {q.description}
                          </div>
                        )}
                        {lvlStyle && (
                          <div className="md:hidden mt-1.5 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: lvlStyle.text }} />
                            <span className="text-[10px] text-white/50">{lvlNorm}</span>
                          </div>
                        )}
                      </Link>
                    </td>

                    <td className="px-4 py-3 align-top hidden md:table-cell">
                      {lvlStyle && (
                        <span
                          className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded border font-medium"
                          style={{
                            background: lvlStyle.bg,
                            color: lvlStyle.text,
                            borderColor: lvlStyle.border,
                          }}
                        >
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: lvlStyle.text }} />
                          {lvlNorm}
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3 align-top text-right">
                      <Link
                        href={`/interviews/${q.category || currentCategory}/${q.id}`}
                        className="inline-flex items-center justify-center w-6 h-6 rounded text-white/30 hover:text-amber-400 hover:bg-amber-500/10 transition-all"
                        aria-label="Çöz"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}