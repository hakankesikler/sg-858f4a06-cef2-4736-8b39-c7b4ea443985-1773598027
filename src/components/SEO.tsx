import Head from 'next/head';

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
}

// SEO elements that can be used in _document.tsx (returns JSX without Head wrapper)
export function SEOElements({
  title = "REX Lojistik - Uluslararası Taşımacılık ve Lojistik Hizmetleri",
  description = "2003 yılından bu yana hava, deniz ve kara yolu taşımacılığı, gümrükleme ve depolama hizmetlerinde profesyonel çözümler. İstanbul merkezli uluslararası lojistik şirketi.",
  image = "/og-image.png",
  url,
}: SEOProps) {
  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content="lojistik, uluslararası taşımacılık, hava kargo, deniz yolu taşımacılığı, kara yolu taşımacılığı, gümrükleme, depolama, antrepo, İstanbul lojistik, ithalat ihracat" />
      <link rel="icon" href="/favicon.ico" />

      {/* Open Graph */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      {image && <meta property="og:image" content={image} />}
      {url && <meta property="og:url" content={url} />}
      <meta property="og:type" content="website" />
      <meta property="og:locale" content="tr_TR" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      {image && <meta name="twitter:image" content={image} />}
    </>
  );
}

// SEO component for use in pages/_app.tsx or individual pages (uses next/head)
// Note: Flattened structure (no fragment) for better Next.js Head compatibility during hot reload
export function SEO({
  title = "REX Lojistik - Uluslararası Taşımacılık ve Lojistik Hizmetleri",
  description = "2003 yılından bu yana hava, deniz ve kara yolu taşımacılığı, gümrükleme ve depolama hizmetlerinde profesyonel çözümler. İstanbul merkezli uluslararası lojistik şirketi.",
  image = "/og-image.png",
  url,
}: SEOProps) {
  return (
    <Head>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content="lojistik, uluslararası taşımacılık, hava kargo, deniz yolu taşımacılığı, kara yolu taşımacılığı, gümrükleme, depolama, antrepo, İstanbul lojistik, ithalat ihracat" />
      <link rel="icon" href="/favicon.ico" />

      {/* Open Graph */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      {image && <meta property="og:image" content={image} />}
      {url && <meta property="og:url" content={url} />}
      <meta property="og:type" content="website" />
      <meta property="og:locale" content="tr_TR" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      {image && <meta name="twitter:image" content={image} />}
    </Head>
  );
}