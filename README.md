# Rex Lojistik Portal

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
