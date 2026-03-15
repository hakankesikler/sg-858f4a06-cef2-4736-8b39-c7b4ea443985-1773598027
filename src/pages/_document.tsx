import { Html, Head, Main, NextScript } from "next/document";
import { SEOElements } from "@/components/SEO";

export default function Document() {
  return (
    <Html lang="tr">
      <Head>
        <SEOElements
          title="LogisticPro - Profesyonel Lojistik Çözümleri"
          description="Kara, hava ve deniz taşımacılığı ile depolama hizmetleri. 150+ ülkeye güvenli ve hızlı teslimat. 7/24 müşteri desteği ve anlık kargo takibi."
          image="/og-image.png"
        />
        <link rel="icon" href="/favicon.ico" />
        <meta name="theme-color" content="#1e3a8a" />
        <link rel="apple-touch-icon" href="/og-image.png" />
        <meta name="keywords" content="lojistik, kargo, taşımacılık, depolama, hava kargo, deniz taşımacılığı, kara taşımacılığı, uluslararası lojistik, kargo takip, tedarik zinciri" />
        <meta name="author" content="LogisticPro" />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://logisticpro.com" />
        
        {/* JSON-LD Structured Data for SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "LogisticPro",
              "description": "Profesyonel lojistik ve kargo taşımacılığı hizmetleri",
              "url": "https://logisticpro.com",
              "logo": "https://logisticpro.com/og-image.png",
              "contactPoint": {
                "@type": "ContactPoint",
                "telephone": "+90-850-123-4567",
                "contactType": "customer service",
                "areaServed": "TR",
                "availableLanguage": ["tr", "en"]
              },
              "sameAs": [
                "https://facebook.com/logisticpro",
                "https://twitter.com/logisticpro",
                "https://instagram.com/logisticpro",
                "https://linkedin.com/company/logisticpro"
              ],
              "address": {
                "@type": "PostalAddress",
                "streetAddress": "Atatürk Mah. Lojistik Cad. No:123",
                "addressLocality": "İstanbul",
                "postalCode": "34758",
                "addressCountry": "TR"
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
              "serviceType": "Lojistik ve Kargo Hizmetleri",
              "provider": {
                "@type": "Organization",
                "name": "LogisticPro"
              },
              "areaServed": {
                "@type": "Country",
                "name": "Turkey"
              },
              "hasOfferCatalog": {
                "@type": "OfferCatalog",
                "name": "Lojistik Hizmetleri",
                "itemListElement": [
                  {
                    "@type": "Offer",
                    "itemOffered": {
                      "@type": "Service",
                      "name": "Kara Taşımacılığı"
                    }
                  },
                  {
                    "@type": "Offer",
                    "itemOffered": {
                      "@type": "Service",
                      "name": "Hava Kargo"
                    }
                  },
                  {
                    "@type": "Offer",
                    "itemOffered": {
                      "@type": "Service",
                      "name": "Deniz Taşımacılığı"
                    }
                  },
                  {
                    "@type": "Offer",
                    "itemOffered": {
                      "@type": "Service",
                      "name": "Depolama Hizmeti"
                    }
                  }
                ]
              }
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