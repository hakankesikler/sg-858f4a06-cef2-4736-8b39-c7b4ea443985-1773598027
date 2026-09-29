export type LoadingGuide = { slug:string; title:string; summary:string; intro:string; sections:{title:string;paragraphs:string[]}[]; example:string; exampleLabel:string; related:string };

export const loadingGuides: LoadingGuide[] = [
  {
    slug:"konteynere-kac-palet-sigar",title:"20’lik ve 40’lık Konteynere Kaç Palet Sığar?",summary:"Sabit palet sayısı yerine ölçü, kapı ve istif koşullarıyla yerleşimi değerlendirin.",
    intro:"20’ veya 40’ konteynere sığan palet sayısı tek bir rakam değildir. Paletin dış ölçüsü, izin verilen döndürme, yük yüksekliği, kapı açıklığı ve brüt ağırlık birlikte sonucu değiştirir.",
    sections:[
      {title:"Önce yüklü paletin dış ölçüsünü alın",paragraphs:["Yalnızca boş paletin 80 × 120 cm ölçüsünü kullanmayın. Ürün ambalajı kenardan taşıyorsa en ve boy bu taşmaları içermelidir. Yüksekliğe paletin kendisi ve yükün en üst noktası dahildir.","20’ ve 40’ kuru yük konteynerlerinin taban boyları farklıdır; benzer iç genişlik, her yük için aynı sayıda sıra kurulacağı anlamına gelmez. Kapı açıklığı iç genişlikten daha dar olabilir."]},
      {title:"Örnek yerleşim, garanti değil",paragraphs:["Örnekte 80 × 120 × 110 cm dış ölçülü, 450 kg brüt ağırlıklı, istiflenmeyen 11 palet kullanılır. Planlayıcı, 20’, 40’ ve 40’ High Cube için paletleri numaralandırarak fiziksel konum arar.","Yerleşim hesabı üretici teknik föylerindeki örnek ekipman ölçülerine dayanır. Tahsis edilen konteyner serisi ve CSC plakası, kapı manevrası, zemin/aks dağılımı ve yük emniyeti yüklemeden önce ayrıca kontrol edilmelidir."]},
    ],example:"konteyner",exampleLabel:"11 paletlik konteyner örneğini aç",related:"/konteyner-olculeri"
  },
  {
    slug:"tira-kac-palet-yuklenir",title:"Tıra Kaç Palet Yüklenir?",summary:"Dorse tabanı, yükleme açıklığı ve yüke göre değişen palet sayısını keşfedin.",
    intro:"Tır için söylenen standart palet adetleri, yalnızca belirli palet ölçüsü ve dizilim varsayımıyla anlamlıdır. Taşan ambalaj, döndürme yasağı, istif ve ağırlık farklı bir plan gerektirebilir.",
    sections:[
      {title:"LDM ile gerçek yerleşim aynı hesap değildir",paragraphs:["LDM tabanda kullanılan alanı yükleme metresine çeviren yararlı bir göstergedir. Fakat tek başına paletlerin tabanda yan yana ve uç uca oturup oturmadığını kanıtlamaz. 3D planlayıcı dikdörtgen paletler için x/y/z konumu üretir.","Örnekte 80 × 120 × 115 cm dış ölçülü, 600 kg brüt ağırlıklı 24 palet kullanılır. Standart ve mega tenteli dorse örnekleri karşılaştırılır. Çoklu dorseye otomatik bölme yapılmaz; dışarıda kalan paletler ayrıca gösterilir."]},
      {title:"Taşıma öncesi ayrıca teyit",paragraphs:["Dorse teknik taşıma sınırı, aracın ve güzergâhın yasal yük sınırı değildir. Arka kapı açıklığı, rampaya erişim, aks yükleri, yük bağlama ve zemin noktasal yükü bu araçta doğrulanmaz."]},
    ],example:"tir",exampleLabel:"24 paletlik dorse örneğini aç",related:"/ldm-hesaplama"
  },
  {
    slug:"palet-istifleme-kosullari",title:"Palet İstifleme Koşulları Nasıl Belirlenir?",summary:"Azami kat, üst yük, aynı/karma grup ve bilinmeyen dayanımın etkisi.",
    intro:"Paletin üzerine ikinci bir palet konabilmesi yalnızca boş yüksekliğe bağlı değildir. Alt paletin taşıma dayanımı, toplam üst ağırlık, kat sınırı ve taban desteği gerekir.",
    sections:[
      {title:"Bilinmeyen koşulda istif kapalı kalmalı",paragraphs:["Azami kat ve üzerine konabilecek azami kilogram doğrulanmamışsa planlayıcı istif yapmaz. İstif izni verilmiş olsa bile üst paletin tabanı alttaki paletin dış tabanı içinde kalmalı; yan yatırma kabul edilmez.","Aynı grup seçeneği yalnızca özdeş gruptan paletleri üst üste koyar. Karma grup izni, alt ve üst paletlerin her ikisinin koşulları sağlanıyorsa değerlendirilir. Bu geometrik ön kontrol, gerçek ambalaj dayanımı veya dinamik taşıma güvenliği sertifikası değildir."]},
      {title:"İki katlı örnek",paragraphs:["Örnekte 80 × 120 × 100 cm, 300 kg brüt ağırlıklı 12 palet, azami iki kat ve üstten 350 kg sınırıyla girilmiştir. Aynı gruptan paletler uygun yükseklikte istiflenebilir; üçüncü kat engellenir."]},
    ],example:"istif",exampleLabel:"İki katlı palet örneğini aç",related:"/cbm-hesaplama"
  },
  {
    slug:"paletli-yuk-packing-list",title:"Paletli Yükler İçin Packing List Hazırlama",summary:"Palet numarası, sipariş referansı, ölçü ve brüt ağırlığı tek çıktıdaki planla bağlayın.",
    intro:"Packing list, hangi palet grubunun kaç parçadan oluştuğunu ve paletlerin ölçü/ağırlığını takip etmeyi kolaylaştırır. Yerleşim hesabı için ürün açıklaması zorunlu değildir; operasyon iletişiminde ise faydalıdır.",
    sections:[
      {title:"Hangi alanlar girilmeli?",paragraphs:["Her grup için kısa bir ad, isteğe bağlı sipariş referansı ve ürün açıklaması, yüklü dış en/boy/yükseklik, palet adedi ve palet başına brüt kg kaydedin. Aynı özellikteki paletleri tek satırda girebilirsiniz; plan çıktısında her biri P001, P002 gibi ayrı numara alır.","Planlayıcıdan indirilen CSV, yerleşen palet için kat ve x/y/z konumunu, dışarıda kalan için durumunu gösterir. Bu dosya ticari/gümrük evrakının tek başına yerine geçmez; gerçek sevkiyat belge gerekliliklerini ayrıca kontrol edin."]},
      {title:"Gizlilik ve teklif",paragraphs:["Yük listesi URL parametresine yazılmaz ve halka açık bir sayfaya kaydedilmez. Teklif istediğinizde temel grup ve ölçü verileri mevcut teklif formuna taşınır; iletişim ve güzergâh bilgilerini siz eklersiniz."]},
    ],example:"packing-list",exampleLabel:"Packing list örneğini aç",related:"/denizyolu-konteyner-tasimaciligi"
  },
];
