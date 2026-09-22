import { EnglishFooter } from "@/components/EnglishFooter";
import { EnglishHeader } from "@/components/EnglishHeader";
import { EnglishQuoteLaunchButton } from "@/components/EnglishQuoteLaunchButton";
import { Features } from "@/components/Features";
import { Hero } from "@/components/Hero";
import { SEO } from "@/components/SEO";
import { Services } from "@/components/Services";
import { TrackingSection } from "@/components/TrackingSection";

export default function EnglishHome() {
  const url = "https://www.rexlojistik.com/en";
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [{
      "@type": "WebPage",
      "@id": url,
      url,
      name: "REX Logistics | Freight Solutions",
      isPartOf: { "@id": "https://www.rexlojistik.com/#website" },
      about: { "@id": "https://www.rexlojistik.com/#organization" },
    }],
  };

  return <>
    <SEO title="REX Logistics | Domestic and International Freight Solutions" description="REX Logistics organises domestic and international road, air and sea freight solutions. Request a tailored transport quote." url={url} language="en" alternates={{ tr: "https://www.rexlojistik.com/", en: url }} structuredData={structuredData} />
    <EnglishHeader />
    <main>
      <Hero locale="en" quoteEventName="rex:open-english-quote-form" />
      <Services locale="en" />
      <TrackingSection locale="en" />
      <Features locale="en" />
      <section id="quote" className="bg-slate-50 py-16 scroll-mt-24">
        <div className="container mx-auto px-4 text-center sm:px-6 lg:px-8">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-orange-600">A clear start</p>
          <h2 className="mt-3 font-heading text-3xl font-bold text-navy sm:text-4xl">Tell Us About Your Shipment</h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-slate-600">Share the collection and delivery addresses, cargo quantity, dimensions, weight and readiness date. We will assess a suitable transport option.</p>
          <div className="mt-7"><EnglishQuoteLaunchButton label="Get a Quote" /></div>
        </div>
      </section>
    </main>
    <EnglishFooter />
  </>;
}
