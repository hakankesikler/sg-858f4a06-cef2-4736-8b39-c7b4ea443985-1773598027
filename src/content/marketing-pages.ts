export type MarketingIcon = "truck" | "route" | "globe" | "plane" | "ship" | "zap" | "warehouse" | "building" | "contact";

export type MarketingPageData = {
  slug: string;
  kind: "service" | "about" | "contact";
  icon: MarketingIcon;
  eyebrow: string;
  title: string;
  lead: string;
  seoTitle: string;
  seoDescription: string;
  keywords: string[];
  highlights: Array<{ title: string; text: string }>;
  sections: Array<{ title: string; paragraphs: string[]; bullets?: string[] }>;
  steps?: Array<{ title: string; text: string }>;
  faq: Array<{ question: string; answer: string }>;
  related: string[];
};

export const marketingPages: Record<string, MarketingPageData> = {
  "yurtici-parsiyel-tasimacilik": {
    slug: "yurtici-parsiyel-tasimacilik",
    kind: "service",
    icon: "route",
    eyebrow: "Türkiye geneli dağıtım",
    title: "Yurtiçi Parsiyel Taşımacılık",
    lead: "Aracın tamamını doldurmayan paletli ve ambalajlı yüklerinizi aynı güzergâhtaki gönderilerle planlıyor; çıkış noktasından teslimata kadar kontrollü bir operasyon yürütüyoruz.",
    seoTitle: "Yurtiçi Parsiyel Taşımacılık | REX Lojistik",
    seoDescription: "Türkiye genelinde parsiyel yük taşımacılığı, paletli ürün dağıtımı ve planlı teslimat. REX Lojistik'ten yurtiçi parsiyel nakliye teklifi alın.",
    keywords: ["yurtiçi parsiyel taşımacılık", "parsiyel nakliye", "palet taşımacılığı", "Türkiye geneli dağıtım", "İzmir parsiyel taşımacılık"],
    highlights: [
      { title: "81 İl Kapsaması", text: "İl ve ilçelere planlı dağıtım organizasyonu" },
      { title: "Esnek Kapasite", text: "Bir paletten başlayan yükler için uygun çözüm" },
      { title: "Kontrollü Teslimat", text: "Takip numarası ve dijital teslim evrakı" },
    ],
    sections: [
      {
        title: "Parsiyel taşımacılık nedir?",
        paragraphs: [
          "Parsiyel taşımacılık, farklı müşterilere ait ve aynı yönde ilerleyen yüklerin araç kapasitesini paylaşmasıdır. Böylece yalnızca kullandığınız kapasite için planlama yapılır; komple araç kiralamaya ihtiyaç duymayan gönderiler daha verimli taşınır.",
          "REX Lojistik; yükün ölçüsü, ağırlığı, ambalajı, çıkış noktası ve teslim adresini birlikte değerlendirerek uygun hattı oluşturur. Paletli ürünler, kolili ticari gönderiler ve düzenli bayi sevkiyatları için tekrarlanabilir operasyon planları hazırlanabilir.",
        ],
        bullets: ["Palet ve koli bazlı ticari yükler", "Düzenli bayi ve şube dağıtımları", "Farklı şehirlerde çoklu teslimat noktaları", "Teslim evrakının dijital olarak izlenmesi"],
      },
      {
        title: "Yurtiçi parsiyel gönderiniz nasıl yönetilir?",
        paragraphs: [
          "Operasyon ekibimiz yük bilgilerini aldıktan sonra uygun araç ve hat planlamasını yapar. Gönderi sisteme kaydedilir, taşıma boyunca durumu izlenir ve teslim sonrasında evrak kaydı tamamlanır.",
          "İzmir ve Manisa ofislerimizden koordine edilen operasyonlarla Türkiye genelindeki çıkış ve varış noktaları için tek muhatap üzerinden ilerleyebilirsiniz.",
        ],
      },
    ],
    steps: [
      { title: "Yük bilgisi", text: "Çıkış, varış, ölçü, ağırlık ve teslim beklentisi alınır." },
      { title: "Hat planlaması", text: "Gönderi uygun güzergâh ve araç kapasitesiyle eşleştirilir." },
      { title: "Taşıma ve takip", text: "Sevkiyat numarası üzerinden operasyon durumu izlenir." },
      { title: "Teslimat", text: "Teslim bilgisi ve evrakı sisteme kaydedilerek süreç kapatılır." },
    ],
    faq: [
      { question: "Parsiyel taşıma hangi yükler için uygundur?", answer: "Aracın tamamını doldurmayan, paletli veya uygun şekilde ambalajlanmış ticari yükler için uygundur. Kesin uygunluk yükün ölçüsü, ağırlığı ve niteliği değerlendirilerek belirlenir." },
      { question: "Türkiye'nin hangi şehirlerine teslimat yapılıyor?", answer: "REX Lojistik Türkiye'nin 81 iline ve ilçelerine yönelik dağıtım organizasyonu sağlar. Teslim süresi çıkış-varış hattına ve yük özelliklerine göre teklif aşamasında paylaşılır." },
      { question: "Parsiyel gönderiyi nasıl takip ederim?", answer: "Oluşturulan takip numarasıyla web sitesindeki kargo takip alanından güncel sevkiyat durumunu görüntüleyebilirsiniz." },
      { question: "Fiyat nasıl hesaplanır?", answer: "Fiyat; çıkış ve varış noktası, palet/koli adedi, ölçü, ağırlık, yük niteliği ve teslimat koşullarına göre hesaplanır." },
    ],
    related: ["komple-tasimacilik", "express-kargo", "depolama"],
  },
  "komple-tasimacilik": {
    slug: "komple-tasimacilik",
    kind: "service",
    icon: "truck",
    eyebrow: "Araca özel taşıma planı",
    title: "Komple Taşımacılık",
    lead: "Yükünüze ayrılmış araçla, aktarma ihtiyacını azaltan ve teslimat programınıza göre şekillenen yurtiçi komple taşıma çözümleri sunuyoruz.",
    seoTitle: "Komple Taşımacılık ve FTL Nakliye | REX Lojistik",
    seoDescription: "Yükünüze özel araç, planlı rota ve doğrudan teslimatla komple taşımacılık hizmeti. Yurtiçi FTL nakliye teklifinizi REX Lojistik'ten alın.",
    keywords: ["komple taşımacılık", "FTL nakliye", "komple araç taşımacılığı", "şehirlerarası nakliye", "kurumsal yük taşımacılığı"],
    highlights: [
      { title: "Yüke Özel Araç", text: "Araç kapasitesi yalnızca sizin sevkiyatınıza ayrılır" },
      { title: "Doğrudan Rota", text: "Planlı çıkış ve teslimat noktasına odaklı operasyon" },
      { title: "Uygun Araç Seçimi", text: "Yükün ağırlığı ve hacmine göre araç eşleştirmesi" },
    ],
    sections: [
      {
        title: "Komple yük taşımacılığında operasyon kontrolü",
        paragraphs: [
          "Komple taşımacılıkta araç kapasitesi tek bir müşterinin yüküne ayrılır. Yükleme programı, teslimat penceresi, araç türü ve güzergâh birlikte planlandığı için yüksek hacimli ya da zaman hassasiyetli sevkiyatlarda güçlü bir seçenektir.",
          "REX Lojistik, yükün toplam ağırlığını ve hacmini araç kapasitesiyle karşılaştırır; sürücü ve araç belgelerinin operasyon şartlarını karşıladığını kontrol ederek atama sürecini yönetir.",
        ],
        bullets: ["Fabrika, depo ve şube arası taşımalar", "Tek noktadan tek veya çoklu teslimat", "Paletli, kolili ve proje bazlı ticari yükler", "Planlı ve tekrarlayan sevkiyat programları"],
      },
      {
        title: "Hangi araç ve rota seçilir?",
        paragraphs: [
          "Araç seçimi yalnızca palet adedine göre yapılmaz. Yükün toplam kilogramı, hacmi, istiflenebilirliği, yükleme ekipmanı ve adres erişim koşulları birlikte değerlendirilir.",
          "Güzergâh ve teslimat saatleri kesinleştirildikten sonra sevkiyat sisteme alınır. Taşıma başlangıcı, operasyon hareketleri ve teslim evrakı aynı kayıt üzerinden takip edilir.",
        ],
      },
    ],
    steps: [
      { title: "Kapasite analizi", text: "Yük ölçüsü, ağırlığı ve araç gereksinimi belirlenir." },
      { title: "Araç ataması", text: "Uygun sürücü ve araç operasyon için eşleştirilir." },
      { title: "Doğrudan sevk", text: "Planlanan çıkış saatinde yükleme ve taşıma başlatılır." },
      { title: "Teslim doğrulama", text: "Teslim alan bilgisi ve evrakı dijital kayda eklenir." },
    ],
    faq: [
      { question: "Komple taşımacılık ile parsiyel taşıma arasındaki fark nedir?", answer: "Komple taşımada araç kapasitesi tek müşterinin sevkiyatına ayrılır. Parsiyel taşımada ise aynı güzergâhtaki farklı müşterilerin yükleri araç kapasitesini paylaşır." },
      { question: "Komple taşıma için hangi araçlar kullanılabilir?", answer: "Araç tipi yükün hacmi, ağırlığı, yükleme şekli ve adres koşullarına göre belirlenir. Teklif öncesinde bu bilgiler operasyon ekibi tarafından kontrol edilir." },
      { question: "Düzenli komple araç planlaması yapılabilir mi?", answer: "Evet. Belirli gün ve güzergâhlarda tekrarlayan fabrika, depo, şube veya müşteri teslimatları için düzenli operasyon planı oluşturulabilir." },
      { question: "Teslim evrakına nasıl ulaşılır?", answer: "Teslim tamamlandıktan sonra yüklenen teslim belgesi yetkili müşteri portalı ve ilgili takip ekranı üzerinden görüntülenebilir." },
    ],
    related: ["yurtici-parsiyel-tasimacilik", "depolama", "uluslararasi-karayolu-tasimaciligi"],
  },
  "uluslararasi-karayolu-tasimaciligi": {
    slug: "uluslararasi-karayolu-tasimaciligi",
    kind: "service",
    icon: "globe",
    eyebrow: "Avrupa ve uluslararası hatlar",
    title: "Uluslararası Karayolu Taşımacılığı",
    lead: "İthalat ve ihracat yükleriniz için parsiyel veya komple araç seçeneklerini; güzergâh, belge ve teslimat koordinasyonuyla tek operasyon altında yönetiyoruz.",
    seoTitle: "Uluslararası Karayolu Taşımacılığı | REX Lojistik",
    seoDescription: "Avrupa yönlü ithalat ve ihracat yükleri için uluslararası karayolu taşımacılığı, parsiyel ve komple araç çözümleri. REX Lojistik'ten teklif alın.",
    keywords: ["uluslararası karayolu taşımacılığı", "Avrupa nakliye", "ihracat taşımacılığı", "ithalat taşımacılığı", "uluslararası parsiyel"],
    highlights: [
      { title: "İthalat & İhracat", text: "Çift yönlü uluslararası taşıma organizasyonu" },
      { title: "Parsiyel & Komple", text: "Yük hacmine göre esnek araç planlaması" },
      { title: "Belge Koordinasyonu", text: "Taşıma evrakları için kontrollü süreç" },
    ],
    sections: [
      {
        title: "Sınır ötesi yükler için planlı karayolu çözümü",
        paragraphs: [
          "Uluslararası karayolu taşımacılığı, Türkiye ile Avrupa başta olmak üzere karayolu bağlantısı bulunan pazarlardaki ticari yükler için kapıdan kapıya esneklik sağlar. REX Lojistik, gönderinin hacmine göre parsiyel veya komple araç planlar.",
          "Çıkış ülkesi, teslim ülkesi, sınır geçişinde ihtiyaç duyulan taşıma evrakları, ürün niteliği ve teslim şekli teklif öncesinde değerlendirilir. İthalat ve ihracata ilişkin resmi işlemler müşteri ile müşterinin kendi yetkili danışmanları tarafından yürütülür; REX Lojistik taşıma operasyonuna odaklanır.",
        ],
        bullets: ["Avrupa yönlü ithalat ve ihracat sevkiyatları", "Komple araç ve parsiyel yük organizasyonu", "Kapıdan kapıya veya terminal bağlantılı teslimat", "Taşıma belgesi ve sınır geçişi koordinasyonu"],
      },
      {
        title: "Uluslararası taşıma teklifinde hangi bilgiler gerekir?",
        paragraphs: [
          "Doğru araç ve transit planı için yükleme ve teslim adresi, ürün tanımı, GTİP bilgisi mevcutsa paylaşımı, paketleme biçimi, palet/koli adedi, brüt ağırlık, hacim ve hazır olma tarihi gereklidir.",
          "Tehlikeli madde, ısı kontrollü yük, gabari dışı ölçü veya özel elleçleme gereksinimi varsa teklif aşamasında ayrıca belirtilmelidir.",
        ],
      },
    ],
    steps: [
      { title: "Hat analizi", text: "Ülke, adres, yük ve teslim şekli değerlendirilir." },
      { title: "Belge kontrolü", text: "Taşıma için gerekli ticari ve operasyonel bilgiler teyit edilir." },
      { title: "Uluslararası sevk", text: "Araç, çıkış ve transit planına göre taşıma başlatılır." },
      { title: "Teslim & raporlama", text: "Teslim bilgisi ve evrak akışı müşteriyle paylaşılır." },
    ],
    faq: [
      { question: "Uluslararası parsiyel ve komple taşıma yapılabiliyor mu?", answer: "Evet. Yük miktarı ve teslim beklentisine göre parsiyel ya da komple araç seçeneği planlanabilir." },
      { question: "REX Lojistik uluslararası taşımada hangi kapsamı yönetir?", answer: "REX Lojistik araç, hat, taşıma evrakı ve teslimat operasyonunu yönetir. İthalat ve ihracata ilişkin resmi işlemler müşterinin kendi yetkili danışmanları tarafından yürütülür ve REX Lojistik hizmet kapsamının dışındadır." },
      { question: "Transit süre nasıl belirlenir?", answer: "Transit süre; ülke, güzergâh, sınır geçişleri ve resmi işlemler, araç planı ve teslimat koşullarına göre belirlenir. Tahmini süre teklif sırasında paylaşılır." },
      { question: "Hangi belgeler gerekir?", answer: "Fatura, çeki listesi ve taşıma belgeleri başta olmak üzere gereklilikler yük ve ülkeye göre değişebilir. Operasyon öncesi kontrol listesi paylaşılır." },
    ],
    related: ["komple-tasimacilik", "hava-kargo", "denizyolu-tasimaciligi"],
  },
  "hava-kargo": {
    slug: "hava-kargo",
    kind: "service",
    icon: "plane",
    eyebrow: "Zaman hassasiyetli gönderiler",
    title: "Hava Kargo Taşımacılığı",
    lead: "Acil, yüksek değerli veya teslim süresi kritik uluslararası gönderileriniz için uçuş seçeneklerini ve kara bağlantılarını birlikte planlıyoruz.",
    seoTitle: "Hava Kargo ve Hava Yolu Taşımacılığı | REX Lojistik",
    seoDescription: "Acil ve zaman hassasiyetli gönderiler için uluslararası hava kargo, havalimanı ve kapı teslim seçenekleri. REX Lojistik hava kargo teklifi alın.",
    keywords: ["hava kargo", "hava yolu taşımacılığı", "uluslararası hava kargo", "acil kargo", "kapıdan kapıya hava kargo"],
    highlights: [
      { title: "Hız Odaklı", text: "Uygun uçuş ve bağlantı seçeneklerinin karşılaştırılması" },
      { title: "Kapı Bağlantısı", text: "Çıkış ve varış kara transferlerinin planlanması" },
      { title: "Evrak Takibi", text: "Hava taşıma belgeleri için operasyon koordinasyonu" },
    ],
    sections: [
      {
        title: "Hava kargo ne zaman tercih edilir?",
        paragraphs: [
          "Üretim hattını bekleten parçalar, numuneler, değerli ürünler ve teslim süresi kritik ticari gönderiler için hava kargo güçlü bir alternatiftir. En hızlı seçenek her zaman en doğru seçenek değildir; uçuş sıklığı, aktarma, hacimsel ağırlık ve varış hizmetleri birlikte değerlendirilmelidir.",
          "REX Lojistik; gönderinin çıkış adresinden havalimanına, uçuş sürecinden varış transferine kadar ilgili aşamaları tek plan içinde koordine eder.",
        ],
        bullets: ["Havalimanından havalimanına taşıma", "Kapıdan havalimanına veya kapıdan kapıya çözüm", "Numune, yedek parça ve ticari paketler", "Uçuş ve transit alternatiflerinin karşılaştırılması"],
      },
      {
        title: "Hacimsel ağırlık ve paketleme",
        paragraphs: [
          "Hava kargo fiyatları gerçek ağırlığın yanı sıra paketin kapladığı hacme göre de hesaplanabilir. Bu nedenle koli ölçülerinin ve brüt ağırlığın doğru paylaşılması teklifin doğruluğu için önemlidir.",
          "Paketleme; ürünün niteliğine, uçuş güvenliği kurallarına ve aktarma koşullarına uygun olmalıdır. Özel nitelikli ürünler, batarya içeren gönderiler veya tehlikeli maddeler önceden bildirilmelidir.",
        ],
      },
    ],
    steps: [
      { title: "Gönderi analizi", text: "Ürün, ölçü, ağırlık, adres ve teslim hedefi alınır." },
      { title: "Uçuş seçimi", text: "Uygun hat, transit süre ve maliyet seçenekleri karşılaştırılır." },
      { title: "Kabul & uçuş", text: "Kara transferi ve havayolu kabul süreci koordine edilir." },
      { title: "Varış teslimi", text: "Varış işlemleri ve son teslimat seçilen kapsama göre yürütülür." },
    ],
    faq: [
      { question: "Hava kargo fiyatı nasıl hesaplanır?", answer: "Fiyat; çıkış-varış hattı, gerçek ve hacimsel ağırlık, ürün niteliği, uçuş seçeneği ve kapı teslim hizmetlerine göre hesaplanır." },
      { question: "Kapıdan kapıya hava kargo yapılabilir mi?", answer: "Uygun ülkelerde çıkış ve varış kara transferleri hava taşımasına eklenerek kapıdan kapıya çözüm planlanabilir." },
      { question: "Her ürün hava kargoyla taşınabilir mi?", answer: "Hayır. Tehlikeli maddeler, bataryalar, sıvılar ve bazı özel ürünler için havayolu kabul kuralları bulunur. Ürün detayları rezervasyon öncesi kontrol edilir." },
      { question: "Teslim süresi ne kadardır?", answer: "Süre uçuş hattı, rezervasyon durumu, aktarma, ülke giriş koşulları ve kapı teslim kapsamına göre değişir; teklif sırasında tahmini transit süre belirtilir." },
    ],
    related: ["express-kargo", "uluslararasi-karayolu-tasimaciligi", "denizyolu-tasimaciligi"],
  },
  "denizyolu-tasimaciligi": {
    slug: "denizyolu-tasimaciligi",
    kind: "service",
    icon: "ship",
    eyebrow: "Küresel liman bağlantıları",
    title: "Denizyolu Taşımacılığı",
    lead: "Yük hacminize ve tedarik planınıza göre FCL komple konteyner veya LCL parsiyel denizyolu seçeneklerini organize ediyoruz.",
    seoTitle: "Denizyolu Taşımacılığı, FCL ve LCL | REX Lojistik",
    seoDescription: "İthalat ve ihracat yükleri için FCL komple konteyner, LCL parsiyel denizyolu taşımacılığı ve liman bağlantıları. REX Lojistik'ten teklif alın.",
    keywords: ["denizyolu taşımacılığı", "FCL konteyner", "LCL parsiyel", "uluslararası deniz kargo", "konteyner taşımacılığı"],
    highlights: [
      { title: "FCL", text: "Yüke ayrılmış komple konteyner seçeneği" },
      { title: "LCL", text: "Daha düşük hacimli yükler için parsiyel çözüm" },
      { title: "Liman Bağlantısı", text: "Ön ve son kara taşımasının koordinasyonu" },
    ],
    sections: [
      {
        title: "FCL ve LCL denizyolu çözümleri",
        paragraphs: [
          "FCL taşımada konteyner tek müşterinin yüküne ayrılır. LCL taşımada ise aynı varış yönündeki farklı yükler konteyner kapasitesini paylaşır. Doğru seçim yalnızca hacme değil; ürün niteliğine, yükleme tarihine, liman masraflarına ve teslim hedeflerine göre yapılır.",
          "REX Lojistik, çıkış limanı ve varış limanı alternatiflerini, gemi programını, konteyner türünü ve kara bağlantılarını birlikte değerlendirir.",
        ],
        bullets: ["20', 40' ve uygun konteyner alternatifleri", "LCL parsiyel denizyolu organizasyonu", "Liman, depo ve fabrika arası kara bağlantıları", "İthalat ve ihracat evrak koordinasyonu"],
      },
      {
        title: "Denizyolu teklifinde maliyet şeffaflığı",
        paragraphs: [
          "Navlun dışında çıkış ve varış yerel masrafları, terminal hizmetleri, resmi ithalat ve ihracat giderleri, ardiye riski ve kara transferleri toplam maliyeti etkileyebilir. Teklif kapsamının hangi hizmetleri içerdiği açık biçimde belirlenmelidir.",
          "Konteyner serbest süreleri ve liman teslim kuralları operasyon öncesinde değerlendirilerek gecikme riskini azaltacak takvim oluşturulur.",
        ],
      },
    ],
    steps: [
      { title: "Yük & rota", text: "Hacim, ağırlık, teslim şekli ve liman seçenekleri analiz edilir." },
      { title: "Rezervasyon", text: "Uygun gemi programı ve konteyner seçeneği planlanır." },
      { title: "Liman operasyonu", text: "Kara bağlantısı, evrak ve liman teslimi koordine edilir." },
      { title: "Varış süreci", text: "Varış limanı ve son teslim kapsamı takip edilir." },
    ],
    faq: [
      { question: "FCL ve LCL arasındaki fark nedir?", answer: "FCL'de konteyner tek bir müşteriye ayrılır; LCL'de birden fazla göndericinin yükü aynı konteyner kapasitesini paylaşır." },
      { question: "Denizyolu taşıma süresi nasıl belirlenir?", answer: "Gemi programı, çıkış ve varış limanı, aktarma, liman yoğunluğu, resmi işlemler ve kara bağlantıları toplam süreyi etkiler." },
      { question: "Kapıdan kapıya denizyolu hizmeti alınabilir mi?", answer: "Uygun hatlarda çıkış ve varış kara taşımaları denizyolu operasyonuna eklenerek kapıdan kapıya plan yapılabilir." },
      { question: "Konteyner türünü kim belirler?", answer: "Yükün ölçüsü, ağırlığı, ambalajı, yükleme biçimi ve özel gereksinimleri incelenerek uygun konteyner seçeneği önerilir." },
    ],
    related: ["uluslararasi-karayolu-tasimaciligi", "hava-kargo", "depolama"],
  },
  "express-kargo": {
    slug: "express-kargo",
    kind: "service",
    icon: "zap",
    eyebrow: "Hızlı uluslararası teslimat",
    title: "Express Kargo",
    lead: "Dosya, numune, yedek parça ve küçük ticari gönderilerinizi güçlü express kargo iş ortaklarıyla dünyanın erişilebilir noktalarına ulaştırıyoruz.",
    seoTitle: "Uluslararası Express Kargo | REX Lojistik",
    seoDescription: "Dosya, numune, yedek parça ve paketler için hızlı uluslararası express kargo ve kapıdan kapıya teslimat. REX Lojistik'ten fiyat alın.",
    keywords: ["express kargo", "uluslararası express kargo", "hızlı kargo", "yurtdışı numune gönderimi", "kapıdan kapıya kargo"],
    highlights: [
      { title: "Hızlı Rezervasyon", text: "Gönderi bilgisine göre uygun servis seçimi" },
      { title: "Kapıdan Kapıya", text: "Alım ve teslimat bağlantılarının planlanması" },
      { title: "Takip Edilebilir", text: "Gönderi hareketlerinin takip numarasıyla izlenmesi" },
    ],
    sections: [
      {
        title: "Express kargo hangi gönderiler için uygundur?",
        paragraphs: [
          "Express kargo; dosya, numune, küçük yedek parça, e-ticaret paketi ve zaman hassasiyetli düşük hacimli gönderiler için pratik bir çözümdür. Servis seçimi yapılırken yalnızca hız değil, ülke kapsaması, ülke giriş koşulları, ürün kabul kuralları ve teslimat bölgesi de değerlendirilir.",
          "REX Lojistik gönderi bilgilerini kontrol ederek uygun express servis alternatifini sunar ve takip numarası üzerinden sürecin izlenmesini sağlar.",
        ],
        bullets: ["Ticari numune ve evrak gönderileri", "Küçük yedek parça ve paketler", "Kapıdan kapıya uluslararası teslimat", "Takip numarasıyla gönderi sorgulama"],
      },
      {
        title: "Ürün kabul ve ülke giriş koşulları",
        paragraphs: [
          "Uluslararası express gönderilerde ürün tanımı, miktar, değer ve kullanım amacı açık olmalıdır. Ticari fatura ya da proforma gereksinimi gönderi türüne göre belirlenir.",
          "Batarya, sıvı, gıda, kozmetik, ilaç ve benzeri ürünlerde ülke ve taşıyıcı kuralları farklılaşabilir. Rezervasyon öncesinde içerik mutlaka doğru beyan edilmelidir.",
        ],
      },
    ],
    steps: [
      { title: "Bilgi paylaşımı", text: "Paket ölçüsü, ağırlığı, içeriği ve adresler alınır." },
      { title: "Servis seçimi", text: "Transit süre ve kapsama göre uygun seçenek belirlenir." },
      { title: "Alım & çıkış", text: "Gönderi alınır, etiketlenir ve çıkış operasyonuna girer." },
      { title: "Takip & teslim", text: "Hareketler takip edilir ve teslim sonucu paylaşılır." },
    ],
    faq: [
      { question: "Express kargo ile hangi ülkelere gönderim yapılır?", answer: "Kapsama, seçilen iş ortağına ve gönderi içeriğine göre değişir. Adres ve ürün bilgisiyle ülke/posta kodu uygunluğu kontrol edilir." },
      { question: "Fiyat için hangi bilgiler gerekir?", answer: "Çıkış-varış posta kodu, koli adedi, her kolinin ölçüsü ve ağırlığı, ürün tanımı ve beyan değeri gerekir." },
      { question: "Varış ülkesindeki vergi ve harçlar fiyata dahil mi?", answer: "Varış ülkesindeki vergi ve harçlar teslim şekline göre alıcıya veya göndericiye ait olabilir. Teklif kapsamı rezervasyon öncesi netleştirilir." },
      { question: "Gönderimi nasıl takip ederim?", answer: "Oluşturulan takip numarasıyla taşıma hareketleri takip edilir; REX Lojistik operasyon ekibi gerektiğinde süreç hakkında destek verir." },
    ],
    related: ["hava-kargo", "yurtici-parsiyel-tasimacilik", "uluslararasi-karayolu-tasimaciligi"],
  },
  "depolama": {
    slug: "depolama",
    kind: "service",
    icon: "warehouse",
    eyebrow: "Esnek stok ve dağıtım çözümleri",
    title: "Depolama Hizmetleri",
    lead: "Ürün kabulünden stok takibine, elleçlemeden sevkiyat hazırlığına kadar depolama ihtiyacınızı dağıtım operasyonuyla birlikte planlıyoruz.",
    seoTitle: "Depolama, Stok ve Dağıtım Hizmetleri | REX Lojistik",
    seoDescription: "Kurumsal depolama, stok takibi, ürün kabulü, elleçleme, paketleme ve Türkiye geneli dağıtım çözümleri. REX Lojistik'ten depolama teklifi alın.",
    keywords: ["depolama hizmetleri", "lojistik depo", "stok yönetimi", "elleçleme", "İzmir depolama", "dağıtım hizmetleri"],
    highlights: [
      { title: "Esnek Alan", text: "Dönemsel veya sürekli ihtiyaca göre planlama" },
      { title: "Stok Görünürlüğü", text: "Giriş, çıkış ve sevkiyat hareketlerinin kaydı" },
      { title: "Dağıtıma Bağlı", text: "Depodan Türkiye geneli teslimat organizasyonu" },
    ],
    sections: [
      {
        title: "Depolama yalnızca alan kiralamak değildir",
        paragraphs: [
          "Etkili bir depolama operasyonu; ürün kabulü, sayım, adresleme, uygun istifleme, sipariş hazırlama, paketleme ve sevkiyat adımlarının birlikte yönetilmesini gerektirir. REX Lojistik ihtiyacın kapsamını ürün ve sipariş akışına göre tasarlar.",
          "Dönemsel stok artışları, proje bazlı yükler, bayi dağıtımı ve şehir bazlı ürün konumlandırma gibi senaryolar için esnek modeller değerlendirilebilir.",
        ],
        bullets: ["Mal kabul ve miktar kontrolü", "Palet/koli bazlı stok takibi", "Toplama, paketleme ve etiketleme", "Sevkiyat hazırlığı ve dağıtım bağlantısı"],
      },
      {
        title: "Depo ve taşıma tek operasyonda",
        paragraphs: [
          "Depolama ile dağıtımın ayrı ayrı yönetilmesi bilgi kaybına ve gecikmeye neden olabilir. Depodan çıkan sevkiyatların taşıma sistemine bağlanması, siparişten teslim evrakına kadar daha görünür bir akış oluşturur.",
          "Ürün niteliği, palet ölçüsü, raf veya zemin ihtiyacı, aylık giriş-çıkış hacmi ve katma değerli hizmetler teklifin temelini oluşturur.",
        ],
      },
    ],
    steps: [
      { title: "İhtiyaç analizi", text: "Ürün, stok hacmi, giriş-çıkış ve hizmet kapsamı belirlenir." },
      { title: "Depo planı", text: "Kabul, yerleşim, stok ve sipariş süreçleri tasarlanır." },
      { title: "Operasyon", text: "Ürün hareketleri kayıt altına alınır ve siparişler hazırlanır." },
      { title: "Dağıtım", text: "Hazırlanan gönderiler uygun taşıma modeliyle sevk edilir." },
    ],
    faq: [
      { question: "Kısa süreli depolama hizmeti alınabilir mi?", answer: "Uygunluk ve kapasiteye göre dönemsel veya proje bazlı depolama planlanabilir. Ürün ve süre bilgisi teklif öncesinde değerlendirilir." },
      { question: "Paketleme ve etiketleme yapılabilir mi?", answer: "Operasyon kapsamına göre ürün toplama, koli/palet hazırlama, etiketleme ve sevkiyat öncesi elleçleme hizmetleri planlanabilir." },
      { question: "Depodan Türkiye geneli dağıtım yapılır mı?", answer: "Evet. Depolama operasyonu yurtiçi parsiyel veya komple taşıma planına bağlanarak farklı şehirlere dağıtım organize edilebilir." },
      { question: "Depolama fiyatı nasıl belirlenir?", answer: "Palet veya metrekare ihtiyacı, ürün niteliği, depolama süresi, giriş-çıkış sıklığı, elleçleme ve ek hizmetler fiyatı etkiler." },
    ],
    related: ["yurtici-parsiyel-tasimacilik", "komple-tasimacilik", "express-kargo"],
  },
  "hakkimizda": {
    slug: "hakkimizda",
    kind: "about",
    icon: "building",
    eyebrow: "REX Lojistik'i tanıyın",
    title: "Deneyimi teknolojiyle birleştiren lojistik yaklaşımı",
    lead: "2002'den gelen sektör deneyimi üzerine 2022 yılında kurulan REX Lojistik; taşımacılık, depolama ve dağıtım süreçlerini şeffaf, ölçülebilir ve güvenilir biçimde yönetmek için çalışır.",
    seoTitle: "Hakkımızda | REX Lojistik Taşımacılık",
    seoDescription: "REX Lojistik'in deneyimi, TİO yetki belgesi, İzmir ve Manisa ofisleri, teknoloji destekli taşımacılık ve müşteri odaklı çalışma yaklaşımı.",
    keywords: ["REX Lojistik hakkında", "lojistik firması", "İzmir lojistik", "Manisa lojistik", "TİO yetki belgeli lojistik"],
    highlights: [
      { title: "20+ Yıl Deneyim", text: "2002'den bugüne taşımacılık bilgisi" },
      { title: "TİO Yetki Belgesi", text: "Yetkili taşıma işleri organizatörü" },
      { title: "İzmir & Manisa", text: "İki ofisten Türkiye ve dünya bağlantısı" },
    ],
    sections: [
      {
        title: "REX Lojistik'in hikâyesi",
        paragraphs: [
          "REX Lojistik Taşımacılık Depolama Danışmanlık Limited Şirketi, uzun yıllara dayanan sektör deneyimini kurumsal ve teknoloji destekli bir hizmet modeline dönüştürmek amacıyla 2022 yılında kuruldu.",
          "İzmir merkez ofisi ve Manisa ofisi üzerinden yurtiçi parsiyel, komple, uluslararası karayolu, hava kargo, denizyolu, express kargo ve depolama operasyonları koordine edilir.",
        ],
      },
      {
        title: "Taşımada görünürlük ve sorumluluk",
        paragraphs: [
          "Bir lojistik operasyonunun yalnızca yükü hareket ettirmekten ibaret olmadığına inanıyoruz. Doğru iş kaydı, uygun sürücü ve araç ataması, takip edilebilir durum hareketleri, teslim evrakı ve finansal kapanış aynı sürecin parçalarıdır.",
          "REX Portal ile sevkiyatların operasyon geçmişini, takip numarasını, teslim belgelerini ve yetkili müşteri erişimini tek sistem altında geliştirmeye devam ediyoruz.",
        ],
        bullets: ["Müşteri ihtiyacına göre taşıma modeli", "Operasyon boyunca tek muhatap", "Takip edilebilir sevkiyat kayıtları", "Teslim evrakı ve süreç raporlaması"],
      },
      {
        title: "Değerlerimiz",
        paragraphs: [
          "Güvenilirlik, açık iletişim, mevzuata uyum, doğru kayıt ve sürekli iyileştirme çalışma kültürümüzün temelidir. Her yükün gereksinimini ayrı değerlendirir; uygulanabilir, anlaşılır ve sürdürülebilir çözümler üretmeye odaklanırız.",
        ],
      },
    ],
    faq: [
      { question: "REX Lojistik hangi hizmetleri sunuyor?", answer: "Yurtiçi parsiyel ve komple taşımacılık, uluslararası karayolu, hava kargo, denizyolu, express kargo, depolama, dağıtım ve elleçleme çözümleri sunar." },
      { question: "REX Lojistik'in merkez ofisi nerede?", answer: "Merkez ofisimiz Bayraklı, İzmir'deki Folkart Towers'tadır. Ayrıca Yunusemre, Manisa'da ofisimiz bulunur." },
      { question: "Firma TİO yetki belgesine sahip mi?", answer: "Evet. REX Lojistik, Ulaştırma ve Altyapı Bakanlığı tarafından düzenlenmiş TİO yetki belgesine sahiptir." },
      { question: "Kurumsal müşteriler sevkiyatlarını takip edebilir mi?", answer: "Evet. Yetkilendirilen kurumsal müşteriler müşteri portalından sevkiyatlarını ve ilgili teslim belgelerini görüntüleyebilir." },
    ],
    related: ["yurtici-parsiyel-tasimacilik", "uluslararasi-karayolu-tasimaciligi", "iletisim"],
  },
  "iletisim": {
    slug: "iletisim",
    kind: "contact",
    icon: "contact",
    eyebrow: "Teklif ve operasyon desteği",
    title: "REX Lojistik ile iletişime geçin",
    lead: "Taşıma, depolama veya dağıtım ihtiyacınızı paylaşın; operasyon ekibimiz yükünüze ve teslim hedefinize uygun çözüm için sizinle iletişime geçsin.",
    seoTitle: "İletişim ve Lojistik Teklifi | REX Lojistik",
    seoDescription: "REX Lojistik İzmir ve Manisa ofisleri, telefon ve e-posta bilgileri. Taşımacılık, depolama ve dağıtım için hızlı teklif talebi oluşturun.",
    keywords: ["REX Lojistik iletişim", "lojistik teklifi", "İzmir lojistik firması", "Manisa lojistik firması", "nakliye fiyat teklifi"],
    highlights: [
      { title: "0543 401 07 55", text: "Teklif ve operasyon iletişim hattı" },
      { title: "info@rexlojistik.com", text: "Kurumsal e-posta adresi" },
      { title: "İzmir & Manisa", text: "Merkez ve bölge ofislerimiz" },
    ],
    sections: [
      {
        title: "Merkez Ofis — İzmir",
        paragraphs: [
          "Folkart Towers A Kule No:47/B, Kat:26 Daire:2601, Adalet Mahallesi Manas Bulvarı, Bayraklı 35630 İzmir.",
          "Telefon: +90 (232) 229 00 14 · Mobil: +90 (543) 401 07 55",
        ],
      },
      {
        title: "Manisa Ofis",
        paragraphs: [
          "Rainbow Life AVM, Muradiye Mahallesi Manolya Sokak No:228/1, A Blok No:28, Yunusemre 45140 Manisa.",
          "Telefon: +90 (236) 230 00 13 · Mobil: +90 (543) 401 07 55",
        ],
      },
      {
        title: "Teklif için gerekli bilgiler",
        paragraphs: [
          "Hızlı ve doğru bir teklif için çıkış ve varış adresi, yükleme tarihi, ürün tanımı, koli/palet adedi, ölçüler, toplam ağırlık ve özel teslimat beklentilerini paylaşabilirsiniz.",
        ],
        bullets: ["Çıkış ve teslim adresleri", "Yükün ölçüsü, ağırlığı ve ambalajı", "Hazır olma ve hedef teslim tarihi", "Özel araç, elleçleme veya belge gereksinimi"],
      },
    ],
    faq: [
      { question: "Nasıl fiyat teklifi alabilirim?", answer: "Sayfadaki teklif formunu doldurabilir, 0543 401 07 55 numarasını arayabilir veya info@rexlojistik.com adresine yük bilgilerinizi gönderebilirsiniz." },
      { question: "Teklif ne kadar sürede hazırlanır?", answer: "Süre taşıma türüne ve ihtiyaç duyulan hat/araç araştırmasına göre değişir. Eksiksiz yük bilgisi paylaşılması teklif sürecini hızlandırır." },
      { question: "Mevcut sevkiyatım için kiminle görüşmeliyim?", answer: "Takip numaranızla 0543 401 07 55 numaralı operasyon hattımızdan veya kurumsal müşteri portalından destek alabilirsiniz." },
      { question: "Ofisleri ziyaret edebilir miyim?", answer: "Evet. Operasyon yoğunluğu nedeniyle ziyaret öncesinde telefonla randevu oluşturmanızı öneririz." },
    ],
    related: ["hakkimizda", "yurtici-parsiyel-tasimacilik", "komple-tasimacilik"],
  },
};

export const marketingPageList = Object.values(marketingPages);
