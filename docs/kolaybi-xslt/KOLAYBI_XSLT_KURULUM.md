# REX TYS – KolayBi Fatura XSLT Şablonu

`rex-tys-kolaybi-fatura.xslt`, UBL-TR e-Fatura ve e-Arşiv Fatura belgeleri için tek şablondur. Belgenin `ProfileID` alanına göre başlığı otomatik değiştirir.

## KolayBi'ye verilecek dosya

- `rex-tys-kolaybi-fatura.xslt`

Şablon kendi içinde REX Lojistik web sitesi logosunu ve GİB logosunu taşır. Ayrı görsel yüklenmesi gerekmez.

GİB karekodu, KolayBi'nin ürettiği UBL içindeki `AdditionalDocumentReference` alanından okunur. Şablon `QR`, `KAREKOD`, `BARKOD` ve `BARCODE` tanımlarını; hem gömülü Base64 görseli hem de harici URI biçimini destekler. Karekodun oluşması için KolayBi'nin nihai UBL belgesine karekod verisini eklemesi gerekir.

## TMS bilgilerinin faturada görünmesi

KolayBi/API üzerinden UBL oluşturulurken aşağıdaki alanlar gönderilirse şablonda “REX TYS · Taşıma ve operasyon bilgileri” bölümü açılır:

| TMS verisi | UBL-TR alanı |
|---|---|
| İş / sipariş numarası | `cac:OrderReference/cbc:ID` |
| İrsaliye numarası | `cac:DespatchDocumentReference/cbc:ID` |
| Proje veya müşteri referansı | `cac:ProjectReference/cbc:ID` |
| Sevkiyat / takip / TYS iş numarası | `cac:AdditionalDocumentReference` içinde `DocumentTypeCode` ve `ID` |
| Teslim tarihi ve yeri | `cac:Delivery` |

Önerilen ek referans örnekleri:

- `DocumentTypeCode=REX_TYS_SEVKIYAT`, `ID=SVK-2026-000123`
- `DocumentTypeCode=REX_TYS_TAKIP`, `ID=REX-TR-26000123`
- `DocumentTypeCode=REX_TYS_IS_EMRI`, `ID=IS-2026-00458`

## KolayBi'ye iletilecek kısa not

Şablon UTF-8, XSLT 1.0 ve UBL-TR Invoice 2.x namespace yapısıyla hazırlanmıştır. e-Fatura/e-Arşiv ayrımı `cbc:ProfileID` üzerinden yapılır. Canlıya almadan önce KolayBi test ortamında örnek e-Fatura, e-Arşiv, tevkifatlı ve dövizli belgeyle doğrulanmalıdır.
