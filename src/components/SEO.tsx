import Head from "next/head";

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
}

export function SEO({
  title = "Rex Lojistik - Hızlı ve Güvenilir Lojistik Çözümleri",
  description = "Kara, hava ve deniz taşımacılığı, depolama ve uluslararası kargo hizmetleri. 7/24 müşteri desteği ile güvenli teslimat.",
  image = "/og-image.png",
  url = "https://rexlojistik.com"
}: SEOProps) {
  return (
    <Head>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content="lojistik, kargo, taşımacılık, depolama, hava kargo, deniz kargo, uluslararası kargo, hızlı teslimat" />
      
      {/* Open Graph */}
      <meta property="og:type" content="website" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={url} />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      
      {/* Canonical */}
      <link rel="canonical" href={url} />
    </Head>
  );
}

export function SEOElements() {
  return (
    <>
      <meta name="description" content="Kara, hava ve deniz taşımacılığı, depolama ve uluslararası kargo hizmetleri. 7/24 müşteri desteği ile güvenli teslimat." />
      <meta name="keywords" content="lojistik, kargo, taşımacılık, depolama, hava kargo, deniz kargo, uluslararası kargo, hızlı teslimat" />
      <meta property="og:type" content="website" />
      <meta property="og:title" content="Rex Lojistik - Hızlı ve Güvenilir Lojistik Çözümleri" />
      <meta property="og:description" content="Kara, hava ve deniz taşımacılığı, depolama ve uluslararası kargo hizmetleri. 7/24 müşteri desteği ile güvenli teslimat." />
      <meta property="og:image" content="/og-image.png" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="Rex Lojistik - Hızlı ve Güvenilir Lojistik Çözümleri" />
      <meta name="twitter:description" content="Kara, hava ve deniz taşımacılığı, depolama ve uluslararası kargo hizmetleri. 7/24 müşteri desteği ile güvenli teslimat." />
      <meta name="twitter:image" content="/og-image.png" />
    </>
  );
}