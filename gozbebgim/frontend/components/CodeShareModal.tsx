"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Highlight, themes } from "prism-react-renderer";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────
interface CodeShareModalProps {
  open: boolean;
  onClose: () => void;
  code: string;
  language?: string;
  title?: string;
  category?: string;
  username?: string;
  durationLabel?: string;
  passedCount?: number;
  totalCount?: number;
}

// ─── Helpers ──────────────────────────────────────────────
function buildTweetText(opts: {
  title?: string;
  username?: string;
  passedCount?: number;
  totalCount?: number;
  durationLabel?: string;
}): string {
  const lines: string[] = [];

  lines.push("🐍 Python mülakat sorusunu çözdüm!");
  if (opts.title) lines.push(`📝 ${opts.title}`);
  if (opts.passedCount !== undefined && opts.totalCount !== undefined) {
    lines.push(`✅ ${opts.passedCount}/${opts.totalCount} test geçti`);
  }
  if (opts.durationLabel) lines.push(`⏱️ Süre: ${opts.durationLabel}`);
  if (opts.username) lines.push(`👤 @${opts.username}`);
  lines.push("");
  lines.push("#python #mülakat #pythonmulakat.com");
  return lines.join("\n");
}

// ─── Component ────────────────────────────────────────────
export default function CodeShareModal({
  open,
  onClose,
  code,
  language = "python",
  title,
  category,
  username,
  durationLabel,
  passedCount,
  totalCount,
}: CodeShareModalProps) {
  const [copied, setCopied] = useState(false);

  const tweetText = buildTweetText({
    title,
    username,
    passedCount,
    totalCount,
    durationLabel,
  });

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success("📋 Kod kopyalandı");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Kopyalama başarısız");
    }
  };

  const handleTweet = () => {
    // Twitter Web Intent — OAuth gerektirmez, tamamen ücretsiz
    const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
    window.open(tweetUrl, "_blank", "noopener,noreferrer,width=550,height=420");
    toast.success("🐦 Twitter penceresi açıldı", {
      description: "Tweet'ini göndermeyi unutma!",
    });
  };

  const handleCopyTweet = async () => {
    try {
      await navigator.clipboard.writeText(tweetText);
      toast.success("📋 Tweet metni kopyalandı");
    } catch {
      toast.error("Kopyalama başarısız");
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
            transition={{ type: "spring", duration: 0.4 }}
            className="relative bg-[#0a0e1a] border border-white/10 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 flex-shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-amber-400 flex items-center justify-center flex-shrink-0">
                  <span className="text-lg">🎉</span>
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg font-bold text-white truncate">
                    Çözümünü Paylaş
                  </h2>
                  {title && (
                    <p className="text-xs text-white/40 truncate">{title}</p>
                  )}
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-white/40 hover:text-white transition-colors p-1 flex-shrink-0"
                aria-label="Kapat"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Code Block */}
            <div className="flex-1 overflow-auto p-4 min-h-0">
              <div className="relative rounded-xl overflow-hidden border border-white/10 bg-[#050816]">
                <div className="flex items-center justify-between px-4 py-2 border-b border-white/5 bg-white/[0.02]">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-red-500/60" />
                    <span className="w-3 h-3 rounded-full bg-amber-500/60" />
                    <span className="w-3 h-3 rounded-full bg-green-500/60" />
                    <span className="ml-2 text-[10px] uppercase tracking-wider text-white/40 font-bold">
                      solution.{language === "python" ? "py" : language}
                    </span>
                  </div>
                  <button
                    onClick={handleCopy}
                    className="text-[10px] uppercase tracking-wider font-bold text-white/50 hover:text-amber-400 transition-colors px-2 py-1 rounded"
                  >
                    {copied ? "✓ Kopyalandı" : "📋 Kopyala"}
                  </button>
                </div>

                <Highlight
                  code={code.replace(/\n$/, "")}
                  language={language}
                  theme={themes.nightOwl}
                >
                  {({ className, style, tokens, getLineProps, getTokenProps }) => (
                    <pre
                      className={`${className} text-xs overflow-x-auto p-4 font-mono leading-relaxed`}
                      style={{ ...style, background: "transparent" }}
                    >
                      {tokens.map((line, i) => (
                        <div key={i} {...getLineProps({ line })} className="table-row">
                          <span className="table-cell pr-4 text-right text-white/20 select-none w-8">
                            {i + 1}
                          </span>
                          <span className="table-cell">
                            {line.map((token, key) => (
                              <span key={key} {...getTokenProps({ token })} />
                            ))}
                          </span>
                        </div>
                      ))}
                    </pre>
                  )}
                </Highlight>
              </div>
            </div>

            {/* Footer / Tweet Box */}
            <div className="border-t border-white/5 p-5 flex-shrink-0 space-y-3">
              <div className="bg-black/30 border border-white/10 rounded-xl p-3">
                <div className="text-[10px] uppercase tracking-wider text-white/40 font-bold mb-1.5">
                  Önizleme — Twitter'da Paylaş
                </div>
                <pre className="text-xs text-white/80 whitespace-pre-wrap font-sans leading-relaxed">
                  {tweetText}
                </pre>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleCopyTweet}
                  className="px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
                >
                  📋 Metni Kopyala
                </button>
                <button
                  onClick={handleTweet}
                  className="px-4 py-2.5 bg-gradient-to-r from-sky-500 to-blue-500 hover:from-sky-400 hover:to-blue-400 rounded-xl text-white text-sm font-bold transition-all hover:shadow-lg hover:shadow-sky-500/30 flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                  Twitter'da Paylaş
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}