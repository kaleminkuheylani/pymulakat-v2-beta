

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kullanım Şartları ve Gizlilik Politikası",
  description:
    "Python Mulakat platformunun kullanım şartları ve hizmet koşulları.",
};

const LAST_UPDATED = "29 Mayıs 2026";
const COMPANY_NAME = "Python Mulakat";
const CONTACT_EMAIL = "kaleminkuheylani@gmail.com";

interface Section {
  num: string;
  title: string;
  content: React.ReactNode;
}

function SectionBlock({ num, title, content }: Section) {
  return (
    <div className="border-l-2 border-zinc-800 pl-5 hover:border-zinc-600 transition-colors duration-200">
      <p className="font-mono text-[10px] tracking-widest text-zinc-600 mb-2 uppercase">
        {num}
      </p>

      <h2 className="text-[15px] font-semibold text-zinc-200 mb-3">
        {title}
      </h2>

      <div className="text-[14px] leading-relaxed text-zinc-500 space-y-3">
        {content}
      </div>
    </div>
  );
}

export default function TermsPage() {
  const sections: Section[] = [
    {
      num: "01",
      title: "Sözleşmenin Kapsamı",
      content: (
        <>
          <p>
            Bu Kullanım Koşulları,{" "}
            <strong className="text-zinc-300">{COMPANY_NAME}</strong>{" "}
            platformunu kullanan tüm ziyaretçiler ve kayıtlı kullanıcılar için
            bağlayıcıdır.
          </p>

          <p>
            Platformu kullanmanız, aşağıda belirtilen şartları kabul ettiğiniz
            anlamına gelir.
          </p>
        </>
      ),
    },

    {
      num: "02",
      title: "Hizmet Tanımı",
      content: (
        <>
          <p>
            Platform; Python programlama mülakatları, teknik değerlendirmeler,
            eğitim içerikleri, tarayıcı tabanlı kod editörü ve istemci taraflı
            Python çalıştırma araçları sunmaktadır.
          </p>

          <p>
            Kod yürütme işlemleri Pyodide teknolojisi aracılığıyla doğrudan
            kullanıcının tarayıcısında gerçekleştirilmektedir.
          </p>

          <p>
            Platform, herhangi bir iş teklifini, işe alım garantisini veya
            sertifikasyon sonucunu taahhüt etmez.
          </p>
        </>
      ),
    },

    {
      num: "03",
      title: "Hesap Sorumluluğu",
      content: (
        <>
          <p>
            Kullanıcı hesabınızın güvenliğinden ve hesabınız üzerinden
            gerçekleştirilen işlemlerden siz sorumlusunuz.
          </p>

          <p>
            Hesap bilgilerinizin üçüncü kişilerle paylaşılması önerilmez.
          </p>

          <p>
            Platform, şüpheli kullanım durumlarında hesabı askıya alma veya
            sonlandırma hakkını saklı tutar.
          </p>
        </>
      ),
    },

    {
      num: "04",
      title: "Kod Çalıştırma Ortamı ve Sandbox",
      content: (
        <>
          <p>
            Platformda çalıştırılan Python kodları sunucularımızda değil,
            doğrudan tarayıcınız içerisinde çalışan Pyodide tabanlı izole bir
            çalışma ortamında yürütülmektedir.
          </p>

          <p>
            Kod çalıştırma ortamı güvenlik katmanları içerse de mutlak güvenlik
            garantisi verilmemektedir.
          </p>

          <p>
            Platform; sonsuz döngüler, aşırı bellek tüketimi, tarayıcı
            performans kaybı, cihaz yavaşlaması veya istemci taraflı kaynak
            tüketiminden doğabilecek dolaylı zararlardan sorumlu değildir.
          </p>

          <p>
            Kullanıcı, çalıştırdığı kodun kendi cihazında işleneceğini kabul
            eder.
          </p>
        </>
      ),
    },

    {
      num: "05",
      title: "Yasaklı Kullanımlar",
      content: (
        <>
          <p>
            Platform aşağıdaki amaçlarla kullanılamaz:
          </p>

          <ul className="list-disc pl-5 space-y-2">
            <li>Zararlı yazılım geliştirme veya dağıtımı</li>
            <li>Yetkisiz erişim girişimleri</li>
            <li>Kripto madenciliği veya kaynak sömürüsü</li>
            <li>Sandbox bypass denemeleri</li>
            <li>Otomatik yoğun istek gönderimi</li>
            <li>Platform güvenliğini test etmeye yönelik saldırılar</li>
            <li>Yasadışı veri toplama veya scraping faaliyetleri</li>
          </ul>

          <p>
            Bu tür faaliyetler tespit edildiğinde erişim engellenebilir ve
            gerekli durumlarda hukuki süreç başlatılabilir.
          </p>
        </>
      ),
    },

    {
      num: "06",
      title: "Fikri Mülkiyet",
      content: (
        <>
          <p>
            Platformdaki arayüzler, içerikler, soru sistemleri, tasarımlar ve
            marka unsurları ilgili fikri mülkiyet mevzuatı kapsamında
            korunmaktadır.
          </p>

          <p>
            Kullanıcılar yalnızca kişisel ve eğitim amaçlı kullanım hakkına
            sahiptir.
          </p>

          <p>
            İçeriklerin izinsiz çoğaltılması, ticari kullanımı veya yeniden
            dağıtımı yasaktır.
          </p>
        </>
      ),
    },

    {
      num: "07",
      title: "Kullanıcı Kodları ve İçerikleri",
      content: (
        <>
          <p>
            Kullanıcı tarafından yazılan kodlar ve çıktılar esas olarak
            kullanıcının cihazında işlenmektedir.
          </p>

          <p>
            Bazı teknik hata kayıtları, performans logları veya değerlendirme
            sonuçları hizmet kalitesini artırmak amacıyla geçici olarak
            işlenebilir.
          </p>

          <p>
            Kullanıcı, platforma yüklediği içeriklerin hukuka uygun olduğunu
            kabul eder.
          </p>
        </>
      ),
    },

    {
      num: "08",
      title: "Hizmet Sürekliliği",
      content: (
        <>
          <p>
            Platform kesintisiz veya hatasız çalışma garantisi vermez.
          </p>

          <p>
            Bakım, altyapı değişiklikleri, üçüncü taraf servis kesintileri veya
            teknik problemler nedeniyle hizmet geçici olarak durabilir.
          </p>

          <p>
            Platform özellikleri önceden bildirim yapılmaksızın değiştirilebilir
            veya kaldırılabilir.
          </p>
        </>
      ),
    },

    {
      num: "09",
      title: "Üçüncü Taraf Hizmetler",
      content: (
        <>
          <p>
            Platform; Railway, Vercel, Google Analytics ve jsDelivr CDN gibi
            üçüncü taraf altyapılar kullanmaktadır.
          </p>

          <p>
            Bu servislerin kendi gizlilik politikaları ve hizmet koşulları
            bulunmaktadır.
          </p>

          <p>
            Üçüncü taraf servis kesintileri veya güvenlik olaylarından doğrudan
            sorumluluk kabul edilmez.
          </p>
        </>
      ),
    },

    {
      num: "10",
      title: "Sorumluluğun Sınırlandırılması",
      content: (
        <>
          <p>
            Platform, eğitim ve değerlendirme amacıyla “olduğu gibi”
            sunulmaktadır.
          </p>

          <p>
            Teknik hata, veri kaybı, tarayıcı çökmesi, performans düşüşü,
            cihaz uyumsuzluğu veya üçüncü taraf servis kesintilerinden doğan
            dolaylı zararlardan sorumluluk kabul edilmez.
          </p>

          <p>
            Kullanıcı, platformu kendi sorumluluğu altında kullandığını kabul
            eder.
          </p>
        </>
      ),
    },

    {
      num: "11",
      title: "Hesap Sonlandırma",
      content: (
        <>
          <p>
            Kullanıcı istediği zaman hesabını kapatabilir.
          </p>

          <p>
            Platform; kötüye kullanım, güvenlik ihlali, yasa dışı faaliyet veya
            bu sözleşmeye aykırılık durumlarında hesabı askıya alma veya kalıcı
            olarak sonlandırma hakkını saklı tutar.
          </p>
        </>
      ),
    },

    {
      num: "12",
      title: "Uygulanacak Hukuk",
      content: (
        <>
          <p>
            Bu sözleşme Türkiye Cumhuriyeti hukukuna tabidir.
          </p>

         
        </>
      ),
    },

    {
      num: "13",
      title: "İletişim",
      content: (
        <>
          <p>
            Kullanım koşulları hakkında bizimle aşağıdaki e-posta adresi
            üzerinden iletişime geçebilirsiniz:
          </p>

          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="text-zinc-300 underline underline-offset-2 hover:text-zinc-100 transition-colors"
          >
            {CONTACT_EMAIL}
          </a>
        </>
      ),
    },
  ];

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="max-w-2xl mx-auto px-6 py-16">

        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded px-3 py-1.5 mb-10">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />

          <span className="font-mono text-[11px] text-zinc-500">
            Terms of Service · Güncel
          </span>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-semibold text-zinc-100 mb-2">
          Kullanım Koşulları
        </h1>

        <p className="font-mono text-[13px] text-zinc-600 mb-14">
          Son güncelleme: {LAST_UPDATED}
        </p>

        {/* Sections */}
        <div className="space-y-10">
          {sections.map((s) => (
            <SectionBlock key={s.num} {...s} />
          ))}
        </div>

        {/* Footer */}
        <hr className="border-zinc-900 my-12" />

        <p className="font-mono text-[11px] text-zinc-700">
          Bu kullanım koşulları Türkiye Cumhuriyeti mevzuatı kapsamında
          hazırlanmıştır. · Türkiye
        </p>
      </div>
    </main>
  );
}
