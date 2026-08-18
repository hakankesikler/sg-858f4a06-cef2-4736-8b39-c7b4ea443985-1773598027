import { supabase } from "@/integrations/supabase/client";

export type TransportComplianceAlert = {
  entity_type: "driver" | "vehicle";
  entity_id: string;
  entity_name: string;
  document_type: string;
  expiry_date: string | null;
  days_remaining: number | null;
  severity: "blocked" | "warning" | "ok";
  message: string;
};

export const transportComplianceService = {
  async getAlerts(warningDays = 30): Promise<TransportComplianceAlert[]> {
    const { data, error } = await (supabase as any).rpc("rex_transport_compliance_alerts", {
      p_warning_days: warningDays,
    });
    if (error) throw error;
    const optionalDocuments = new Set(["SRC Belgesi", "Psikoteknik", "Trafik Sigortası", "Yetki Belgesi"]);
    return ((data || []) as TransportComplianceAlert[]).filter(
      (alert) => !optionalDocuments.has(alert.document_type),
    );
  },
};
