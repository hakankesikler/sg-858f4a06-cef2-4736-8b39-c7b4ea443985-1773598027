# Rex Lojistik Portal

## Güvenli teklif formu

Teklifler önce Supabase üzerindeki kalıcı kuyruğa ve değiştirilemeyen onay geçmişine kaydedilir, ardından Resend ile `info@rexlojistik.com` adresine iletilir. Geçici teslimat hataları günlük kuyruk göreviyle otomatik olarak yeniden denenir. Canlı Vercel ortamında aşağıdaki değişkenler tanımlanmalıdır:

```text
RESEND_API_KEY=
QUOTE_RECIPIENT_EMAIL=info@rexlojistik.com
QUOTE_FROM_EMAIL=REX Lojistik <teklif@rexlojistik.com>
NEXT_PUBLIC_TURNSTILE_SITE_KEY=
TURNSTILE_SECRET_KEY=
QUOTE_SECURITY_SECRET=
SUPABASE_SERVICE_ROLE_KEY=
CRON_SECRET=
```

`QUOTE_FROM_EMAIL` kullanılmadan önce `rexlojistik.com` alan adı Resend içinde doğrulanmalıdır. Doğrulama tamamlanana kadar bu değişken boş bırakılır ve Resend test göndericisi kullanılır. `TURNSTILE_SECRET_KEY`, `QUOTE_SECURITY_SECRET`, `SUPABASE_SERVICE_ROLE_KEY` ve `CRON_SECRET` yalnızca sunucuda tutulur.

## KolayBi fatura bağlantısı

KolayBi anahtarları yalnızca sunucu ortamında tutulur. Canlı ortamda aşağıdaki değişkenler tanımlanmalıdır:

```text
KOLAYBI_API_KEY=
KOLAYBI_CHANNEL=
KOLAYBI_PRODUCT_ID=
KOLAYBI_BASE_URL=https://ofis-api.kolaybi.com/kolaybi/v1
KOLAYBI_AUTO_SEND_E_DOCUMENT=false
KOLAYBI_E_DOCUMENT_PREFIX=
SUPABASE_SERVICE_ROLE_KEY=
CRON_SECRET=
```

`CRON_SECRET` en az 16 karakterlik rastgele bir değer olmalıdır. `SUPABASE_SERVICE_ROLE_KEY` ve bütün KolayBi anahtarları yalnızca Vercel sunucu ortamında tutulur; `NEXT_PUBLIC_` ile başlayan değişkenlere kesinlikle yazılmaz.

Önce cari kartındaki **KolayBi Contact ID** ve **Address ID** alanları eşleştirilir. Taşıma hizmeti için `KOLAYBI_PRODUCT_ID` veya `invoice_product_mappings` tablosundaki `HIZMET` eşlemesi kullanılır. Anahtarlar ya da eşlemeler eksikse yerel taslak korunur, sevkiyat faturalandı sayılmaz ve hata muhasebe ekranında gösterilir.

Fatura durumları: `draft` → `queued` → `submitted` → `official`. Geçici bağlantı hataları artan bekleme süreleriyle yeniden denenir. Sevkiyat yalnızca `official` durumunda `faturalandi` olur. Vercel zamanlayıcısı kuyruğu her gün işler; muhasebe ekranı açıkken vadesi gelen işler ayrıca her dakika işlenir.

## Teslim evrakı virüs taraması

Teslim evrakları önce özel `shipment-documents/delivery-documents` karantina alanına yüklenir. Gerçek sunucu tarafı tarama için canlı Vercel ortamında şu değişken tanımlanmalıdır:

```text
CLOUDMERSIVE_API_KEY=
```

Anahtar tarayıcıya gönderilmez ve kesinlikle `NEXT_PUBLIC_` ön ekiyle tanımlanmaz. Tarama servisi bağlı değilse yeni belge `pending` durumunda özel karantinada kalır ve müşteriye gösterilmez. `delivery_document_settings.scan_enforcement_enabled` değeri yalnızca tarama anahtarı canlı ortamda doğrulandıktan sonra `true` yapılmalıdır. Zararlı sonucu alan dosyalar bu ayardan bağımsız olarak teslimatta kullanılamaz ve önizlemeye açılmaz.

## Cloudflare R2 özel belge depolama

R2 geçişi geriye uyumludur: mevcut `storage://` kayıtları Supabase Storage üzerinden açılmaya devam eder. Yeni yüklemeleri R2'ye geçirmek için özel `rex-private-documents` bucket'ı, yalnızca bu bucket'a **Object Read & Write** yetkili bir R2 API token'ı ve aşağıdaki Vercel değişkenleri gerekir:

```text
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=rex-private-documents
NEXT_PUBLIC_PRIVATE_STORAGE_BACKEND=r2
```

R2 anahtarları yalnızca sunucuda tutulur. Bucket herkese açık yapılmaz. Tarayıcı yüklemeleri beş dakikalık imzalı URL ile yapılır; CORS yalnızca `https://www.rexlojistik.com` ve kontrollü geliştirme adreslerini kabul etmelidir. Önce Preview ortamında yükleme, görüntüleme, silme ve teslim evrakı virüs taraması doğrulanır; ardından Production değişkeni `r2` yapılır.
