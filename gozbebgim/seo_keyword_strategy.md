# pythonmulakat.com — SEO Keyword Stratejisi Raporu

## 1. Rakip & Pazar Analizi

### Ana Rakipler
| Site | Güçlü Yön | Zayıf Yön |
|---|---|---|
| coderspace.io | Geniş soru bankası, marka bilinirliği | Statik içerik, sandbox yok |
| techcareer.net | Kariyer odaklı, sektör bağlantısı | Sadece TR, interaktif değil |
| bitdegree.org/tr | SEO güçlü, çok dilli | Türkçe içerik yüzeysel |
| Medium makaleleri | Uzun kuyruklu trafiği var | Dağınık, platform bağımlı |

### Fırsat Boşluğu
- **Türkçe + interaktif sandbox** kombinasyonu hiçbir rakipte yok
- Kütüphane bazlı (Pandas, Sklearn) ayrıştırılmış soru havuzu rakiplerde eksik
- AI geri bildirimi olan tek Türkçe platform olma potansiyeli

---

## 2. Keyword Kümeleri & Öncelik Matrisi

### 🔴 Tier 1 — Ana Hedef Keywords (Yüksek Hacim / Direkt Intent)
| Keyword | Arama Niyeti | Uygulama Yeri |
|---|---|---|
| `python mülakat soruları` | Bilgi + Hazırlık | Ana sayfa H1, title, description |
| `veri bilimi mülakat soruları` | Bilgi + Hazırlık | Ana sayfa, blog |
| `data science mülakat` | Bilgi | Ana sayfa, OG |
| `pandas mülakat soruları` | Kütüphane öğrenme | /interviews/pandas |
| `scikit-learn mülakat soruları` | Kütüphane öğrenme | /interviews/sklearn |
| `machine learning mülakat` | Hazırlık | Genel sayfa |

### 🟡 Tier 2 — Long-Tail Keywords (Düşük Rekabet / Yüksek Dönüşüm)
| Keyword | Sayfa |
|---|---|
| `pandas mülakat soruları ve cevapları` | /interviews/pandas |
| `python data cleaning mülakat` | Pandas soru sayfaları |
| `sklearn pipeline interview türkçe` | Sklearn soru sayfaları |
| `interaktif python öğrenme türkçe` | Ana sayfa |
| `veri bilimi sandbox uygulama` | Ana sayfa, about |
| `ai ile python mülakat hazırlığı` | Ana sayfa |
| `data scientist nasıl olunur türkiye 2025` | Blog / landing |
| `pandas groupby mülakat sorusu` | /interviews/pandas/[id] |
| `feature engineering mülakat` | Sklearn/Pandas sayfaları |
| `random forest interview türkçe` | Sklearn sayfaları |

### 🟢 Tier 3 — Marka & Navigasyon Keywords
| Keyword | Yön |
|---|---|
| `pythonmulakat` | Marka koruması |
| `python mülakat platformu` | Brand awareness |
| `veri bilimi hazırlık platformu` | Kategori liderliği |

---

## 3. Sayfa Bazlı Keyword Ataması

### Ana Sayfa (/)
- **Primary:** `python mülakat soruları`, `veri bilimi mülakat soruları`
- **Secondary:** `interaktif python öğrenme`, `ai geri bildirim`, `pandas sklearn dask mülakat`
- **Title:** `Python & Veri Bilimi Mülakat Hazırlığı | pythonmulakat.com`
- **Description:** Pandas, Scikit-learn ve daha fazlası için interaktif Türkçe mülakat platformu. Gerçek sandbox, anlık AI geri bildirimi.

### /interviews/pandas
- **Primary:** `pandas mülakat soruları`, `pandas interview türkçe`
- **Secondary:** `pandas data cleaning`, `groupby mülakat`, `pandas öğren`

### /interviews/sklearn
- **Primary:** `scikit-learn mülakat soruları`, `sklearn interview türkçe`
- **Secondary:** `pipeline mülakat`, `random forest interview`, `feature selection`

### /interviews/[libname]/[id] (Soru Detay Sayfaları)
- **Primary:** `[konu] mülakat sorusu`, `[kütüphane] [level] mülakat`
- Her soru için özgün title + description (mevcut dynamic metadata ✅)

### /profile
- `noindex` ✅ (mevcut doğru)

### /register
- `noindex` ✅ (mevcut doğru)

---

## 4. Teknik SEO Sorunları & Düzeltmeler

### 🚨 Kritik
1. **Typo:** `template: "%s | Python MUlakat"` → `"%s | Python Mülakat"` düzeltilmeli
2. **Domain tutarsızlığı:** interview layout `datasciencetutor.cloud` kullanıyor, root layout `pythonmulakat.com` → tek domain seçilmeli
3. **OG title/description** ana sayfada `Dask` geçiyor ama `pythonmulakat.com` branding ile çelişiyor

### ⚠️ Orta Öncelik
4. **LIB_LABELS eksik:** `numpy`, `scipy`, `seaborn`, `statsmodels`, `nltk`, `sqlite3` yok → 404'e düşen canonical URL'ler
5. **Marka tutarsızlığı:** Organization `DataScienceTutor`, publisher `Python Mulakat` → birini seç
6. **`template` title** içindeki `Ü` harfi lowercase olmalı

### ✅ İyi Yapılanlar
- robots.txt yönlendirmeleri doğru
- JSON-LD Organization + WebSite mevcut
- LearningResource schema interview sayfalarında var
- Pyodide preload link var
- google-site-verification eklenmiş

---

## 5. Content Stratejisi (SEO Destekli)

### Blog / Landing Sayfaları Önerileri
1. `/blog/pandas-mulakat-sorulari-rehberi` — Tier 1 keyword landing page
2. `/blog/data-scientist-mulakat-hazirlik-2025` — Uzun kuyruklu + güncel
3. `/blog/sklearn-pipeline-nedir` — Eğitici + mülakat bağlantılı
4. `/kütüphaneler/pandas` — Kütüphane hub sayfası
5. `/seviyeler/beginner` — Level bazlı filtreleme

### Internal Linking
- Her soru sayfası → ilgili kütüphane hub'ına link
- Level filtreleri arası bağlantı
- Benzer konu soruları arası "Şunu da çöz" önerisi

---

## 6. Uygulama Öncelik Sırası

| Öncelik | Görev | Dosya |
|---|---|---|
| P0 | Typo düzelt (MUlakat) | root layout.tsx |
| P0 | Domain birleştir (pythonmulakat.com) | interview layout.tsx |
| P1 | Keywords zenginleştir | root layout.tsx |
| P1 | LIB_LABELS tamamla | interview layout.tsx |
| P1 | Marka tutarlılığı (Organization adı) | root layout.tsx |
| P2 | Sitemap.xml oluştur | /app/sitemap.ts |
| P2 | robots.txt optimize et | /public/robots.txt |
| P3 | Blog landing sayfaları | Yeni dosyalar |
