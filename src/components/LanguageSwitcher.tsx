"use client";

import Link from "next/link";
import { useRouter } from "next/router";
import { languagePath, type PublicLocale } from "@/lib/public-locale";

export function LanguageSwitcher({ locale }: { locale: PublicLocale }) {
  const router = useRouter();
  const sourcePath = router.asPath || "/";

  return (
    <div className="inline-flex overflow-hidden rounded-lg border border-slate-200 bg-white text-xs font-bold shadow-sm" aria-label={locale === "en" ? "Language selection" : "Dil seçimi"}>
      <Link href={languagePath(sourcePath, "tr")} className={`px-2.5 py-2 transition ${locale === "tr" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-50"}`}>TR</Link>
      <Link href={languagePath(sourcePath, "en")} className={`border-l border-slate-200 px-2.5 py-2 transition ${locale === "en" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-50"}`}>EN</Link>
    </div>
  );
}
