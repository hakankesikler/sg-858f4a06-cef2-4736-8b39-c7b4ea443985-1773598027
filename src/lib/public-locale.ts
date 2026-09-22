export type PublicLocale = "tr" | "en";

const englishByTurkishPath: Record<string, string> = {
  "/": "/en",
  "/yurtici-parsiyel-tasimacilik": "/en/domestic-part-load-transport",
  "/komple-tasimacilik": "/en/full-truckload-transport",
  "/uluslararasi-karayolu-tasimaciligi": "/en/international-road-freight",
  "/hava-kargo": "/en/air-freight",
  "/express-kargo": "/en/express-courier",
  "/denizyolu-tasimaciligi": "/en/sea-freight",
  "/depolama": "/en/warehousing-services",
  "/hakkimizda": "/en/about",
  "/iletisim": "/en/contact",
};

const turkishByEnglishPath = Object.fromEntries(
  Object.entries(englishByTurkishPath).map(([turkishPath, englishPath]) => [englishPath, turkishPath]),
);

turkishByEnglishPath["/en/packing-and-handling"] = "/depolama";

export function isEnglishPublicPath(pathname: string) {
  return pathname === "/en" || pathname.startsWith("/en/");
}

export function languagePath(pathname: string, target: PublicLocale) {
  const cleanPath = pathname.split("?")[0].split("#")[0] || "/";
  if (target === "en") return englishByTurkishPath[cleanPath] || "/en";
  return turkishByEnglishPath[cleanPath] || "/";
}

export function localizedPublicPath(path: string, locale: PublicLocale) {
  if (locale === "tr") return path;
  return englishByTurkishPath[path] || "/en";
}

export const englishPublicPaths = Object.values(englishByTurkishPath);
