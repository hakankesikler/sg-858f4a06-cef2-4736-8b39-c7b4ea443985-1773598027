import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

function publicScanError(error: unknown) {
  const message = error instanceof Error ? error.message : "Virüs taraması tamamlanamadı.";
  return message.slice(0, 300);
}

function deliveryObjectPath(reference: string) {
  const prefix = "storage://shipment-documents/";
  if (!reference.startsWith(prefix)) throw new Error("Belge depolama adresi geçersiz.");
  const path = reference.slice(prefix.length);
  if (!path.startsWith("delivery-documents/")) throw new Error("Belge karantina alanında bulunmuyor.");
  return path;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Yalnızca POST desteklenir." });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const scanKey = process.env.CLOUDMERSIVE_API_KEY;
  if (!supabaseUrl || !anonKey || !serviceKey) return res.status(500).json({ error: "Sunucu güvenlik ayarları eksik." });

  const bearer = req.headers.authorization?.startsWith("Bearer ") ? req.headers.authorization.slice(7) : "";
  if (!bearer) return res.status(401).json({ error: "Oturum doğrulanamadı." });

  const userDb = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${bearer}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: userData, error: userError } = await userDb.auth.getUser(bearer);
  if (userError || !userData.user) return res.status(401).json({ error: "Oturum süresi dolmuş." });
  const { data: allowed } = await userDb.rpc("rex_has_role" as any, { required_roles: ["admin", "operations"] } as any);
  if (!allowed) return res.status(403).json({ error: "Teslim evrakı tarama yetkiniz bulunmuyor." });

  const documentId = typeof req.body?.documentId === "string" ? req.body.documentId : "";
  if (!/^[0-9a-f-]{36}$/i.test(documentId)) return res.status(400).json({ error: "Belge kimliği geçersiz." });
  if (!scanKey) {
    return res.status(503).json({
      error: "Gerçek virüs tarama servisi henüz etkinleştirilmedi; belge güvenli karantinada ve tarama bekliyor.",
      code: "SCANNER_NOT_CONFIGURED",
    });
  }

  const adminDb = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: document, error: documentError } = await (adminDb.from("delivery_documents" as any) as any)
    .select("id,file_reference,original_file_name,mime_type,scan_status")
    .eq("id", documentId)
    .single();
  if (documentError || !document) return res.status(404).json({ error: "Teslim evrakı bulunamadı." });
  if (document.scan_status === "clean") return res.status(200).json({ status: "clean", clean: true, cached: true });
  if (document.scan_status === "infected") return res.status(409).json({ error: "Dosya zararlı olarak işaretlenmiş.", status: "infected" });

  try {
    const path = deliveryObjectPath(document.file_reference);
    const { data: fileBlob, error: downloadError } = await adminDb.storage.from("shipment-documents").download(path);
    if (downloadError || !fileBlob) throw downloadError || new Error("Belge indirilemedi.");

    const form = new FormData();
    form.append("inputFile", fileBlob, document.original_file_name);
    const scanResponse = await fetch("https://api.cloudmersive.com/virus/scan/file/advanced", {
      method: "POST",
      headers: {
        Apikey: scanKey,
        allowExecutables: "false",
        allowInvalidFiles: "false",
        allowScripts: "false",
        allowPasswordProtectedFiles: "false",
        allowMacros: "false",
        allowXmlExternalEntities: "false",
        allowInsecureDeserialization: "false",
        allowHtml: "false",
        allowUnsafeArchives: "false",
        allowOleEmbeddedObject: "false",
        allowUnwantedAction: "false",
        restrictFileTypes: ".pdf,.jpg,.jpeg,.png,.webp",
      },
      body: form,
    });
    const scan = await scanResponse.json().catch(() => ({} as any));
    if (!scanResponse.ok || scan?.Successful === false) {
      throw new Error(scan?.ErrorDetailedDescription || `Tarama servisi ${scanResponse.status} hatası verdi.`);
    }

    const clean = scan?.CleanResult === true;
    const status = clean ? "clean" : "infected";
    const safeResult = {
      clean,
      verifiedFileFormat: scan?.VerifiedFileFormat || null,
      containsExecutable: Boolean(scan?.ContainsExecutable),
      containsInvalidFile: Boolean(scan?.ContainsInvalidFile),
      containsScript: Boolean(scan?.ContainsScript),
      containsMacros: Boolean(scan?.ContainsMacros),
      foundViruses: Array.isArray(scan?.FoundViruses)
        ? scan.FoundViruses.slice(0, 10).map((item: any) => ({ fileName: item?.FileName || null, virusName: item?.VirusName || null }))
        : [],
    };
    const { error: recordError } = await adminDb.rpc("rex_record_delivery_document_scan" as any, {
      p_document_id: documentId,
      p_status: status,
      p_provider: "cloudmersive",
      p_result: safeResult,
    } as any);
    if (recordError) throw recordError;

    if (!clean) return res.status(422).json({ error: "Dosya zararlı veya güvenli olmayan içerik taşıyor.", status, clean: false });
    return res.status(200).json({ status, clean: true });
  } catch (error) {
    const message = publicScanError(error);
    await adminDb.rpc("rex_record_delivery_document_scan" as any, {
      p_document_id: documentId,
      p_status: "error",
      p_provider: "cloudmersive",
      p_result: { error: message },
    } as any);
    return res.status(502).json({ error: message, status: "error" });
  }
}

