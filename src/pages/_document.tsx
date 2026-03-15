import { Html, Head, Main, NextScript } from "next/document";
import { SEOElements } from "@/components/SEO";

export default function Document() {
  return (
    <Html lang="tr">
      <Head>
        <SEOElements
          title="REX Lojistik - Uluslararası Lojistik ve Nakliye Hizmetleri"
          description="REX Lojistik ile güvenli, hızlı ve ekonomik uluslararası taşımacılık. Kara, hava, deniz yolu taşımacılığı, depolama ve sigorta hizmetleri. 2022'den beri profesyonel hizmet."
          image="/og-image.png"
        />
        <link rel="icon" href="/favicon.ico" />
        <meta name="theme-color" content="#1e3a8a" />
        <link rel="apple-touch-icon" href="/og-image.png" />
        <meta name="keywords" content="rex lojistik, uluslararası lojistik, kargo taşımacılığı, hava kargo, deniz yolu taşımacılığı, kara taşımacılığı, depolama hizmeti, nakliye sigortası, parsiyel taşıma, komple taşıma, proje taşımacılığı" />
        <meta name="author" content="REX Lojistik" />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://www.rexlojistik.com" />
        
        {/* JSON-LD Structured Data for SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "REX Lojistik",
              "description": "Uluslararası lojistik ve nakliye hizmetleri - Kara, hava, deniz yolu taşımacılığı",
              "url": "https://www.rexlojistik.com",
              "logo": "https://www.rexlojistik.com/og-image.png",
              "foundingDate": "2022-12",
              "contactPoint": {
                "@type": "ContactPoint",
                "telephone": "+90-216-123-4567",
                "contactType": "customer service",
                "areaServed": "TR",
                "availableLanguage": ["tr", "en"]
              },
              "sameAs": [
                "https://facebook.com/rexlojistik",
                "https://twitter.com/rexlojistik",
                "https://instagram.com/rexlojistik",
                "https://linkedin.com/company/rexlojistik"
              ],
              "address": {
                "@type": "PostalAddress",
                "streetAddress": "Atatürk Mahallesi, Lojistik Caddesi No:45",
                "addressLocality": "İstanbul",
                "addressRegion": "Marmara",
                "postalCode": "34758",
                "addressCountry": "TR"
              },
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "4.9",
                "reviewCount": "150+"
              }
            })
          }}
        />
        
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Service",
              "serviceType": "Uluslararası Lojistik ve Nakliye Hizmetleri",
              "provider": {
                "@type": "Organization",
                "name": "REX Lojistik"
              },
              "areaServed": [
                {
                  "@type": "Country",
                  "name": "Turkey"
                },
                {
                  "@type": "Place",
                  "name": "Europe"
                },
                {
                  "@type": "Place",
                  "name": "Asia"
                },
                {
                  "@type": "Place",
                  "name": "Middle East"
                }
              ],
              "hasOfferCatalog": {
                "@type": "OfferCatalog",
                "name": "Lojistik Hizmetleri",
                "itemListElement": [
                  {
                    "@type": "Offer",
                    "itemOffered": {
                      "@type": "Service",
                      "name": "Kara Yolu Taşımacılığı",
                      "description": "Parsiyel ve komple yük taşımacılığı"
                    }
                  },
                  {
                    "@type": "Offer",
                    "itemOffered": {
                      "@type": "Service",
                      "name": "Hava Yolu Taşımacılığı",
                      "description": "Express ve standart hava kargo"
                    }
                  },
                  {
                    "@type": "Offer",
                    "itemOffered": {
                      "@type": "Service",
                      "name": "Deniz Yolu Taşımacılığı",
                      "description": "FCL ve LCL konteyner taşımacılığı"
                    }
                  },
                  {
                    "@type": "Offer",
                    "itemOffered": {
                      "@type": "Service",
                      "name": "Depolama Hizmeti",
                      "description": "Güvenli depolama ve stok yönetimi"
                    }
                  },
                  {
                    "@type": "Offer",
                    "itemOffered": {
                      "@type": "Service",
                      "name": "Paketleme ve Elleçleme",
                      "description": "Profesyonel paketleme hizmetleri"
                    }
                  },
                  {
                    "@type": "Offer",
                    "itemOffered": {
                      "@type": "Service",
                      "name": "Proje Kargo",
                      "description": "Ağır ve büyük boy ekipman taşımacılığı"
                    }
                  }
                ]
              }
            })
          }}
        />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              "mainEntity": [
                {
                  "@type": "Question",
                  "name": "REX Lojistik hangi ülkelere hizmet veriyor?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "REX Lojistik, Avrupa, Asya, Orta Doğu ve Afrika olmak üzere 30'dan fazla ülkeye kara, hava ve deniz yolu taşımacılığı hizmeti sunmaktadır."
                  }
                },
                {
                  "@type": "Question",
                  "name": "Kargomun durumunu nasıl takip edebilirim?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Web sitemizin kargo takip bölümünden takip numaranızı girerek kargonuzun anlık konumunu ve durumunu görebilirsiniz. Ayrıca SMS ve e-posta bildirimleri alırsınız."
                  }
                },
                {
                  "@type": "Question",
                  "name": "Nakliye sigortası zorunlu mudur?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Nakliye sigortası zorunlu değildir ancak yükünüzün güvenliği için şiddetle tavsiye edilir. REX Lojistik, kapsamlı sigorta seçenekleri sunmaktadır."
                  }
                }
              ]
            })
          }}
        />
      </Head>
      <body className="antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}