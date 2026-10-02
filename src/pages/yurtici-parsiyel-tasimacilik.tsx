import { MarketingPage } from "@/components/MarketingPage";
import { DomesticPartialPlanner } from "@/components/DomesticPartialPlanner";
import { marketingPages } from "@/content/marketing-pages";

export default function YurticiParsiyelTasimacilikPage() {
  return (
    <MarketingPage page={marketingPages["yurtici-parsiyel-tasimacilik"]}>
      <DomesticPartialPlanner />
      <section aria-labelledby="parsiyel-rotalar-baslik" className="border-y border-slate-200 bg-slate-50 py-14">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <h2 id="parsiyel-rotalar-baslik" className="text-3xl font-bold text-slate-950">Sık Kullanılan Parsiyel Rotalar</h2>
          <p className="mt-4 text-lg leading-8 text-slate-600">
            İzmir ve Manisa çıkışlı gönderileriniz için aşağıdaki rota sayfalarında yük alımı ve teslimat planlamasına ilişkin bilgileri inceleyebilirsiniz.
          </p>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2">
            {[
              { href: "/izmir-gebze-parsiyel-tasimacilik", label: "İzmir’den Gebze’ye parsiyel gönderiler" },
              { href: "/manisa-gebze-parsiyel-tasimacilik", label: "Manisa–Gebze hattında parsiyel taşıma" },
              { href: "/izmir-istanbul-parsiyel-tasimacilik", label: "İzmir–İstanbul parsiyel taşıma planlaması" },
              { href: "/izmir-bursa-parsiyel-tasimacilik", label: "İzmir’den Bursa’ya parsiyel yük sevkiyatı" },
              { href: "/manisa-bursa-parsiyel-tasimacilik", label: "Manisa çıkışlı Bursa parsiyel gönderileri" },
            ].map((route) => (
              <li key={route.href}>
                <a href={route.href} className="block rounded-xl border border-slate-200 bg-white p-5 font-semibold text-slate-800 transition hover:border-orange-300 hover:text-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-300">
                  {route.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </MarketingPage>
  );
}
