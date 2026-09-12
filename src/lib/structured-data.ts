import type { MarketingPageData } from "@/content/marketing-pages";

export type StructuredData = Record<string, unknown>;

export const SITE_URL = "https://www.rexlojistik.com";
export const ORGANIZATION_ID = `${SITE_URL}/#organization`;
export const WEBSITE_ID = `${SITE_URL}/#website`;
export const IZMIR_OFFICE_ID = `${SITE_URL}/#izmir-office`;
export const MANISA_OFFICE_ID = `${SITE_URL}/#manisa-office`;

const LOGO_URL = `${SITE_URL}/rex.png`;

const turkeyOnlyServiceSlugs = new Set([
  "yurtici-parsiyel-tasimacilik",
  "gumruk-antrepo-yurtici-transfer",
  "hafta-sonu-acil-nakliye",
  "komple-tasimacilik",
  "turkiye-geneli-hava-kargo-alimi",
  "depolama",
]);

function organization(includeLocations: boolean): StructuredData {
  return {
    "@type": "Organization",
    "@id": ORGANIZATION_ID,
    name: "REX Lojistik",
    legalName: "REX Lojistik Taşımacılık Depolama Danışmanlık Limited Şirketi",
    url: SITE_URL,
    logo: {
      "@type": "ImageObject",
      "@id": `${SITE_URL}/#logo`,
      url: LOGO_URL,
      contentUrl: LOGO_URL,
    },
    foundingDate: "2022",
    email: "info@rexlojistik.com",
    telephone: "+905434010755",
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+905434010755",
      contactType: "customer service",
      availableLanguage: "Turkish",
    },
    ...(includeLocations
      ? {
          location: [
            { "@id": IZMIR_OFFICE_ID },
            { "@id": MANISA_OFFICE_ID },
          ],
        }
      : {}),
  };
}

function website(): StructuredData {
  return {
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    url: `${SITE_URL}/`,
    name: "REX Lojistik",
    publisher: { "@id": ORGANIZATION_ID },
    inLanguage: "tr-TR",
  };
}

function offices(): StructuredData[] {
  return [
    {
      "@type": "LocalBusiness",
      "@id": IZMIR_OFFICE_ID,
      name: "REX Lojistik İzmir Merkez Ofisi",
      parentOrganization: { "@id": ORGANIZATION_ID },
      email: "info@rexlojistik.com",
      telephone: "+902322290014",
      address: {
        "@type": "PostalAddress",
        streetAddress: "Folkart Towers A Kule No:47/B Kat:26 Daire:2601, Adalet Mahallesi Manas Bulvarı",
        addressLocality: "Bayraklı",
        addressRegion: "İzmir",
        postalCode: "35630",
        addressCountry: "TR",
      },
    },
    {
      "@type": "LocalBusiness",
      "@id": MANISA_OFFICE_ID,
      name: "REX Lojistik Manisa Ofisi",
      parentOrganization: { "@id": ORGANIZATION_ID },
      email: "info@rexlojistik.com",
      telephone: "+902362300013",
      address: {
        "@type": "PostalAddress",
        streetAddress: "Rainbow Life AVM, Muradiye Mahallesi Manolya Sokak No:228/1, A Blok No:28",
        addressLocality: "Yunusemre",
        addressRegion: "Manisa",
        postalCode: "45140",
        addressCountry: "TR",
      },
    },
  ];
}

function breadcrumb(
  canonicalUrl: string,
  items: Array<{ name: string; item: string }>,
): StructuredData {
  return {
    "@type": "BreadcrumbList",
    "@id": `${canonicalUrl}#breadcrumb`,
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.item,
    })),
  };
}

function graph(nodes: StructuredData[]): StructuredData {
  return {
    "@context": "https://schema.org",
    "@graph": nodes,
  };
}

export function buildHomeStructuredData(input: {
  name: string;
  description: string;
}): StructuredData {
  return graph([
    organization(true),
    website(),
    ...offices(),
    {
      "@type": "WebPage",
      "@id": `${SITE_URL}/#webpage`,
      url: `${SITE_URL}/`,
      name: input.name,
      description: input.description,
      isPartOf: { "@id": WEBSITE_ID },
      about: { "@id": ORGANIZATION_ID },
      inLanguage: "tr-TR",
    },
  ]);
}

export function buildMarketingPageStructuredData(page: MarketingPageData): StructuredData {
  const canonicalUrl = `${SITE_URL}/${page.slug}`;
  const includeLocations = page.kind === "contact";
  const breadcrumbNode = breadcrumb(canonicalUrl, [
    { name: "Ana Sayfa", item: `${SITE_URL}/` },
    { name: page.title, item: canonicalUrl },
  ]);
  const pageNode: StructuredData = {
    "@type": "WebPage",
    "@id": `${canonicalUrl}#webpage`,
    url: canonicalUrl,
    name: page.title,
    description: page.lead,
    isPartOf: { "@id": WEBSITE_ID },
    breadcrumb: { "@id": `${canonicalUrl}#breadcrumb` },
    about: { "@id": page.kind === "service" ? `${canonicalUrl}#service` : ORGANIZATION_ID },
    inLanguage: "tr-TR",
  };
  const nodes: StructuredData[] = [organization(includeLocations), website()];

  if (includeLocations) nodes.push(...offices());
  nodes.push(pageNode, breadcrumbNode);

  if (page.kind === "service") {
    nodes.push({
      "@type": "Service",
      "@id": `${canonicalUrl}#service`,
      name: page.title,
      serviceType: page.title,
      description: page.lead,
      url: canonicalUrl,
      provider: { "@id": ORGANIZATION_ID },
      mainEntityOfPage: { "@id": `${canonicalUrl}#webpage` },
      ...(turkeyOnlyServiceSlugs.has(page.slug)
        ? { areaServed: { "@type": "Country", name: "Türkiye" } }
        : {}),
    });
  }

  return graph(nodes);
}

export function buildResourcePageStructuredData(input: {
  page: MarketingPageData;
  parentName: string;
  parentPath: string;
  dateModified: string;
}): StructuredData {
  const canonicalUrl = `${SITE_URL}/${input.page.slug}`;
  const articleId = `${canonicalUrl}#article`;
  const breadcrumbNode = breadcrumb(canonicalUrl, [
    { name: "Ana Sayfa", item: `${SITE_URL}/` },
    { name: input.parentName, item: `${SITE_URL}${input.parentPath}` },
    { name: input.page.title, item: canonicalUrl },
  ]);

  return graph([
    organization(false),
    website(),
    {
      "@type": "WebPage",
      "@id": `${canonicalUrl}#webpage`,
      url: canonicalUrl,
      name: input.page.title,
      description: input.page.lead,
      isPartOf: { "@id": WEBSITE_ID },
      breadcrumb: { "@id": `${canonicalUrl}#breadcrumb` },
      mainEntity: { "@id": articleId },
      inLanguage: "tr-TR",
    },
    breadcrumbNode,
    {
      "@type": "Article",
      "@id": articleId,
      headline: input.page.title,
      description: input.page.lead,
      url: canonicalUrl,
      inLanguage: "tr-TR",
      dateModified: input.dateModified,
      mainEntityOfPage: { "@id": `${canonicalUrl}#webpage` },
      author: { "@id": ORGANIZATION_ID },
      publisher: { "@id": ORGANIZATION_ID },
    },
  ]);
}
