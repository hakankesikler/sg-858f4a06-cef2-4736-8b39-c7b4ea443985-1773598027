# Rex Lojistik Portal

## KolayBi fatura bağlantısı

KolayBi anahtarları yalnızca sunucu ortamında tutulur. Canlı ortamda aşağıdaki değişkenler tanımlanmalıdır:

```text
KOLAYBI_API_KEY=
KOLAYBI_CHANNEL=
KOLAYBI_PRODUCT_ID=
KOLAYBI_BASE_URL=https://ofis-api.kolaybi.com/kolaybi/v1
KOLAYBI_AUTO_SEND_E_DOCUMENT=false
```

Önce cari kartındaki **KolayBi Contact ID** ve **Address ID** alanları eşleştirilir. Anahtarlar veya cari eşlemesi eksikse yerel fatura korunur ve KolayBi gönderimi bekleme durumuna alınır.
