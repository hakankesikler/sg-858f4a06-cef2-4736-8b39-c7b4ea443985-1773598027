import Head from "next/head";

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
}

export function SEO({
  title = "Rex Lojistik - Türkiye'nin Güvenilir Lojistik Partneri",
  description = "Rex Lojistik ile kara, hava ve deniz taşımacılığı hizmetleri. Depolama, dağıtım ve uluslararası kargo çözümleri. 7/24 müşteri desteği, hızlı ve güvenli teslimat. İletişim: 0543 401 07 55",
  image = "/og-image.png",
  url = "https://www.rexlojistik.com"
}: SEOProps) {
  return (
    <Head>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content="rex lojistik, lojistik firması, kargo şirketi, nakliye, taşımacılık, depolama, dağıtım, hava kargo, deniz kargo, kara taşımacılığı, uluslararası kargo, lojistik çözümleri, hızlı teslimat, güvenli kargo" />
      <meta name="author" content="Rex Lojistik" />
      <meta name="language" content="tr" />
      <meta name="robots" content="index, follow" />
      
      {/* Open Graph */}
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="Rex Lojistik" />
      <meta property="og:locale" content="tr_TR" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:url" content={url} />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      
      {/* Canonical */}
      <link rel="canonical" href={url} />
      
      {/* Additional SEO */}
      <meta name="theme-color" content="#D84315" />
      <meta name="apple-mobile-web-app-title" content="Rex Lojistik" />
      <meta name="application-name" content="Rex Lojistik" />
    </Head>
  );
}

export function SEOElements() {
  return (
    <>
      <meta name="description" content="Rex Lojistik ile kara, hava ve deniz taşımacılığı hizmetleri. Depolama, dağıtım ve uluslararası kargo çözümleri. 7/24 müşteri desteği, hızlı ve güvenli teslimat. İletişim: 0543 401 07 55" />
      <meta name="keywords" content="rex lojistik, lojistik firması, kargo şirketi, nakliye, taşımacılık, depolama, dağıtım, hava kargo, deniz kargo, kara taşımacılığı, uluslararası kargo, lojistik çözümleri, hızlı teslimat, güvenli kargo" />
      <meta name="author" content="Rex Lojistik" />
      <meta name="language" content="tr" />
      <meta name="theme-color" content="#D84315" />
      <meta name="apple-mobile-web-app-title" content="Rex Lojistik" />
      <meta name="application-name" content="Rex Lojistik" />
    </>
  );
}