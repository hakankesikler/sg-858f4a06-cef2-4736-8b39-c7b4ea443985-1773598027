"use client";

import { FormEvent, useState } from "react";
import { TurnstileWidget, turnstileSiteKey } from "@/components/security/TurnstileWidget";

const inputClass = "mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-slate-900 shadow-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100";

export function EnglishQuoteForm({ variant = "embedded" }: { variant?: "embedded" | "modal" }) {
  const [captchaToken, setCaptchaToken] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setMessage("");
    const form = new FormData(event.currentTarget);
    const cargo = { width: String(form.get("width") || ""), length: String(form.get("length") || ""), height: String(form.get("height") || ""), weight: String(form.get("weight") || ""), quantity: String(form.get("quantity") || "") };
    const required = ["fullName", "companyName", "loadingPoint", "deliveryPoint"];
    if (required.some((field) => !String(form.get(field) || "").trim()) || (!String(form.get("email") || "").trim() && !String(form.get("phone") || "").trim()) || Object.values(cargo).some((value) => !value || Number(value) <= 0)) { setMessage("Please complete the required contact, route and cargo information."); return; }
    if (turnstileSiteKey && !captchaToken) { setMessage("Please complete the robot verification."); return; }
    setSubmitting(true);
    try {
      const response = await fetch("/api/send-quote", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fullName: form.get("fullName"), companyName: form.get("companyName"), email: form.get("email"), phone: form.get("phone"), serviceType: form.get("serviceType"), transportMode: form.get("transportMode"), loadingPoint: form.get("loadingPoint"), deliveryPoint: form.get("deliveryPoint"), cargos: [cargo], specialRequirements: form.get("specialRequirements"), kvkkAcknowledged: form.get("privacy") === "on", commercialConsent: form.get("commercial") === "on", captchaToken, submissionId: crypto.randomUUID() }) });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.message || "Your request could not be sent.");
      event.currentTarget.reset(); setCaptchaToken(""); setMessage("Thank you. Your quote request has been received.");
    } catch { setMessage("Your request could not be sent. Please try again or call us on +90 543 401 07 55."); } finally { setSubmitting(false); }
  }

  return <form onSubmit={submit} className={variant === "modal" ? "text-white" : "rounded-2xl bg-slate-900 p-5 text-white shadow-xl sm:p-8"}>
    <div className="mb-6"><p className="text-sm font-bold uppercase tracking-[0.2em] text-orange-300">Quote request</p><h2 className="mt-2 text-2xl font-bold sm:text-3xl">Tell us about your shipment</h2><p className="mt-2 text-slate-300">Share the essential details and we will assess a suitable transport option.</p></div>
    <div className="grid gap-4 md:grid-cols-2"><label>Full name *<input name="fullName" className={inputClass} /></label><label>Company name *<input name="companyName" className={inputClass} /></label><label>Email<input name="email" type="email" className={inputClass} /></label><label>Phone<input name="phone" type="tel" className={inputClass} /></label><label>Service *<select name="serviceType" defaultValue="domestic" className={inputClass}><option value="domestic">Domestic transport</option><option value="international">International transport</option></select></label><label>Transport mode *<select name="transportMode" defaultValue="road" className={inputClass}><option value="road">Road</option><option value="air">Air</option><option value="sea">Sea</option></select></label><label>Collection address *<input name="loadingPoint" className={inputClass} /></label><label>Delivery address *<input name="deliveryPoint" className={inputClass} /></label></div>
    <fieldset className="mt-6 rounded-xl border border-white/15 p-4"><legend className="px-2 font-semibold">Cargo details *</legend><div className="mt-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-5"><label>Width (cm)<input name="width" inputMode="decimal" className={inputClass} /></label><label>Length (cm)<input name="length" inputMode="decimal" className={inputClass} /></label><label>Height (cm)<input name="height" inputMode="decimal" className={inputClass} /></label><label>Weight (kg)<input name="weight" inputMode="decimal" className={inputClass} /></label><label>Quantity<input name="quantity" inputMode="numeric" className={inputClass} /></label></div></fieldset>
    <label className="mt-5 block">Additional cargo or timing details<textarea name="specialRequirements" rows={3} className={inputClass} /></label>
    <label className="mt-5 flex items-start gap-3 text-sm text-slate-200"><input required name="privacy" type="checkbox" className="mt-1 h-4 w-4" />I acknowledge the <a href="/gizlilik-politikasi" className="underline" target="_blank" rel="noreferrer">Privacy Notice</a> (Turkish).</label>
    <label className="mt-3 flex items-start gap-3 text-sm text-slate-200"><input name="commercial" type="checkbox" className="mt-1 h-4 w-4" />I agree to receive commercial communications. Optional.</label>
    <div className="mt-4"><TurnstileWidget onToken={setCaptchaToken} theme="dark" /></div>
    {message && <p role="status" className="mt-4 rounded-lg bg-white/10 p-3 text-sm">{message}</p>}
    <button type="submit" disabled={submitting} className="mt-6 w-full rounded-md bg-orange-500 px-5 py-3 font-bold text-white transition hover:bg-orange-600 disabled:opacity-60">{submitting ? "Sending…" : "Request a quote"}</button>
  </form>;
}
