import { createHmac } from "node:crypto";
import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import { sendQuoteEmail, type StoredQuoteRequest } from "@/lib/quote-delivery";

type ResponseData = { success: boolean; message: string };
type Cargo = { width: string | number; length: string | number; height: string | number; weight: string | number; quantity: string | number };

const PRIVACY_NOTICE_VERSION = "2026-08-26";
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const config = { api: { bodyParser: { sizeLimit: "32kb" } } };

function header(req: NextApiRequest, name: string): string {
  const value = req.headers[name.toLowerCase()];
  return Array.isArray(value) ? value[0] || "" : value || "";
}

function requestIp(req: NextApiRequest): string {
  return header(req, "x-forwarded-for").split(",")[0]?.trim() || req.socket.remoteAddress || "unknown";
}

function sameOrigin(req: NextApiRequest): boolean {
  const origin = header(req, "origin") || header(req, "referer");
  const host = header(req, "host");
  if (!origin || !host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

function validText(value: unknown, maxLength: number): value is string {
  return typeof value === "string" && value.trim().length > 0 && value.length <= maxLength;
}

function optionalText(value: unknown, maxLength: number): string | null {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, maxLength) : null;
}

function validPositiveNumber(value: unknown) {
  if (typeof value !== "string" && typeof value !== "number") return false;
  const numericValue = Number(value);
  return Number.isFinite(numericValue) && numericValue > 0;
}

function fingerprint(value: string, secret: string): string {
  return createHmac("sha256", secret).update(value).digest("hex");
}

async function verifyTurnstile(token: unknown, ip: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  if (!secret || !siteKey) return process.env.NODE_ENV !== "production";
  if (!validText(token, 4096)) return false;

  const body = new URLSearchParams({ secret, response: token, remoteip: ip });
  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) return false;
  const result = await response.json() as { success?: boolean; hostname?: string };
  return result.success === true && (!result.hostname || /(^|\.)rexlojistik\.com$/i.test(result.hostname));
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<ResponseData>) {
  res.setHeader("Cache-Control", "private, no-store");
  if (req.method !== "POST") return res.status(405).json({ success: false, message: "Method not allowed" });
  if (!sameOrigin(req)) return res.status(403).json({ success: false, message: "İstek reddedildi" });

  try {
    const formData = req.body || {};
    const emailProvided = validText(formData.email, 200);
    const phoneProvided = validText(formData.phone, 40);
    const emailValid = !formData.email || (emailProvided && /^\S+@\S+\.\S+$/.test(formData.email));
    const phoneValid = !formData.phone || (phoneProvided && formData.phone.replace(/\D/g, "").length >= 10);

    if (
      !UUID_PATTERN.test(String(formData.submissionId || "")) ||
      !validText(formData.fullName, 120) ||
      !validText(formData.companyName, 160) ||
      (!emailProvided && !phoneProvided) ||
      !emailValid || !phoneValid ||
      !["domestic", "international"].includes(formData.serviceType) ||
      !["road", "air", "sea"].includes(formData.transportMode) ||
      !validText(formData.loadingPoint, 200) ||
      !validText(formData.deliveryPoint, 200) ||
      formData.kvkkAcknowledged !== true ||
      (formData.commercialConsent !== undefined && typeof formData.commercialConsent !== "boolean") ||
      (formData.specialRequirements && (typeof formData.specialRequirements !== "string" || formData.specialRequirements.length > 2000))
    ) return res.status(400).json({ success: false, message: "Form bilgileri geçersiz" });

    if (!Array.isArray(formData.cargos) || formData.cargos.length === 0 || formData.cargos.length > 20) {
      return res.status(400).json({ success: false, message: "En az bir yük bilgisi girilmelidir" });
    }
    if (formData.cargos.some((cargo: Cargo) => (
      !validPositiveNumber(cargo?.width) || !validPositiveNumber(cargo?.length) ||
      !validPositiveNumber(cargo?.height) || !validPositiveNumber(cargo?.weight) ||
      !validPositiveNumber(cargo?.quantity)
    ))) return res.status(400).json({ success: false, message: "Yük bilgileri geçersiz" });

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceKey) return res.status(503).json({ success: false, message: "Teklif servisi geçici olarak kullanılamıyor" });

    const ip = requestIp(req);
    if (!await verifyTurnstile(formData.captchaToken, ip)) {
      return res.status(400).json({ success: false, message: "Robot doğrulaması tamamlanamadı. Lütfen tekrar deneyin." });
    }

    const securitySecret = process.env.QUOTE_SECURITY_SECRET || serviceKey;
    const requestFingerprint = fingerprint(ip, securitySecret);
    const userAgentHash = fingerprint(header(req, "user-agent"), securitySecret);
    const db = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

    const { data: allowed, error: rateLimitError } = await db.rpc("rex_consume_quote_rate_limit" as never, {
      p_request_key: requestFingerprint, p_limit: 3, p_window_seconds: 900,
    } as never);
    if (rateLimitError) throw new Error("Teklif güvenlik sınırı kullanılamıyor");
    if (!allowed) return res.status(429).json({ success: false, message: "Çok fazla istek gönderdiniz. Lütfen daha sonra tekrar deneyin." });

    const consentRecordedAt = new Date().toISOString();
    const quoteRecord = {
      submission_id: formData.submissionId,
      status: "sending",
      full_name: formData.fullName.trim(), company_name: formData.companyName.trim(),
      email: emailProvided ? formData.email.trim().toLowerCase() : null,
      phone: phoneProvided ? formData.phone.trim() : null,
      service_type: formData.serviceType, transport_mode: formData.transportMode,
      transport_detail: optionalText(formData.transportDetail, 80),
      loading_point: formData.loadingPoint.trim(), delivery_point: formData.deliveryPoint.trim(),
      cargos: formData.cargos, special_requirements: optionalText(formData.specialRequirements, 2000),
      kvkk_acknowledged: true, commercial_consent: formData.commercialConsent === true,
      privacy_notice_version: PRIVACY_NOTICE_VERSION, consent_recorded_at: consentRecordedAt,
      request_fingerprint: requestFingerprint, user_agent_hash: userAgentHash, delivery_attempts: 1,
    };

    const { data: inserted, error: insertError } = await db.from("quote_requests").insert(quoteRecord as never).select("*").single();
    if (insertError) {
      if (insertError.code === "23505") return res.status(200).json({ success: true, message: "Teklif talebiniz daha önce alınmış" });
      throw new Error("Teklif talebi güvenli kayda alınamadı");
    }

    const quote = inserted as unknown as StoredQuoteRequest;
    const consentEvents = [
      { quote_request_id: quote.id, event_type: "privacy_notice_acknowledged", notice_version: PRIVACY_NOTICE_VERSION, communication_channels: [], source: "public_quote_form", request_fingerprint: requestFingerprint, recorded_at: consentRecordedAt },
      { quote_request_id: quote.id, event_type: formData.commercialConsent === true ? "commercial_consent_granted" : "commercial_consent_not_granted", notice_version: PRIVACY_NOTICE_VERSION, communication_channels: formData.commercialConsent === true ? ["email", "sms", "phone"] : [], source: "public_quote_form", request_fingerprint: requestFingerprint, recorded_at: consentRecordedAt },
    ];
    const { error: consentError } = await db.from("quote_consent_events").insert(consentEvents as never);
    if (consentError) {
      await db.from("quote_requests").delete().eq("id", quote.id);
      throw new Error("Aydınlatma kaydı oluşturulamadı");
    }

    try {
      const providerMessageId = await sendQuoteEmail(quote);
      const { error: resultError } = await db.rpc("rex_record_quote_delivery_result" as never, {
        p_quote_request_id: quote.id, p_success: true, p_provider_message_id: providerMessageId, p_error: null,
      } as never);
      if (resultError) console.error("Quote delivery result could not be recorded:", resultError.message);
      return res.status(200).json({ success: true, message: "Teklif talebiniz başarıyla alındı" });
    } catch (deliveryError) {
      const message = deliveryError instanceof Error ? deliveryError.message : "Bilinmeyen teslimat hatası";
      await db.rpc("rex_record_quote_delivery_result" as never, {
        p_quote_request_id: quote.id, p_success: false, p_provider_message_id: null, p_error: message,
      } as never);
      console.error("Quote email queued for retry:", message);
      return res.status(202).json({ success: true, message: "Teklif talebiniz alındı ve işleme koyuldu" });
    }
  } catch (error) {
    console.error("Error processing quote request:", error);
    return res.status(500).json({ success: false, message: "Form gönderilirken bir hata oluştu" });
  }
}
