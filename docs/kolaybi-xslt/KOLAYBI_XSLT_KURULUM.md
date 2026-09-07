# REX TYS – KolayBi Fatura XSLT Şablonu

KolayBi'nin e-Fatura ve e-Arşiv şablon alanları için iki ayrı UBL-TR XSLT dosyası hazırlanmıştır. Belge başlığı, yanlış şablon türünün gösterilmesini önlemek için her dosyada sabittir.

## KolayBi'ye verilecek dosya

- KolayBi **e-Fatura** alanına: `rex-tys-kolaybi-e-fatura.xslt`
- KolayBi **e-Arşiv** alanına: `rex-tys-kolaybi-e-arsiv.xslt`

Dosyalar birbirinin yerine yüklenmemelidir. Her iki şablon da aynı REX tasarımını ve GİB karekod üretimini kullanır; e-Arşiv elektronik iletim notu yalnızca e-Arşiv şablonunda bulunur.

Şablon kendi içinde REX Lojistik web sitesi logosunu ve GİB logosunu taşır. Ayrı görsel yüklenmesi gerekmez.

GİB karekodu öncelikle KolayBi'nin ürettiği UBL içindeki `AdditionalDocumentReference` alanından okunur. Şablon `QR`, `KAREKOD`, `BARKOD` ve `BARCODE` tanımlarını; hem gömülü Base64 görseli hem de harici URI biçimini destekler. UBL içinde hazır karekod bulunmazsa, KolayBi'nin önceki resmî şablonuyla aynı alanları kullanan gömülü QR üreticisi karekodu fatura verilerinden oluşturur.

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

Şablonlar UTF-8, XSLT 1.0 ve UBL-TR Invoice 2.x namespace yapısıyla hazırlanmıştır. Canlıya almadan önce KolayBi test ortamında örnek e-Fatura, e-Arşiv, tevkifatlı ve dövizli belgeyle doğrulanmalıdır.
