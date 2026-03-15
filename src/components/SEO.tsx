import Head from "next/head";

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
}

const defaultSEO = {
  title: "REX Lojistik - Kara, Hava ve Deniz Taşımacılığı | Gümrükleme ve Depolama Hizmetleri",
  description: "REX Lojistik olarak parsiyel yük taşımacılığı, komple araç kiralama, hava ve deniz taşımacılığı, gümrükleme ve depolama hizmetleri sunuyoruz. Türkiye ve Avrupa'ya güvenli teslimat.",
  image: "/og-image.png",
  url: "https://rexlojistik.com",
};

export function SEO({ 
  title = defaultSEO.title, 
  description = defaultSEO.description, 
  image = defaultSEO.image,
  url = defaultSEO.url 
}: SEOProps) {
  return (
    <Head>
      <title>{title}</title>
      <meta name="description" content={description} />
      
      <meta property="og:type" content="website" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={url} />
      
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      
      <link rel="canonical" href={url} />
      
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta charSet="utf-8" />
      <link rel="icon" href="/favicon.ico" />
    </Head>
  );
}

export function SEOElements() {
  return (
    <>
      <title>{defaultSEO.title}</title>
      <meta name="description" content={defaultSEO.description} />
      
      <meta property="og:type" content="website" />
      <meta property="og:title" content={defaultSEO.title} />
      <meta property="og:description" content={defaultSEO.description} />
      <meta property="og:image" content={defaultSEO.image} />
      <meta property="og:url" content={defaultSEO.url} />
      
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={defaultSEO.title} />
      <meta name="twitter:description" content={defaultSEO.description} />
      <meta name="twitter:image" content={defaultSEO.image} />
      
      <link rel="canonical" href={defaultSEO.url} />
    </>
  );
}