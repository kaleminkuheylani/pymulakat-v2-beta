# 📘 DataScienceTutor - Teknik README

> **Gerçek Zamanlı, Test-Tabanlı, Pyodide Destekli Mülakat ve Eğitim Platformu**  
> 🌐 [www.datasciencetutor.cloud]
> www.pythonmulakat.com
> (https://datasciencetutor.cloud)

---

## ⚠️ Telif ve Kullanım Hakları

Bu repository (`kaleminkuheylani/datasciencetutor`) ve içerisindeki tüm kaynak kodları, dokümantasyon, mimari desenler ve ticari sırlar **yalnızca repository sahibine aittir**. İzinsiz kopyalama, dağıtma, ticari amaçlı kullanma veya türev çalışma oluşturma 5846 Sayılı Fikir ve Sanat Eserleri Kanunu kapsamında yasaktır. Ticari entegrasyon veya katkı talepleri için lütfen doğrudan repo sahibi ile iletişime geçiniz.

---

## 🚀 Proje Özeti

**DataScienceTutor**, veri bilimi alanında gerçek zamanlı öğrenci-işveren etkileşimini hedefleyen, tarayıcı tabanlı Python çalıştırma ortamı sunan, test-case odaklı bir mülakat ve eğitim platformudur. Proje, modern full-stack mimarisi ile sektördeki mevcut çözümlerin ötesine geçerek güvenli, genişletilebilir ve yüksek performanslı bir deneyim sunar.

---

## 🏗️ Teknoloji Yığını (Tech Stack)

| Katman | Teknoloji | Açıklama |
|--------|-----------|----------|
| **Frontend** | Next.js 14 + TypeScript [[30]] | SSR/ISR destekli, SEO dostu, tip güvenliği sağlayan modern React framework'ü |
| **Backend** | FastAPI + Python 3.11+ [[37]] | Asenkron, OpenAPI otomatik dokümantasyonlu, yüksek performanslı REST/GraphQL API |
| **Code Editor** | Monaco Editor [[4]] | VS Code tabanlı, IntelliSense, syntax highlighting, hata teşhisi sunan profesyonel editör |
| **Python Runtime** | Pyodide (WebAssembly) [[3]][[5]] | Tarayıcıda CPython çalıştıran, micropip ile paket yönetimi destekleyen sandbox ortamı |
| **Test Altyapısı** | Jest + Playwright + Pytest [[51]] | Frontend ve backend için entegre, uçtan uca test senaryoları |
| **Güvenlik** | CSP, DOMPurify, Pyodide Sandbox [[23]][[38]] | Çok katmanlı güvenlik duvarı ile kod izole etme ve XSS/CSRF koruması |

---

## 🔧 Temel Özellikler

### ✅ Pyodide Entegrasyonu
- Tarayıcıda tam Python 3.11 ortamı [[1]][[9]]
- `micropip` ile NumPy, Pandas, Scikit-learn gibi kütüphanelerin dinamik yüklenmesi [[3]]
- WebAssembly tabanlı sandbox ile güvenli kod çalıştırma [[38]]
- Network kısıtlamaları ve CORS politikaları ile izole execution ortamı [[41]]

### ✅ Monaco Editor Altyapısı
- VS Code ile aynı dil servisleri: IntelliSense, hover, go-to-definition [[7]]
- Çoklu dil desteği: Python, SQL, R, Markdown
- `onValidate` callback ile gerçek zamanlı linting ve hata yakalama [[22]]
- Özelleştirilebilir tema, kısayol ve eklenti mimarisi

### ✅ Robust Hata Yakalama Mekanizması
```typescript
// Örnek: Pyodide execution error handler
try {
  await pyodide.runPythonAsync(userCode);
} catch (err) {
  if (err instanceof PyodideError) {
    // Sandbox ihlali tespit edildi
    logSecurityEvent('PYODIDE_ESCAPE_ATTEMPT', { userId, codeSnippet });
    throw new SecureExecutionError('Güvenlik politikası ihlali');
  }
  // Monaco Editor ile kullanıcıya dostane hata mesajı
  editor.setModelMarkers(model, 'owner', [{
    startLineNumber: err.lineno,
    endLineNumber: err.lineno,
    message: err.message,
    severity: MarkerSeverity.Error
  }]);
}
```

### ✅ Güvenli IDE – Sektör Ötesi Standartlar
- **Content Security Policy (CSP)** ile inline script engelleme [[27]][[28]]
- **DOMPurify** ile kullanıcı girdisi sanitizasyonu [[23]]
- **Pyodide sandbox escape** koruması için fonksiyon beyaz liste kontrolü [[39]][[42]]
- **Rate limiting + JWT + Refresh Token** ile yetkilendirme katmanı
- **Audit log** ile tüm kod çalıştırma ve erişim olaylarının izlenebilirliği

### ✅ Test-Case Odaklı Değerlendirme
- Her mülakat sorusu için önceden tanımlanmış unit/integration test senaryoları
- Otomatik puanlama: doğruluk, performans, kod kalitesi metrikleri
- Playwright ile E2E test otomasyonu: kullanıcı akışları, edge case'ler [[51]]
- Jest + React Testing Library ile frontend bileşen testleri [[50]]

---

## 🔄 NEXT.js + FastAPI Sinergisi

Bu proje, modern full-stack geliştirme prensiplerini benimseyerek **Next.js** ve **FastAPI** kombinasyonunun sunduğu ayrıcalıklı ekosistemden faydalanır [[31]][[32]]:

| Avantaj | Açıklama |
|---------|----------|
| 🚀 **Performans** | Next.js ISR/SSR ile hızlı ilk yükleme; FastAPI async/await ile yüksek I/O throughput |
| 🔐 **Tip Güvenliği** | TypeScript + Pydantic ile uçtan uca tip doğrulama, runtime hatalarında %90 azalma |
| 📦 **Developer Experience** | Hot reload, otomatik OpenAPI docs, VS Code entegrasyonu ile hızlı iterasyon |
| 🌍 **Deployment Esnekliği** | Vercel (frontend) + Docker/K8s (backend) ile bağımsız ölçeklendirme [[34]][[35]] |
| 🧪 **Test Kolaylığı** | Jest (frontend) + Pytest (backend) + Playwright (E2E) ile kapsamlı test stratejisi |

---

## 🧭 Gelecek Yol Haritası



- 🤖 **AI Destekli Geri Bildirim**: LLM tabanlı kod önerileri ve açıklama üretimi
- 🎯 **Kişiselleştirilmiş Öğrenme Yolu**: Kullanıcı performans verisi ile adaptif soru havuzu
- 🌐 **Çoklu Dil Desteği**: Arayüz ve dokümantasyon için i18n altyapısı
- 🔌 **Plugin Mimarisi**: Topluluk katkılarına açık, güvenli eklenti sistemi

---

## 🛠️ Kurulum ve Geliştirme

```bash
# 1. Repository'yi klonlayın
git clone https://github.com/kaleminkuheylani/datasciencetutor.git
cd datasciencetutor

# 2. Frontend bağımlılıkları
cd frontend
npm install
cp .env.example .env.local  # Değişkenleri doldurun

# 3. Backend bağımlılıkları
cd ../backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# 4. Geliştirme sunucularını başlatın
# Terminal 1: Frontend
cd frontend && npm run dev

# Terminal 2: Backend
cd backend && uvicorn main:app --reload
```

> 🔐 **Güvenlik Notu**: Production ortamında Pyodide runtime'ı mutlaka ek sandbox katmanları (Deno, gVisor) ile güçlendirilmelidir [[40]].

---

## 📜 Lisans ve Katkı

- Bu proje **özel mülkiyet** statüsündedir. Açık kaynak lisansı uygulanmamaktadır.
- Katkı talepleri için lütfen önce `CONTRIBUTING.md` dosyasını inceleyiniz ve repo sahibi ile ön görüşme yapınız.
- Güvenlik açıkları için lütfen doğrudan `mkemal@datasciencetutor.cloud` adresine bildirimde bulununuz.
---

*Son Güncelleme: Mayıs 2026*  
*Proje Sahibi: @kaleminkuheylani*  
*İletişim: [GitHub Issues](https://github.com/kaleminkuheylani/datasciencetutor/issues) • [Website](https://datasciencetutor.cloud)*
