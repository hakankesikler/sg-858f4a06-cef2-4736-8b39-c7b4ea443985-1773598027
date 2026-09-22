"use client";

import Image from "next/image";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

const links = [
  { href: "/en/#services", label: "Services" },
  { href: "/en/about", label: "About us" },
  { href: "/en/contact", label: "Contact" },
];

export function EnglishHeader() {
  const [open, setOpen] = useState(false);
  return <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/95 shadow-sm backdrop-blur">
    <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-2 sm:px-6 lg:px-8">
      <Link href="/en" aria-label="REX Logistics home"><Image src="/rex.png" alt="REX Logistics" width={180} height={77} priority className="h-[54px] w-auto object-contain sm:h-[66px]" /></Link>
      <nav aria-label="Primary navigation" className="hidden items-center gap-6 lg:flex">
        {links.map((link) => <Link key={link.href} href={link.href} className="font-medium text-slate-700 transition hover:text-orange-600">{link.label}</Link>)}
        <a href="tel:+905434010755" className="font-semibold text-slate-700 transition hover:text-orange-600">+90 543 401 07 55</a>
        <LanguageSwitcher locale="en" />
        <Link href="/en/#quote" className="rounded-md bg-orange-600 px-5 py-2.5 font-semibold text-white transition hover:bg-orange-700">Get a quote</Link>
      </nav>
      <div className="flex items-center gap-2 lg:hidden"><LanguageSwitcher locale="en" /><button type="button" onClick={() => setOpen((value) => !value)} className="rounded-md p-2 text-slate-800" aria-label={open ? "Close menu" : "Open menu"}>{open ? <X /> : <Menu />}</button></div>
    </div>
    {open && <nav aria-label="Mobile navigation" className="border-t border-slate-100 bg-white px-4 py-4 lg:hidden">
      <div className="mx-auto flex max-w-7xl flex-col gap-1">{links.map((link) => <Link key={link.href} href={link.href} onClick={() => setOpen(false)} className="rounded-lg px-4 py-3 font-medium text-slate-700 hover:bg-orange-50 hover:text-orange-700">{link.label}</Link>)}<a href="tel:+905434010755" className="rounded-lg px-4 py-3 font-medium text-slate-700">+90 543 401 07 55</a><Link href="/en/#quote" onClick={() => setOpen(false)} className="mt-2 rounded-lg bg-orange-600 px-4 py-3 text-center font-semibold text-white">Get a quote</Link></div>
    </nav>}
  </header>;
}
