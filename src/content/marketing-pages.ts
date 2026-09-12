export type MarketingIcon = "truck" | "route" | "globe" | "plane" | "ship" | "zap" | "warehouse" | "building" | "contact";

export type MarketingContextualLink = {
  anchor: string;
  href: string;
};

export type MarketingPageData = {
  slug: string;
  kind: "service" | "guide" | "about" | "contact";
  icon: MarketingIcon;
  eyebrow: string;
  title: string;
  lead: string;
  seoTitle: string;
  seoDescription: string;
  keywords: string[];
  highlights: Array<{ title: string; text: string }>;
  sections: Array<{
    title: string;
    paragraphs: string[];
    bullets?: string[];
    cta?: { label: string; href: string };
  }>;
  steps?: Array<{ title: string; text: string }>;
  faq: Array<{ question: string; answer: string }>;
  related: string[];
  contextualLinks?: MarketingContextualLink[];
  heroPrimaryCtaLabel?: string;
  heroWhatsAppLabel?: string;
  breadcrumbParent?: { name: string; href: string };
  finalCta?: {
    title: string;
    text: string;
    primaryLabel: string;
    whatsappLabel: string;
  };
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
          "İzmir ve Manisa ofislerimizden koordine edilen operasyonlarla Türkiye genelindeki çıkış ve varış noktaları için tek muhatap üzerinden ilerleyebilirsiniz. Depolama bağlantısı veya uluslararası karayolu taşımacılığı devamı bulunan yükler de aynı operasyon görünürlüğü içinde planlanabilir.",
        ],
      },
      {
        title: "İzmir ve Manisa çıkışlı parsiyel planlama",
        paragraphs: [
          "İzmir parsiyel taşımacılık ihtiyaçlarında 1 paletten başlayan yükler için adres bazlı alım ve Türkiye geneline teslimat planı oluşturulabilir.",
          "Manisa parsiyel taşımacılık ihtiyaçlarında ise üretim ve ticaret bölgelerinden çıkacak paletli yükler, varış adresi ve yük özellikleri birlikte değerlendirilerek organize edilir.",
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
    related: ["gumruk-antrepo-yurtici-transfer", "hafta-sonu-acil-nakliye", "komple-tasimacilik", "depolama"],
    contextualLinks: [
      { anchor: "komple araç", href: "/komple-tasimacilik" },
      { anchor: "Depolama bağlantısı", href: "/depolama" },
      { anchor: "uluslararası karayolu taşımacılığı", href: "/uluslararasi-karayolu-tasimaciligi" },
      { anchor: "İzmir parsiyel taşımacılık", href: "/izmir-parsiyel-tasimacilik" },
      { anchor: "Manisa parsiyel taşımacılık", href: "/manisa-parsiyel-tasimacilik" },
    ],
  },
  "gumruk-antrepo-yurtici-transfer": {
    slug: "gumruk-antrepo-yurtici-transfer",
    kind: "service",
    icon: "warehouse",
    eyebrow: "İhracat ve ithalatta çift yönlü yurtiçi bağlantı",
    title: "Liman, Antrepo ve İhracat Depolarına Çift Yönlü Transfer",
    lead: "İzmir ve Manisa başta olmak üzere Ankara ve Türkiye’nin diğer illerinden İstanbul’daki ihracat depolarına, konsolidasyon merkezlerine, liman ve antrepolara yük taşıyor; ithalatta ise aynı ağı liman veya antrepodan nihai adrese ters yönde işletiyoruz.",
    seoTitle: "İhracat Deposuna ve Antrepodan Çift Yönlü Nakliye | REX",
    seoDescription: "İzmir, Manisa, Ankara ve Türkiye genelinden İstanbul ihracat depoları, liman ve antrepolara taşıma; antrepodan Türkiye geneline ithalat yükü transferi.",
    keywords: ["İstanbul ihracat deposuna nakliye", "İzmir ihracat deposu nakliye", "Manisa İstanbul ihracat yükü", "Ankara ihracat deposuna taşıma", "antrepoya yük teslimi", "antrepodan yük alma", "gümrükten yük alma nakliye", "Ambarlı limanı nakliye", "Çatalca antrepo nakliye", "Muratbey gümrük nakliye", "Erenköy gümrük nakliye", "Türkiye İstanbul ihracat yükü transferi"],
    highlights: [
      { title: "İhracat Deposuna Besleme", text: "İzmir, Manisa ve Ankara’dan İstanbul’daki depo, liman ve antrepolara zamanında teslim" },
      { title: "İthalat Yükünü Sahadan Alım", text: "Serbest kalan yükün liman veya antrepodan Türkiye genelindeki adrese transferi" },
      { title: "Çift Yönlü Tek Operasyon", text: "Doğru saha, referans ve son kabul saatine göre izlenebilir sevkiyat akışı" },
    ],
    sections: [
      {
        title: "İzmir, Manisa ve Ankara’dan İstanbul ihracat depolarına",
        paragraphs: [
          "İhracat yükünüzün yolculuğu İstanbul’da değil, üretim veya yükleme adresinde başlar. İzmir ve Manisa’daki fabrika, organize sanayi bölgesi ve depolardan; Ankara ve Türkiye’nin diğer illerindeki çıkış noktalarından alınan paletli ya da kolili yükleri İstanbul Avrupa yakasındaki uluslararası nakliye depolarına, konsolidasyon merkezlerine, limanlara ve bildirilen antrepolara planlı şekilde ulaştırıyoruz.",
          "Parsiyel ihracat beslemesinde amaç yalnızca İstanbul’a varmak değildir. Yükün doğru firma deposuna, doğru rezervasyon veya dosya numarasıyla ve ana hat aracının son kabul saatinden önce teslim edilmesi gerekir. REX; çıkış adresi, yük hazır olma zamanı, depo kabul penceresi ve araç kapasitesini aynı planda buluşturur.",
        ],
        bullets: ["İzmir ve Manisa’dan İstanbul Avrupa yakası ihracat depolarına", "Ankara ve diğer illerden liman, antrepo ve konsolidasyon merkezlerine", "Paletli ve kolili parsiyel ihracat yükü beslemesi", "Depo referansı ve son kabul saatine göre teslim"],
      },
      {
        title: "İhracat yükünde doğru depo ve son kabul saati",
        paragraphs: [
          "İstanbul–Avrupa yönünde çalışan uluslararası nakliye firmalarının depoları farklı bölgelerde ve farklı kabul kurallarıyla çalışabilir. Bu nedenle depo unvanı, açık adres, yük referansı, rezervasyon veya dosya numarası, etiket bilgisi, yetkili kişi ve son kabul saati araç çıkmadan önce teyit edilir.",
          "Yükün hafta içi standart hatta mı, doğrudan araçla mı yoksa zaman kritik hızlı transferle mi taşınacağı; hacim, kilogram, hazır olma saati ve bağlantı aracının kapanışına göre belirlenir. Böylece ihracat yükü şehirlerarası transferde görünmez bir bekleme noktasına takılmaz.",
        ],
      },
      {
        title: "İstanbul’da hangi gümrük ve antrepo bölgelerinden yük alınır?",
        paragraphs: [
          "İstanbul’daki ithalat yükleri taşıma türüne ve bağlı bulunduğu idareye göre farklı sahalara iner. Deniz yolu yüklerinde Ambarlı Limanı ve çevresindeki Beylikdüzü–Esenyurt–Büyükçekmece antrepo hattı; karayolu yüklerinde Muratbey Gümrük Müdürlüğü ile Çatalca–Hadımköy çevresindeki antrepolar; Anadolu yakasında ise Erenköy Gümrük Müdürlüğüne bağlı sahalar öne çıkar.",
          "Büyükçekmece ve Çatalca ifadeleri çoğu zaman sahayı tarif eden coğrafi adlardır. Doğru araç gönderimi için yalnızca bölge adı değil; antrepo unvanı, açık adres, yük referansı, teslim emri durumu ve araç kabul saati birlikte teyit edilmelidir. Hava, posta veya farklı liman hareketlerinde İstanbul Havalimanı, AHL Kargo, Haydarpaşa ya da Pendik bağlantısı ayrıca değerlendirilir.",
        ],
        bullets: ["Ambarlı Limanı ve Ambarlı bağlantılı antrepolar", "Muratbey–Çatalca ve Hadımköy depo hattı", "Erenköy bağlantılı Anadolu yakası antrepoları", "Beylikdüzü, Esenyurt ve Büyükçekmece depo koridoru"],
      },
      {
        title: "Gümrük işlemi değil, serbest kalan yükün profesyonel transferi",
        paragraphs: [
          "REX Lojistik’in bu hizmetteki görevi gümrük müşavirliği veya ithalat işlemi yürütmek değildir. Eşyanın yetkili müşaviriniz ve ilgili işletme tarafından teslim edilebilir duruma getirilmesinden sonra; araç girişini, yük alımını, yurtiçi rotayı ve son teslimatı koordine ederiz.",
          "Araç sahaya gelmeden önce teslim emri, ordino veya işletmenin talep ettiği belge setinin hazır olması; gümrük ve antrepo mesaisinin, randevunun, yükleme ekipmanının ve varsa araç/sürücü bildirimlerinin yetkili taraflarca tamamlanması gerekir. Bu ön kontrol, boş beklemeyi ve ikinci araç hareketi riskini azaltır.",
        ],
      },
      {
        title: "İstanbul’dan İzmir, Manisa, Ankara ve Türkiye geneline",
        paragraphs: [
          "İthalat yükünün limandan veya antrepodan çıkması işin sonu değil, yurtiçi tedarik zincirinin başlangıcıdır. Paletli ürün, makine parçası, üretim girdisi veya kolili ticari yük; varış adresinin kabul saatine ve teslim önceliğine göre parsiyel, komple araç ya da zaman kritik doğrudan transfer modeliyle eşleştirilir.",
          "İzmir ve Manisa’daki operasyon varlığımız, İstanbul–Ege hattındaki depo, fabrika ve müşteri teslimatlarını yakından yönetmemizi sağlar. Ankara ve diğer iller için de yükün hacmi, ağırlığı, hazır olma saati ve teslim penceresi üzerinden uygulanabilir plan kurulur.",
        ],
        bullets: ["Antrepodan fabrikaya doğrudan sevk", "Liman çıkışlı palet ve kolili ticari yük", "Parsiyel, komple veya acil araç karşılaştırması", "Teslim alan ve teslim evrakı kaydı"],
      },
    ],
    steps: [
      { title: "Yönü ve sahayı doğrulama", text: "İhracat veya ithalat yönü; depo, antrepo ya da liman adresi ve referansı alınır." },
      { title: "Zaman penceresi", text: "Yükün hazır olma zamanı ile sahanın araç kabul veya son teslim saati teyit edilir." },
      { title: "Araç ve rota", text: "Hacim, ağırlık ve teslim önceliğine göre uygun taşıma modeli planlanır." },
      { title: "Teslim kaydı", text: "Yük varış adresine ulaştırılır, teslim bilgisi ve evrakı kayda alınır." },
    ],
    faq: [
      { question: "Antrepodan yük alabilmek için hangi bilgiler gerekir?", answer: "Antrepo veya saha unvanı, açık adres, yük/konşimento referansı, yetkili kişi, yükün teslim edilebilirlik teyidi, araç kabul saati, palet-koli adedi, ölçü, brüt ağırlık ve varış adresi gerekir." },
      { question: "REX Lojistik gümrükleme işlemi yapıyor mu?", answer: "Hayır. Gümrükleme ve resmî ithalat/ihracat işlemleri müşterinin yetkili gümrük müşaviri ve ilgili taraflarca yürütülür. REX, eşya teslim alınabilir hâle geldikten sonraki araç, alım, yurtiçi taşıma ve teslim koordinasyonunu sağlar." },
      { question: "Ambarlı veya Çatalca’dan aynı gün yük alınabilir mi?", answer: "Yükün serbest ve teslim edilebilir durumda olması, saha randevusu, araç kabul saati ve uygun araç bulunması hâlinde aynı gün alım değerlendirilebilir. Kesin plan saha ve operasyon teyidinden sonra verilir." },
      { question: "Büyükçekmece Gümrüğü ayrı bir gümrük müdürlüğü mü?", answer: "İstanbul Bölge Müdürlüğünün güncel bağlantı idareleri listesinde Büyükçekmece adıyla ayrı bir gümrük müdürlüğü yer almıyor. Sektörde bu ifade çoğunlukla Ambarlı, Beylikdüzü, Esenyurt ve Büyükçekmece çevresindeki liman/antrepo koridorunu tarif etmek için kullanılıyor." },
      { question: "İhracat yükünü İstanbul’daki nakliye deposuna teslim eder misiniz?", answer: "Evet. Açık depo adresi, yük referansı, son kabul saati ve teslim şartları verildiğinde Türkiye’nin uygun çıkış noktalarından İstanbul’daki ihracat/konsolidasyon deposuna taşıma planlanabilir." },
      { question: "İzmir veya Manisa’dan İstanbul’daki ihracat deposuna parsiyel yük taşınır mı?", answer: "Evet. Yükün ölçüsü, ağırlığı, hazır olma zamanı ve İstanbul’daki deponun son kabul saati birlikte değerlendirilerek parsiyel, doğrudan veya hızlı transfer seçeneklerinden uygun olanı planlanır." },
    ],
    related: ["hafta-sonu-acil-nakliye", "yurtici-parsiyel-tasimacilik", "uluslararasi-karayolu-parsiyel-tasimacilik", "komple-tasimacilik"],
  },
  "hafta-sonu-acil-nakliye": {
    slug: "hafta-sonu-acil-nakliye",
    kind: "service",
    icon: "zap",
    eyebrow: "İzmir ve Manisa çıkışlı Türkiye geneli acil taşıma",
    title: "İzmir ve Manisa Çıkışlı Ertesi Gün Acil Nakliye",
    lead: "REX’in İzmir ve Manisa operasyon gücüyle zaman kritik ticari yükleri Türkiye genelindeki teslim noktalarına planlıyoruz. Özellikle cuma günü hazır olan gönderilerde ertesi gün teslim hedefini; uygun araç, teyitli adres ve gerçek zaman penceresiyle önceliklendiriyoruz.",
    seoTitle: "İzmir ve Manisa Ertesi Gün Acil Nakliye | REX",
    seoDescription: "İzmir ve Manisa’dan Türkiye geneline ertesi gün teslim hedefli acil nakliye. Cuma alım, cumartesi teslim ve zaman kritik ticari yük çözümleri.",
    keywords: ["İzmir acil nakliye", "Manisa acil nakliye", "İzmir ertesi gün teslimat", "Manisa ertesi gün nakliye", "İzmir İstanbul acil nakliye", "Manisa İstanbul acil nakliye", "Türkiye geneli acil nakliye", "cuma alım cumartesi teslim", "cumartesi yük teslimatı", "acil parsiyel yük", "ekspres yurtiçi nakliye"],
    highlights: [
      { title: "İzmir ve Manisa Önceliği", text: "Ege’deki çıkış noktalarından hızlı araç ve rota organizasyonu" },
      { title: "Ertesi Gün Teslim Hedefi", text: "Hazır yük ve açık alıcı teyidiyle bir sonraki gün teslimat planı" },
      { title: "Türkiye Geneli Erişim", text: "İstanbul ve Ankara başta olmak üzere uygun rotalarda şehirler arası acil transfer" },
    ],
    sections: [
      {
        title: "İzmir ve Manisa’dan ertesi gün Türkiye geneli teslimat",
        paragraphs: [
          "İzmir ve Manisa’daki üretim tesisleri, organize sanayi bölgeleri, depolar ve tedarikçiler için acil taşıma yalnızca bir araç bulma işi değildir. Yükün hazır olma saati, şehirler arası mesafe, uygun araç kapasitesi ve alıcının kabul penceresi birlikte planlandığında zaman kritik gönderi ertesi gün teslim hedefine göre yola çıkarılabilir.",
          "Özellikle İzmir ve Manisa’dan İstanbul, Ankara, Bursa, Kocaeli, Eskişehir ve diğer uygun varış noktalarına cuma alım–cumartesi teslim seçeneğini operasyon uygunluğuna göre değerlendiriyoruz. Aynı yaklaşım haftanın diğer günlerinde de üretimi, montajı, müşteri teslimini veya ihracat bağlantısını bekleten yükler için uygulanır.",
        ],
        bullets: ["İzmir ve Manisa’dan İstanbul’a acil yük", "Ege’den Ankara ve İç Anadolu’ya hızlı transfer", "Üretim, bakım ve montajı bekleyen kritik parça", "İhracat deposu veya ana hat çıkışına yetişecek yük"],
      },
      {
        title: "Hafta içi maliyet, hafta sonu fayda odaklı karar",
        paragraphs: [
          "Planlı ve teslim tarihi esnek yüklerde standart ambar veya parsiyel çıkış çoğu zaman maliyet avantajı sağlar. Ancak üretim parçası, müşteri taahhüdü, montaj programı ya da ihracat deposu kapanışı bekleyemiyorsa karar yalnızca kilometre fiyatına göre verilemez; gecikmenin işletmeye maliyeti de hesaba katılır.",
          "REX, acil talebi otomatik olarak en büyük araca yönlendirmez. Yükün hacmini, ağırlığını, hazır olma saatini, teslim adresinin cumartesi kabul durumunu ve alternatif çıkışları karşılaştırır. Amaç, gereken hızı gereksiz kapasite maliyeti oluşturmadan sağlamaktır.",
        ],
        bullets: ["Üretimi bekleten yedek parça ve sarf malzemesi", "Ambar çıkışına yetişmeyen paletli ticari yük", "Cumartesi açık fabrika, depo ve şube teslimatı", "İhracat deposunun son kabulüne yetişecek besleme"],
      },
      {
        title: "İstanbul ve Türkiye’nin diğer illerinden acil taşıma",
        paragraphs: [
          "İzmir ve Manisa önceliğimizin yanında İstanbul, Ankara ve Türkiye’nin diğer illerindeki çıkış noktalarından da acil taşıma planlıyoruz. İstanbul’dan İzmir veya Manisa’ya, Ankara’dan Ege’ye ya da şehirler arasında farklı yönlerde doğrudan ve kontrollü hızlı transfer seçenekleri değerlendirilebilir.",
          "Bu hizmet sabit ve koşulsuz bir teslim garantisi değildir. Yükün zamanında hazır olmaması, resmî veya özel saha çıkışının gecikmesi, yol-hava koşulları ya da alıcının kapalı olması planı etkileyebilir. Operasyon teyidi verildiğinde paylaşacağımız süre, gerçek adres ve zaman penceresine dayanır.",
        ],
      },
      {
        title: "Hafta sonu acil taşımanın kontrol listesi",
        paragraphs: [
          "Hızlı taşımanın kalitesi, aracın hızlı hareket etmesinden önce doğru bilginin hızlı toplanmasına bağlıdır. Açık alım ve teslim adresi, saha yetkilisi, telefon, yükün ambalajı, adet ve ölçüler, toplam brüt ağırlık, yükleme ekipmanı ve en geç teslim zamanı tek mesajda paylaşılmalıdır.",
          "Antrepo, liman veya ihracat deposu bağlantısı varsa mesai, randevu ve belge durumu ayrıca teyit edilir. REX bu alanlardaki resmî işlemleri yürütmez; hazır ve teslim edilebilir yükün taşıma organizasyonunu yönetir.",
        ],
        bullets: ["Yük hazır olma saati", "Alım ve teslim yetkilisinin telefonu", "Ölçü, adet, kilogram ve istif bilgisi", "Cumartesi kabul teyidi ve son teslim saati"],
      },
      {
        title: "Tek seferlik acilden düzenli hızlı hatta",
        paragraphs: [
          "Aynı depolar, tedarikçiler veya şehirler arasında tekrar eden acil talepler; adres, irtibat ve kabul saatleri kaydedilerek daha hızlı planlanabilir. Böylece her cuma aynı operasyon yeniden tarif edilmez, yalnızca o haftanın yük ve zaman bilgisi güncellenir.",
          "İzmir ve Manisa merkezli operasyonun yanında İstanbul, Ankara ve Türkiye’nin diğer illeri için de çift yönlü hızlı transfer değerlendirilir. Uygun çözüm; mesafe, hazır olma saati, yük hacmi, hafta sonu kabulü ve mevcut araç kapasitesine göre belirlenir.",
        ],
      },
    ],
    steps: [
      { title: "Acil ihtiyacı tanımlama", text: "Hazır olma ve en geç teslim zamanı, adres ve yük bilgisi alınır." },
      { title: "Açık kapı teyidi", text: "Alım ve teslim noktalarının cuma/cumartesi çalışma ve kabul durumu doğrulanır." },
      { title: "Hız–maliyet seçimi", text: "Uygun parsiyel bağlantı, doğrudan araç veya ekspres çözüm karşılaştırılır." },
      { title: "Canlı operasyon", text: "Araç hareketi izlenir; teslim alan bilgisi ve evrakı kayda alınır." },
    ],
    faq: [
      { question: "İzmir veya Manisa’dan alınan yük ertesi gün teslim edilir mi?", answer: "Yükün hazır olma saati, çıkış ve varış adresleri, araç uygunluğu, yol koşulları ve alıcının kabul penceresi uygunsa ertesi gün teslim hedefiyle planlanabilir. Kesin süre ve operasyon taahhüdü yük bilgileri doğrulandıktan sonra paylaşılır." },
      { question: "Cuma alınan yük cumartesi teslim edilir mi?", answer: "İzmir ve Manisa çıkışları öncelikli olmak üzere; yükün cuma günü zamanında hazır olması, uygun araç bulunması ve alıcının cumartesi kabulü teyit edilirse planlanabilir. Kesin taahhüt operasyon onayından sonra paylaşılır." },
      { question: "Hafta sonu parsiyel taşıma yapılır mı?", answer: "Standart parsiyel/ambar çıkışları hafta sonu sınırlı olabilir. Yük ve rota uygunsa mevcut hızlı hat, ekspres araç veya doğrudan taşıma seçenekleri karşılaştırılır." },
      { question: "Cumartesi teslimat için alıcının açık olması gerekir mi?", answer: "Evet. Teslim adresi, yetkili kişi, telefon ve kabul saatinin önceden teyit edilmesi gerekir. Teyitsiz adrese hafta sonu araç yönlendirilmesi bekleme ve ikinci teslimat maliyeti doğurabilir." },
      { question: "Hafta sonu acil nakliye fiyatı nasıl belirlenir?", answer: "Rota, yük ölçüsü ve ağırlığı, araç türü, alım saati, teslim penceresi, saha bekleme riski ve dönüş kapasitesine göre belirlenir. Yalnızca kilometre değil, tüm operasyon koşulları değerlendirilir." },
      { question: "İstanbul çıkışlı acil yük de taşıyor musunuz?", answer: "Evet. İzmir ve Manisa operasyon odağımızın yanında İstanbul, Ankara ve Türkiye’nin diğer illerinden uygun varış noktalarına acil taşıma planlanabilir." },
    ],
    related: ["gumruk-antrepo-yurtici-transfer", "yurtici-parsiyel-tasimacilik", "komple-tasimacilik", "minivan-express-tasimacilik"],
  },
  "komple-tasimacilik": {
    slug: "komple-tasimacilik",
    kind: "service",
    icon: "truck",
    eyebrow: "Türkiye genelinde araca özel taşıma",
    title: "Yurtiçi Komple Taşımacılık",
    lead: "Tam kamyon ve tam tır yüklerinizi, yalnızca sevkiyatınıza ayrılan uygun araçla Türkiye genelinde doğrudan ve planlı olarak taşıyoruz.",
    seoTitle: "Yurtiçi Komple Taşımacılık | Tam Kamyon ve Tır Yükü",
    seoDescription: "Tam kamyon yükü, tam tır yükü ve FTL nakliye için araca özel planlama, doğrudan rota ve Türkiye geneli teslimat. REX Lojistik'ten teklif alın.",
    keywords: ["yurtiçi komple taşımacılık", "tam kamyon yükü", "tam tır yükü", "FTL nakliye", "komple araç taşımacılığı", "şehirlerarası nakliye", "kurumsal yük taşımacılığı"],
    highlights: [
      { title: "Yüke Özel Araç", text: "Araç kapasitesi yalnızca sizin sevkiyatınıza ayrılır" },
      { title: "Doğrudan Rota", text: "Planlı çıkış ve teslimat noktasına odaklı operasyon" },
      { title: "Kamyon ve Tır Seçimi", text: "Yükün ağırlığı, hacmi ve saha koşullarına göre araç eşleştirmesi" },
    ],
    sections: [
      {
        title: "Yurtiçi komple yük taşımacılığında operasyon kontrolü",
        paragraphs: [
          "Yurtiçi komple taşımacılıkta araç kapasitesi tek bir müşterinin yüküne ayrılır. Tam kamyon yükü veya tam tır yükü olarak planlanan sevkiyat; başka müşterilerin yükleriyle birleştirilmeden, yükleme programına ve teslimat penceresine göre doğrudan hareket eder.",
          "REX Lojistik, yükün toplam ağırlığını, hacmini, palet yerleşimini ve istif durumunu araç kapasitesiyle karşılaştırır. Kamyon, kırkayak, tenteli tır, kapalı kasa veya uygun diğer araç seçenekleri arasından operasyon koşullarını karşılayan araç planlanır.",
        ],
        bullets: ["Tam kamyon yükü ve tam tır yükü sevkiyatları", "Fabrika, depo ve şube arası taşımalar", "Tek noktadan tek veya çoklu teslimat", "Planlı ve tekrarlayan FTL sevkiyat programları"],
      },
      {
        title: "Hangi araç ve rota seçilir?",
        paragraphs: [
          "Araç seçimi yalnızca palet adedine göre yapılmaz. Tam kamyon veya tır ihtiyacı belirlenirken yükün toplam kilogramı, hacmi, istiflenebilirliği, yükleme ekipmanı, rampa yapısı ve adres erişim koşulları birlikte değerlendirilir.",
          "Güzergâh ve teslimat saatleri kesinleştirildikten sonra sevkiyat sisteme alınır. Taşıma başlangıcı, operasyon hareketleri ve teslim evrakı aynı kayıt üzerinden takip edilir. Yük hacmi tam aracı gerektirmiyorsa yurtiçi parsiyel taşımacılık, Türkiye dışına devam eden rotalarda uluslararası karayolu taşımacılığı ayrıca değerlendirilir. Depolama ihtiyacı bulunan operasyonlar da taşıma planına bağlanabilir.",
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
      { question: "Yurtiçi komple taşımacılık ile parsiyel taşıma arasındaki fark nedir?", answer: "Komple taşımada kamyon veya tır kapasitesi tek müşterinin sevkiyatına ayrılır. Parsiyel taşımada ise aynı güzergâhtaki farklı müşterilerin yükleri araç kapasitesini paylaşır." },
      { question: "Tam kamyon ve tam tır yükü için hangi araçlar kullanılabilir?", answer: "Araç tipi yükün hacmi, ağırlığı, palet yerleşimi, yükleme şekli ve adres koşullarına göre belirlenir. Kamyon, kırkayak, tenteli tır, kapalı kasa ve uygun diğer araç seçenekleri teklif öncesinde operasyon ekibi tarafından değerlendirilir." },
      { question: "Düzenli komple araç planlaması yapılabilir mi?", answer: "Evet. Belirli gün ve güzergâhlarda tekrarlayan fabrika, depo, şube veya müşteri teslimatları için düzenli operasyon planı oluşturulabilir." },
      { question: "Teslim evrakına nasıl ulaşılır?", answer: "Teslim tamamlandıktan sonra yüklenen teslim belgesi yetkili müşteri portalı ve ilgili takip ekranı üzerinden görüntülenebilir." },
    ],
    related: ["yurtici-parsiyel-tasimacilik", "depolama", "uluslararasi-karayolu-tasimaciligi"],
    contextualLinks: [
      { anchor: "yurtiçi parsiyel taşımacılık", href: "/yurtici-parsiyel-tasimacilik" },
      { anchor: "uluslararası karayolu taşımacılığı", href: "/uluslararasi-karayolu-tasimaciligi" },
      { anchor: "Depolama ihtiyacı", href: "/depolama" },
    ],
  },
  "uluslararasi-karayolu-tasimaciligi": {
    slug: "uluslararasi-karayolu-tasimaciligi",
    kind: "service",
    icon: "globe",
    eyebrow: "Türkiye–Avrupa karayolu ağı",
    title: "Uluslararası Karayolu Taşımacılığı",
    lead: "Türkiye ile Avrupa arasındaki ticari yüklerinizi; parsiyel, komple araç ve zaman kritik minivan express seçeneklerini aynı plan içinde karşılaştırarak yönetiyoruz. Doğru kapasiteyi seçer, gereksiz bekleme ve araç maliyetini daha teklif aşamasında ayıklarız.",
    seoTitle: "Uluslararası Karayolu Taşımacılığı | REX Lojistik",
    seoDescription: "Türkiye Avrupa uluslararası karayolu taşımacılığı; parsiyel LTL, komple FTL ve kapıdan kapıya operasyon seçenekleri. REX Lojistik'ten karşılaştırmalı teklif alın.",
    keywords: ["uluslararası karayolu taşımacılığı", "Türkiye Avrupa nakliye", "Avrupa karayolu taşımacılığı", "ihracat taşımacılığı", "ithalat taşımacılığı", "uluslararası parsiyel", "LTL FTL taşımacılık"],
    highlights: [
      { title: "Tek Planda 3 Model", text: "Parsiyel, LTL ve komple araç seçeneklerinin birlikte değerlendirilmesi" },
      { title: "Çift Yönlü Operasyon", text: "Türkiye çıkışlı ve Avrupa çıkışlı taşıma organizasyonu" },
      { title: "Uçtan Uca Görünürlük", text: "Yük bilgisinden teslim evrakına kadar tek operasyon kaydı" },
    ],
    sections: [
      {
        title: "Yükünüz hangi karayolu modeline gerçekten ihtiyaç duyuyor?",
        paragraphs: [
          "Uluslararası karayolunda iyi planlama, doğrudan araç istemekle değil yükün kapladığı alanı ve teslim hedefini doğru okumakla başlar. Birkaç palet için uluslararası parsiyel taşımacılık, daha yüksek hacimler için LTL, araca özel program gerektiğinde ise komple taşımacılık seçenekleri karşılaştırılır.",
          "REX Lojistik; çıkış ve teslim adresini, palet ölçülerini, brüt ağırlığı, istiflenebilirliği ve hazır olma tarihini aynı tabloda değerlendirir. Böylece yalnızca hızlı görünen değil, kapıdan kapıya toplam süresi ve toplam maliyeti işinize uyan model belirlenir. Zaman kritik Avrupa yüklerinde minivan express, uçuş bağlantısının belirleyici olduğu gönderilerde hava kargo alternatif taşıma modeli olarak değerlendirilir.",
        ],
        bullets: ["Az hacimli yüklerde parsiyel ve grupaj planı", "Orta hacimde LTL kapasite karşılaştırması", "Yüksek hacim ve özel programda komple araç", "Türkiye–Avrupa çift yönlü kapı bağlantısı"],
      },
      {
        title: "Türkiye’den Avrupa’ya, Avrupa’dan Türkiye’ye tek operasyon masası",
        paragraphs: [
          "Almanya, Benelüks, Fransa, İtalya, Orta Avrupa ve Balkan hatları başta olmak üzere rota, yükün gerçek adreslerine göre kurulur. Türkiye içindeki ön taşıma, ana karayolu hareketi ve Avrupa’daki son teslim bağlantısı birbirinden kopuk işler olarak değil, tek teslim hedefinin parçaları olarak planlanır.",
          "Düzenli sevkiyatlarda yük sıklığı ve hazır olma günleri kaydedilerek tekrarlanabilir plan oluşturulabilir. Tek seferlik yüklerde ise en yakın uygun çıkış ile teslim beklentisi birlikte değerlendirilir; tahmini süre rota teyidinden sonra paylaşılır.",
        ],
      },
      {
        title: "Teklifte sürprizi azaltan bilgi seti",
        paragraphs: [
          "Net bir uluslararası taşıma teklifi için yalnızca şehir isimleri yeterli değildir. Açık yükleme ve teslim adresi, ürün tanımı, paketleme biçimi, palet veya koli adedi, her bir birimin ölçüsü, toplam brüt ağırlık, hazır olma tarihi ve teslim şekli birlikte paylaşılmalıdır.",
          "Tehlikeli madde, ısı kontrollü ürün, gabari dışı ölçü, üstüne yük konamayan palet veya özel elleçleme gereksinimi varsa en başta belirtilir. Resmî çıkış ve varış işlemleri müşteri ile müşterinin yetkili danışmanları tarafından yürütülür; REX taşıma ve teslim koordinasyonuna odaklanır.",
        ],
      },
    ],
    steps: [
      { title: "Yükü tanıma", text: "Adres, ölçü, ağırlık, ürün ve hazır olma tarihi alınır." },
      { title: "Model karşılaştırma", text: "Parsiyel, LTL ve FTL seçenekleri zaman–maliyet dengesiyle incelenir." },
      { title: "Rota teyidi", text: "Uygun çıkış, ana hat ve son teslim bağlantısı kesinleştirilir." },
      { title: "Teslim & kayıt", text: "Operasyon hareketleri ve teslim evrakı aynı kayıt üzerinden izlenir." },
    ],
    faq: [
      { question: "Uluslararası parsiyel, LTL ve FTL arasındaki fark nedir?", answer: "Parsiyel ve LTL modellerinde araç kapasitesi aynı yöndeki yüklerle paylaşılır; FTL’de araç kapasitesi tek sevkiyata ayrılır. Doğru model palet alanı, ağırlık, teslim hedefi ve yükleme koşullarına göre belirlenir." },
      { question: "Avrupa’dan Türkiye’ye yük alımı yapılabilir mi?", answer: "Uygun ülke, adres, ürün ve kapasite koşullarında Avrupa çıkışlı Türkiye varışlı taşıma organize edilebilir. Kesin kapsam rota ve yük bilgileri incelendikten sonra teyit edilir." },
      { question: "Transit süre nasıl belirlenir?", answer: "Tahmini süre; gerçek yükleme ve teslim adresleri, çıkış planı, sınır geçişleri, resmî işlemler ve son teslim koşullarına göre hesaplanır. Kesin olmayan genel süre vaadi yerine rota teyidinden sonra gerçekçi bir tahmin paylaşılır." },
      { question: "Uluslararası karayolu fiyatı nasıl hesaplanır?", answer: "Fiyat; rota, kullanılan araç alanı, toplam ağırlık, yükleme ve teslim kapsamı, ürün niteliği, hazır olma tarihi ve özel gereksinimlere göre hesaplanır." },
      { question: "REX Lojistik hangi kapsamı yönetir?", answer: "REX; uygun taşıma modelinin seçimini, araç ve rota planını, taşıma evrakı koordinasyonunu ve teslim takibini yönetir. İthalat ve ihracata ilişkin resmî işlemler müşterinin kendi yetkili danışmanları tarafından yürütülür." },
    ],
    related: ["minivan-express-tasimacilik", "uluslararasi-karayolu-parsiyel-tasimacilik", "komple-tasimacilik", "hava-kargo"],
    contextualLinks: [
      { anchor: "uluslararası parsiyel taşımacılık", href: "/uluslararasi-karayolu-parsiyel-tasimacilik" },
      { anchor: "komple taşımacılık", href: "/komple-tasimacilik" },
      { anchor: "minivan express", href: "/minivan-express-tasimacilik" },
      { anchor: "hava kargo", href: "/hava-kargo" },
    ],
  },
  "uluslararasi-karayolu-parsiyel-tasimacilik": {
    slug: "uluslararasi-karayolu-parsiyel-tasimacilik",
    kind: "service",
    icon: "route",
    eyebrow: "Türkiye–Avrupa parsiyel ve LTL",
    title: "Uluslararası Karayolu Parsiyel Taşımacılık",
    lead: "Komple aracı doldurmayan paletli ve kolili ticari yüklerinizi, uygun Avrupa hattı ve araç kapasitesiyle eşleştiriyoruz. Nereden nereye, kaç palet ve ne zaman hazır olduğunu söyleyin; parsiyel planın eksiklerini anında görün.",
    seoTitle: "Uluslararası Karayolu Parsiyel Taşımacılık | REX",
    seoDescription: "Türkiye Avrupa uluslararası parsiyel taşımacılık ve LTL nakliye. Palet, koli, ağırlık ve rota bilgilerinizi hazırlayın; REX ile uygun taşıma planını karşılaştırın.",
    keywords: ["uluslararası parsiyel taşımacılık", "uluslararası karayolu parsiyel", "Avrupa parsiyel nakliye", "Türkiye Avrupa LTL", "Almanya parsiyel taşımacılık", "palet taşımacılığı Avrupa", "grupaj taşımacılık"],
    highlights: [
      { title: "Kullandığınız Kapasite", text: "Komple araç yerine yükün kapladığı alan üzerinden parsiyel plan" },
      { title: "Çift Yönlü Hat", text: "Türkiye’den Avrupa’ya ve uygun Avrupa adreslerinden Türkiye’ye" },
      { title: "Teklif Ön Kontrolü", text: "Rota, ölçü, ağırlık ve hazır olma bilgisini tek ekranda tamamlama" },
    ],
    sections: [
      {
        title: "Parsiyel taşıma ne zaman doğru seçimdir?",
        paragraphs: [
          "Yükünüz komple bir aracı doldurmuyorsa, teslim programı konsolide çıkışa uygunsa ve ambalajınız aktarma koşullarına dayanıklıysa uluslararası parsiyel taşımacılık güçlü bir seçenektir. Aynı yöne giden ticari yükler araç kapasitesini paylaşır; planlama kullanılan alan ve operasyon gereksinimi üzerinden yapılır.",
          "Bir palet ile orta hacimli yük arasında tek bir doğru eşik yoktur. Paletlerin taban ölçüsü, yüksekliği, üst üste konabilir olması, toplam kilogramı ve teslim adresi birlikte değerlendirilir. Bu nedenle REX, yalnızca palet adedine bakarak otomatik süre veya fiyat sözü vermez.",
        ],
        bullets: ["Paletli ihracat ve ithalat yükleri", "Kolili ticari ürün ve yedek parçalar", "Düzenli tedarikçi veya müşteri sevkiyatları", "Komple aracı doldurmayan proje kalemleri"],
      },
      {
        title: "Avrupa hattında hız, çıkış gününden önce kazanılır",
        paragraphs: [
          "Parsiyel sevkiyatta gecikmeyi azaltmanın en etkili yolu, yük hazır olmadan önce doğru bilgi setini tamamlamaktır. Açık adres, ambalaj ölçüleri, brüt ağırlık, ürün tanımı ve hazır olma günü bilindiğinde uygun konsolidasyon alternatifi daha erken karşılaştırılır.",
          "REX’in ön planlama yaklaşımı, yalnızca ana taşıma süresine değil; Türkiye içindeki alım, hat çıkışı, aktarma ihtiyacı ve Avrupa’daki son teslim bağlantısına birlikte bakar. Müşterinin gördüğü sonuç, bir aracın hareket süresi değil kapıdan kapıya toplam plandır. Acil Avrupa yüklerinde minivan express, uçuş bağlantısının daha uygun olduğu gönderilerde hava kargo seçeneği ayrıca değerlendirilir.",
        ],
      },
      {
        title: "Parsiyel yükte ambalaj ve ölçü neden önemlidir?",
        paragraphs: [
          "Konsolide araçta farklı yüklerle aynı kapasite paylaşıldığı için paletin dengeli, sabitlenmiş ve taşıma şartlarına uygun olması gerekir. Üstüne yük konamayan, taşan, yüksek veya hassas paletler standart paletten farklı alan kullanabilir.",
          "Ölçüleri ambalajın en dış noktasından almak, kilogramı brüt paylaşmak ve istiflenebilirlik bilgisini doğru vermek; hem kapasite planını hem de fiyat karşılaştırmasını daha isabetli hale getirir.",
        ],
      },
      {
        title: "Tek sefer değil, tekrar edilebilir bir akış",
        paragraphs: [
          "Aynı tedarikçiden veya aynı müşteriye düzenli yükünüz varsa çıkış sıklığı, ortalama palet adedi ve teslim beklentisi kaydedilerek tekrarlanabilir bir operasyon modeli kurulabilir. Her yeni sevkiyatta süreç sıfırdan tarif edilmez; yalnızca değişen yük ve tarih bilgileri güncellenir.",
          "Yük hacmi büyüdüğünde uluslararası karayolu taşımacılığı kapsamında parsiyel plan LTL veya komple araçla yeniden karşılaştırılır. Amaç tek bir modeli her sevkiyata zorlamak değil, o günkü yük için zaman ve toplam maliyet dengesini korumaktır.",
        ],
      },
    ],
    steps: [
      { title: "Rota ve adres", text: "Gerçek alım ve teslim noktaları ile taşıma yönü belirlenir." },
      { title: "Kapasite bilgisi", text: "Palet/koli ölçüsü, adet, brüt ağırlık ve istif durumu alınır." },
      { title: "Çıkış planı", text: "Hazır olma tarihi uygun konsolidasyon seçenekleriyle eşleştirilir." },
      { title: "Kapı teslim", text: "Alım, ana hat ve son teslim hareketleri tek operasyon olarak izlenir." },
    ],
    faq: [
      { question: "Uluslararası parsiyel taşımacılık nedir?", answer: "Aynı yöndeki farklı müşterilere ait yüklerin araç kapasitesini paylaşarak taşındığı modeldir. Yükün kapladığı alan, ağırlığı ve operasyon gereksinimi fiyatlandırmada dikkate alınır." },
      { question: "Bir palet Avrupa’ya parsiyel gönderilebilir mi?", answer: "Rota, ürün, ambalaj, ölçü, ağırlık ve teslim koşulları uygunsa tek palet dahil düşük hacimli ticari yükler için parsiyel seçenek değerlendirilebilir. Kesin kabul hat teyidinden sonra yapılır." },
      { question: "Parsiyel yük kaç günde teslim edilir?", answer: "Süre ülke adıyla tek başına belirlenemez. Gerçek adresler, yük kabul zamanı, planlanan çıkış, aktarma, resmî süreçler ve son teslim bağlantısı birlikte değerlendirilerek tahmini transit süre paylaşılır." },
      { question: "Parsiyel fiyat için hangi bilgiler gerekir?", answer: "Alım ve teslim adresi, ürün tanımı, palet/koli adedi, her birimin dış ölçüleri, toplam brüt ağırlık, istiflenebilirlik ve hazır olma tarihi gerekir." },
      { question: "Avrupa’dan Türkiye’ye parsiyel yük alınır mı?", answer: "Uygun Avrupa adreslerinden Türkiye’ye parsiyel yük alımı organize edilebilir. Ülke, posta kodu, ürün ve kapasite bilgileriyle hat uygunluğu kontrol edilir." },
      { question: "Parsiyel mi komple araç mı daha avantajlı?", answer: "Düşük ve orta hacimde parsiyel, yüksek hacim veya araca özel program gerektiğinde komple araç daha uygun olabilir. Karar yalnızca fiyatla değil kapıdan kapıya süre, aktarma ve yük niteliğiyle birlikte verilmelidir." },
    ],
    related: ["minivan-express-tasimacilik", "uluslararasi-karayolu-tasimaciligi", "komple-tasimacilik"],
    contextualLinks: [
      { anchor: "uluslararası karayolu taşımacılığı", href: "/uluslararasi-karayolu-tasimaciligi" },
      { anchor: "minivan express", href: "/minivan-express-tasimacilik" },
      { anchor: "hava kargo", href: "/hava-kargo" },
    ],
  },
  "minivan-express-tasimacilik": {
    slug: "minivan-express-tasimacilik",
    kind: "service",
    icon: "zap",
    eyebrow: "Türkiye–Avrupa zaman kritik karayolu",
    title: "Türkiye–Avrupa Minivan Express Taşımacılık",
    lead: "Üretimin, montajın veya teslim programının bekleyemediği düşük ve orta hacimli ticari yükler için araca özel, doğrudan ve çift yönlü minivan taşımacılığı planlıyoruz. Yükünüz hazırsa rota da hazır olsun.",
    seoTitle: "Minivan Express Taşımacılık Türkiye Avrupa | REX",
    seoDescription: "Türkiye Avrupa minivan express taşımacılık: zaman kritik ticari yükler için çift yönlü, araca özel ve kapıdan kapıya rota planı. REX'ten teklif alın.",
    keywords: ["minivan express taşımacılık", "Türkiye Avrupa minivan", "Avrupa minivan nakliye", "express minivan", "speedy van taşımacılık", "acil karayolu taşımacılığı", "kapıdan kapıya minivan", "Avrupa ekspres nakliye"],
    highlights: [
      { title: "Yükünüze Ayrılmış Araç", text: "Konsolidasyon çıkışını beklemeden, uygunluk teyidi sonrası sevkiyata özel plan" },
      { title: "Çift Yönlü Avrupa Hattı", text: "Türkiye’den Avrupa’ya, Avrupa’dan Türkiye’ye ve uygun Avrupa içi rotalar" },
      { title: "Kesintisiz Operasyon Bilgisi", text: "Alım adresinden teslim teyidine kadar tek operasyon kaydı ve tek muhatap" },
    ],
    sections: [
      {
        title: "Minivan express ne zaman doğru seçimdir?",
        paragraphs: [
          "Minivan express; uluslararası parsiyel taşımacılık çıkışını bekleyemeyen, hava kargo terminal bağlantılarına ihtiyaç duymadan doğrudan adrese ilerlemesi gereken ve komple TIR kapasitesine ihtiyaç duymayan ticari yükler için güçlü bir uluslararası karayolu taşımacılığı modelidir. Araç uygunluk teyidinden sonra sevkiyata ayrılır; alım ve teslim rotası yükün gerçek adreslerine göre kurulur.",
          "Bu model özellikle üretim hattını bekleten yedek parça, otomotiv ve makine bileşeni, fuar malzemesi, numune, tekstil, elektronik ve zaman penceresi dar proje yüklerinde değerlendirilir. En hızlı görünen seçeneği değil, kapıdan kapıya toplam süreyi koruyan seçeneği seçmek esastır.",
        ],
        bullets: ["Acil üretim ve bakım parçaları", "Fuar, lansman ve proje malzemeleri", "Paletli veya kolili ticari yükler", "İthalat ve ihracatta çift yönlü taşıma"],
      },
      {
        title: "Hız, aracın yola çıkmasından önce kazanılır",
        paragraphs: [
          "Minivan operasyonunda hız yalnızca aracın sürüş süresi değildir. Açık alım ve teslim adresi, posta kodu, ürün tanımı, ambalajın dış ölçüleri, toplam brüt ağırlık, hazır olma saati ve teslim beklentisi aynı anda netleştiğinde doğru araç daha erken eşleştirilir.",
          "REX Lojistik rota, kapasite, sürücü planı ve resmî süreçlerin hazır olma durumunu tek tabloda değerlendirir. Böylece yola çıkmaya hazır olmayan bir yük için gerçekçi olmayan süre sözü vermek yerine, operasyonun tamamını hızlandıran eksikler önceden görülür.",
        ],
      },
      {
        title: "Referans kapasite: kilogram tek başına yeterli değildir",
        paragraphs: [
          "Minivan ve panelvanlarda sık karşılaşılan referans aralık 1.300 kg, 15–17 m³ ve 6–7 Euro palete kadar olabilir. Ancak kapı ölçüsü, iç yükseklik, palet yerleşimi, ağırlık dağılımı, sabitleme ihtiyacı ve seçilen aracın ruhsat kapasitesi kesin kabulü değiştirir.",
          "Bu nedenle sayfadaki ön kontrol yalnızca ilk eşleştirmeyi yapar. Operasyon ekibi ölçüleri aracın gerçek kapasitesiyle doğrular; sınırı aşan yüklerde tenteli minivan, parsiyel, hava kargo veya daha büyük araca özel seçenek aynı teslim hedefi üzerinden karşılaştırılır.",
        ],
      },
      {
        title: "Aktarma yerine doğrudan rota, belirsizlik yerine görünürlük",
        paragraphs: [
          "Uygun dedike minivan planında yük, gereksiz depo beklemesi ve tekrar elleçleme ihtiyacı azaltılarak alım adresinden teslim adresine aynı taşıma planı içinde ilerler. Bu yapı, hassas ve zaman kritik yüklerde temas noktalarını azaltmaya yardımcı olur.",
          "Sevkiyat oluşturulduğunda operasyon kaydı, sürücü ve araç bilgileri, rota hareketleri ve teslim teyidi REX TYS üzerinden izlenebilir. Müşterinin ihtiyacı yalnızca hızlı bir araç değil; nerede olduğu bilinen, sorumlusu belli ve teslimi doğrulanabilen bir süreçtir.",
        ],
      },
      {
        title: "Minivan mı, hava kargo mu, parsiyel mi?",
        paragraphs: [
          "Türkiye–Avrupa hattında zaman kritik ve düşük/orta hacimli yük için minivan; kıtalar arası veya uçuş bağlantısının belirleyici olduğu küçük yük için hava kargo; teslim tarihi esnek ve maliyet odağı yüksek yük için parsiyel seçenek öne çıkabilir.",
          "REX tek bir taşıma modelini her yüke zorlamaz. Rota, hacim, ağırlık, hazır olma zamanı ve teslim hedefi birlikte okunur; hız ile toplam maliyet arasındaki en dengeli seçenek teklif aşamasında görünür hale getirilir.",
        ],
      },
    ],
    steps: [
      { title: "Acil ihtiyacı tanıma", text: "Yükün neden zaman kritik olduğu, hazır olma saati ve son teslim hedefi alınır." },
      { title: "Kapasite ve rota", text: "Dış ölçüler, brüt ağırlık, adres ve araç erişim koşulları doğrulanır." },
      { title: "Araç ve çıkış teyidi", text: "Uygun araç ile planlanan alım zamanı kesinleştirilerek operasyon başlatılır." },
      { title: "Takip ve teslim", text: "Rota hareketleri izlenir, teslim bilgisi ve evrakı aynı kayıtta tamamlanır." },
    ],
    faq: [
      { question: "Minivan express taşımacılık nedir?", answer: "Zaman kritik ve komple TIR kapasitesi gerektirmeyen ticari yüklerin, uygunluk teyidinden sonra sevkiyata ayrılan minivan veya panelvanla doğrudan karayolu rotasında taşınmasıdır." },
      { question: "Türkiye’den hangi Avrupa ülkelerine minivan gönderilebilir?", answer: "Almanya, Benelüks, Fransa, İtalya, Avusturya, İsviçre, Orta Avrupa ve Balkanlar başta olmak üzere uygun Avrupa rotaları değerlendirilebilir. Kesin kapsam alım ve teslim posta kodlarıyla teyit edilir." },
      { question: "Avrupa’dan Türkiye’ye minivan yük alınır mı?", answer: "Evet, uygun ülke, adres, ürün ve araç koşullarında Avrupa çıkışlı Türkiye varışlı ithalat yükleri için de minivan planlanabilir." },
      { question: "Minivan kaç palet ve kaç kilogram taşır?", answer: "Sık kullanılan araçlarda 6–7 Euro palet, yaklaşık 15–17 m³ ve 1.300 kg referans alınabilir. Kesin kapasite araç tipi, palet ölçüsü, ağırlık dağılımı ve ruhsat değerine göre değişir." },
      { question: "Minivan express kaç günde teslim edilir?", answer: "Tahmini süre gerçek alım ve teslim adresi, yükün hazır olma saati, resmî süreçler, sınır geçişleri ve sürüş planına göre belirlenir. Sabit ülke süresi yerine rota teyidinden sonra gerçekçi kapıdan kapıya tahmin paylaşılır." },
      { question: "Minivan express fiyatı nasıl hesaplanır?", answer: "Fiyat; alım ve teslim adresleri, toplam mesafe, yükün hacim ve ağırlığı, araç tipi, hazır olma zamanı, teslim önceliği ve özel taşıma gereksinimlerine göre hesaplanır." },
      { question: "Minivan ile hava kargo arasındaki fark nedir?", answer: "Minivan Avrupa hattında yükü doğrudan karayoluyla adrese taşımaya odaklanır. Hava kargoda uçuş, terminal ve kara bağlantıları birlikte planlanır. En uygun model kapıdan kapıya toplam süre ve maliyet karşılaştırmasıyla seçilir." },
    ],
    related: ["uluslararasi-karayolu-tasimaciligi", "uluslararasi-karayolu-parsiyel-tasimacilik", "hava-kargo", "komple-tasimacilik"],
    contextualLinks: [
      { anchor: "uluslararası karayolu taşımacılığı", href: "/uluslararasi-karayolu-tasimaciligi" },
      { anchor: "uluslararası parsiyel taşımacılık", href: "/uluslararasi-karayolu-parsiyel-tasimacilik" },
      { anchor: "hava kargo", href: "/hava-kargo" },
    ],
  },
  "hava-kargo": {
    slug: "hava-kargo",
    kind: "service",
    icon: "plane",
    eyebrow: "Türkiye'nin her yerinden dünya bağlantısı",
    title: "Hava Kargo Taşımacılığı",
    lead: "Hava kargonuz Türkiye'nin neresinde olursa olsun rota kapınızdan başlar. 81 ildeki uygun adreslerden alımı, doğru çıkış havalimanını, uçuş alternatiflerini ve varış teslimini tek operasyon planında birleştiriyoruz.",
    seoTitle: "Hava Kargo ve Türkiye Geneli Adresten Alım | REX",
    seoDescription: "Türkiye'nin 81 ilinden uygun adresten alım, uluslararası hava kargo, uçuş karşılaştırması ve kapı teslim koordinasyonu. REX Lojistik'ten teklif alın.",
    keywords: ["hava kargo", "hava taşımacılığı", "Türkiye geneli hava kargo alımı", "uluslararası hava kargo", "kapıdan kapıya hava kargo", "hava kargo fiyatları"],
    highlights: [
      { title: "81 İlden Alım", text: "Gönderiniz havaalanı şehrinde olmasa da uygun adresten çıkış planı" },
      { title: "Zaman–Maliyet Dengesi", text: "Direkt ve aktarmalı uçuşların aynı kapsamla karşılaştırılması" },
      { title: "Tek Operasyon", text: "Kapı alımından varış teslimine kadar bağlantılı koordinasyon" },
    ],
    sections: [
      {
        title: "Hava kargo İstanbul'dan başlamaz; yükünüzün bulunduğu yerden başlar",
        paragraphs: [
          "İzmir, Manisa, Bursa, Ankara, Konya, Kayseri, Gaziantep, Antalya veya Türkiye'nin başka bir ilindeki yükünüz için önce uygun adresten alım planlanır. Gönderi, ürün ve uçuş koşullarına göre doğru çıkış havalimanına bağlanır; böylece müşterinin ayrı bir kara taşıması organize etmesine gerek kalmadan hava kargo süreci tek akışta ilerler. Türkiye geneli hava kargo alım ağımız, uygun gönderilerde kapıdan kapıya hava kargo planının çıkış ayağını oluşturur.",
          "REX Lojistik için hava kargo yalnızca bir uçuş rezervasyonu değildir. Çıkış adresi, kara bağlantısı, havayolu kabulü, uçuş seçeneği, aktarma yapısı ve varış teslimi aynı operasyon masasında değerlendirilir.",
        ],
        bullets: ["Türkiye'nin 81 ilindeki uygun adreslerden planlı alım", "Havalimanından havalimanına taşıma", "Kapıdan havalimanına, havalimanından kapıya veya kapıdan kapıya çözüm", "Numune, yedek parça, paletli ve zaman hassasiyetli ticari yükler"],
      },
      {
        title: "Doğru uçuş, yalnızca en kısa görünen uçuş değildir",
        paragraphs: [
          "Teslim hedefini karşılayan en uygun çözüm; uçuş sıklığı, kapasite, aktarma, kesim saati, çıkış ve varış kara bağlantıları ile birlikte seçilir. Bu yaklaşım, yalnızca hızlı görünen fakat bağlantılarda zaman veya maliyet kaybettiren seçenekleri elemenizi sağlar. Yükün rotası ve hacmi uygunsa uluslararası karayolu taşımacılığı veya denizyolu taşımacılığı da alternatif model olarak karşılaştırılabilir.",
          "Fiyatlandırmada gerçek ağırlık ile hacimsel ağırlığın yüksek olanı esas alınabilir. Koli ölçülerinin, brüt ağırlığın, ürün tanımının ve hazır olma tarihinin baştan doğru paylaşılması daha isabetli bir maliyet ve süre karşılaştırması sağlar.",
        ],
      },
      {
        title: "Zaman kritikse, operasyonun her dakikası önemlidir",
        paragraphs: [
          "Üretim hattını bekleten parçalar, numuneler, değerli ürünler ve teslim tarihi kritik ticari gönderilerde gecikme çoğu zaman uçuşta değil; eksik bilgi, yanlış paketleme veya kopuk kara bağlantısında oluşur. REX, rezervasyondan önce bu temas noktalarını birlikte kontrol eder.",
          "İthalat ve ihracata ilişkin resmi işlemler müşteri ile müşterinin kendi yetkili danışmanları tarafından yürütülür. REX Lojistik, taşıma belgeleri ile kapı–havalimanı–uçuş–teslim operasyonunun kesintisiz ilerlemesine odaklanır.",
        ],
      },
    ],
    steps: [
      { title: "Gönderi analizi", text: "Ürün, ölçü, ağırlık, adres ve teslim hedefi alınır." },
      { title: "Adresten alım", text: "Türkiye'nin uygun çıkış noktasından havalimanı bağlantısı kurulur." },
      { title: "Uçuş seçimi", text: "Süre, kapasite, aktarma ve toplam maliyet seçenekleri karşılaştırılır." },
      { title: "Varış teslimi", text: "Uçuş ve seçilen son teslim kapsamı tek kayıt üzerinden takip edilir." },
    ],
    faq: [
      { question: "Hava kargo fiyatı nasıl hesaplanır?", answer: "Fiyat; çıkış-varış hattı, gerçek ve hacimsel ağırlık, ürün niteliği, uçuş seçeneği ve kapı teslim hizmetlerine göre hesaplanır." },
      { question: "Türkiye'nin her yerinden hava kargo alımı yapılıyor mu?", answer: "Türkiye'nin 81 ilindeki uygun adreslerden kara ön taşıması planlanabilir. Adres erişimi, ürün kabulü, yük ölçüsü ve hazır olma tarihi kontrol edilerek gönderi uygun çıkış havalimanına bağlanır." },
      { question: "Kapıdan kapıya hava kargo yapılabilir mi?", answer: "Uygun çıkış ve varış noktalarında kara transferleri hava taşımasına eklenerek kapıdan kapıya çözüm planlanabilir." },
      { question: "Her ürün hava kargoyla taşınabilir mi?", answer: "Hayır. Tehlikeli maddeler, bataryalar, sıvılar ve bazı özel ürünler için havayolu kabul kuralları bulunur. Ürün detayları rezervasyon öncesi kontrol edilir." },
      { question: "Teslim süresi ne kadardır?", answer: "Süre uçuş hattı, rezervasyon durumu, aktarma, ülke giriş koşulları ve kapı teslim kapsamına göre değişir; teklif sırasında tahmini transit süre belirtilir." },
    ],
    related: ["kapidan-kapiya-hava-kargo", "turkiye-geneli-hava-kargo-alimi", "hava-kargo-hacimsel-agirlik-hesaplama"],
    contextualLinks: [
      { anchor: "Türkiye geneli hava kargo alım", href: "/turkiye-geneli-hava-kargo-alimi" },
      { anchor: "kapıdan kapıya hava kargo", href: "/kapidan-kapiya-hava-kargo" },
      { anchor: "uluslararası karayolu taşımacılığı", href: "/uluslararasi-karayolu-tasimaciligi" },
      { anchor: "denizyolu taşımacılığı", href: "/denizyolu-tasimaciligi" },
    ],
  },
  "uluslararasi-hava-kargo": {
    slug: "uluslararasi-hava-kargo",
    kind: "service",
    icon: "plane",
    eyebrow: "Dünya hatlarına planlı bağlantı",
    title: "Uluslararası Hava Kargo",
    lead: "İhracat ve ithalat gönderileriniz için çıkış adresinden uygun havalimanına, uçuş alternatiflerinden varış teslimine kadar bütün bağlantıları tek operasyon planında yönetiyoruz.",
    seoTitle: "Uluslararası Hava Kargo Taşımacılığı | REX Lojistik",
    seoDescription: "İthalat ve ihracat için uluslararası hava kargo, direkt ve aktarmalı uçuş karşılaştırması, kapı-havalimanı ve kapı teslim koordinasyonu.",
    keywords: ["uluslararası hava kargo", "hava yolu taşımacılığı", "ihracat hava kargo", "ithalat hava kargo", "hava kargo firmaları"],
    highlights: [
      { title: "Uçuş Alternatifleri", text: "Direkt ve aktarmalı seçeneklerin süre ve kapsamla karşılaştırılması" },
      { title: "Kapı Bağlantısı", text: "Türkiye geneli ön taşıma ve uygun varış teslim planı" },
      { title: "Operasyon Görünürlüğü", text: "Rezervasyondan teslimata kadar tek muhatap" },
    ],
    sections: [
      {
        title: "Dünya bağlantısı doğru çıkış planıyla başlar",
        paragraphs: [
          "Uluslararası hava kargoda doğru rota, yalnızca iki havalimanı arasındaki uçuşa bakılarak seçilmez. Yükün Türkiye'deki çıkış adresi, hazır olma zamanı, uçuş kesim saati, aktarma noktası, varış hizmetleri ve teslim hedefi birlikte hesaplanır.",
          "REX Lojistik, uygun uçuş seçeneklerini aynı hizmet kapsamıyla karşılaştırır. Böylece karar, yalnızca navlun rakamına değil; kapıdan varışa kadar oluşan toplam zaman ve toplam operasyon maliyetine dayanır.",
        ],
        bullets: ["Havalimanı–havalimanı", "Kapı–havalimanı", "Havalimanı–kapı", "Uygun rotalarda kapıdan kapıya"],
      },
      {
        title: "Her yük için aynı uçuş modeli kullanılmaz",
        paragraphs: [
          "Acil yedek parça, üretim numunesi, paletli ticari yük ve düzenli ihracat gönderisi aynı önceliklere sahip değildir. Ürün niteliğine göre hız odaklı veya maliyet dengeli alternatifler değerlendirilir.",
          "Batarya, sıvı, ısı hassas ürün, tehlikeli madde veya özel elleçleme gerektiren yükler rezervasyon öncesinde ayrıca kontrol edilir. Resmi ithalat ve ihracat işlemleri müşteri ile müşterinin yetkili danışmanlarının sorumluluğundadır.",
        ],
      },
    ],
    steps: [
      { title: "Yük profili", text: "İçerik, ölçü, ağırlık, adres ve teslim hedefi netleştirilir." },
      { title: "Rota karşılaştırması", text: "Uçuş, aktarma, kapasite ve kara bağlantıları birlikte değerlendirilir." },
      { title: "Rezervasyon & kabul", text: "Uygun seçenek onaylanır, alım ve havayolu kabulü koordine edilir." },
      { title: "Uçuş & teslim", text: "Hareketler takip edilir ve seçilen varış hizmeti tamamlanır." },
    ],
    faq: [
      { question: "Uluslararası hava kargo fiyatı neye göre belirlenir?", answer: "Rota, gerçek ve hacimsel ağırlık, ürün niteliği, uçuş kapasitesi, aktarma, hazır olma tarihi ve kapı hizmetleri fiyatı etkiler." },
      { question: "Direkt uçuş her zaman daha iyi midir?", answer: "Her zaman değil. Uçuş günü, kapasite, kesim saati, kara bağlantısı ve toplam maliyet birlikte değerlendirilmelidir." },
      { question: "Paletli yük hava kargoyla taşınabilir mi?", answer: "Ölçü, ağırlık, paketleme ve havayolu kabul koşulları uygunsa paletli ticari yükler hava kargoyla taşınabilir." },
      { question: "Teklif için hangi bilgiler gerekir?", answer: "Çıkış-varış adresleri, ürün tanımı, koli/palet adedi, ölçüler, brüt ağırlık, hazır olma tarihi ve özel ürün bilgileri gerekir." },
    ],
    related: ["kapidan-kapiya-hava-kargo", "hava-kargo-mu-express-kargo-mu", "hava-kargo-hacimsel-agirlik-hesaplama"],
  },
  "kapidan-kapiya-hava-kargo": {
    slug: "kapidan-kapiya-hava-kargo",
    kind: "service",
    icon: "plane",
    eyebrow: "Tek temas noktasından uçtan uca plan",
    title: "Kapıdan Kapıya Hava Kargo",
    lead: "Gönderiyi bulunduğu adresten alıyor, uygun çıkış havalimanına bağlıyor ve seçilen kapsamda varış adresine kadar tek operasyon içinde izliyoruz.",
    seoTitle: "Kapıdan Kapıya Hava Kargo | Türkiye Geneli Alım",
    seoDescription: "Türkiye'nin 81 ilinden uygun adresten alım, havalimanı bağlantısı, uluslararası uçuş ve varış adresine teslim koordinasyonu.",
    keywords: ["kapıdan kapıya hava kargo", "adresten alım hava kargo", "yurtdışı hava kargo", "hava kargo kapı teslim", "Türkiye geneli kargo alımı"],
    highlights: [
      { title: "Adresinizden Başlar", text: "Türkiye genelinde uygun adresten planlı yük alımı" },
      { title: "Bağlantılar Tek Planda", text: "Kara taşıması, uçuş ve son teslim arasında kesintisiz koordinasyon" },
      { title: "Tek Muhatap", text: "Birden fazla taşıma adımı için tek operasyon ekibi" },
    ],
    sections: [
      {
        title: "Havaalanına nasıl götüreceğinizi değil, yükünüzü anlatın",
        paragraphs: [
          "Kapıdan kapıya hava kargo hizmetinde yükün çıkış havalimanına ulaştırılması ayrı bir problem olarak müşteriye bırakılmaz. REX Lojistik, uygun adres alımını, kara ön taşımasını ve havayolu kabul zamanını uçuş planıyla birleştirir.",
          "Varış ülkesinde seçilen kapsam doğrultusunda son kara bağlantısı da plana eklenebilir. Böylece gönderi farklı firmalar arasında kopuk adımlarla değil, baştan sona tanımlanmış tek akışla yönetilir.",
        ],
        bullets: ["Fabrika, depo veya iş yerinden alım", "Uygun çıkış havalimanına zamanlı bağlantı", "Uçuş ve aktarma hareketlerinin takibi", "Uygun varış noktalarında adres teslimi"],
      },
      {
        title: "Toplam süre, kapıdan kapıya ölçülür",
        paragraphs: [
          "Bir uçuşun kısa olması, yükün tamamlanan teslim süresinin de kısa olacağı anlamına gelmez. Alım saati, havayolu kabul kapanışı, aktarma, varış işlemleri ve son teslim penceresi toplam süreyi belirler.",
          "REX, fiyat ve tahmini transit süre alternatiflerini aynı hizmet kapsamıyla sunarak görünen navlun yerine uygulanabilir toplam çözümü seçmenize yardımcı olur.",
        ],
      },
    ],
    steps: [
      { title: "Adres alımı", text: "Yük uygun araçla çıkış adresinden alınır." },
      { title: "Havalimanı bağlantısı", text: "Kabul saati ve uçuş planına göre ön taşıma yapılır." },
      { title: "Hava taşıması", text: "Rezervasyon, kabul ve uçuş hareketleri takip edilir." },
      { title: "Son teslim", text: "Seçilen hizmet kapsamında varış adresine bağlantı kurulur." },
    ],
    faq: [
      { question: "Kapıdan kapıya hizmet Türkiye'nin hangi şehirlerinden başlar?", answer: "Türkiye'nin 81 ilindeki uygun adreslerden alım planlanabilir. Kesin uygunluk adres, ürün, ölçü ve hazır olma tarihine göre teyit edilir." },
      { question: "Yükün havaalanına teslimini benim mi yapmam gerekir?", answer: "Hayır. Talep edilen kapsamda çıkış adresinden havalimanına kara ön taşıması REX operasyon planına dahil edilebilir." },
      { question: "Varış ülkesinde kapı teslimi mümkün mü?", answer: "Ülke, posta kodu, ürün ve yerel servis uygunluğuna göre varış adresine teslim planlanabilir." },
      { question: "Kapıdan kapıya teklif için ne paylaşmalıyım?", answer: "Tam çıkış-varış adresleri, koli ölçüleri, brüt ağırlık, ürün tanımı, gönderi değeri ve hazır olma tarihi yeterli bir başlangıç sağlar." },
    ],
    related: ["turkiye-geneli-hava-kargo-alimi", "uluslararasi-hava-kargo", "hava-kargo-hacimsel-agirlik-hesaplama"],
    contextualLinks: [
      { anchor: "hava kargo hizmetinde", href: "/hava-kargo" },
    ],
  },
  "turkiye-geneli-hava-kargo-alimi": {
    slug: "turkiye-geneli-hava-kargo-alimi",
    kind: "service",
    icon: "route",
    eyebrow: "81 ilden uygun adresten alım",
    title: "Türkiye Geneli Hava Kargo Alımı",
    lead: "Hava kargonuzun havalimanı olan bir şehirde bulunması gerekmez. Türkiye'nin 81 ilindeki uygun çıkış adresini doğru havalimanı ve uçuş planıyla buluşturuyoruz.",
    seoTitle: "Türkiye Geneli Hava Kargo Alımı | 81 İlden Adresten",
    seoDescription: "İstanbul, İzmir, Ankara ve Türkiye'nin 81 ilindeki uygun adreslerden hava kargo alımı; kara bağlantısı, uçuş ve teslim planı REX'te.",
    keywords: ["Türkiye geneli hava kargo", "81 ilden kargo alımı", "hava kargo adresten alım", "İzmir hava kargo", "Manisa hava kargo", "Ankara hava kargo"],
    highlights: [
      { title: "81 İl", text: "Uygun fabrika, depo ve iş yeri adreslerinden alım planı" },
      { title: "Doğru Çıkış Noktası", text: "Yük ve uçuş koşuluna göre uygun havalimanı bağlantısı" },
      { title: "Teklifte Net Kapsam", text: "Kara bağlantısı ve hava navlununun birlikte değerlendirilmesi" },
    ],
    sections: [
      {
        title: "Hava kargo yalnızca havalimanı şehirlerinin hizmeti değildir",
        paragraphs: [
          "Ürün Manisa'daki bir fabrikada, Konya'daki bir depoda, Kayseri'deki bir üreticide veya Türkiye'nin başka bir noktasında olabilir. REX Lojistik, ana hava kargo hizmeti kapsamında adres alımını uygun çıkış havalimanına bağlayan kara operasyonunu uçuş takvimine göre planlar.",
          "Bu sayede müşteri farklı bir nakliyeci bulmak, havalimanı teslim saatini ayrıca takip etmek ve uçuş rezervasyonuyla kara aracını kendi başına eşleştirmek zorunda kalmaz.",
        ],
        bullets: ["Marmara ve Ege sanayi bölgelerinden alım", "İç Anadolu ve Akdeniz üretim merkezlerinden bağlantı", "Karadeniz, Doğu ve Güneydoğu Anadolu çıkışları", "Adres koşuluna göre koli veya paletli ticari yük alımı"],
      },
      {
        title: "En yakın havalimanı her zaman en uygun havalimanı değildir",
        paragraphs: [
          "Çıkış noktası; yalnızca kilometreye göre değil, hedef ülkeye uçuş sıklığı, ürün kabulü, kapasite, kesim saati ve kara bağlantısının toplam süresi düşünülerek seçilir.",
          "REX'in işi tam da bu bağlantıları görünür hale getirmektir: yükün bulunduğu yerden başlayıp teslim hedefini karşılayan, gereksiz bekleme ve maliyet riskini azaltan uygulanabilir bir rota kurmak.",
        ],
      },
    ],
    steps: [
      { title: "Konum", text: "Tam alım adresi ve yükün hazır olma saati alınır." },
      { title: "Gateway seçimi", text: "Uygun havalimanı ve uçuş seçenekleri karşılaştırılır." },
      { title: "Ön taşıma", text: "Kara aracı, uçuş kabul saatine göre planlanır." },
      { title: "Uçuş & teslim", text: "Hava taşıması ve seçilen varış bağlantısı takip edilir." },
    ],
    faq: [
      { question: "Havaalanı olmayan bir şehirden yük alınabilir mi?", answer: "Evet. Adres, ürün ve yük ölçüleri uygunsa kara ön taşımasıyla uygun çıkış havalimanına bağlantı planlanabilir." },
      { question: "Hangi çıkış havalimanı kullanılır?", answer: "Yükün konumu, hedef ülke, uçuş programı, kapasite, ürün kabulü ve toplam maliyete göre uygun çıkış noktası seçilir." },
      { question: "Aynı gün alım mümkün mü?", answer: "Adres, aracın ve uçuşun uygunluğu ile havayolu kabul saatine bağlıdır. Hazır olma saati paylaşıldığında uygulanabilir en yakın seçenek kontrol edilir." },
      { question: "Türkiye içi alım ücreti teklife dahil mi?", answer: "Talep edilen hizmet kapsamına göre kara ön taşıması ve hava navlunu ayrı ve açık kalemlerle veya bütünleşik kapsamla sunulabilir." },
    ],
    related: ["kapidan-kapiya-hava-kargo", "uluslararasi-hava-kargo", "hava-kargo-mu-express-kargo-mu"],
    contextualLinks: [
      { anchor: "hava kargo hizmeti", href: "/hava-kargo" },
    ],
  },
  "hava-kargo-mu-express-kargo-mu": {
    slug: "hava-kargo-mu-express-kargo-mu",
    kind: "guide",
    icon: "plane",
    eyebrow: "Doğru servis seçim rehberi",
    title: "Hava Kargo mu Express Kargo mu?",
    lead: "Gönderi ağırlığı, ölçüsü, ürün niteliği, teslim hedefi ve kapı hizmetini birlikte değerlendirerek hızlı görünen değil, ihtiyacınıza gerçekten uyan servisi seçin.",
    seoTitle: "Hava Kargo mu Express Kargo mu? Karşılaştırma | REX",
    seoDescription: "Hava kargo ve express kargo arasındaki farkları ağırlık, hacim, teslim süresi, kapı hizmeti ve maliyet açısından karşılaştırın.",
    keywords: ["hava kargo mu express kargo mu", "hava kargo express farkı", "yurtdışı kargo seçimi", "hava kargo karşılaştırma"],
    highlights: [], sections: [], faq: [],
    related: ["hava-kargo-hacimsel-agirlik-hesaplama", "kapidan-kapiya-hava-kargo", "express-kargo"],
  },
  "hava-kargo-hacimsel-agirlik-hesaplama": {
    slug: "hava-kargo-hacimsel-agirlik-hesaplama",
    kind: "guide",
    icon: "plane",
    eyebrow: "Ücretsiz ücretlendirilebilir ağırlık aracı",
    title: "Hava Kargo Hacimsel Ağırlık Hesaplama",
    lead: "Koli ölçülerini ve gerçek ağırlığı girin; hava kargo teklifinde dikkate alınabilecek hacimsel ve ücretlendirilebilir ağırlığı saniyeler içinde görün.",
    seoTitle: "Hava Kargo Hacimsel Ağırlık Hesaplama | REX",
    seoDescription: "Hava kargo desi ve hacimsel ağırlık hesaplama aracı. Koli ölçüsü, adet ve gerçek ağırlıkla yaklaşık ücretlendirilebilir kiloyu bulun.",
    keywords: ["hava kargo hacimsel ağırlık hesaplama", "hava kargo desi hesaplama", "chargeable weight", "koli ağırlık hesaplama", "hava kargo fiyat hesaplama"],
    highlights: [], sections: [], faq: [],
    related: ["hava-kargo-mu-express-kargo-mu", "uluslararasi-hava-kargo", "turkiye-geneli-hava-kargo-alimi"],
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
          "FCL komple konteyner taşımacılığında konteyner tek müşterinin yüküne ayrılır. LCL parsiyel denizyolu taşımacılığında ise aynı varış yönündeki farklı yükler konteyner kapasitesini paylaşır. Doğru seçim yalnızca hacme değil; ürün niteliğine, yükleme tarihine, liman masraflarına ve teslim hedeflerine göre yapılır.",
          "REX Lojistik, çıkış limanı ve varış limanı alternatiflerini, gemi programını, konteyner türünü ve kara bağlantılarını birlikte değerlendirir. Daha kısa transit hedeflerinde hava kargo, Avrupa kapı bağlantılarında ise uluslararası karayolu taşımacılığı alternatifleri yükün özelliklerine göre ayrıca incelenebilir.",
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
    related: ["denizyolu-parsiyel-tasimacilik", "denizyolu-konteyner-tasimaciligi", "lcl-mi-fcl-mi", "cbm-hesaplama"],
    contextualLinks: [
      { anchor: "LCL parsiyel denizyolu taşımacılığında", href: "/denizyolu-parsiyel-tasimacilik" },
      { anchor: "FCL komple konteyner taşımacılığında", href: "/denizyolu-konteyner-tasimaciligi" },
      { anchor: "hava kargo", href: "/hava-kargo" },
      { anchor: "uluslararası karayolu taşımacılığı", href: "/uluslararasi-karayolu-tasimaciligi" },
      { anchor: "İzmir parsiyel taşımacılık", href: "/izmir-parsiyel-tasimacilik" },
      { anchor: "Manisa parsiyel taşımacılık", href: "/manisa-parsiyel-tasimacilik" },
    ],
  },
  "izmir-parsiyel-tasimacilik": {
    slug: "izmir-parsiyel-tasimacilik",
    kind: "service",
    icon: "route",
    eyebrow: "İzmir çıkışlı Türkiye geneli dağıtım",
    title: "İzmir Parsiyel Taşımacılık",
    lead: "İzmir'den 1 paletten başlayan yüklerinizi adresinizden alıyor, Türkiye'nin 81 iline ve ilçelere alıcı adresine kadar teslim ediyoruz.",
    seoTitle: "İzmir Parsiyel Taşımacılık | 1 Paletten Türkiye Geneli | REX Lojistik",
    seoDescription: "İzmir'den 1 paletten başlayan parsiyel yüklerinizi adresinizden alıyor, Türkiye'nin 81 iline ve ilçelere adrese teslim ediyoruz. REX Lojistik'ten hızlı teklif alın.",
    keywords: ["İzmir parsiyel taşımacılık", "İzmir parsiyel nakliye", "İzmir palet taşımacılığı", "İzmir Türkiye geneli nakliye"],
    heroPrimaryCtaLabel: "Hızlı Teklif Al",
    heroWhatsAppLabel: "WhatsApp'tan Teklif Al",
    highlights: [
      { title: "1 Paletten Başlayan Taşıma", text: "Komple araç gerektirmeyen İzmir çıkışlı ticari yükler için esnek planlama" },
      { title: "Adresten Adrese Organizasyon", text: "Gönderici adresinden alım ve ilçe dahil alıcı adresine teslimat" },
      { title: "81 İle Ulaşım", text: "Yük özelliklerine ve güzergâha göre Türkiye geneli taşıma çözümü" },
    ],
    sections: [
      {
        title: "İzmir'den Türkiye Geneline Parsiyel Taşımacılık",
        paragraphs: [
          "Komple bir aracı doldurmayan yükler için parsiyel taşımacılık, aynı güzergâhtaki farklı yüklerin planlı şekilde taşınmasına imkân verir. REX Lojistik olarak İzmir çıkışlı 1 paletten başlayan yükler için Türkiye genelinde parsiyel taşıma organizasyonu sağlıyoruz.",
          "Yükünüzü gönderici adresinden alıyor, taşıma planını yükün palet sayısı, ölçüleri, ağırlığı ve teslimat noktasına göre oluşturuyoruz. Teslimatı yalnızca il merkezlerine değil, uygun dağıtım planlamasıyla ilçelerdeki alıcı adreslerine kadar organize ediyoruz.",
        ],
      },
      {
        title: "İzmir Parsiyel Hizmetinin Avantajları",
        paragraphs: [
          "İzmir çıkışlı yurtiçi parsiyel taşımacılık hizmetimiz, yükünüzün gerçek kapasite ihtiyacına göre planlanır ve süreç tek operasyon noktası üzerinden takip edilir.",
        ],
        bullets: [
          "1 paletten başlayan taşıma",
          "Adresten yük alımı",
          "Alıcı adresine teslimat",
          "Türkiye'nin 81 iline ulaşım",
          "İlçelere teslimat organizasyonu",
          "Yüke uygun taşıma planlaması",
          "Tek noktadan operasyon takibi",
        ],
      },
      {
        title: "Hangi Yükler İçin Parsiyel Taşıma Kullanılabilir?",
        paragraphs: [
          "Parsiyel taşıma özellikle komple araç kapasitesine ihtiyaç duymayan ticari yüklerde avantaj sağlar. Paletli ürünler, ambalajlı ticari yükler ve sevkiyata uygun farklı yük grupları için yükün özelliklerine göre taşıma planı oluşturulabilir.",
          "Paletli yüklerin yanı sıra, güzergâh ve yük özelliklerine göre koli ve toplu koli gönderileri için de taşıma çözümü sunulabilir. Palet sayısı veya toplam yük hacmi arttığında ise yük için daha uygun araç ve nakliye modeli değerlendirilir.",
        ],
      },
      {
        title: "İzmir Parsiyel Nakliye Fiyatı Nasıl Belirlenir?",
        paragraphs: [
          "Parsiyel taşıma fiyatı yalnızca kilogram üzerinden belirlenmez. Çıkış ve teslimat noktası, palet veya koli adedi, yükün ölçüleri, toplam ağırlığı, istiflenebilir olup olmaması ve yükün hazır olma tarihi fiyatlandırmayı etkileyebilir.",
          "Bu nedenle doğru teklif için yük bilgilerini paylaşmanız yeterlidir.",
        ],
        bullets: ["Çıkış adresi", "Teslimat adresi", "Palet / koli adedi", "En × Boy × Yükseklik", "Toplam kg", "İstiflenebilirlik", "Yükün hazır olma tarihi"],
        cta: { label: "Yük Bilgilerini Gönder – Teklif Al", href: "#izmir-parsiyel-teklif" },
      },
      {
        title: "İzmir'de Adresten Alım, Türkiye Genelinde Adrese Teslim",
        paragraphs: [
          "Yükünüzü belirlenen İzmir çıkış adresinden alarak taşıma sürecini planlıyoruz. Varış noktasında teslimat, taşıma planına göre alıcının adresine kadar organize edilir.",
          "Türkiye'nin 81 iline taşıma çözümü sunarken yalnızca il merkezleriyle sınırlı kalmıyor; ilçelere yapılacak teslimatları da güzergâh ve dağıtım planına dahil ediyoruz.",
        ],
      },
      {
        title: "İzmir'den Sık Talep Edilen Parsiyel Güzergâhlar",
        paragraphs: [
          "İzmir çıkışlı taleplerde İstanbul, Ankara, Bursa ve Kocaeli gibi sanayi merkezlerinin yanında Akdeniz ve İç Anadolu yönleri de öne çıkabilir. Aşağıdaki hatlar, talep edilen güzergâhlara örnektir; hizmet kapsamını sınırlandırmaz.",
          "Bu güzergâhların dışında Türkiye'nin 81 iline ve ilçelere parsiyel taşıma organizasyonu sağlanabilir.",
        ],
        bullets: ["İzmir → İstanbul", "İzmir → Gebze", "İzmir → Ankara", "İzmir → Bursa", "İzmir → Kocaeli", "İzmir → Antalya", "İzmir → Konya", "İzmir → Adana", "İzmir → Manisa"],
      },
      {
        title: "İzmir'in Ticaret ve Üretim Bölgelerinden Adres Bazlı Alım",
        paragraphs: [
          "Bornova, Kemalpaşa, Gaziemir, Çiğli, Torbalı, Aliağa, Menemen ve Menderes gibi İzmir'in ticaret ve üretim bölgelerinden yapılacak yüklemeler için adres bazlı taşıma planlaması oluşturulabilir.",
          "Alım planı; açık yükleme adresi, saha kabul koşulları, yükün hazır olma zamanı ve araç erişimi değerlendirilerek netleştirilir. Böylece çözüm, yalnızca il adına değil gerçek operasyon noktasına göre hazırlanır.",
        ],
      },
    ],
    faq: [
      { question: "İzmir'den 1 palet yük gönderebilir miyim?", answer: "Evet. İzmir çıkışlı 1 paletten başlayan, sevkiyata uygun paletli ticari yükler için parsiyel taşıma planlanabilir. Uygunluk; ölçü, ağırlık, yük niteliği ve teslimat adresi birlikte değerlendirilerek teyit edilir." },
      { question: "İzmir'de yük gönderici adresinden alınır mı?", answer: "Evet. Açık adres, yükün hazır olma zamanı ve saha koşulları paylaşıldığında gönderici adresinden alım planı oluşturulabilir." },
      { question: "İzmir'den ilçelere teslimat yapılabilir mi?", answer: "Türkiye'nin 81 iline ek olarak ilçelerdeki alıcı adreslerine teslimat organize edilebilir. Teslimat planı güzergâh, yük özellikleri ve adres erişimine göre belirlenir." },
      { question: "İzmir parsiyel nakliye fiyatı için hangi bilgiler gerekir?", answer: "Çıkış ve teslimat adresleri, palet veya koli adedi, her yük grubunun ölçüleri, toplam ağırlık, istiflenebilirlik ve hazır olma tarihi doğru teklif için gereklidir." },
      { question: "Palet dışında koli gönderisi kabul edilir mi?", answer: "Paletli yükler temel hizmet kapsamındadır. Güzergâh ve yük özelliklerine göre koli ve toplu koli gönderileri için de taşıma çözümü değerlendirilebilir." },
    ],
    related: ["yurtici-parsiyel-tasimacilik", "komple-tasimacilik", "manisa-parsiyel-tasimacilik"],
    contextualLinks: [
      { anchor: "yurtiçi parsiyel taşımacılık", href: "/yurtici-parsiyel-tasimacilik" },
      { anchor: "komple araç", href: "/komple-tasimacilik" },
      { anchor: "İzmir → İstanbul", href: "/izmir-istanbul-parsiyel-tasimacilik" },
      { anchor: "İzmir → Gebze", href: "/izmir-gebze-parsiyel-tasimacilik" },
      { anchor: "İzmir → Bursa", href: "/izmir-bursa-parsiyel-tasimacilik" },
    ],
  },
  "izmir-istanbul-parsiyel-tasimacilik": {
    slug: "izmir-istanbul-parsiyel-tasimacilik",
    kind: "service",
    icon: "route",
    eyebrow: "İzmir'den İstanbul'un iki yakasına",
    title: "İzmir İstanbul Parsiyel Taşımacılık",
    lead: "İzmir'den İstanbul'a 1 paletten başlayan yüklerinizi adresinizden alıyor, İstanbul Avrupa ve Anadolu Yakası'nda alıcı adresine kadar teslim ediyoruz.",
    seoTitle: "İzmir İstanbul Parsiyel Taşımacılık | REX Lojistik",
    seoDescription: "İzmir'den İstanbul'a 1 paletten başlayan parsiyel yüklerinizi adresinizden alıyor, Avrupa ve Anadolu Yakası'nda alıcı adresine teslim ediyoruz. Hızlı teklif alın.",
    keywords: ["İzmir İstanbul parsiyel taşımacılık", "İzmir İstanbul parsiyel nakliye", "İzmir'den İstanbul'a parsiyel yük", "İzmir İstanbul palet taşıma"],
    heroPrimaryCtaLabel: "Hızlı Teklif Al",
    heroWhatsAppLabel: "WhatsApp'tan Teklif Al",
    breadcrumbParent: {
      name: "İzmir Parsiyel Taşımacılık",
      href: "/izmir-parsiyel-tasimacilik",
    },
    highlights: [
      { title: "1 Paletten Başlayan Taşıma", text: "Komple araç kapasitesine ihtiyaç duymayan yükler için rota odaklı planlama" },
      { title: "İzmir'de Adresten Alım", text: "Açık yükleme adresi ve saha koşullarına göre organize edilen alım" },
      { title: "İstanbul'da Adrese Teslim", text: "Taşıma planına göre alıcının açık teslimat adresine kadar organizasyon" },
      { title: "Avrupa + Anadolu Yakası", text: "İstanbul'un iki yakasındaki teslimat noktaları için adres bazlı değerlendirme" },
      { title: "Yüke Uygun Taşıma Planlaması", text: "Palet sayısı, hacim, ağırlık ve istiflenebilirliğe göre model seçimi" },
      { title: "Tek Noktadan Operasyon", text: "İzmir'deki alımdan İstanbul'daki teslimata REX Lojistik koordinasyonu" },
    ],
    sections: [
      {
        title: "İzmir'den İstanbul'a Parsiyel Yük Taşıma",
        paragraphs: [
          "İzmir'den İstanbul'a göndereceğiniz yük komple bir aracı doldurmuyorsa parsiyel taşımacılık daha uygun bir taşıma modeli olabilir. REX Lojistik olarak İzmir çıkışlı 1 paletten başlayan yüklerin İstanbul'a taşıma organizasyonunu sağlıyoruz.",
          "Yükü İzmir'deki gönderici adresinden alıyor, palet sayısı, ölçüler, ağırlık ve teslimat adresine göre taşıma planını oluşturuyoruz. İstanbul'da teslimatı Avrupa veya Anadolu Yakası'ndaki alıcı adresine kadar organize ediyoruz.",
          "Bu sayfa İstanbul varışlı rota planına odaklanır; diğer varış noktaları için İzmir parsiyel taşımacılık seçeneklerini inceleyebilirsiniz.",
        ],
      },
      {
        title: "İstanbul Avrupa ve Anadolu Yakası'na Adrese Teslim",
        paragraphs: [
          "İstanbul teslimatlarında yalnızca belirli bir aktarma veya teslim noktasına gönderim yapmak zorunda değilsiniz. Taşıma planına göre yükün alıcı adresine kadar teslim edilmesini organize ediyoruz.",
          "Avrupa ve Anadolu Yakası teslimatlarında yükün ölçüleri, palet sayısı, araç erişimi ve açık teslimat adresi planlamada dikkate alınır. Böylece İzmir'deki yükleme adresinden İstanbul'daki teslimat adresine kadar süreç tek operasyon üzerinden yönetilebilir.",
        ],
      },
      {
        title: "1 Palet Yük İzmir'den İstanbul'a Gönderilebilir mi?",
        paragraphs: [
          "Evet. İzmir çıkışlı İstanbul varışlı taşımalar için 1 paletten başlayan yükler organize edilebilir.",
          "Parsiyel taşımanın temel avantajı, yükünüz komple araç kapasitesine ihtiyaç duymadığında sevkiyatın yük miktarına uygun bir taşıma modeliyle planlanabilmesidir.",
          "Palet sayısı ve toplam yük hacmi arttığında ise parsiyel taşımanın yanında yük için daha uygun araç veya nakliye modeli değerlendirilir. Amaç her yükü aynı yöntemle taşımak değil, sevkiyatın özelliklerine uygun çözümü oluşturmaktır.",
        ],
      },
      {
        title: "Paletli ve Koli Yükler İçin Taşıma Seçenekleri",
        paragraphs: [
          "İzmir–İstanbul hattında paletli ticari yükler temel taşıma kapsamındadır. Ürünün taşıma ve ambalaj özelliklerine göre koli gönderileri için de çözüm oluşturulabilir.",
          "Koli gönderilerinde adet, toplam hacim, ağırlık ve ambalaj yapısı değerlendirilir. Yük miktarı arttığında toplu koli veya paletleme seçeneği taşıma planını daha verimli hale getirebilir.",
          "İstanbul dışındaki şehir bağlantıları için yurtiçi parsiyel taşımacılık hizmet kapsamını inceleyebilirsiniz.",
        ],
      },
      {
        title: "İzmir İstanbul Parsiyel Nakliye Fiyatı Nasıl Hesaplanır?",
        paragraphs: [
          "İzmir–İstanbul parsiyel taşıma fiyatı yalnızca yükün kilogramına göre belirlenmez. Palet veya koli adedi, yükün ölçüleri, toplam ağırlığı, istiflenebilir olup olmaması, İzmir'deki yükleme adresi ve İstanbul'daki teslimat adresi fiyatlandırmayı etkileyebilir.",
          "Doğru teklif hazırlayabilmemiz için temel yük bilgilerini iletmeniz yeterlidir.",
        ],
        bullets: ["Çıkış adresi", "Teslimat adresi", "Palet / koli adedi", "En × Boy × Yükseklik", "Toplam ağırlık (kg)", "İstiflenebilir mi?", "Yük hazır mı / hazır olma tarihi"],
        cta: { label: "Yük Bilgilerini Gönder – Teklif Al", href: "#izmir-istanbul-parsiyel-teklif" },
      },
      {
        title: "İzmir'de Adresten Alım Nasıl Çalışır?",
        paragraphs: [
          "Teklif ve taşıma planı oluşturulduktan sonra yükün İzmir'deki açık yükleme adresi üzerinden alımı planlanır.",
          "Yükleme öncesinde palet veya koli adedi, ölçüler, ağırlık, ürünün taşıma şekli ve yükün hazır olduğu zaman bilgisi netleştirilir. Bu bilgiler doğru araç ve taşıma planının oluşturulmasına yardımcı olur.",
        ],
      },
      {
        title: "İzmir İstanbul Parsiyel Taşıma Süreci",
        paragraphs: [
          "İzmir'deki yükleme adresinden İstanbul'daki teslimat adresine uzanan süreç, aşağıdaki beş aşamada planlanır. Her aşamada paylaşılan gerçek yük ve adres bilgileri esas alınır.",
        ],
      },
      {
        title: "Parsiyel mi, Komple Araç mı?",
        paragraphs: [
          "Bir veya birkaç paletlik yüklerde parsiyel taşıma çoğu durumda değerlendirilebilecek ilk seçeneklerden biridir. Ancak palet sayısı, toplam hacim veya ağırlık arttıkça yük için komple ya da farklı araç bazlı taşıma modeli daha uygun hale gelebilir.",
          "REX Lojistik, verilen yük bilgilerine göre sevkiyat için uygun taşıma modelini değerlendirir. Kapasite ihtiyacı yükseldiğinde komple taşımacılık seçeneği de karşılaştırmaya dahil edilir.",
        ],
      },
    ],
    steps: [
      { title: "Yük Bilgilerinin Alınması", text: "Çıkış-varış adresi, palet/koli adedi, ölçüler ve ağırlık alınır." },
      { title: "Taşıma Planının Oluşturulması", text: "Yük miktarı ve özelliklerine uygun taşıma modeli değerlendirilir." },
      { title: "İzmir'de Adresten Alım", text: "Planlanan yükleme adresinden yükün alımı organize edilir." },
      { title: "İzmir–İstanbul Taşıması", text: "Yük, belirlenen taşıma planına göre İstanbul'a sevk edilir." },
      { title: "İstanbul'da Adrese Teslim", text: "Avrupa veya Anadolu Yakası'ndaki teslimat adresine teslim organizasyonu tamamlanır." },
    ],
    faq: [
      { question: "İzmir'den İstanbul'a 1 palet gönderebilir miyim?", answer: "Evet. İzmir çıkışlı İstanbul varışlı yüklerde 1 paletten başlayan parsiyel taşıma organize edilebilir. Teklif için palet ölçüleri, ağırlık ve açık yükleme/teslimat adreslerinin paylaşılması yeterlidir." },
      { question: "İzmir'de yükü adresimden alıyor musunuz?", answer: "Evet. Taşıma planına göre yükün İzmir'deki gönderici adresinden alınması organize edilebilir." },
      { question: "İstanbul'da adrese teslim yapılıyor mu?", answer: "Evet. Taşıma planına göre yük İstanbul'daki alıcı adresine kadar teslim edilebilir." },
      { question: "İstanbul Avrupa Yakası'na teslimat yapılıyor mu?", answer: "Evet. İstanbul Avrupa Yakası için adrese teslim taşıma organizasyonu sağlanabilir." },
      { question: "İstanbul Anadolu Yakası'na teslimat yapılıyor mu?", answer: "Evet. İstanbul Anadolu Yakası için adrese teslim taşıma organizasyonu sağlanabilir." },
      { question: "İzmir İstanbul parsiyel taşıma fiyatı ne kadar?", answer: "Fiyat; yükleme ve teslimat adresi, palet/koli adedi, ölçüler, toplam ağırlık ve yükün taşıma özelliklerine göre değişebilir. Net fiyat için yük bilgilerinin paylaşılması gerekir." },
      { question: "Palet sayısı fazla olursa ne olur?", answer: "Palet sayısı veya toplam hacim arttığında parsiyel taşımanın yanında farklı araç ve nakliye seçenekleri de değerlendirilir. Yüke uygun taşıma modeli yük bilgilerine göre belirlenir." },
    ],
    finalCta: {
      title: "İzmir'den İstanbul'a Göndereceğiniz Yük İçin Teklif Alın",
      text: "Palet veya toplu yükünüzün temel bilgilerini paylaşın; İzmir'deki yükleme adresinden İstanbul'daki teslimat adresine uygun taşıma seçeneğini değerlendirelim.",
      primaryLabel: "Hızlı Teklif Al",
      whatsappLabel: "WhatsApp'tan Teklif Al",
    },
    related: ["izmir-parsiyel-tasimacilik", "yurtici-parsiyel-tasimacilik", "komple-tasimacilik"],
    contextualLinks: [
      { anchor: "İzmir parsiyel taşımacılık", href: "/izmir-parsiyel-tasimacilik" },
      { anchor: "yurtiçi parsiyel taşımacılık", href: "/yurtici-parsiyel-tasimacilik" },
      { anchor: "komple taşımacılık", href: "/komple-tasimacilik" },
    ],
  },
  "izmir-gebze-parsiyel-tasimacilik": {
    slug: "izmir-gebze-parsiyel-tasimacilik",
    kind: "service",
    icon: "route",
    eyebrow: "İzmir üretim ve ticaret bölgelerinden Gebze'ye",
    title: "İzmir Gebze Parsiyel Taşımacılık",
    lead: "İzmir'den Gebze'ye 1 paletten başlayan sanayi ve ticari yüklerinizi adresinizden alıyor, Gebze'deki alıcı adresine kadar teslim ediyoruz.",
    seoTitle: "İzmir Gebze Parsiyel Taşımacılık | REX Lojistik",
    seoDescription: "İzmir'den Gebze'ye 1 paletten başlayan sanayi ve ticari yüklerinizi adresinizden alıyor, Gebze'de alıcı adresine teslim ediyoruz. Hızlı teklif alın.",
    keywords: ["İzmir Gebze parsiyel taşımacılık", "İzmir Gebze parsiyel nakliye", "İzmir'den Gebze'ye parsiyel yük", "İzmir Gebze palet taşıma", "İzmir Gebze nakliye"],
    heroPrimaryCtaLabel: "Hızlı Teklif Al",
    heroWhatsAppLabel: "WhatsApp'tan Teklif Al",
    breadcrumbParent: {
      name: "İzmir Parsiyel Taşımacılık",
      href: "/izmir-parsiyel-tasimacilik",
    },
    highlights: [
      { title: "1 Paletten Başlayan Taşıma", text: "Komple araç kapasitesine ihtiyaç duymayan yükler için rota odaklı planlama" },
      { title: "İzmir'de Adresten Alım", text: "Açık yükleme adresi ve saha koşullarına göre organize edilen alım" },
      { title: "Gebze'de Adrese Teslim", text: "Taşıma planına göre alıcının açık teslimat adresine kadar organizasyon" },
      { title: "Sanayi + Ticari Yükler", text: "Sevkiyata uygun paletli üretim girdileri, parçalar ve ticari ürünler" },
      { title: "Yüke Uygun Taşıma Modeli", text: "Palet sayısı, hacim, ağırlık ve istiflenebilirliğe göre değerlendirme" },
      { title: "Tek Noktadan Operasyon", text: "İzmir'deki alımdan Gebze'deki teslimata REX Lojistik koordinasyonu" },
    ],
    sections: [
      {
        title: "İzmir'den Gebze'ye Parsiyel Yük Taşıma",
        paragraphs: [
          "İzmir ile Gebze arasındaki üretim, tedarik ve ticaret hareketliliğinde her yük komple araç kapasitesine ihtiyaç duymaz. Bir veya birkaç paletlik sevkiyatlarda parsiyel taşımacılık, yük miktarına uygun bir taşıma modeli oluşturulmasına imkân verir.",
          "REX Lojistik olarak İzmir çıkışlı 1 paletten başlayan yüklerin Gebze'ye taşıma organizasyonunu sağlıyoruz. Yükü İzmir'deki gönderici adresinden alıyor, palet sayısı, ölçüler, ağırlık ve teslimat noktasına göre taşıma planını oluşturuyor ve Gebze'deki alıcı adresine teslimatı organize ediyoruz.",
          "Bu sayfa Gebze varışlı rota planına odaklanır; diğer varış noktaları için İzmir parsiyel taşımacılık seçeneklerini inceleyebilirsiniz.",
        ],
      },
      {
        title: "İzmir'in Sanayi ve Ticaret Bölgelerinden Gebze'ye Taşıma",
        paragraphs: [
          "İzmir'in sanayi, üretim, depolama ve ticaret bölgelerinden Gebze yönüne farklı büyüklüklerde yük hareketleri oluşmaktadır. Komple araç kapasitesine ihtiyaç duymayan paletli yüklerde parsiyel taşıma, sevkiyat miktarına göre değerlendirilebilecek seçeneklerden biridir.",
          "Kemalpaşa, Bornova, Işıkkent, Gaziemir, Çiğli, Torbalı, Aliağa, Menemen ve çevresindeki üretim veya ticaret noktalarından çıkacak yükler için açık yükleme adresine göre alım planlaması oluşturulabilir.",
        ],
      },
      {
        title: "Sanayi Yüklerinin Yanında Ticari Yükler de Taşınabilir",
        paragraphs: [
          "İzmir–Gebze hattındaki taşıma ihtiyacı yalnızca sanayi üretimiyle sınırlı değildir. Sevkiyata uygun şekilde ambalajlanmış paletli sanayi ürünleri, üretim girdileri, makine ve ekipman parçaları ile paletli ticari ürünler yük özelliklerine göre değerlendirilebilir.",
          "Paletli yüklerin yanı sıra güzergâh, koli adedi, toplam hacim, ağırlık ve ambalaj özelliklerine göre koli veya toplu koli gönderileri için de taşıma çözümü oluşturulabilir.",
          "Gebze dışındaki yurtiçi hatlar için yurtiçi parsiyel taşımacılık hizmet kapsamını inceleyebilirsiniz.",
        ],
      },
      {
        title: "1 Palet İzmir'den Gebze'ye Gönderilebilir mi?",
        paragraphs: [
          "Evet. İzmir çıkışlı Gebze varışlı yüklerde 1 paletten başlayan taşıma organize edilebilir.",
          "Komple araç kapasitesine ihtiyaç duymayan bir veya birkaç paletlik yüklerde parsiyel taşıma değerlendirilebilir. Palet sayısı, toplam hacim veya ağırlık arttığında ise farklı araç ve nakliye seçenekleri daha uygun hale gelebilir.",
          "Bu nedenle taşıma modeli yalnızca palet sayısına değil, yükün ölçülerine, ağırlığına, hacmine ve teslimat noktasına göre değerlendirilir.",
        ],
      },
      {
        title: "İzmir Gebze Parsiyel Nakliye Fiyatı Nasıl Hesaplanır?",
        paragraphs: [
          "İzmir–Gebze parsiyel taşıma fiyatı yalnızca kilogram üzerinden belirlenmez. İzmir'deki açık yükleme adresi, Gebze'deki teslimat adresi, palet veya koli adedi, yük ölçüleri, toplam ağırlık ve istiflenebilirlik durumu fiyatlandırmayı etkileyebilir.",
          "Doğru teklif ve uygun taşıma modelinin belirlenebilmesi için temel yük bilgilerini paylaşmanız yeterlidir.",
        ],
        bullets: ["Çıkış adresi", "Teslimat adresi", "Palet / koli adedi", "En × Boy × Yükseklik", "Toplam kg", "İstiflenebilir mi?", "Yük hazır mı / hazır olma tarihi"],
        cta: { label: "Yük Bilgilerini Gönder – Teklif Al", href: "#izmir-gebze-parsiyel-teklif" },
      },
      {
        title: "İzmir'de Adresten Alım, Gebze'de Adrese Teslim",
        paragraphs: [
          "Yükünüzün bir ambar veya nakliye noktasına tarafınızdan götürülmesi zorunlu değildir. Taşıma planına göre yük İzmir'deki gönderici adresinden alınabilir ve Gebze'deki alıcı adresine kadar teslimatı organize edilebilir.",
          "Açık yükleme ve teslimat adreslerinin teklif aşamasında paylaşılması, hem fiyatlandırmanın hem de taşıma planının doğru oluşturulmasına yardımcı olur.",
        ],
      },
      {
        title: "İzmir Gebze Parsiyel Taşıma Süreci",
        paragraphs: [
          "İzmir'deki yükleme adresinden Gebze'deki teslimat adresine uzanan süreç, beş aşamada planlanır. Her aşamada paylaşılan gerçek yük ve adres bilgileri esas alınır.",
        ],
      },
      {
        title: "Parsiyel Taşıma mı, Komple Araç mı?",
        paragraphs: [
          "Bir veya birkaç paletlik sevkiyatlarda parsiyel taşıma değerlendirilebilecek seçeneklerden biridir. Ancak yük miktarı, palet sayısı, toplam hacim veya ağırlık arttığında araç bazlı taşıma daha uygun hale gelebilir.",
          "REX Lojistik, verilen yük bilgilerine göre parsiyel taşıma ile komple araç seçeneklerini değerlendirerek sevkiyat için uygun taşıma modelinin oluşturulmasını sağlar. Kapasite ihtiyacı yükseldiğinde komple taşımacılık seçeneği de karşılaştırmaya dahil edilir.",
        ],
      },
      {
        title: "İzmir–Gebze Hattı Neden Önemli?",
        paragraphs: [
          "İzmir'in üretim ve ticaret yapısı ile Gebze'nin yoğun sanayi ve tedarik ağı, iki bölge arasında düzenli yük hareketi oluşmasına neden olur. Özellikle komple araç kapasitesine ulaşmayan paletli sevkiyatlarda yük miktarına uygun taşıma planlaması önem kazanır.",
          "REX Lojistik, İzmir çıkışlı sanayi ve ticari yüklerin Gebze'deki işletme veya alıcı adreslerine ulaştırılması için yük özelliklerine göre taşıma organizasyonu oluşturur.",
        ],
      },
    ],
    steps: [
      { title: "Yük Bilgilerinin Alınması", text: "İzmir yükleme adresi, Gebze teslimat adresi, palet/koli adedi, ölçüler ve ağırlık alınır." },
      { title: "Taşıma Modelinin Belirlenmesi", text: "Yükün miktarı ve özelliklerine göre uygun taşıma modeli değerlendirilir." },
      { title: "İzmir'de Adresten Alım", text: "Belirlenen gönderici adresinden yük alımı organize edilir." },
      { title: "İzmir–Gebze Taşıması", text: "Yük, oluşturulan taşıma planına göre Gebze'ye sevk edilir." },
      { title: "Gebze'de Adrese Teslim", text: "Alıcının açık adresine teslimat organize edilir." },
    ],
    faq: [
      { question: "İzmir'den Gebze'ye 1 palet gönderebilir miyim?", answer: "Evet. İzmir çıkışlı Gebze varışlı yüklerde 1 paletten başlayan taşıma organize edilebilir. Teklif için palet ölçüleri, ağırlık ve yükleme/teslimat adreslerinin paylaşılması yeterlidir." },
      { question: "İzmir'de yükü adresimden alıyor musunuz?", answer: "Evet. Taşıma planına göre yükün İzmir'deki gönderici adresinden alınması organize edilebilir." },
      { question: "Gebze'de adrese teslim yapılıyor mu?", answer: "Evet. Taşıma planına göre yükün Gebze'deki alıcı adresine teslim edilmesi organize edilebilir." },
      { question: "Sanayi yükleri taşınabiliyor mu?", answer: "Sevkiyata uygun şekilde ambalajlanmış paletli sanayi ve ticari yükler, yük özelliklerine göre değerlendirilebilir. Özel taşıma koşulu gerektiren ürünlerde yük detaylarının teklif öncesinde paylaşılması gerekir." },
      { question: "İzmir Gebze parsiyel nakliye fiyatı ne kadar?", answer: "Fiyat; İzmir'deki yükleme adresi, Gebze'deki teslimat adresi, palet/koli adedi, ölçüler, toplam ağırlık ve yükün taşıma özelliklerine göre değişebilir. Net fiyat için yük bilgilerinin paylaşılması gerekir." },
      { question: "İzmir'den Gebze'ye koli gönderilebilir mi?", answer: "Güzergâh, koli adedi, toplam hacim, ağırlık ve ambalaj özelliklerine göre koli veya toplu koli gönderileri için taşıma çözümü değerlendirilebilir." },
      { question: "Palet sayısı arttığında ne olur?", answer: "Palet sayısı veya toplam hacim arttığında parsiyel taşımanın yanında farklı araç veya komple taşıma seçenekleri de değerlendirilebilir. Uygun taşıma modeli yük özelliklerine göre belirlenir." },
    ],
    finalCta: {
      title: "İzmir'den Gebze'ye Göndereceğiniz Yük İçin Teklif Alın",
      text: "Paletli sanayi veya ticari yükünüzün bilgilerini paylaşın; İzmir'deki yükleme adresinden Gebze'deki teslimat adresine uygun taşıma seçeneğini değerlendirelim.",
      primaryLabel: "Hızlı Teklif Al",
      whatsappLabel: "WhatsApp'tan Teklif Al",
    },
    related: ["izmir-parsiyel-tasimacilik", "yurtici-parsiyel-tasimacilik", "komple-tasimacilik"],
    contextualLinks: [
      { anchor: "İzmir parsiyel taşımacılık", href: "/izmir-parsiyel-tasimacilik" },
      { anchor: "yurtiçi parsiyel taşımacılık", href: "/yurtici-parsiyel-tasimacilik" },
      { anchor: "komple taşımacılık", href: "/komple-tasimacilik" },
    ],
  },
  "izmir-bursa-parsiyel-tasimacilik": {
    slug: "izmir-bursa-parsiyel-tasimacilik",
    kind: "service",
    icon: "route",
    eyebrow: "İzmir'in sanayi ve ticaret bölgelerinden Bursa'ya",
    title: "İzmir Bursa Parsiyel Taşımacılık",
    lead: "İzmir'den Bursa'ya 1 paletten başlayan sanayi ve ticari yüklerinizi adresinizden alıyor, Bursa'daki alıcı adresine kadar teslim ediyoruz.",
    seoTitle: "İzmir Bursa Parsiyel Taşımacılık | REX Lojistik",
    seoDescription: "İzmir'den Bursa'ya 1 paletten başlayan sanayi ve ticari yüklerinizi adresinizden alıyor, Bursa'da alıcı adresine teslim ediyoruz. Hızlı teklif alın.",
    keywords: ["İzmir Bursa parsiyel taşımacılık", "İzmir Bursa parsiyel nakliye", "İzmir'den Bursa'ya parsiyel yük", "İzmir Bursa palet taşıma", "İzmir Bursa nakliye"],
    heroPrimaryCtaLabel: "Hızlı Teklif Al",
    heroWhatsAppLabel: "WhatsApp'tan Teklif Al",
    breadcrumbParent: {
      name: "İzmir Parsiyel Taşımacılık",
      href: "/izmir-parsiyel-tasimacilik",
    },
    highlights: [
      { title: "1 Paletten Başlayan Taşıma", text: "Komple araç kapasitesine ihtiyaç duymayan yükler için rota odaklı planlama" },
      { title: "İzmir'de Adresten Alım", text: "Açık yükleme adresi ve saha koşullarına göre organize edilen alım" },
      { title: "Bursa'da Adrese Teslim", text: "Taşıma planına göre alıcının açık teslimat adresine kadar organizasyon" },
      { title: "Sanayi + Ticari Yükler", text: "Sevkiyata uygun paletli üretim girdileri, parçalar ve ticari ürünler" },
      { title: "Yüke Uygun Taşıma Modeli", text: "Palet sayısı, hacim, ağırlık ve istiflenebilirliğe göre değerlendirme" },
      { title: "Tek Noktadan Operasyon", text: "İzmir'deki alımdan Bursa'daki teslimata REX Lojistik koordinasyonu" },
    ],
    sections: [
      {
        title: "İzmir'den Bursa'ya Parsiyel Yük Taşıma",
        paragraphs: [
          "İzmir ve Bursa arasındaki üretim, tedarik ve ticaret hareketliliğinde her sevkiyat komple araç kapasitesine ihtiyaç duymaz. Bir veya birkaç paletlik sanayi ve ticari yüklerde parsiyel taşımacılık, yük miktarına uygun bir taşıma modeli oluşturulmasına imkân verir.",
          "REX Lojistik olarak İzmir çıkışlı 1 paletten başlayan yüklerin Bursa'ya taşıma organizasyonunu sağlıyoruz. Yükü İzmir'deki gönderici adresinden alıyor, palet sayısı, ölçüler, ağırlık ve Bursa'daki teslimat noktasına göre taşıma planını oluşturuyoruz.",
          "Bu sayfa Bursa varışlı rota planına odaklanır; diğer varış noktaları için İzmir parsiyel taşımacılık seçeneklerini inceleyebilirsiniz.",
        ],
      },
      {
        title: "Kemalpaşa, Işıkkent, Torbalı ve Çiğli'den Bursa'ya Yük Taşıma",
        paragraphs: [
          "İzmir'in üretim, sanayi ve ticaret bölgelerinden Bursa yönüne farklı büyüklüklerde sevkiyat ihtiyaçları oluşabilir. Kemalpaşa, Işıkkent, Torbalı ve Çiğli gibi üretim ve ticaret yoğunluğu bulunan bölgelerden çıkacak paletli yüklerde, komple araç kapasitesine ihtiyaç duyulmuyorsa parsiyel taşıma değerlendirilebilir.",
          "Yükün açık adresi, palet sayısı, ölçüleri ve ağırlığı paylaşıldığında adresten alım ve Bursa'daki teslimat noktasına uygun taşıma planlaması oluşturulabilir.",
          "Bursa merkezinin yanı sıra Nilüfer, Osmangazi, İnegöl veya Gemlik gibi farklı teslimat noktalarında açık adres bilgisi taşıma planının oluşturulmasında dikkate alınır.",
        ],
      },
      {
        title: "İzmir–Bursa Hattında Sanayi ve Ticari Yükler",
        paragraphs: [
          "İzmir–Bursa hattındaki taşıma ihtiyacı yalnızca tek bir sektöre bağlı değildir. Sevkiyata uygun şekilde ambalajlanmış üretim girdileri, makine ve ekipman parçaları, paletli sanayi ürünleri ve genel ticari yükler yük özelliklerine göre değerlendirilebilir.",
          "Bursa'nın otomotiv, makine ve üretim ekosistemi nedeniyle tedarik amaçlı parça ve malzeme sevkiyatlarında da parsiyel taşıma ihtiyacı oluşabilir. Bununla birlikte her ürünün taşıma koşulları ayrı değerlendirilmelidir.",
          "Paletli yüklerin yanında güzergâh, koli adedi, toplam hacim, ağırlık ve ambalaj özelliklerine göre koli veya toplu koli gönderileri için de taşıma çözümü değerlendirilebilir. Diğer hatlar için yurtiçi parsiyel taşımacılık hizmet kapsamını inceleyebilirsiniz.",
        ],
      },
      {
        title: "1 Palet İzmir'den Bursa'ya Gönderilebilir mi?",
        paragraphs: [
          "Evet. İzmir çıkışlı Bursa varışlı yüklerde 1 paletten başlayan taşıma organize edilebilir.",
          "Bir veya birkaç paletlik sevkiyatlarda parsiyel taşıma değerlendirilebilir. Palet sayısı, toplam hacim veya ağırlık arttığında ise farklı araç ve nakliye modelleri daha uygun hale gelebilir.",
          "Bu nedenle taşıma modeli yalnızca palet adedine değil, yükün ölçülerine, toplam ağırlığına, hacmine ve teslimat noktasına göre değerlendirilir.",
        ],
      },
      {
        title: "İzmir Bursa Parsiyel Nakliye Fiyatı Nasıl Hesaplanır?",
        paragraphs: [
          "İzmir–Bursa parsiyel taşıma fiyatı yalnızca kilogram üzerinden belirlenmez. İzmir'deki açık yükleme adresi, Bursa'daki teslimat adresi, palet veya koli adedi, yük ölçüleri, toplam ağırlık ve istiflenebilirlik durumu fiyatlandırmayı etkileyebilir.",
          "Doğru teklif ve taşıma modelinin belirlenebilmesi için yükün temel bilgilerini paylaşmanız yeterlidir.",
        ],
        bullets: ["Çıkış adresi", "Teslimat adresi", "Palet / koli adedi", "En × Boy × Yükseklik", "Toplam kg", "İstiflenebilir mi?", "Yük hazır mı / hazır olma tarihi"],
        cta: { label: "Yük Bilgilerini Gönder – Teklif Al", href: "#izmir-bursa-parsiyel-teklif" },
      },
      {
        title: "İzmir'de Adresten Alım, Bursa'da Adrese Teslim",
        paragraphs: [
          "Yükünüzün bir ambar veya nakliye noktasına tarafınızdan bırakılması zorunlu değildir. Taşıma planına göre yük İzmir'deki gönderici adresinden alınabilir ve Bursa'daki alıcı adresine kadar teslimatı organize edilebilir.",
          "Açık yükleme ve teslimat adreslerinin teklif aşamasında paylaşılması, fiyatlandırmanın ve taşıma planının doğru oluşturulmasına yardımcı olur.",
        ],
      },
      {
        title: "İzmir Bursa Parsiyel Taşıma Süreci",
        paragraphs: [
          "İzmir'deki yükleme adresinden Bursa'daki teslimat adresine uzanan süreç, beş aşamada planlanır. Her aşamada paylaşılan gerçek yük ve adres bilgileri esas alınır.",
        ],
      },
      {
        title: "Palet Sayısı Arttığında Parsiyel mi, Komple Araç mı?",
        paragraphs: [
          "Bir veya birkaç paletlik yüklerde parsiyel taşıma değerlendirilebilecek seçeneklerden biridir. Ancak palet sayısı, toplam hacim, ağırlık veya yükün kapladığı araç kapasitesi arttığında araç bazlı taşıma daha uygun hale gelebilir.",
          "REX Lojistik, verilen yük bilgilerine göre parsiyel ve komple taşıma seçeneklerini değerlendirerek sevkiyata uygun taşıma modelinin oluşturulmasını sağlar. Kapasite ihtiyacı yükseldiğinde komple taşımacılık seçeneği de karşılaştırmaya dahil edilir.",
        ],
      },
      {
        title: "İzmir–Bursa Hattı Neden Önemli?",
        paragraphs: [
          "İzmir'in sanayi ve ticaret altyapısı ile Bursa'nın güçlü üretim ekosistemi, iki şehir arasında sanayi ürünleri, tedarik malzemeleri ve ticari yüklerin hareketine zemin oluşturur.",
          "Özellikle komple araç kapasitesine ulaşmayan sevkiyatlarda yük miktarına uygun taşıma modelinin seçilmesi önem kazanır. REX Lojistik, İzmir'deki yükleme adresinden Bursa'daki teslimat adresine kadar yük özelliklerine uygun taşıma organizasyonunu oluşturur.",
        ],
      },
    ],
    steps: [
      { title: "Yük Bilgilerinin Alınması", text: "İzmir yükleme adresi, Bursa teslimat adresi, palet/koli adedi, ölçüler ve ağırlık alınır." },
      { title: "Taşıma Modelinin Belirlenmesi", text: "Yük miktarı, hacmi ve özelliklerine göre uygun taşıma modeli değerlendirilir." },
      { title: "İzmir'de Adresten Alım", text: "Belirlenen gönderici adresinden yük alımı organize edilir." },
      { title: "İzmir–Bursa Taşıması", text: "Yük, oluşturulan taşıma planına göre Bursa'ya sevk edilir." },
      { title: "Bursa'da Adrese Teslim", text: "Yükün alıcı adresine teslimatı organize edilir." },
    ],
    faq: [
      { question: "İzmir'den Bursa'ya 1 palet gönderebilir miyim?", answer: "Evet. İzmir çıkışlı Bursa varışlı yüklerde 1 paletten başlayan taşıma organize edilebilir. Teklif için palet ölçüleri, ağırlık ve açık yükleme/teslimat adreslerinin paylaşılması yeterlidir." },
      { question: "İzmir'de yükü adresimden alıyor musunuz?", answer: "Evet. Taşıma planına göre yükün İzmir'deki gönderici adresinden alınması organize edilebilir." },
      { question: "Bursa'da adrese teslim yapılıyor mu?", answer: "Evet. Taşıma planına göre yükün Bursa'daki alıcı adresine teslim edilmesi organize edilebilir." },
      { question: "Sanayi yükleri taşınabiliyor mu?", answer: "Sevkiyata uygun şekilde ambalajlanmış paletli sanayi ve ticari yükler, yük özelliklerine göre değerlendirilebilir. Özel taşıma koşulu gerektiren ürünlerde yük detaylarının teklif öncesinde paylaşılması gerekir." },
      { question: "İzmir Bursa parsiyel nakliye fiyatı ne kadar?", answer: "Fiyat; İzmir'deki yükleme adresi, Bursa'daki teslimat adresi, palet/koli adedi, ölçüler, toplam ağırlık ve yükün taşıma özelliklerine göre değişebilir. Net teklif için yük bilgilerinin paylaşılması gerekir." },
      { question: "İzmir'den Bursa'ya koli gönderebilir miyim?", answer: "Güzergâh, koli adedi, toplam hacim, ağırlık ve ambalaj özelliklerine göre koli veya toplu koli gönderileri için taşıma çözümü değerlendirilebilir." },
      { question: "Palet sayısı arttığında ne olur?", answer: "Palet sayısı veya toplam hacim arttığında parsiyel taşımanın yanında farklı araç veya komple taşıma seçenekleri de değerlendirilebilir. Uygun taşıma modeli yük özelliklerine göre belirlenir." },
    ],
    finalCta: {
      title: "İzmir'den Bursa'ya Göndereceğiniz Yük İçin Teklif Alın",
      text: "Paletli sanayi veya ticari yükünüzün bilgilerini paylaşın; İzmir'deki yükleme adresinden Bursa'daki teslimat adresine uygun taşıma seçeneğini değerlendirelim.",
      primaryLabel: "Hızlı Teklif Al",
      whatsappLabel: "WhatsApp'tan Teklif Al",
    },
    related: ["izmir-parsiyel-tasimacilik", "yurtici-parsiyel-tasimacilik", "komple-tasimacilik"],
    contextualLinks: [
      { anchor: "İzmir parsiyel taşımacılık", href: "/izmir-parsiyel-tasimacilik" },
      { anchor: "yurtiçi parsiyel taşımacılık", href: "/yurtici-parsiyel-tasimacilik" },
      { anchor: "komple taşımacılık", href: "/komple-tasimacilik" },
    ],
  },
  "manisa-parsiyel-tasimacilik": {
    slug: "manisa-parsiyel-tasimacilik",
    kind: "service",
    icon: "route",
    eyebrow: "Manisa üretim bölgelerinden Türkiye geneline",
    title: "Manisa Parsiyel Taşımacılık",
    lead: "Manisa'dan 1 paletten başlayan parsiyel yüklerinizi adresinizden alıyor, Türkiye'nin 81 iline ve ilçelere alıcı adresine kadar teslim ediyoruz.",
    seoTitle: "Manisa Parsiyel Taşımacılık | 1 Paletten Türkiye Geneli | REX Lojistik",
    seoDescription: "Manisa'dan 1 paletten başlayan parsiyel yüklerinizi adresinizden alıyor, Türkiye'nin 81 iline ve ilçelere adrese teslim ediyoruz. REX Lojistik'ten hızlı teklif alın.",
    keywords: ["Manisa parsiyel taşımacılık", "Manisa parsiyel nakliye", "Manisa palet taşımacılığı", "Manisa Türkiye geneli nakliye"],
    heroPrimaryCtaLabel: "Hızlı Teklif Al",
    heroWhatsAppLabel: "WhatsApp'tan Teklif Al",
    highlights: [
      { title: "Manisa'da Adresten Alım", text: "Üretim ve ticaret noktalarından açık yükleme adresine göre planlama" },
      { title: "Esnek Kapasite Seçimi", text: "Bir paletten daha yüksek hacimlere kadar yüke uygun taşıma modeli" },
      { title: "81 İl ve İlçeler", text: "Türkiye genelindeki alıcı adreslerine kontrollü teslimat organizasyonu" },
    ],
    sections: [
      {
        title: "Manisa'dan Türkiye Geneline Parsiyel Taşımacılık",
        paragraphs: [
          "Manisa'nın üretim ve sanayi yapısında her sevkiyat komple araç gerektirmez. Bir veya birkaç paletlik yüklerde parsiyel taşıma, kullanılmayan araç kapasitesi için komple araç maliyetine katlanmadan taşıma planlanmasına imkân verir.",
          "REX Lojistik olarak Manisa çıkışlı 1 paletten başlayan yüklerin adresinizden alınmasını ve Türkiye genelinde alıcı adresine teslim edilmesini organize ediyoruz. Taşıma modeli yükün palet sayısı, ölçüleri, ağırlığı, güzergâhı ve teslimat noktasına göre belirlenir.",
        ],
      },
      {
        title: "Manisa Parsiyel Hizmetinin Avantajları",
        paragraphs: [
          "Manisa çıkışlı parsiyel taşımacılık hizmetimiz, sanayi ve ticaret yüklerinin gerçek kapasite ihtiyacına göre esnek biçimde organize edilmesini sağlar.",
        ],
        bullets: [
          "1 paletten başlayan taşıma",
          "Manisa'da adresten alım",
          "Türkiye genelinde adrese teslim",
          "81 il ve ilçelere ulaşım",
          "Palet sayısına göre uygun taşıma modeli",
          "Parsiyel ve gerektiğinde araç bazlı çözüm",
          "Tek noktadan operasyon takibi",
        ],
      },
      {
        title: "Manisa'nın Sanayi ve Üretim Bölgelerinden Yük Alımı",
        paragraphs: [
          "Manisa merkez ve çevresindeki üretim, sanayi ve ticaret noktalarından yapılacak sevkiyatlarda yükleme adresine göre alım planlaması oluşturulabilir.",
          "Manisa OSB, Yunusemre, Şehzadeler, Muradiye, Turgutlu, Akhisar ve Salihli gibi üretim ve ticaret yoğunluğu bulunan bölgelerden çıkacak paletli yükler için Türkiye geneline taşıma organizasyonu sağlanabilir.",
          "Planlama, bölgede fiziksel bir şube veya depo iddiasına değil; bildirilen açık adres, saha koşulları ve yükün hazır olma zamanına dayanır.",
        ],
      },
      {
        title: "Paletli ve Toplu Yükler İçin Esnek Taşıma Planlaması",
        paragraphs: [
          "Bir paletlik yük ile daha yüksek palet adetlerindeki sevkiyatların taşıma ihtiyacı aynı olmayabilir. Bu nedenle taşıma modelini yalnızca 'parsiyel' etiketiyle sınırlandırmıyor; palet sayısı ve toplam hacim arttığında yük için uygun nakliye modelini değerlendiriyoruz.",
          "Paletli yükler temel hizmet kapsamındadır. Güzergâh ve yük özelliklerine göre koli veya toplu koli gönderileri için de çözüm oluşturulabilir. Kapasite arttığında komple taşımacılık alternatifi de yükün gerçek ihtiyacına göre karşılaştırılabilir.",
        ],
      },
      {
        title: "Manisa Parsiyel Nakliye Fiyatı Nasıl Hesaplanır?",
        paragraphs: [
          "Manisa çıkışlı parsiyel yüklerde fiyat; yükleme ve teslimat adresi, palet/koli adedi, ölçüler, toplam ağırlık, istiflenebilirlik ve yükün hazır olma tarihine göre değerlendirilir.",
          "Yük bilgilerini ilettiğinizde sevkiyat için uygun taşıma modeli belirlenerek teklif hazırlanabilir.",
        ],
        bullets: ["Çıkış adresi", "Teslimat adresi", "Palet / koli adedi", "En × Boy × Yükseklik", "Toplam kg", "İstiflenebilirlik", "Hazır olma tarihi"],
        cta: { label: "Yük Bilgilerini Gönder – Teklif Al", href: "#manisa-parsiyel-teklif" },
      },
      {
        title: "Manisa'dan Sık Talep Edilen Parsiyel Güzergâhlar",
        paragraphs: [
          "Manisa'nın üretim noktalarından Marmara, İç Anadolu, Ege ve Akdeniz yönlerine farklı hacimlerde sevkiyat talepleri oluşabilir. Aşağıdaki hatlar doğal rota örnekleridir; hizmet alanını yalnızca bu şehirlerle sınırlandırmaz.",
          "Bu güzergâhların dışında Türkiye'nin 81 iline ve ilçelere taşıma organizasyonu sağlanabilir.",
        ],
        bullets: ["Manisa → Gebze", "Manisa → İstanbul", "Manisa → Ankara", "Manisa → Bursa", "Manisa → Kocaeli", "Manisa → İzmir", "Manisa → Konya", "Manisa → Adana", "Manisa → Antalya"],
      },
      {
        title: "Adresten Alım ve Adrese Teslim",
        paragraphs: [
          "Parsiyel yükünüzün bir aktarma veya ambar noktasına sizin tarafınızdan götürülmesi zorunlu değildir. Uygun taşıma planlaması kapsamında yük Manisa'daki gönderici adresinden alınabilir ve varış noktasında alıcının adresine kadar teslimat organize edilebilir.",
          "Bu yapı özellikle düzenli sevkiyat yapan üretici, tedarikçi ve işletmeler için taşıma sürecinin tek noktadan yönetilmesini kolaylaştırır. Parsiyel taşımacılık hizmetimiz, adres ve yük bilgileri netleştirildikten sonra Türkiye geneline göre planlanır.",
        ],
      },
    ],
    faq: [
      { question: "Manisa'dan 1 palet yük gönderebilir miyim?", answer: "Evet. Manisa çıkışlı 1 paletten başlayan sevkiyata uygun paletli ticari yükler için parsiyel taşıma organize edilebilir. Yük ölçüleri, ağırlık, nitelik ve teslimat adresi teklif öncesinde değerlendirilir." },
      { question: "Manisa OSB ve çevresinden adresten alım yapılabilir mi?", answer: "Manisa OSB, Yunusemre, Şehzadeler, Muradiye ve çevredeki üretim noktalarında açık adres ile saha koşulları paylaşıldığında adresten alım planlanabilir." },
      { question: "Palet sayısı arttığında yine parsiyel taşıma mı kullanılır?", answer: "Her zaman değil. Palet sayısı, hacim ve ağırlık arttığında parsiyel seçenek ile uygun araç bazlı çözüm karşılaştırılarak sevkiyata uygun model belirlenir." },
      { question: "Manisa parsiyel nakliye fiyatı nasıl hesaplanır?", answer: "Fiyat; yükleme ve teslimat adresi, palet veya koli adedi, ölçüler, toplam ağırlık, istiflenebilirlik ve hazır olma tarihine göre hazırlanır." },
      { question: "Manisa'dan Türkiye'nin ilçelerine teslimat yapılabilir mi?", answer: "Evet. Türkiye'nin 81 iline ve ilçelerdeki alıcı adreslerine teslimat organize edilebilir. Kesin plan güzergâh, adres erişimi ve yük özelliklerine göre paylaşılır." },
    ],
    related: ["yurtici-parsiyel-tasimacilik", "komple-tasimacilik", "izmir-parsiyel-tasimacilik"],
    contextualLinks: [
      { anchor: "Parsiyel taşımacılık hizmetimiz", href: "/yurtici-parsiyel-tasimacilik" },
      { anchor: "komple taşımacılık", href: "/komple-tasimacilik" },
      { anchor: "Manisa → Gebze", href: "/manisa-gebze-parsiyel-tasimacilik" },
      { anchor: "Manisa → Bursa", href: "/manisa-bursa-parsiyel-tasimacilik" },
    ],
  },
  "manisa-gebze-parsiyel-tasimacilik": {
    slug: "manisa-gebze-parsiyel-tasimacilik",
    kind: "service",
    icon: "route",
    eyebrow: "Manisa sanayisinden Gebze'ye",
    title: "Manisa Gebze Parsiyel Taşımacılık",
    lead: "Manisa'dan Gebze'ye 1 paletten başlayan sanayi ve ticari yüklerinizi adresinizden alıyor, Gebze'deki alıcı adresine kadar teslim ediyoruz.",
    seoTitle: "Manisa Gebze Parsiyel Taşımacılık | REX Lojistik",
    seoDescription: "Manisa'dan Gebze'ye 1 paletten başlayan sanayi ve ticari yüklerinizi adresinizden alıyor, Gebze'de alıcı adresine teslim ediyoruz. Hızlı teklif alın.",
    keywords: ["Manisa Gebze parsiyel taşımacılık", "Manisa Gebze parsiyel nakliye", "Manisa'dan Gebze'ye parsiyel yük", "Manisa Gebze palet taşıma", "Manisa Gebze nakliye"],
    heroPrimaryCtaLabel: "Hızlı Teklif Al",
    heroWhatsAppLabel: "WhatsApp'tan Teklif Al",
    breadcrumbParent: {
      name: "Manisa Parsiyel Taşımacılık",
      href: "/manisa-parsiyel-tasimacilik",
    },
    highlights: [
      { title: "1 Paletten Başlayan Taşıma", text: "Komple araç kapasitesine ihtiyaç duymayan yükler için rota odaklı planlama" },
      { title: "Manisa'da Adresten Alım", text: "Açık yükleme adresi ve saha koşullarına göre organize edilen alım" },
      { title: "Gebze'de Adrese Teslim", text: "Taşıma planına göre alıcının açık teslimat adresine kadar organizasyon" },
      { title: "Sanayi + Ticari Yükler", text: "Sevkiyata uygun paletli üretim girdileri, parçalar ve ticari ürünler" },
      { title: "Yüke Uygun Taşıma Modeli", text: "Palet sayısı, hacim, ağırlık ve istiflenebilirliğe göre değerlendirme" },
      { title: "Tek Noktadan Operasyon", text: "Manisa'daki alımdan Gebze'deki teslimata REX Lojistik koordinasyonu" },
    ],
    sections: [
      {
        title: "Manisa'dan Gebze'ye Parsiyel Yük Taşıma",
        paragraphs: [
          "Manisa ile Gebze arasındaki sanayi ve ticaret hareketliliğinde her sevkiyat komple araç kapasitesine ihtiyaç duymaz. Bir veya birkaç paletlik üretim ve ticari yüklerde parsiyel taşımacılık, yük miktarına uygun bir taşıma modeli oluşturulmasına imkân verir.",
          "REX Lojistik olarak Manisa çıkışlı 1 paletten başlayan yüklerin Gebze'ye taşıma organizasyonunu sağlıyoruz. Yükü Manisa'daki gönderici adresinden alıyor, palet sayısı, ölçüler, ağırlık ve teslimat noktasına göre taşıma planını oluşturuyor ve Gebze'deki alıcı adresine teslimatı organize ediyoruz.",
          "Bu sayfa Gebze varışlı rota planına odaklanır; diğer varış noktaları için Manisa parsiyel taşımacılık seçeneklerini inceleyebilirsiniz.",
        ],
      },
      {
        title: "Manisa Sanayisinden Gebze'ye Taşıma Çözümleri",
        paragraphs: [
          "Manisa'nın üretim ve sanayi yapısı ile Gebze'nin güçlü sanayi ve ticaret ağı arasında farklı ölçekte düzenli yük hareketleri oluşmaktadır. Komple araç gerektirmeyen paletli sevkiyatlarda parsiyel taşıma, üretici ve tedarikçiler için değerlendirilebilecek taşıma modellerinden biridir.",
          "Manisa OSB, Muradiye, Yunusemre, Şehzadeler, Turgutlu, Akhisar ve çevresindeki üretim veya ticaret noktalarından çıkacak yükler için yükleme adresine göre alım planlaması oluşturulabilir.",
        ],
      },
      {
        title: "Hangi Sanayi ve Ticari Yükler Taşınabilir?",
        paragraphs: [
          "Manisa–Gebze parsiyel taşıma çözümü, sevkiyata uygun şekilde ambalajlanmış paletli sanayi ve ticari yüklerde kullanılabilir. Üretim girdileri, ambalajlı ticari ürünler, makine ve ekipman parçaları ile farklı paletli ürün grupları yük özelliklerine göre değerlendirilebilir.",
          "Paletli yüklerin yanı sıra güzergâh, ambalaj, adet, hacim ve ağırlığa göre koli veya toplu koli gönderileri için de taşıma çözümü oluşturulabilir.",
          "Gebze dışındaki yurtiçi hatlar için yurtiçi parsiyel taşımacılık hizmet kapsamını inceleyebilirsiniz.",
        ],
      },
      {
        title: "1 Palet Manisa'dan Gebze'ye Gönderilebilir mi?",
        paragraphs: [
          "Evet. Manisa çıkışlı Gebze varışlı yüklerde 1 paletten başlayan taşıma organize edilebilir.",
          "Bir veya birkaç paletlik yüklerde parsiyel taşıma değerlendirilebilirken palet sayısı, toplam hacim veya ağırlık arttığında farklı araç ve nakliye seçenekleri daha uygun hale gelebilir.",
          "Bu nedenle taşıma modeli yalnızca palet adedine değil, yükün tamamının özelliklerine göre değerlendirilir.",
        ],
      },
      {
        title: "Manisa Gebze Parsiyel Nakliye Fiyatı Nasıl Hesaplanır?",
        paragraphs: [
          "Manisa–Gebze parsiyel taşıma fiyatı yalnızca kilogram üzerinden hesaplanmaz. Manisa'daki açık yükleme adresi, Gebze'deki teslimat adresi, palet veya koli adedi, yükün ölçüleri, toplam ağırlığı ve istiflenebilirlik durumu fiyatlandırmayı etkileyebilir.",
          "Doğru taşıma seçeneği ve fiyat için yükün temel bilgilerini paylaşmanız yeterlidir.",
        ],
        bullets: ["Çıkış adresi", "Teslimat adresi", "Palet / koli adedi", "En × Boy × Yükseklik", "Toplam kg", "İstiflenebilir mi?", "Yük hazır mı / hazır olma tarihi"],
        cta: { label: "Yük Bilgilerini Gönder – Teklif Al", href: "#manisa-gebze-parsiyel-teklif" },
      },
      {
        title: "Manisa'da Adresten Alım, Gebze'de Adrese Teslim",
        paragraphs: [
          "Yükün bir nakliye noktasına gönderici tarafından bırakılması zorunlu değildir. Taşıma planına göre yükün Manisa'daki gönderici adresinden alınması ve Gebze'deki alıcı adresine teslim edilmesi organize edilebilir.",
          "Yükleme ve teslimat adreslerinin açık olarak paylaşılması, taşıma planının ve fiyatlandırmanın doğru oluşturulmasına yardımcı olur.",
        ],
      },
      {
        title: "Manisa Gebze Parsiyel Taşıma Süreci",
        paragraphs: [
          "Manisa'daki yükleme adresinden Gebze'deki teslimat adresine uzanan süreç, beş aşamada planlanır. Her aşamada paylaşılan gerçek yük ve adres bilgileri esas alınır.",
        ],
      },
      {
        title: "Palet Sayısı Arttığında Hangi Taşıma Modeli Kullanılır?",
        paragraphs: [
          "Yük miktarı arttığında parsiyel taşıma her zaman en uygun seçenek olmayabilir. Palet sayısı, toplam hacim, ağırlık ve yükün kapladığı araç kapasitesine göre farklı araç veya komple taşıma seçenekleri değerlendirilebilir.",
          "REX Lojistik, yük bilgilerine göre parsiyel ve araç bazlı alternatifleri değerlendirerek sevkiyata uygun taşıma modelinin oluşturulmasını sağlar.",
        ],
      },
      {
        title: "Gebze Neden Önemli Bir Teslimat Noktası?",
        paragraphs: [
          "Gebze, Kocaeli'nin sanayi ve ticaret yoğunluğu yüksek bölgelerinden biridir. Üretici, tedarikçi ve sanayi işletmelerinin yoğunluğu nedeniyle Manisa çıkışlı paletli ve ticari yüklerde önemli teslimat noktalarından biri olarak öne çıkar.",
          "REX Lojistik, Manisa çıkışlı yüklerin Gebze'deki işletme veya alıcı adreslerine ulaştırılması için yük özelliklerine uygun taşıma planlaması oluşturur.",
        ],
      },
    ],
    steps: [
      { title: "Yük Bilgilerinin Alınması", text: "Manisa yükleme adresi, Gebze teslimat adresi, palet/koli adedi, ölçüler ve ağırlık alınır." },
      { title: "Uygun Taşıma Modelinin Belirlenmesi", text: "Yük miktarı, hacmi ve özelliklerine göre parsiyel veya uygun alternatif taşıma modeli değerlendirilir." },
      { title: "Manisa'da Adresten Alım", text: "Belirlenen gönderici adresinden yük alımı organize edilir." },
      { title: "Manisa–Gebze Taşıması", text: "Yük belirlenen taşıma planına göre Gebze'ye sevk edilir." },
      { title: "Gebze'de Adrese Teslim", text: "Yükün alıcı adresine teslimatı organize edilir." },
    ],
    faq: [
      { question: "Manisa'dan Gebze'ye 1 palet gönderebilir miyim?", answer: "Evet. Manisa çıkışlı Gebze varışlı yüklerde 1 paletten başlayan taşıma organize edilebilir. Teklif için palet ölçüleri, ağırlık ve yükleme/teslimat adreslerinin paylaşılması yeterlidir." },
      { question: "Manisa'da yükü adresimden alıyor musunuz?", answer: "Evet. Taşıma planına göre yükün Manisa'daki gönderici adresinden alınması organize edilebilir." },
      { question: "Gebze'de adrese teslim yapılıyor mu?", answer: "Evet. Taşıma planına göre yükün Gebze'deki alıcı adresine teslim edilmesi organize edilebilir." },
      { question: "Sanayi yükleri taşınabiliyor mu?", answer: "Sevkiyata uygun şekilde ambalajlanmış paletli sanayi ve ticari yükler, yük özelliklerine göre değerlendirilebilir. Özel taşıma koşulu gerektiren ürünlerde yük detaylarının teklif öncesinde paylaşılması gerekir." },
      { question: "Manisa Gebze parsiyel taşıma fiyatı ne kadar?", answer: "Fiyat; yükleme ve teslimat adresi, palet/koli adedi, ölçüler, toplam ağırlık ve yükün taşıma özelliklerine göre değişebilir. Net teklif için yük bilgilerinin paylaşılması gerekir." },
      { question: "Palet sayısı fazla olduğunda parsiyel taşıma yapılır mı?", answer: "Palet sayısı ve toplam hacim arttığında parsiyel taşımanın yanında farklı araç veya komple taşıma seçenekleri de değerlendirilebilir. Uygun model yükün özelliklerine göre belirlenir." },
      { question: "Manisa'dan Gebze'ye koli gönderebilir miyim?", answer: "Güzergâh, koli adedi, toplam hacim, ağırlık ve ambalaj özelliklerine göre koli veya toplu koli gönderileri için taşıma çözümü değerlendirilebilir." },
    ],
    finalCta: {
      title: "Manisa'dan Gebze'ye Göndereceğiniz Yük İçin Teklif Alın",
      text: "Paletli sanayi veya ticari yükünüzün bilgilerini paylaşın; Manisa'daki yükleme adresinden Gebze'deki teslimat adresine uygun taşıma seçeneğini değerlendirelim.",
      primaryLabel: "Hızlı Teklif Al",
      whatsappLabel: "WhatsApp'tan Teklif Al",
    },
    related: ["manisa-parsiyel-tasimacilik", "yurtici-parsiyel-tasimacilik", "komple-tasimacilik"],
    contextualLinks: [
      { anchor: "Manisa parsiyel taşımacılık", href: "/manisa-parsiyel-tasimacilik" },
      { anchor: "yurtiçi parsiyel taşımacılık", href: "/yurtici-parsiyel-tasimacilik" },
      { anchor: "komple taşıma", href: "/komple-tasimacilik" },
    ],
  },
  "manisa-bursa-parsiyel-tasimacilik": {
    slug: "manisa-bursa-parsiyel-tasimacilik",
    kind: "service",
    icon: "route",
    eyebrow: "Manisa üretim ve ticaret bölgelerinden Bursa'ya",
    title: "Manisa Bursa Parsiyel Taşımacılık",
    lead: "Manisa'dan Bursa'ya 1 paletten başlayan sanayi ve ticari yüklerinizi adresinizden alıyor, Bursa'daki alıcı adresine kadar teslim ediyoruz.",
    seoTitle: "Manisa Bursa Parsiyel Taşımacılık | REX Lojistik",
    seoDescription: "Manisa'dan Bursa'ya 1 paletten başlayan sanayi ve ticari yüklerinizi adresinizden alıyor, Bursa'da alıcı adresine teslim ediyoruz. Hızlı teklif alın.",
    keywords: ["Manisa Bursa parsiyel taşımacılık", "Manisa Bursa parsiyel nakliye", "Manisa'dan Bursa'ya parsiyel yük", "Manisa Bursa palet taşıma", "Manisa Bursa nakliye", "Manisa'dan Bursa'ya yük gönderme"],
    heroPrimaryCtaLabel: "Hızlı Teklif Al",
    heroWhatsAppLabel: "WhatsApp'tan Teklif Al",
    breadcrumbParent: {
      name: "Manisa Parsiyel Taşımacılık",
      href: "/manisa-parsiyel-tasimacilik",
    },
    highlights: [
      { title: "1 Paletten Başlayan Taşıma", text: "Komple araç kapasitesine ihtiyaç duymayan yükler için rota odaklı planlama" },
      { title: "Manisa'da Adresten Alım", text: "Açık yükleme adresi ve saha koşullarına göre organize edilen alım" },
      { title: "Bursa'da Adrese Teslim", text: "Taşıma planına göre alıcının açık teslimat adresine kadar organizasyon" },
      { title: "Sanayi + Ticari Yükler", text: "Sevkiyata uygun paletli üretim girdileri, parçalar ve ticari ürünler" },
      { title: "Yüke Uygun Taşıma Modeli", text: "Palet sayısı, hacim, ağırlık ve istiflenebilirliğe göre değerlendirme" },
      { title: "Tek Noktadan Operasyon", text: "Manisa'daki alımdan Bursa'daki teslimata REX Lojistik koordinasyonu" },
    ],
    sections: [
      {
        title: "Manisa'dan Bursa'ya Parsiyel Yük Taşıma",
        paragraphs: [
          "Manisa ve Bursa, üretim ve sanayi faaliyetlerinin yoğun olduğu iki önemli bölgedir. Bu iki şehir arasındaki sevkiyatlarda her yük komple araç kapasitesine ihtiyaç duymaz. Bir veya birkaç paletlik sanayi ve ticari yüklerde parsiyel taşımacılık, yük miktarına uygun taşıma planı oluşturulmasına imkân verir.",
          "REX Lojistik olarak Manisa çıkışlı 1 paletten başlayan yüklerin Bursa'ya taşıma organizasyonunu sağlıyoruz. Yükü Manisa'daki gönderici adresinden alıyor, palet sayısı, ölçüler, ağırlık ve Bursa'daki teslimat noktasına göre taşıma planını oluşturuyoruz.",
          "Bu sayfa Bursa varışlı rota planına odaklanır; diğer varış noktaları için Manisa parsiyel taşımacılık seçeneklerini inceleyebilirsiniz.",
        ],
      },
      {
        title: "Manisa–Bursa Sanayi ve Üretim Hattında Parsiyel Taşıma",
        paragraphs: [
          "Manisa'daki üretici ve tedarikçiler ile Bursa'daki sanayi ve ticaret işletmeleri arasında farklı ölçekte sevkiyat ihtiyaçları oluşabilir. Komple araç kapasitesine ulaşmayan paletli yüklerde parsiyel taşıma, sevkiyat miktarına göre değerlendirilebilecek taşıma seçeneklerinden biridir.",
          "Manisa OSB, Muradiye, Yunusemre, Şehzadeler, Turgutlu, Akhisar ve çevresindeki üretim veya ticaret noktalarından çıkacak yükler için açık yükleme adresine göre alım planlaması oluşturulabilir.",
          "Bursa varışında Nilüfer, Osmangazi, Yıldırım, İnegöl veya Gemlik yönündeki teslimatlar, açık adres ve yük özellikleri esas alınarak taşıma planına dahil edilebilir.",
        ],
      },
      {
        title: "Bursa'ya Hangi Sanayi ve Ticari Yükler Gönderilebilir?",
        paragraphs: [
          "Sevkiyata uygun şekilde ambalajlanmış paletli sanayi ve ticari ürünler Manisa–Bursa hattında yük özelliklerine göre değerlendirilebilir. Üretim girdileri, makine ve ekipman parçaları, ambalajlı sanayi ürünleri ve paletli ticari ürünler bu kapsamdaki yük gruplarına örnek olabilir.",
          "Bursa'nın otomotiv ve makine üretimiyle güçlü ilişkisi nedeniyle üretici ve tedarikçilerden gelen parça ve malzeme sevkiyatlarında da parsiyel taşıma ihtiyacı oluşabilir. Ancak her yükün taşıma koşulları ayrı değerlendirilmelidir.",
          "Paletli yüklerin yanında güzergâh, koli adedi, toplam hacim, ağırlık ve ambalaj özelliklerine göre koli veya toplu koli gönderileri için de taşıma çözümü değerlendirilebilir. Diğer hatlar için yurtiçi parsiyel taşımacılık hizmet kapsamını inceleyebilirsiniz.",
        ],
      },
      {
        title: "1 Palet Manisa'dan Bursa'ya Gönderilebilir mi?",
        paragraphs: [
          "Evet. Manisa çıkışlı Bursa varışlı yüklerde 1 paletten başlayan taşıma organize edilebilir.",
          "Bir veya birkaç paletlik yüklerde parsiyel taşıma değerlendirilebilirken, palet sayısı ve toplam yük hacmi arttığında farklı araç veya nakliye modelleri daha uygun hale gelebilir.",
          "Bu nedenle taşıma modeli yükün palet sayısı, ölçüleri, toplam ağırlığı, hacmi ve teslimat noktasına göre değerlendirilir.",
        ],
      },
      {
        title: "Manisa Bursa Parsiyel Nakliye Fiyatı Nasıl Hesaplanır?",
        paragraphs: [
          "Manisa–Bursa parsiyel taşıma fiyatı yalnızca kilogram üzerinden belirlenmez. Manisa'daki açık yükleme adresi, Bursa'daki teslimat adresi, palet veya koli adedi, yük ölçüleri, toplam ağırlık ve istiflenebilirlik durumu fiyatlandırmayı etkileyebilir.",
          "Doğru teklif ve taşıma modelinin belirlenebilmesi için temel yük bilgilerini paylaşmanız yeterlidir.",
        ],
        bullets: ["Çıkış adresi", "Teslimat adresi", "Palet / koli adedi", "En × Boy × Yükseklik", "Toplam kg", "İstiflenebilir mi?", "Yük hazır mı / hazır olma tarihi"],
        cta: { label: "Yük Bilgilerini Gönder – Teklif Al", href: "#manisa-bursa-parsiyel-teklif" },
      },
      {
        title: "Manisa'da Adresten Alım, Bursa'da Adrese Teslim",
        paragraphs: [
          "Yükün gönderici tarafından bir ambar veya nakliye noktasına bırakılması zorunlu değildir. Taşıma planına göre yükün Manisa'daki gönderici adresinden alınması ve Bursa'daki alıcı adresine teslim edilmesi organize edilebilir.",
          "Açık yükleme ve teslimat adreslerinin teklif aşamasında paylaşılması, taşıma planının ve fiyatlandırmanın doğru oluşturulmasına yardımcı olur.",
        ],
      },
      {
        title: "Manisa Bursa Parsiyel Taşıma Süreci",
        paragraphs: [
          "Manisa'daki yükleme adresinden Bursa'daki teslimat adresine uzanan süreç, beş aşamada planlanır. Her aşamada paylaşılan gerçek yük ve adres bilgileri esas alınır.",
        ],
      },
      {
        title: "Palet Sayısı Arttığında Parsiyel mi, Komple Araç mı?",
        paragraphs: [
          "Yük miktarı arttığında parsiyel taşıma her sevkiyat için en uygun seçenek olmayabilir. Palet sayısı, toplam hacim, ağırlık ve yükün kapladığı araç kapasitesine göre araç bazlı veya komple taşıma seçeneği değerlendirilebilir.",
          "REX Lojistik, verilen yük bilgilerine göre parsiyel ve komple taşıma seçeneklerini değerlendirerek sevkiyata uygun taşıma modelinin oluşturulmasını sağlar. Kapasite ihtiyacı yükseldiğinde komple taşımacılık seçeneği de karşılaştırmaya dahil edilir.",
        ],
      },
      {
        title: "Manisa–Bursa Hattı Neden Önemli?",
        paragraphs: [
          "Manisa ve Bursa'nın güçlü üretim altyapısı, iki şehir arasında sanayi ürünleri, tedarik malzemeleri ve ticari yüklerin hareketine zemin oluşturur. Özellikle komple araç kapasitesine ulaşmayan sevkiyatlarda yük miktarına uygun taşıma planlaması önem kazanır.",
          "REX Lojistik, Manisa'daki yükleme adresinden Bursa'daki teslimat adresine kadar sanayi ve ticari yükler için uygun taşıma organizasyonunu oluşturur.",
        ],
      },
    ],
    steps: [
      { title: "Yük Bilgilerinin Alınması", text: "Manisa yükleme adresi, Bursa teslimat adresi, palet/koli adedi, ölçüler ve ağırlık alınır." },
      { title: "Taşıma Modelinin Belirlenmesi", text: "Yük miktarı, hacmi ve özelliklerine göre uygun taşıma modeli değerlendirilir." },
      { title: "Manisa'da Adresten Alım", text: "Belirlenen gönderici adresinden yük alımı organize edilir." },
      { title: "Manisa–Bursa Taşıması", text: "Yük oluşturulan taşıma planına göre Bursa'ya sevk edilir." },
      { title: "Bursa'da Adrese Teslim", text: "Yükün alıcı adresine teslimatı organize edilir." },
    ],
    faq: [
      { question: "Manisa'dan Bursa'ya 1 palet gönderebilir miyim?", answer: "Evet. Manisa çıkışlı Bursa varışlı yüklerde 1 paletten başlayan taşıma organize edilebilir. Teklif için palet ölçüleri, ağırlık ve açık yükleme/teslimat adreslerinin paylaşılması yeterlidir." },
      { question: "Manisa'da yükü adresimden alıyor musunuz?", answer: "Evet. Taşıma planına göre yükün Manisa'daki gönderici adresinden alınması organize edilebilir." },
      { question: "Bursa'da adrese teslim yapılıyor mu?", answer: "Evet. Taşıma planına göre yükün Bursa'daki alıcı adresine teslim edilmesi organize edilebilir." },
      { question: "Sanayi yükleri taşınabiliyor mu?", answer: "Sevkiyata uygun şekilde ambalajlanmış paletli sanayi ve ticari yükler, yük özelliklerine göre değerlendirilebilir. Özel taşıma koşulu gerektiren ürünlerde yük detaylarının teklif öncesinde paylaşılması gerekir." },
      { question: "Manisa Bursa parsiyel nakliye fiyatı ne kadar?", answer: "Fiyat; Manisa'daki yükleme adresi, Bursa'daki teslimat adresi, palet/koli adedi, ölçüler, toplam ağırlık ve yükün taşıma özelliklerine göre değişebilir. Net teklif için yük bilgilerinin paylaşılması gerekir." },
      { question: "Manisa'dan Bursa'ya koli gönderebilir miyim?", answer: "Güzergâh, koli adedi, toplam hacim, ağırlık ve ambalaj özelliklerine göre koli veya toplu koli gönderileri için taşıma çözümü değerlendirilebilir." },
      { question: "Palet sayısı arttığında ne olur?", answer: "Palet sayısı veya toplam hacim arttığında parsiyel taşımanın yanında farklı araç veya komple taşıma seçenekleri de değerlendirilebilir. Uygun taşıma modeli yük özelliklerine göre belirlenir." },
    ],
    finalCta: {
      title: "Manisa'dan Bursa'ya Göndereceğiniz Yük İçin Teklif Alın",
      text: "Paletli sanayi veya ticari yükünüzün bilgilerini paylaşın; Manisa'daki yükleme adresinden Bursa'daki teslimat adresine uygun taşıma seçeneğini değerlendirelim.",
      primaryLabel: "Hızlı Teklif Al",
      whatsappLabel: "WhatsApp'tan Teklif Al",
    },
    related: ["manisa-parsiyel-tasimacilik", "yurtici-parsiyel-tasimacilik", "komple-tasimacilik"],
    contextualLinks: [
      { anchor: "Manisa parsiyel taşımacılık", href: "/manisa-parsiyel-tasimacilik" },
      { anchor: "yurtiçi parsiyel taşımacılık", href: "/yurtici-parsiyel-tasimacilik" },
      { anchor: "komple taşımacılık", href: "/komple-tasimacilik" },
    ],
  },
  "denizyolu-parsiyel-tasimacilik": {
    slug: "denizyolu-parsiyel-tasimacilik",
    kind: "service",
    icon: "ship",
    eyebrow: "LCL · Paylaşımlı konteyner",
    title: "Denizyolu Parsiyel Taşımacılık (LCL)",
    lead: "Konteynerin tamamını doldurmayan ticari yüklerinizi; uygun maliyet, hareket programı ve teslim hedefini birlikte gözeten LCL seçenekleriyle limandan limana veya kapıdan kapıya organize ediyoruz.",
    seoTitle: "Denizyolu Parsiyel Taşımacılık (LCL) | REX Lojistik",
    seoDescription: "LCL denizyolu parsiyel taşımacılık, CBM bazlı yük planlama, konsolidasyon, liman ve kapı teslim seçenekleri için REX Lojistik'ten teklif alın.",
    keywords: ["denizyolu parsiyel taşımacılık", "LCL taşımacılık", "parsiyel deniz kargo", "palet denizyolu taşıma", "LCL navlun"],
    highlights: [
      { title: "Akılcı Maliyet", text: "Kullanılan hacme uygun seçenekler toplam taşıma kapsamıyla karşılaştırılır" },
      { title: "Planlı Transit", text: "Konsolidasyon kapanışı ve gemi programı teslim hedefiyle eşleştirilir" },
      { title: "Uçtan Uca Akış", text: "Depo, liman ve teslim adresi arasındaki etaplar tek planda ele alınır" },
    ],
    sections: [
      {
        title: "LCL taşımacılık nasıl çalışır?",
        paragraphs: [
          "LCL, aynı varış yönünde ilerleyen farklı göndericilere ait yüklerin bir konteynerde konsolide edilmesidir. Gönderici komple konteyner yerine kullandığı hacim ve taşıma koşullarına göre planlanan hizmetten yararlanır. Bu model, denizyolu taşımacılığı ana hizmetinin düşük hacimli yükler için kullanılan seçeneğidir.",
          "REX Lojistik; yükün koli veya palet adedini, ölçülerini, brüt ağırlığını, çıkış ve teslim adreslerini değerlendirir. Farklı çıkış programları ve liman bağlantıları arasından maliyet ile transit süre dengesini kuran seçenekler tek teklif kapsamında açıklanır.",
        ],
        bullets: ["Paletli ve kolili ticari yükler", "İthalat ve ihracat yönlü LCL organizasyonu", "Depodan limana ve limandan adrese transfer", "Yük ve taşıma evrakı koordinasyonu"],
      },
      {
        title: "Teklifte hangi bilgiler gerekir?",
        paragraphs: [
          "Doğru LCL teklifi için her ambalajın en, boy ve yüksekliği; adet, brüt ağırlık, ürün tanımı ve istiflenebilirlik bilgisi paylaşılmalıdır. Bu bilgiler toplam CBM ile ağırlık esaslı ücretlendirme karşılaştırmasının yapılmasını sağlar.",
          "Çıkış ve varış masrafları, konsolidasyon hizmeti, liman işlemleri ve kara transferleri teklif kapsamına göre değişebilir. Bu nedenle yalnızca ana navlun rakamı değil; kapıdan kapıya toplam maliyet, hareket günü ve tahmini transit süre birlikte karşılaştırılır.",
        ],
      },
      {
        title: "LCL ne zaman güçlü bir seçenektir?",
        paragraphs: [
          "Konteynerin tamamını doldurmayan, sevk tarihi konsolidasyon programına uyabilen ve uygun şekilde ambalajlanmış yüklerde LCL önemli bir alternatiftir. Düzenli çıkışa uygun yüklerde gereksiz kapasite maliyetini azaltırken öngörülebilir bir sevk takvimi kurmaya yardımcı olur. Yük hacmi yükseldiğinde ise LCL ile FCL toplam maliyeti ve transit planı birlikte karşılaştırılmalıdır.",
          "Hassas, kırılabilir veya özel elleçleme gerektiren ürünlerde yalnızca maliyet değil; aktarma, yükleme şekli ve hasar riski de seçim kriteri olmalıdır.",
        ],
      },
    ],
    steps: [
      { title: "Yük ölçümü", text: "Koli veya palet ölçüleri, adet ve brüt ağırlık alınır." },
      { title: "Konsolidasyon", text: "Uygun çıkış programı ve liman bağlantısı belirlenir." },
      { title: "Denizyolu sevki", text: "Yük konteynere alınır ve planlanan gemiyle taşınır." },
      { title: "Ayrıştırma & teslim", text: "Varışta yük ayrıştırılır ve seçilen kapsama göre teslim edilir." },
    ],
    faq: [
      { question: "LCL ile bir palet gönderilebilir mi?", answer: "Evet. Ölçüleri, ağırlığı, ürün niteliği ve güzergâhı uygun olan tek paletli ticari yükler LCL olarak planlanabilir." },
      { question: "LCL fiyatı sadece CBM'ye göre mi hesaplanır?", answer: "Her zaman değil. Hacim, brüt ağırlık, rota, ürün, yerel masraflar ve hizmet kapsamı birlikte değerlendirilir. Bazı tarifelerde hacim ve ağırlık karşılaştırması kullanılır." },
      { question: "LCL taşıma FCL'den daha mı ucuzdur?", answer: "Düşük hacimlerde avantajlı olabilir; ancak hacim yükseldikçe konsolidasyon ve yerel masraflar nedeniyle FCL alternatifiyle toplam maliyet karşılaştırması yapılmalıdır." },
      { question: "Kapıdan kapıya LCL hizmeti alınabilir mi?", answer: "Uygun hatlarda çıkış ve varış kara taşımaları LCL operasyona eklenerek kapıdan kapıya plan hazırlanabilir." },
    ],
    related: ["cbm-hesaplama", "lcl-mi-fcl-mi", "denizyolu-konteyner-tasimaciligi"],
    contextualLinks: [
      { anchor: "denizyolu taşımacılığı", href: "/denizyolu-tasimaciligi" },
      { anchor: "FCL", href: "/denizyolu-konteyner-tasimaciligi" },
    ],
  },
  "denizyolu-konteyner-tasimaciligi": {
    slug: "denizyolu-konteyner-tasimaciligi",
    kind: "service",
    icon: "ship",
    eyebrow: "FCL · Komple konteyner",
    title: "Denizyolu Konteyner Taşımacılığı (FCL)",
    lead: "İthalat ve ihracat yüklerinizi; doğru ekipman, rekabetçi toplam maliyet ve teslim hedefinize uygun gemi programı odağında FCL konteyner seçenekleriyle planlıyoruz.",
    seoTitle: "Denizyolu Konteyner Taşımacılığı (FCL) | REX Lojistik",
    seoDescription: "FCL komple konteyner taşımacılığı, 20 ve 40 feet konteyner seçenekleri, liman ve kapı teslim operasyonları için REX Lojistik'ten teklif alın.",
    keywords: ["denizyolu konteyner taşımacılığı", "FCL taşımacılık", "komple konteyner", "20 DC konteyner", "40 HC konteyner"],
    highlights: [
      { title: "Maliyet Kontrolü", text: "Navlun ve yerel masraflar toplam taşıma bedeli üzerinden değerlendirilir" },
      { title: "Program Seçeneği", text: "Gemi hareketleri teslim hedefi ve ekipman uygunluğuyla karşılaştırılır" },
      { title: "Doğru Ekipman", text: "Kapasite kaybını ve operasyon gecikmesini azaltan konteyner seçimi yapılır" },
    ],
    sections: [
      {
        title: "FCL konteyner taşımacılığı nedir?",
        paragraphs: [
          "FCL, denizyolu taşımacılığı kapsamında bir konteynerin tek göndericinin yüküne ayrıldığı taşıma modelidir. Konteynerin fiziksel olarak tamamen dolması şart değildir; gönderici tahsis edilen konteynerin tamamını kullanır.",
          "Bu model, yüksek hacimli yüklerde, düzenli ihracat ve ithalat programlarında veya diğer yüklerle konsolide edilmesi tercih edilmeyen ürünlerde değerlendirilir. Daha düşük hacimli yüklerde LCL seçeneğiyle toplam maliyet ve transit planı karşılaştırılabilir. Konteyner türü; ürün, toplam ağırlık, hacim, yükleme biçimi ve kapı açıklığı dikkate alınarak belirlenir. Doğru ekipman seçimi kullanılmayan kapasiteyi, yeniden elleçlemeyi ve zaman kaybını azaltmaya yardımcı olur.",
        ],
        bullets: ["20 DC, 40 DC ve 40 HC seçenekleri", "Reefer, Open Top ve Flat Rack değerlendirmesi", "Liman-liman veya kapı-kapı organizasyon", "İthalat ve ihracat taşıma evrakı koordinasyonu"],
      },
      {
        title: "Doğru konteyner nasıl seçilir?",
        paragraphs: [
          "Ağır fakat düşük hacimli yükler ile hafif fakat hacimli yükler aynı konteyner ihtiyacını oluşturmaz. İç ölçüler, kapı açıklığı, yük dağılımı, ambalaj ve yükleme ekipmanı birlikte kontrol edilmelidir.",
          "Standart ölçü tabloları ön planlama için kullanılır. Rezervasyon öncesinde tahsis edilen ekipmanın teknik özellikleri ve operasyonun geçerli ağırlık sınırları ayrıca teyit edilmelidir.",
        ],
      },
      {
        title: "Toplam maliyeti etkileyen kalemler",
        paragraphs: [
          "Deniz navlununun yanında çıkış ve varış terminal masrafları, kara taşıması, ekipman teslimi, serbest süre, ardiye, demuraj ve detention koşulları toplam maliyeti etkileyebilir.",
          "Teklifte dahil ve hariç hizmetlerin, teslim şeklinin, yükleme adresinin ve serbest sürelerin açık biçimde belirtilmesi sonradan oluşabilecek maliyet farklarını azaltır. Alternatif gemi programları aynı kapsamla karşılaştırılarak bütçe ve teslim tarihi arasında daha dengeli bir seçim yapılır.",
        ],
      },
    ],
    steps: [
      { title: "Kapasite analizi", text: "Yük ölçüsü, ağırlığı ve yükleme yöntemi değerlendirilir." },
      { title: "Ekipman & rezervasyon", text: "Uygun konteyner ve gemi programı seçilir." },
      { title: "Yükleme & liman", text: "Konteyner temini, dolum ve liman teslimi koordine edilir." },
      { title: "Varış & son teslim", text: "Varış operasyonu ve seçilen kara bağlantısı takip edilir." },
    ],
    faq: [
      { question: "FCL için konteyner tamamen dolu olmak zorunda mı?", answer: "Hayır. FCL, konteynerin tek göndericiye tahsis edilmesini ifade eder; konteynerin fiziksel olarak tamamen dolması zorunlu değildir." },
      { question: "20 DC ile 40 HC arasındaki temel fark nedir?", answer: "40 HC daha uzun ve daha yüksek iç hacim sunar. Doğru seçim yalnızca hacme değil, toplam ağırlığa, yük dağılımına ve operasyon koşullarına göre yapılır." },
      { question: "Konteyner taşımasında kapıdan kapıya hizmet verilebilir mi?", answer: "Uygun güzergâhlarda konteynerin yükleme adresine temini ve varışta teslim adresine ulaştırılması denizyolu planına dahil edilebilir." },
      { question: "Demuraj ve detention nasıl önlenir?", answer: "Serbest sürelerin önceden bilinmesi, evrak ve teslim programının hazırlanması ve konteyner hareketlerinin zamanında tamamlanması riski azaltır; koşullar taşıyıcı ve limana göre değişir." },
    ],
    related: ["konteyner-olculeri", "lcl-mi-fcl-mi", "denizyolu-parsiyel-tasimacilik"],
    contextualLinks: [
      { anchor: "denizyolu taşımacılığı", href: "/denizyolu-tasimaciligi" },
      { anchor: "LCL", href: "/denizyolu-parsiyel-tasimacilik" },
    ],
  },
  "lcl-mi-fcl-mi": {
    slug: "lcl-mi-fcl-mi",
    kind: "guide",
    icon: "ship",
    eyebrow: "Karşılaştırmalı seçim rehberi",
    title: "LCL mi FCL mi?",
    lead: "Parsiyel denizyolu ile komple konteyner seçeneklerini; yalnızca CBM üzerinden değil, kapıdan kapıya toplam maliyet ve hedeflenen transit süre birlikte düşünülerek karşılaştırın.",
    seoTitle: "LCL mi FCL mi? Denizyolu Taşıma Karşılaştırması | REX",
    seoDescription: "LCL ve FCL arasındaki farkları; hacim, maliyet, elleçleme ve teslim süresi açısından karşılaştırın. Yükünüz için doğru denizyolu modelini seçin.",
    keywords: ["LCL mi FCL mi", "LCL FCL farkı", "parsiyel mi konteyner mi", "denizyolu taşıma karşılaştırma"],
    highlights: [], sections: [], faq: [],
    related: ["cbm-hesaplama", "denizyolu-parsiyel-tasimacilik", "denizyolu-konteyner-tasimaciligi"],
  },
  "konteyner-olculeri": {
    slug: "konteyner-olculeri",
    kind: "guide",
    icon: "ship",
    eyebrow: "Teknik ölçü ve kapasite rehberi",
    title: "Konteyner Ölçüleri ve Kapasiteleri",
    lead: "20 DC, 40 DC ve 40 HC konteynerleri karşılaştırarak gereksiz kapasite maliyetini azaltan ve yüklemeyi hızlandıran ekipman seçimine sağlam bir başlangıç yapın.",
    seoTitle: "20'lik, 40'lık ve 40 HC Konteyner Ölçüleri | REX",
    seoDescription: "20 DC, 40 DC ve 40 HC konteyner iç ölçüleri, kapı açıklıkları ve yaklaşık hacimleri. Yük planlaması için karşılaştırma tablosu.",
    keywords: ["konteyner ölçüleri", "20 lik konteyner ölçüleri", "40 lık konteyner ölçüleri", "40 HC ölçüleri", "konteyner kapasitesi"],
    highlights: [], sections: [], faq: [],
    related: ["cbm-hesaplama", "denizyolu-konteyner-tasimaciligi", "lcl-mi-fcl-mi"],
  },
  "cbm-hesaplama": {
    slug: "cbm-hesaplama",
    kind: "guide",
    icon: "ship",
    eyebrow: "Ücretsiz yük hacmi aracı",
    title: "CBM Hesaplama Aracı",
    lead: "Koli veya palet ölçülerinizi girerek toplam hacmi ve ağırlığı netleştirin; size uygun maliyet ve transit süre seçeneklerinin daha hızlı hazırlanmasını sağlayın.",
    seoTitle: "CBM Hesaplama Aracı | Denizyolu Hacim Hesabı | REX",
    seoDescription: "Ücretsiz CBM hesaplama aracıyla koli ve paletlerinizin toplam metreküpünü, brüt ağırlığını ve yaklaşık LCL W/M değerini hesaplayın.",
    keywords: ["CBM hesaplama", "metreküp hesaplama", "koli hacmi hesaplama", "LCL hesaplama", "konteyner hacim hesaplama"],
    highlights: [], sections: [], faq: [],
    related: ["lcl-mi-fcl-mi", "konteyner-olculeri", "denizyolu-parsiyel-tasimacilik"],
  },
  "express-kargo": {
    slug: "express-kargo",
    kind: "service",
    icon: "zap",
    eyebrow: "Türkiye'den dünyaya, dünyadan Türkiye'ye",
    title: "Uluslararası Express Kargo",
    lead: "Dosya, numune, yedek parça ve ticari paketlerinizi Türkiye'den 220'den fazla ülke ve bölgeye ulaştırıyor; desteklenen noktalardaki ithalat gönderilerinizi adresten alıp Türkiye'deki teslim adresine getiriyoruz.",
    seoTitle: "Uluslararası Express Kargo ve İthalat Gönderisi | REX",
    seoDescription: "Türkiye'den dünyaya ve dünyadan Türkiye'ye kapıdan kapıya express kargo. İhracat ve ithalat paketleri için uygun servis, süre ve fiyat seçenekleri.",
    keywords: ["express kargo", "uluslararası express kargo", "yurtdışı kargo", "yurtdışından Türkiye'ye kargo", "ithalat express kargo", "kapıdan kapıya kargo"],
    highlights: [
      { title: "Çift Yönlü Servis", text: "Türkiye'den çıkış ve yurt dışından Türkiye'ye adresten alım" },
      { title: "Tek Muhatap", text: "Servis karşılaştırması, rezervasyon ve takip tek operasyon akışında" },
      { title: "Doğru Servis Dengesi", text: "Teslim hedefi ile toplam maliyet birlikte değerlendirilir" },
    ],
    sections: [
      {
        title: "Göndeririz. Getiririz. Takip ederiz.",
        paragraphs: [
          "Express kargo yalnızca yurt dışına paket göndermek değildir. Tedarikçiniz veya müşteriniz desteklenen bir ülkedeyse gönderinin bulunduğu adresten alınmasını, Türkiye'ye taşınmasını ve belirlediğiniz adrese teslimini de aynı akışta planlarız.",
          "REX Lojistik; ülke, posta kodu, içerik, ölçü, ağırlık ve teslim hedefini birlikte değerlendirir. Böylece müşterinin karşısına taşıyıcı isimlerinden oluşan karmaşık bir liste değil, ihtiyaca uyan açık servis seçenekleri çıkar. Dünyanın neresinden gelirse gelsin, gönderiniz REX'te tek operasyona dönüşür.",
        ],
        bullets: ["Ticari numune ve doküman", "Küçük yedek parça ve paket", "Yurt dışından adresten alım", "Takip numarasıyla görünür süreç"],
      },
      {
        title: "Uygun global servis nasıl seçilir?",
        paragraphs: [
          "Gönderiye ve hatta göre DHL Express, FedEx, UPS veya Aramex gibi global taşıyıcıların erişilebilir servis alternatifleri değerlendirilebilir. Nihai seçenek; çıkış-varış posta kodu, ürün kabulü, ölçü-ağırlık, kapasite ve hedef teslim süresine göre belirlenir. Standart express paket sınırlarını aşan paletli yüklerde hava kargo, Avrupa yönündeki zaman kritik ticari yüklerde ise minivan express farklı taşıma modelleri olarak karşılaştırılabilir.",
          "DHL, FedEx, UPS ve Aramex adları ilgili marka sahiplerinin ticari markalarıdır. REX Lojistik bağımsız bir lojistik hizmet sağlayıcısıdır; marka isimlerinin burada anılması ortaklık, yetkili temsilcilik veya marka onayı anlamına gelmez.",
        ],
      },
      {
        title: "Eksiksiz bilgi daha doğru süre ve fiyat getirir",
        paragraphs: [
          "Uluslararası express gönderilerde ürün tanımı, miktar, değer, kullanım amacı, paket ölçüleri ve gerçek ağırlık açık olmalıdır. Ticari fatura veya proforma gereksinimi gönderinin niteliğine göre belirlenir.",
          "Batarya, sıvı, gıda, kozmetik, ilaç ve benzeri ürünlerde ülke ve taşıyıcı kabul kuralları değişebilir. Rezervasyon öncesinde içeriğin doğru beyan edilmesi, sonradan oluşabilecek süre ve maliyet sapmalarını azaltır.",
        ],
      },
    ],
    steps: [
      { title: "Bilgi paylaşımı", text: "Paket ölçüsü, ağırlığı, içeriği ve adresler alınır." },
      { title: "Seçenek karşılaştırma", text: "Teslim hedefi, kapsama ve toplam maliyet birlikte değerlendirilir." },
      { title: "Alım & çıkış", text: "Gönderi alınır, etiketlenir ve çıkış operasyonuna girer." },
      { title: "Takip & teslim", text: "Hareketler takip edilir ve teslim sonucu paylaşılır." },
    ],
    faq: [
      { question: "Express kargo ile kaç ülkeye gönderim yapılabilir?", answer: "Değerlendirilen global taşıyıcı ağları 220'den fazla ülke ve bölgeye ulaşabilir. Kesin servis; ülke, posta kodu, ürün içeriği ve güncel kabul koşullarına göre teyit edilir." },
      { question: "Yurt dışındaki tedarikçimden gönderi alabilir misiniz?", answer: "Evet. Servis bulunan çıkış noktalarında tedarikçi adresinden alım ve Türkiye'deki teslim adresine kadar taşıma planlanabilir. Adres, paket ve hazır olma bilgileriyle uygunluk kontrol edilir." },
      { question: "Fiyat için hangi bilgiler gerekir?", answer: "Çıkış-varış posta kodu, koli adedi, her kolinin ölçüsü ve ağırlığı, ürün tanımı ve beyan değeri gerekir." },
      { question: "Varış ülkesindeki vergi ve harçlar fiyata dahil mi?", answer: "Varış ülkesindeki vergi ve harçlar teslim şekline göre alıcıya veya göndericiye ait olabilir. Teklif kapsamı rezervasyon öncesi netleştirilir." },
      { question: "Gönderimi nasıl takip ederim?", answer: "Oluşturulan takip numarasıyla taşıma hareketleri takip edilir; REX Lojistik operasyon ekibi gerektiğinde süreç hakkında destek verir." },
    ],
    related: ["yurtdisindan-turkiyeye-express-kargo", "turkiyeden-yurtdisina-express-kargo", "express-kargo-hacimsel-agirlik-hesaplama", "yurtdisi-kargo-gonderim-rehberi"],
    contextualLinks: [
      { anchor: "hava kargo", href: "/hava-kargo" },
      { anchor: "minivan express", href: "/minivan-express-tasimacilik" },
    ],
  },
  "yurtdisindan-turkiyeye-express-kargo": {
    slug: "yurtdisindan-turkiyeye-express-kargo",
    kind: "service",
    icon: "globe",
    eyebrow: "İthalat paketlerinde adresten alım",
    title: "Yurt Dışından Türkiye'ye Express Kargo",
    lead: "Yurt dışındaki tedarikçi, müşteri veya fuar adresindeki uygun paketi aldırıyor; Türkiye'deki iş yerinize ya da belirlediğiniz adrese kadar tek operasyonla planlıyoruz.",
    seoTitle: "Yurt Dışından Türkiye'ye Express Kargo | REX",
    seoDescription: "Yurt dışındaki tedarikçiden adresten alım, Türkiye'ye express taşıma ve kapıya teslim. İthalat numunesi, evrak ve ticari paket çözümleri.",
    keywords: ["yurtdışından Türkiye'ye kargo", "ithalat express kargo", "yurtdışından adresten kargo alımı", "Almanya'dan Türkiye'ye kargo", "Çin'den Türkiye'ye express kargo"],
    highlights: [
      { title: "Kaynağından Alım", text: "Desteklenen ülkede tedarikçi veya gönderici adresinden planlama" },
      { title: "Türkiye'ye Teslim", text: "Varış operasyonu ve son adres bağlantısının tek kapsamda yönetimi" },
      { title: "Tek Dosya, Tek Takip", text: "Gönderi bilgileri ve hareketlerin tek muhatap üzerinden izlenmesi" },
    ],
    sections: [
      {
        title: "Tedarikçiniz gönderemiyorsa siz aldırabilirsiniz",
        paragraphs: [
          "Yurt dışındaki satıcının uygun taşıma organizasyonu kuramadığı durumlarda, paketin çıkış adresinden alınması REX üzerinden planlanabilir. Avrupa, Amerika, Orta Doğu ve Uzak Doğu'daki desteklenen noktalardan Türkiye'ye gelen numune, yedek parça, doküman ve küçük ticari gönderiler için çözüm oluşturulur.",
          "Göndericinin yapması gerekenler sade biçimde paylaşılır; alım adresi, iletişim kişisi, paket bilgileri ve hazır olma tarihi doğrulandıktan sonra servis seçeneği netleştirilir. Böylece farklı ülkedeki tedarikçinizle taşıma ağı arasında tek başınıza koordinasyon kurmak zorunda kalmazsınız.",
        ],
        bullets: ["Tedarikçi adresinden alım", "Numune ve küçük ticari paket", "Türkiye'de iş yerine teslim", "Tek operasyon iletişimi"],
      },
      {
        title: "İthalat express gönderisi için gereken bilgiler",
        paragraphs: [
          "Çıkış ülke ve posta kodu, tam adres, gönderici iletişim bilgisi, koli adedi, ölçüler, brüt ağırlık, içerik tanımı ve beyan değeri ilk değerlendirme için gereklidir.",
          "Ürün kabulü ve resmi giriş işlemleri gönderi içeriğine göre değişebilir. REX taşıma ve belge koordinasyonunu yürütür; müşterinin veya yetkilendirdiği danışmanın sorumluluğundaki resmi işlemler ayrıca teyit edilir.",
        ],
      },
    ],
    steps: [
      { title: "Çıkış bilgileri", text: "Tedarikçi adresi, iletişim kişisi ve hazır olma tarihi alınır." },
      { title: "Paket doğrulama", text: "İçerik, ölçü, ağırlık ve beyan belgeleri kontrol edilir." },
      { title: "Adresten alım", text: "Uygun global servis ile çıkış adresinden alım planlanır." },
      { title: "Türkiye teslimi", text: "Hareketler takip edilir ve son adres teslimi sonuçlandırılır." },
    ],
    faq: [
      { question: "Yurt dışındaki satıcı adına alım kaydı açılabilir mi?", answer: "Servis ve ürün kabulü uygunsa evet. Göndericinin tam adresi, iletişim kişisi ve paketin hazır olacağı tarih gerekir." },
      { question: "Hangi ülkelerden alım yapılabilir?", answer: "Değerlendirilen global ağların servis verdiği 220'den fazla ülke ve bölgedeki uygun posta kodlarından alım planlanabilir. Kesin kapsam adres ve ürün bilgisiyle doğrulanır." },
      { question: "Satıcı hangi belgeleri hazırlamalı?", answer: "Gönderi türüne göre ticari fatura veya proforma, açık ürün tanımı, miktar ve beyan değeri gerekir. Ek gereksinimler ürün ve ülkeye göre değişebilir." },
      { question: "Türkiye'de kapıya kadar teslim edilir mi?", answer: "Uygun servis seçeneğinde son adres teslimi aynı taşıma kapsamına dahil edilebilir. Uzak bölge ve özel teslim koşulları teklif öncesi teyit edilir." },
    ],
    related: ["express-kargo", "express-kargo-hacimsel-agirlik-hesaplama", "yurtdisi-kargo-gonderim-rehberi"],
  },
  "turkiyeden-yurtdisina-express-kargo": {
    slug: "turkiyeden-yurtdisina-express-kargo",
    kind: "service",
    icon: "zap",
    eyebrow: "Türkiye'nin her yerinden dünyaya",
    title: "Türkiye'den Yurt Dışına Express Kargo",
    lead: "İstanbul'dan, İzmir'den ya da Türkiye'nin başka bir ilinden çıkan dosya ve paketlerinizi uygun adresten alıp desteklenen uluslararası teslim noktalarına ulaştırıyoruz.",
    seoTitle: "Türkiye'den Yurt Dışına Express Kargo | REX",
    seoDescription: "Türkiye'nin uygun adreslerinden alım ve 220'den fazla ülke ve bölgeye express paket teslimatı. Süre ve toplam maliyeti birlikte karşılaştırın.",
    keywords: ["Türkiye'den yurtdışına kargo", "uluslararası paket gönderimi", "yurtdışı express kargo", "adresten yurtdışı kargo", "İzmir yurtdışı kargo"],
    highlights: [
      { title: "Türkiye Geneli Alım", text: "Uygun il ve ilçelerden çıkış adresi bağlantısı" },
      { title: "Global Erişim", text: "Servis bulunan 220'den fazla ülke ve bölge için seçenek" },
      { title: "Net Karşılaştırma", text: "Süre hedefi ve toplam kapsamın aynı teklifte görünmesi" },
    ],
    sections: [
      {
        title: "Paketiniz nerede olursa olsun rota kapınızdan başlar",
        paragraphs: [
          "Türkiye'nin yalnızca büyük şehirlerinden değil, uygun servis bulunan il ve ilçelerinden de express çıkış planlanabilir. Dosya, numune, yedek parça, e-ticaret paketi ve düşük hacimli ticari gönderiler için adresten alım ile uluslararası ana taşıma tek akışta ele alınır.",
          "Amaç yalnızca en hızlı görünen seçeneği sunmak değildir. İstenen teslim tarihi, ürün kabulü, posta kodu erişimi ve toplam maliyet dengesi birlikte değerlendirilir. Doğru express servis, gereksiz beklemeyi ve sonradan çıkan ek maliyetleri azaltan servistir.",
        ],
        bullets: ["Evrak ve ticari numune", "Küçük yedek parça", "Kolili ihracat gönderisi", "Adres teslim seçenekleri"],
      },
      {
        title: "Hızlı teklif için paketi ölçün, içeriği açık yazın",
        paragraphs: [
          "Her kolinin boy, en, yükseklik ve brüt ağırlığını ayrı paylaşın. Ürün tanımını yalnızca 'numune' veya 'parça' olarak bırakmak yerine malzeme ve kullanım amacıyla açıklayın.",
          "Doğru ölçü ve açık içerik, servis seçimini hızlandırır. Takip numarası oluşturulduktan sonra gönderi hareketleri izlenir ve teslim sonucu tek muhatap üzerinden takip edilir.",
        ],
      },
    ],
    steps: [
      { title: "Gönderi bilgisi", text: "Adresler, içerik, ölçü, ağırlık ve teslim hedefi alınır." },
      { title: "Servis karşılaştırma", text: "Uygun global taşıyıcı servisleri süre ve kapsamla değerlendirilir." },
      { title: "Türkiye'de alım", text: "Paket hazır olduğunda uygun çıkış adresinden alınır." },
      { title: "Uluslararası teslim", text: "Hareketler izlenir ve teslim sonucu takip edilir." },
    ],
    faq: [
      { question: "Türkiye'nin her ilinden express kargo alınabilir mi?", answer: "Uygun servis ve alım günü bulunmasına bağlı olarak Türkiye genelindeki il ve ilçelerden çıkış bağlantısı planlanabilir. Kesin uygunluk posta koduyla teyit edilir." },
      { question: "220'den fazla ülkeye doğrudan REX mi taşıyor?", answer: "REX Lojistik bağımsız hizmet sağlayıcı olarak uygun global taşıyıcı servislerini değerlendirir ve operasyonu tek muhatap üzerinden yönetir. Kapsama, seçilen taşıyıcının güncel ağına ve ürün kabulüne bağlıdır." },
      { question: "En hızlı servis her zaman en doğru seçenek mi?", answer: "Hayır. Teslim hedefi kadar ürün kabulü, adres kapsaması ve toplam maliyet de önemlidir. Bu nedenle seçenekler birlikte karşılaştırılır." },
      { question: "Paketimi nasıl takip ederim?", answer: "Rezervasyon sonrasında oluşan takip numarasıyla hareketler izlenir; gerektiğinde REX operasyon ekibi süreç hakkında bilgi verir." },
    ],
    related: ["express-kargo", "yurtdisindan-turkiyeye-express-kargo", "express-kargo-hacimsel-agirlik-hesaplama"],
  },
  "express-kargo-hacimsel-agirlik-hesaplama": {
    slug: "express-kargo-hacimsel-agirlik-hesaplama",
    kind: "guide",
    icon: "zap",
    eyebrow: "Ücretsiz express paket planlama aracı",
    title: "Express Kargo Hacimsel Ağırlık Hesaplama",
    lead: "Kolilerinizin gerçek ve hacimsel ağırlığını karşılaştırın; teklif öncesinde ücretlendirilebilir ağırlık için daha doğru bir tahmin oluşturun.",
    seoTitle: "Express Kargo Hacimsel Ağırlık Hesaplama | REX",
    seoDescription: "Express paket için desi ve hacimsel ağırlık hesaplayın. Koli ölçüsü, adet ve gerçek kiloya göre yaklaşık ücretlendirilebilir ağırlığı görün.",
    keywords: ["express kargo desi hesaplama", "kargo hacimsel ağırlık", "yurtdışı kargo desi", "koli desi hesaplama", "express kargo fiyat hesaplama"],
    highlights: [], sections: [], faq: [],
    related: ["express-kargo", "yurtdisindan-turkiyeye-express-kargo", "turkiyeden-yurtdisina-express-kargo"],
  },
  "yurtdisi-kargo-gonderim-rehberi": {
    slug: "yurtdisi-kargo-gonderim-rehberi",
    kind: "guide",
    icon: "globe",
    eyebrow: "İlk rezervasyondan teslimata",
    title: "Yurt Dışı Express Kargo Gönderim Rehberi",
    lead: "Adres, paket, içerik ve belge bilgilerini ilk seferde doğru hazırlayın; servis seçimini hızlandırıp beklenmeyen maliyet riskini azaltın.",
    seoTitle: "Yurt Dışı Kargo Nasıl Gönderilir? Express Rehber | REX",
    seoDescription: "Yurt dışı express kargo için gerekli adres, ölçü, ağırlık, içerik ve belge bilgileri. İhracat ve ithalat paketleri için pratik kontrol listesi.",
    keywords: ["yurtdışı kargo nasıl gönderilir", "uluslararası kargo gerekli belgeler", "yurtdışı paket gönderimi", "ithalat kargo rehberi", "express kargo kontrol listesi"],
    highlights: [], sections: [], faq: [],
    related: ["express-kargo", "express-kargo-hacimsel-agirlik-hesaplama", "yurtdisindan-turkiyeye-express-kargo"],
  },
  "almanyaya-express-kargo": {
    slug: "almanyaya-express-kargo",
    kind: "service",
    icon: "zap",
    eyebrow: "Türkiye'den Almanya'ya kapıdan kapıya",
    title: "Almanya'ya Express Kargo",
    lead: "Türkiye'nin uygun çıkış adreslerinden Almanya'daki iş yerlerine ve teslim adreslerine dosya, numune, yedek parça ve ticari paket gönderilerinizi tek operasyon üzerinden planlıyoruz.",
    seoTitle: "Almanya'ya Express Kargo ve Fiyat Teklifi | REX",
    seoDescription: "Türkiye'den Almanya'ya express kargo, adresten alım, hacimsel ağırlık hesabı ve kapı teslim planlaması. REX Lojistik'ten servis seçeneklerini karşılaştırın.",
    keywords: ["Almanya'ya kargo", "Almanya express kargo", "Türkiye Almanya kargo", "Almanya'ya paket gönderme", "Almanya ithalat kargo"],
    highlights: [
      { title: "Türkiye Geneli Alım", text: "Uygun il ve ilçelerden çıkış adresi bağlantısı" },
      { title: "Servis Karşılaştırması", text: "Maliyet, planlanan süre ve teslim kapsamı birlikte" },
      { title: "Tek Operasyon", text: "Alımdan Almanya teslimine kadar REX koordinasyonu" },
    ],
    sections: [
      {
        title: "Almanya gönderisi doğru posta koduyla başlar",
        paragraphs: [
          "Almanya'ya express kargo planında yalnızca ülke adı yeterli değildir. Çıkış ve varış posta kodları, paketin dış ölçüleri, gerçek ağırlığı, açık ürün tanımı ve teslim beklentisi servis seçimini doğrudan etkiler.",
          "REX Lojistik bu bilgileri aynı kapsamda değerlendirerek uygun global servis alternatiflerini karşılaştırır. Amaç yalnızca en kısa görünen seçeneği değil, teslim hedefini karşılayan en dengeli toplam çözümü bulmaktır.",
        ],
        bullets: ["Ticari numune ve doküman", "Makine ve otomotiv yedek parçası", "Kolili ticari ürün", "Almanya'dan Türkiye'ye ters yönlü alım"],
      },
      {
        title: "Evrak ve ürün tanımı beklemeyi azaltır",
        paragraphs: [
          "Ticari ürünlerde gönderici ve alıcı bilgilerinin, ürün miktarının, birim ve toplam değerin açık yazılması gerekir. Gönderinin niteliğine göre ticari fatura veya uygun proforma hazırlanır.",
          "Batarya, sıvı, gıda, kozmetik ve benzeri ürünlerde kabul koşulları ayrıca kontrol edilir. Nihai servis ve transit planı ürün ile posta kodu doğrulandıktan sonra paylaşılır.",
        ],
      },
    ],
    steps: [
      { title: "Rota bilgisi", text: "Türkiye ve Almanya posta kodları alınır." },
      { title: "Paket analizi", text: "Ölçü, kilo, içerik ve değer kontrol edilir." },
      { title: "Servis seçimi", text: "Ekonomik, hızlı ve dengeli alternatifler araştırılır." },
      { title: "Alım ve takip", text: "Uygun çıkış adresinden alım ve teslim süreci izlenir." },
    ],
    faq: [
      { question: "Almanya'ya express kargo fiyatı nasıl hesaplanır?", answer: "Fiyat; çıkış-varış posta kodu, paket adedi, gerçek veya hacimsel ağırlık, ürün içeriği ve seçilen servis kapsamına göre belirlenir." },
      { question: "Türkiye'nin başka bir şehrinden alım yapılabilir mi?", answer: "Uygun posta kodu ve alım günü bulunmasına bağlı olarak Türkiye genelinden çıkış bağlantısı planlanabilir." },
      { question: "Almanya'dan Türkiye'ye paket getirebilir misiniz?", answer: "Uygun çıkış noktalarında tedarikçi veya gönderici adresinden alım ve Türkiye teslimi planlanabilir." },
      { question: "Kesin teslim süresi ne zaman belli olur?", answer: "Posta kodları, ürün kabulü, hazır olma zamanı ve servis kapasitesi doğrulandıktan sonra planlanan transit süre paylaşılır." },
    ],
    related: ["express-kargo", "express-kargo-hacimsel-agirlik-hesaplama", "yurtdisi-kargo-gonderim-rehberi"],
  },
  "amerikaya-express-kargo": {
    slug: "amerikaya-express-kargo",
    kind: "service",
    icon: "globe",
    eyebrow: "Türkiye'den ABD'ye kontrollü gönderim",
    title: "Amerika'ya Express Kargo",
    lead: "ABD'ye gönderilecek dosya, numune, yedek parça ve ticari paketler için çıkış adresi, eyalet ve posta kodunu birlikte değerlendiriyor; uygun servis planını tek muhatapla hazırlıyoruz.",
    seoTitle: "Amerika'ya Express Kargo ve Paket Gönderimi | REX",
    seoDescription: "Türkiye'den Amerika'ya express kargo ve paket gönderimi. Adresten alım, hacimsel ağırlık, evrak ve ABD posta koduna göre servis planlaması.",
    keywords: ["Amerika'ya kargo", "ABD express kargo", "Amerika'ya paket gönderme", "Türkiye Amerika kargo fiyatı", "ABD'ye numune gönderme"],
    highlights: [
      { title: "Eyalet & Posta Kodu", text: "Varış noktasına göre gerçek servis kapsamı" },
      { title: "Ürün Ön Kontrolü", text: "İçerik ve evrak bilgilerinin rezervasyon öncesi incelenmesi" },
      { title: "Kapı Teslim Planı", text: "Uygun rotalarda çıkıştan son adrese bağlantı" },
    ],
    sections: [
      {
        title: "ABD için ülke adı değil, tam rota belirleyicidir",
        paragraphs: [
          "Amerika Birleşik Devletleri'nde servis ve teslim planı eyalet, şehir ve posta koduna göre değişebilir. Bu nedenle teklif hazırlanırken Türkiye'deki alım adresi ile ABD'deki tam teslim noktası birlikte değerlendirilir.",
          "Paket ölçüleri ve gerçek kilo üzerinden yaklaşık ücretlendirilebilir ağırlık hesaplanır; ürün kabulü, adres kapsamı ve teslim hedefi doğrulandıktan sonra uygun alternatifler sunulur.",
        ],
        bullets: ["Doküman ve ticari numune", "Küçük makine parçası", "E-ticaret dışı kurumsal paket", "ABD'den Türkiye'ye tedarikçi alımı"],
      },
      {
        title: "Ürün açıklaması resmi değerlendirmenin temelidir",
        paragraphs: [
          "Belirsiz veya yalnızca 'sample' yazan açıklamalar yerine ürünün malzemesi, kullanım amacı, miktarı ve değeri açıkça belirtilmelidir. Alıcı ve gönderici bilgilerinin evraklarla tutarlı olması beklenir.",
          "Vergi, harç ve resmi ithalat koşulları gönderinin niteliğine ve teslim şekline göre değişebilir. Teklif kapsamı taşıma hizmetini açıklar; resmi işlemler ilgili yetkili taraflarca yürütülür.",
        ],
      },
    ],
    steps: [
      { title: "Adres doğrulama", text: "Eyalet, şehir ve posta kodu netleştirilir." },
      { title: "İçerik kontrolü", text: "Ürün tanımı, miktarı, değeri ve belgeleri incelenir." },
      { title: "Plan karşılaştırma", text: "Teslim önceliğine uyan servis kapsamları araştırılır." },
      { title: "Gönderi takibi", text: "Alımdan teslim sonucuna kadar hareketler izlenir." },
    ],
    faq: [
      { question: "Amerika'ya kargo fiyatı için hangi bilgiler gerekir?", answer: "Çıkış ve ABD varış posta kodu, koli ölçüleri, gerçek ağırlık, ürün tanımı, miktarı ve değeri gerekir." },
      { question: "Amerika'nın her eyaletine aynı sürede teslim edilir mi?", answer: "Hayır. Hat, posta kodu, uzak bölge kapsamı ve güncel servis kapasitesi planlanan teslim süresini etkiler." },
      { question: "ABD'den Türkiye'ye ithalat gönderisi alınabilir mi?", answer: "Uygun alım adreslerinde göndericiden teslim alma ve Türkiye'ye taşıma seçeneği değerlendirilebilir." },
      { question: "Hacimsel ağırlık neden önemlidir?", answer: "Express kargoda gerçek ağırlık ile paketin kapladığı hacme göre hesaplanan ağırlıktan yüksek olanı ücretlendirmeye referans olabilir." },
    ],
    related: ["express-kargo", "yurtdisindan-turkiyeye-express-kargo", "express-kargo-hacimsel-agirlik-hesaplama"],
  },
  "ingiltereye-express-kargo": {
    slug: "ingiltereye-express-kargo",
    kind: "service",
    icon: "zap",
    eyebrow: "Birleşik Krallık yönlü express çözüm",
    title: "İngiltere'ye Express Kargo",
    lead: "Birleşik Krallık'taki iş ortaklarınıza ve teslim adreslerine gönderilecek ticari paketleri; posta kodu, ürün kabulü ve teslim hedefi üzerinden planlıyoruz.",
    seoTitle: "İngiltere'ye Express Kargo ve Fiyat Teklifi | REX",
    seoDescription: "Türkiye'den İngiltere'ye express kargo, paket ve numune gönderimi. Posta koduna göre servis, hacimsel ağırlık ve evrak planlaması.",
    keywords: ["İngiltere'ye kargo", "İngiltere express kargo", "Birleşik Krallık paket gönderme", "Türkiye İngiltere kargo", "Londra'ya express kargo"],
    highlights: [
      { title: "Posta Kodu Bazlı", text: "Londra ve diğer bölgeler için adres kapsamı kontrolü" },
      { title: "Çift Yönlü", text: "Türkiye'den gönderim ve İngiltere'den uygun adresten alım" },
      { title: "Açık Kapsam", text: "Planlanan süre, alım ve teslim detaylarının teklifte görünmesi" },
    ],
    sections: [
      {
        title: "İngiltere gönderilerinde teslim noktası baştan net olmalı",
        paragraphs: [
          "Birleşik Krallık yönlü express gönderilerde varış posta kodu, uzak bölge veya ek teslim koşullarının anlaşılması için temel bilgidir. Çıkış adresi, paket ve hazır olma zamanı da aynı teklifte değerlendirilir.",
          "REX Lojistik, uygun global servisleri aynı gönderi bilgileriyle karşılaştırır. Böylece karar yalnızca bir taşıma rakamına değil, alımdan teslimata kadar açıklanan toplam kapsama dayanır.",
        ],
        bullets: ["Londra ve Birleşik Krallık iş adresleri", "Numune, doküman ve yedek parça", "Planlı tedarikçi alımı", "Takip numarasıyla görünür gönderi"],
      },
      {
        title: "Evrak bilgisi paket bilgisi kadar önemlidir",
        paragraphs: [
          "Ticari nitelikteki gönderilerde ürün açıklaması, miktar, değer, gönderici ve alıcı bilgilerinin tutarlı olması gerekir. Belge gereksinimi ürünün ve işlemin niteliğine göre kesinleştirilir.",
          "Kısıtlı veya özel kabul gerektiren ürünler standart paket gibi değerlendirilmez. Batarya, sıvı, gıda, kozmetik ve medikal ürünler rezervasyon öncesinde ayrıca bildirilmelidir.",
        ],
      },
    ],
    steps: [
      { title: "Posta kodları", text: "Çıkış ve Birleşik Krallık teslim noktası alınır." },
      { title: "Ağırlık hesabı", text: "Gerçek ve hacimsel ağırlık karşılaştırılır." },
      { title: "Kapsam seçimi", text: "Ekonomik, hızlı veya dengeli öncelik belirlenir." },
      { title: "Teslim takibi", text: "Seçilen hizmetin hareketleri operasyonca izlenir." },
    ],
    faq: [
      { question: "İngiltere'ye express kargo kaç günde gider?", answer: "Planlanan süre çıkış-varış posta kodu, ürün kabulü, servis kapasitesi ve resmi süreçlere göre değişir; teklif aşamasında teyit edilir." },
      { question: "İngiltere'den ürün aldırabilir miyim?", answer: "Uygun çıkış adreslerinde tedarikçiden alım ve Türkiye teslimi planlanabilir. Gönderici iletişim ve hazır olma bilgileri gerekir." },
      { question: "Fiyatı en çok ne etkiler?", answer: "Ücretlendirilebilir ağırlık, posta kodları, ürün niteliği, teslim önceliği ve olası ek hizmetler fiyatı etkiler." },
      { question: "Taşıyıcı seçimini ben mi yapmalıyım?", answer: "Hayır. Teslim hedefinizi paylaşmanız yeterlidir; uygun servis alternatifleri kapsam ve önceliklerinize göre karşılaştırılır." },
    ],
    related: ["express-kargo", "turkiyeden-yurtdisina-express-kargo", "yurtdisi-kargo-gonderim-rehberi"],
  },
  "cinden-turkiyeye-express-kargo": {
    slug: "cinden-turkiyeye-express-kargo",
    kind: "service",
    icon: "globe",
    eyebrow: "Çin'deki tedarikçiden Türkiye'ye",
    title: "Çin'den Türkiye'ye Express Kargo",
    lead: "Çin'deki uygun tedarikçi adresinden alınacak numune, yedek parça ve ticari paketleri Türkiye'deki teslim noktasına kadar tek operasyon kapsamında planlıyoruz.",
    seoTitle: "Çin'den Türkiye'ye Express Kargo ve İthalat | REX",
    seoDescription: "Çin'deki tedarikçiden adresten alım, Türkiye'ye express ithalat gönderisi, paket ölçüsü, evrak ve teslim planlaması için REX Lojistik'ten teklif alın.",
    keywords: ["Çin'den kargo", "Çin Türkiye express kargo", "Çin'den ürün getirme", "Çin ithalat kargo", "Çin'den numune getirme"],
    highlights: [
      { title: "Tedarikçiden Alım", text: "Uygun Çin çıkış adresinden planlı pickup" },
      { title: "İthalat Yönlü Plan", text: "Çıkış, uçuş ve Türkiye teslim bağlantısı" },
      { title: "Tek Muhatap", text: "Tedarikçi iletişiminden teslim takibine REX koordinasyonu" },
    ],
    sections: [
      {
        title: "Çin'deki gönderiyi uzaktan yönetmenin pratik yolu",
        paragraphs: [
          "Tedarikçinin açık adresi, yetkili kişisi, telefonu, paket ölçüleri, ağırlığı ve hazır olma tarihi paylaşıldığında uygun alım seçeneği araştırılabilir. Gönderinin Türkiye'deki teslim adresi aynı operasyon planına eklenir.",
          "REX Lojistik, müşteriyi farklı operasyon tarafları arasında bırakmadan gönderi bilgilerini tek dosyada toplar; alımın gerçekleşmesi ve uluslararası hareketlerin izlenmesi için koordinasyonu yürütür.",
        ],
        bullets: ["Üretim numunesi", "Küçük yedek parça", "Ticari paket", "Tedarikçi adresinden uygun alım"],
      },
      {
        title: "İthalat gönderisinde değer ve içerik açık olmalı",
        paragraphs: [
          "Tedarikçi faturası, ürünün açık tanımı, miktarı, değeri ve paket bilgileri taşıma planının temelini oluşturur. Eksik veya genel açıklamalar kabul ve resmi işlem aşamalarında ek bilgi talebine yol açabilir.",
          "REX Lojistik taşıma operasyonunu yönetir. İthalata ilişkin resmi işlemler, vergiler, izinler ve ürün uygunluğu müşteri ile müşterinin yetkili danışmanları tarafından yürütülür.",
        ],
      },
    ],
    steps: [
      { title: "Tedarikçi bilgisi", text: "Çin çıkış adresi, yetkili ve hazır olma tarihi alınır." },
      { title: "Paket & evrak", text: "Ölçü, ağırlık, içerik, değer ve fatura kontrol edilir." },
      { title: "Alım planı", text: "Uygun servis ve tedarikçi alım bağlantısı kurulur." },
      { title: "Türkiye teslimi", text: "Uluslararası hareket ve son teslim süreci takip edilir." },
    ],
    faq: [
      { question: "Çin'deki tedarikçiden doğrudan alım yapılabilir mi?", answer: "Uygun çıkış adresi, ürün kabulü ve servis bulunmasına bağlı olarak tedarikçiden alım planlanabilir." },
      { question: "Tedarikçiden hangi bilgileri istemeliyim?", answer: "Açık adres, yetkili kişi, telefon, hazır olma tarihi, koli adedi, ölçüler, brüt ağırlık, ürün tanımı ve ticari fatura bilgileri gerekir." },
      { question: "Çin'den gelen gönderinin vergileri fiyata dahil mi?", answer: "Vergi ve resmi masraflar ürün ile işlem koşullarına göre değişir. Taşıma teklifinin kapsamı rezervasyondan önce açıkça belirtilir." },
      { question: "Express mi genel hava kargo mu seçmeliyim?", answer: "Paket ölçüsü, toplam ağırlık, ürün niteliği ve teslim hedefi karşılaştırılarak uygun yöntem belirlenir. Büyük veya paletli yüklerde genel hava kargo daha uygun olabilir." },
    ],
    related: ["yurtdisindan-turkiyeye-express-kargo", "hava-kargo-mu-express-kargo-mu", "express-kargo-hacimsel-agirlik-hesaplama"],
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
          "Depolama ile dağıtımın ayrı ayrı yönetilmesi bilgi kaybına ve gecikmeye neden olabilir. Depodan çıkan sevkiyatların taşıma sistemine bağlanması, siparişten teslim evrakına kadar daha görünür bir akış oluşturur. Yük hacmine göre yurtiçi parsiyel taşımacılık veya komple taşımacılık seçilerek depo çıkışı doğrudan teslim planına bağlanabilir.",
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
    contextualLinks: [
      { anchor: "yurtiçi parsiyel taşımacılık", href: "/yurtici-parsiyel-tasimacilik" },
      { anchor: "komple taşımacılık", href: "/komple-tasimacilik" },
    ],
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
