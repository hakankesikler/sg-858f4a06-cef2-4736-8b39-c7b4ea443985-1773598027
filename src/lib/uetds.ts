type DatabaseClient = any;

const UETDS_V2_METHODS = {
  createJourney: "yeniYukKaydiBildirV2",
  updateJourney: "seferGuncelle",
  addLoad: "sefereYukEkle",
  cancelJourney: "seferIptalEt",
  activateJourney: "seferAktifEt",
  summary: "seferBildirimOzeti",
  report: "seferBildirimRaporu",
  updateLoad: "yukBildirimiGuncelleV2",
  cancelLoad: "yukIptalEtV2",
  loadDetail: "yukBildirimiDetayiV2",
} as const;

class UetdsGatewayError extends Error {
  retryable: boolean;
  code?: string;
  constructor(message: string, retryable: boolean, code?: string) {
    super(message);
    this.name = "UetdsGatewayError";
    this.retryable = retryable;
    this.code = code;
  }
}

function config() {
  const gatewayUrl = (process.env.UETDS_GATEWAY_URL || "").replace(/\/$/, "");
  const gatewayToken = process.env.UETDS_GATEWAY_TOKEN || "";
  if (!gatewayUrl || !gatewayToken) {
    throw new UetdsGatewayError("U-ETDS sabit IP geçidi ve güvenli bağlantı anahtarı henüz tanımlanmadı.", false);
  }
  return { gatewayUrl, gatewayToken };
}

async function sendToGateway(payload: any) {
  const { gatewayUrl, gatewayToken } = config();
  let response: Response;
  try {
    response = await fetch(`${gatewayUrl}/v2/journeys`, {
      method: "POST",
      headers: { Authorization: `Bearer ${gatewayToken}`, "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(30_000),
    });
  } catch (error: any) {
    throw new UetdsGatewayError(`U-ETDS geçit bağlantısı kurulamadı: ${String(error?.message || error)}`, true);
  }
  const text = await response.text();
  let result: any = {};
  try { result = text ? JSON.parse(text) : {}; } catch { result = { message: text.slice(0, 1000) }; }
  if (!response.ok || result?.success === false) {
    const retryable = response.status === 408 || response.status === 429 || response.status >= 500;
    throw new UetdsGatewayError(String(result?.message || `U-ETDS geçidi HTTP ${response.status}`).slice(0, 1000), retryable, String(result?.code || response.status));
  }
  return result;
}

export async function processUetdsJob(db: DatabaseClient) {
  const { data: payload, error: claimError } = await db.rpc("rex_claim_uetds_job");
  if (claimError) throw claimError;
  if (!payload) return { processed: false };
  const journeyId = payload.journey_id;
  try {
    const result = await sendToGateway({ ...payload, contract: "UETDS_ESYA_V2_1", methods: UETDS_V2_METHODS });
    const { error } = await db.rpc("rex_record_uetds_result", {
      p_journey_id: journeyId, p_success: true, p_reference: result?.reference || null,
      p_response_code: result?.code || "OK", p_message: result?.message || "Kabul edildi", p_retryable: false,
    });
    if (error) throw error;
    return { processed: true, success: true, journeyId, reference: result?.reference || null };
  } catch (error: any) {
    const safeError = error instanceof UetdsGatewayError ? error : new UetdsGatewayError(String(error?.message || error), true);
    const { error: recordError } = await db.rpc("rex_record_uetds_result", {
      p_journey_id: journeyId, p_success: false, p_reference: null,
      p_response_code: safeError.code || null, p_message: safeError.message, p_retryable: safeError.retryable,
    });
    if (recordError) throw recordError;
    return { processed: true, success: false, journeyId, error: safeError.message };
  }
}
