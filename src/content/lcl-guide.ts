export const lclGuide = {
  path: "/bilgi-merkezi/lcl-nedir",
  title: "LCL Nedir? LCL Yükleme Nasıl Yapılır?",
  seoTitle: "LCL Nedir? LCL Yükleme ve FCL Farkı | REX Lojistik",
  description: "LCL nedir, LCL yükleme nasıl yapılır? Parsiyel denizyolunda konsolidasyon, CBM ve W/M hesabı, FCL farkı ve teslim sürecini öğrenin.",
  date: "2026-09-20",
  updatedDate: "2026-09-21",
  summary: "Konteyneri doldurmayan yükler için LCL nasıl çalışır? Yükleme adımlarını, FCL ile farklarını ve teklif karşılaştırırken dikkat edilecek maliyet kalemlerini inceleyin.",
};

export const loadingSteps = [
  { title: "Yük bilgileri ve rezervasyon", text: "Ürün tanımı, ambalajlı ölçüler, brüt ağırlık, adet, istiflenebilirlik ve hazır olma tarihi bildirilir. Yükün hatta kabulü, çıkış programı, teslim kapsamı ve evrak gereksinimleri teyit edilmeden sevk planı kesinleştirilmez." },
  { title: "CFS kabulü ve konsolidasyon", text: "Yük, belirlenen son kabul tarihine kadar konsolidasyon deposuna veya CFS'ye (Container Freight Station) ulaştırılır. Ambalaj, işaretleme, adet, ölçü ve ağırlık kontrolleri yapılır. Uygun güzergâhtaki ve birlikte taşınmaya elverişli gönderiler aynı konteyner için bir araya getirilir; bu işleme konsolidasyon denir." },
  { title: "Konteyner yükleme ve sabitleme", text: "Yüklerin ağırlık dağılımı, ambalaj dayanımı, istif sınırları ve birbirleriyle uyumu dikkate alınarak yerleşim yapılır. Uygun sabitleme ve koruma önlemleri uygulanır. Konteyner, gerekli taşıma ve liman işlemleri tamamlanarak gemi seferine hazırlanır." },
  { title: "Denizyolu taşıması", text: "Konteyner planlanan hat üzerinden varış limanına taşınır. Doğrudan sefer veya aktarmalı bağlantı kullanılabilir. Gemi programındaki değişiklikler ve aktarma beklemeleri tahmini varış tarihini etkileyebilir." },
  { title: "Varışta dekonsolidasyon", text: "Konteyner varıştaki uygun depo veya CFS alanına alınır. İçindeki gönderiler boşaltılır, kontrol edilir ve alıcılarına göre ayrılır. Konsolidasyonun bu ters aşamasına dekonsolidasyon denir; geminin limana varması yükün aynı anda teslim alınabileceği anlamına gelmez." },
  { title: "Teslim bağlantısı", text: "Yük, gerekli resmi işlemler ve teslim koşulları tamamlandıktan sonra teslim alınabilir hâle gelir. Teklif kapsamına göre depodan teslim veya son kara taşımasıyla adrese teslim planlanır. Gümrük işlemleri ilgili yetkili taraflarca yürütülür; taşıma koordinasyonu ile gümrük müşavirliği ayrı hizmetlerdir." },
];

export const comparisonRows = [
  ["Konteyner kullanımı", "Farklı göndericilerin yükleri aynı konteyneri paylaşır.", "Konteyner bir göndericinin yüküne ayrılır; tamamen dolması şart değildir."],
  ["Maliyet yaklaşımı", "Genellikle hacim/ağırlık esası, minimumlar ve yerel işlem kalemleri birlikte değerlendirilir.", "Ana navlun çoğunlukla konteyner bazındadır; yerel masraflar ayrıca değerlendirilir."],
  ["Elleçleme", "Konsolidasyon ve ayrıştırma nedeniyle ilave depo elleçlemeleri bulunur.", "Konsolidasyon ihtiyacı azalır; liman ve kara bağlantısı işlemleri devam eder."],
  ["Program", "CFS son kabulü, konsolidasyon ve dekonsolidasyon takvimi hesaba katılır.", "Konteyner temini, yükleme, liman son kabulü ve gemi takvimi belirleyicidir."],
  ["Seçim ölçütü", "Düşük hacim, uygun ambalaj ve esnek teslim planında değerlendirilebilir.", "Artan hacim, yükün diğer gönderilerden ayrı tutulması veya özel yükleme planında değerlendirilebilir."],
];

export const lclFaq = [
  { question: "LCL açılımı nedir?", answer: "LCL, Less than Container Load ifadesinin kısaltmasıdır. Türkçede parsiyel denizyolu taşımacılığı olarak kullanılır; farklı gönderiler aynı konteyner kapasitesini paylaşır." },
  { question: "LCL ile bir palet gönderilebilir mi?", answer: "Hat, ürün, ölçü ve ağırlık açısından kabul edilen bir palet LCL ile taşınabilir. Minimum ücretlendirme ve çıkış programı ayrıca teyit edilmelidir." },
  { question: "LCL yükleme ile konsolidasyon aynı şey mi?", answer: "Konsolidasyon, farklı gönderileri ortak bir taşıma planında birleştirmektir. Konteyner yükleme ise bu planın fiziksel yerleştirme ve sabitleme aşamasıdır. Günlük kullanımda LCL yükleme ifadesi sürecin tamamını da anlatabilir." },
  { question: "LCL kaç CBM'ye kadar uygundur?", answer: "Her hat ve yük için geçerli tek bir CBM sınırı yoktur. Hacim arttıkça LCL ve FCL seçeneklerinin toplam maliyeti, elleçleme ihtiyacı ve teslim planı birlikte karşılaştırılmalıdır." },
  { question: "1 CBM her zaman 1.000 kg olarak mı ücretlendirilir?", answer: "1 m³ ile 1 metrik tonun karşılaştırılması LCL ana navlununda yaygın W/M yaklaşımıdır; yükün gerçek ağırlığının değiştiği anlamına gelmez. Kullanılacak oran, minimum ve yuvarlama koşulları tarifeye bağlıdır. Yerel hizmetlerde farklı hesap esasları uygulanabilir." },
  { question: "İstiflenemeyen yük LCL ile taşınabilir mi?", answer: "Bazı hatlarda uygun plan ve ek alan/maliyet değerlendirmesiyle kabul edilebilir. Üstüne yük konulamayacağı rezervasyondan önce bildirilmelidir; kabul otomatik değildir." },
  { question: "LCL mi FCL mi daha hızlıdır?", answer: "Aynı hatta LCL'nin konsolidasyon ve ayrıştırma adımları ek süre gerektirebilir. Ancak uygun sefer ve aktarma programı sonucu değiştirebilir. Yalnız gemi süresi yerine kapıdan kapıya tahmini süre karşılaştırılmalıdır." },
  { question: "LCL teklifine varış masrafları dahil midir?", answer: "Bu, teklifin kapsamına bağlıdır. Ana navlun, çıkış ve varış yerel masrafları, kara bağlantıları ve hariç tutulan giderler ayrı ayrı teyit edilmelidir. Yalnız navlun tutarı üzerinden karar verilmemelidir." },
];
