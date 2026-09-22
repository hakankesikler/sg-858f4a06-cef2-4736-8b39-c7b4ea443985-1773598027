import Link from "next/link";
import Image from "next/image";

export function EnglishFooter() {
  return <footer className="bg-[#1a1f2e] text-white">
    <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-3 lg:px-8">
      <div><Image src="/rexlogo.png" alt="REX Logistics" width={270} height={60} className="mb-6 w-56" /><p className="text-sm leading-relaxed text-slate-200">Founded in 2022 on its founder's logistics experience since 2002, REX Logistics offers planned, reliable solutions for domestic and international transport.</p></div>
      <div><h2 className="mb-4 text-lg font-semibold">Services</h2><ul className="space-y-2 text-sm text-slate-200"><li><Link href="/en/domestic-part-load-transport">Domestic part loads</Link></li><li><Link href="/en/full-truckload-transport">Full truckload</Link></li><li><Link href="/en/international-road-freight">International road freight</Link></li><li><Link href="/en/air-freight">Air freight</Link></li><li><Link href="/en/sea-freight">Sea freight</Link></li></ul></div>
      <div><h2 className="mb-4 text-lg font-semibold">Contact</h2><address className="not-italic text-sm leading-relaxed text-slate-200">Folkart Towers A Tower No:47/B<br />Floor 26, Suite 2601<br />Bayraklı, İzmir, Türkiye<br /><a className="mt-3 block" href="tel:+902322290014">+90 232 229 00 14</a><a href="mailto:info@rexlojistik.com">info@rexlojistik.com</a></address></div>
    </div><div className="border-t border-white/10 px-4 py-5 text-center text-sm text-slate-300">© 2026 REX Logistics. <Link href="/gizlilik-politikasi" className="underline">Privacy notice</Link> (Turkish)</div>
  </footer>;
}
