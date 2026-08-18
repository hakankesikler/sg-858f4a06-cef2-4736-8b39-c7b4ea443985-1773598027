-- Immutable shipment audit history. Business rows are not changed.

CREATE TABLE IF NOT EXISTS public.shipment_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id uuid NOT NULL,
  shipment_code text,
  event_type text NOT NULL CHECK (event_type IN (
    'history_enabled','created','updated','assignment_changed','status_changed',
    'delivery_document_added','delivered','invoiced','invoice_unlinked','deleted'
  )),
  old_status text,
  new_status text,
  changed_fields jsonb NOT NULL DEFAULT '{}'::jsonb,
  actor_id uuid,
  actor_email text,
  actor_role text,
  event_at timestamptz NOT NULL DEFAULT now(),
  source text NOT NULL DEFAULT 'portal',
  note text
);

CREATE INDEX IF NOT EXISTS shipment_events_shipment_idx
  ON public.shipment_events(shipment_id, event_at DESC);
CREATE INDEX IF NOT EXISTS shipment_events_code_idx
  ON public.shipment_events(shipment_code, event_at DESC);

ALTER TABLE public.shipment_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS rex_shipment_events_select ON public.shipment_events;
CREATE POLICY rex_shipment_events_select ON public.shipment_events
  FOR SELECT TO authenticated
  USING (public.rex_has_role(ARRAY['admin','operations','accounting']));

CREATE OR REPLACE FUNCTION public.rex_audit_shipment_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path=public,pg_temp
AS $$
DECLARE
  v_old jsonb := CASE WHEN TG_OP='INSERT' THEN '{}'::jsonb ELSE to_jsonb(OLD) END;
  v_new jsonb := CASE WHEN TG_OP='DELETE' THEN '{}'::jsonb ELSE to_jsonb(NEW) END;
  v_changes jsonb := '{}'::jsonb;
  v_type text;
  v_actor uuid := auth.uid();
  v_email text;
  v_role text;
BEGIN
  IF v_actor IS NOT NULL THEN
    SELECT email,role INTO v_email,v_role
    FROM public.app_user_roles
    WHERE user_id=v_actor AND active=true
    LIMIT 1;
    v_email := coalesce(v_email, auth.jwt()->>'email');
  END IF;

  IF TG_OP='INSERT' THEN
    v_type := 'created';
    v_changes := jsonb_build_object('new_record', v_new - ARRAY['created_at','updated_at']);
  ELSIF TG_OP='DELETE' THEN
    v_type := 'deleted';
    v_changes := jsonb_build_object('deleted_record', v_old - ARRAY['created_at','updated_at']);
  ELSE
    SELECT coalesce(jsonb_object_agg(key,jsonb_build_object('old',v_old->key,'new',value)),'{}'::jsonb)
    INTO v_changes
    FROM jsonb_each(v_new)
    WHERE key NOT IN ('created_at','updated_at')
      AND (v_old->key) IS DISTINCT FROM value;

    IF v_changes='{}'::jsonb THEN RETURN NEW; END IF;

    IF v_changes ? 'driver_id' THEN
      v_changes := jsonb_set(v_changes,'{driver_id,old_label}',to_jsonb(coalesce((SELECT full_name FROM public.drivers WHERE id=OLD.driver_id),'—')));
      v_changes := jsonb_set(v_changes,'{driver_id,new_label}',to_jsonb(coalesce((SELECT full_name FROM public.drivers WHERE id=NEW.driver_id),'—')));
    END IF;
    IF v_changes ? 'vehicle_id' THEN
      v_changes := jsonb_set(v_changes,'{vehicle_id,old_label}',to_jsonb(coalesce((SELECT cekici_plakasi FROM public.vehicles WHERE id=OLD.vehicle_id),'—')));
      v_changes := jsonb_set(v_changes,'{vehicle_id,new_label}',to_jsonb(coalesce((SELECT cekici_plakasi FROM public.vehicles WHERE id=NEW.vehicle_id),'—')));
    END IF;
    IF v_changes ? 'customer_id' THEN
      v_changes := jsonb_set(v_changes,'{customer_id,old_label}',to_jsonb(coalesce((SELECT name FROM public.customers WHERE id=OLD.customer_id),'—')));
      v_changes := jsonb_set(v_changes,'{customer_id,new_label}',to_jsonb(coalesce((SELECT name FROM public.customers WHERE id=NEW.customer_id),'—')));
    END IF;
    IF v_changes ? 'supplier_id' THEN
      v_changes := jsonb_set(v_changes,'{supplier_id,old_label}',to_jsonb(coalesce((SELECT name FROM public.customers WHERE id=OLD.supplier_id),'—')));
      v_changes := jsonb_set(v_changes,'{supplier_id,new_label}',to_jsonb(coalesce((SELECT name FROM public.customers WHERE id=NEW.supplier_id),'—')));
    END IF;
    IF v_changes ? 'sale_invoice_id' THEN
      v_changes := jsonb_set(v_changes,'{sale_invoice_id,old_label}',to_jsonb(coalesce((SELECT invoice_no FROM public.sales_invoices WHERE id=OLD.sale_invoice_id),'—')));
      v_changes := jsonb_set(v_changes,'{sale_invoice_id,new_label}',to_jsonb(coalesce((SELECT invoice_no FROM public.sales_invoices WHERE id=NEW.sale_invoice_id),'—')));
    END IF;

    v_type := CASE
      WHEN OLD.status IS DISTINCT FROM NEW.status AND NEW.status IN ('teslim_edildi','Teslim Edildi') THEN 'delivered'
      WHEN OLD.sale_invoice_id IS NULL AND NEW.sale_invoice_id IS NOT NULL THEN 'invoiced'
      WHEN OLD.sale_invoice_id IS NOT NULL AND NEW.sale_invoice_id IS NULL THEN 'invoice_unlinked'
      WHEN OLD.delivery_proof_url IS DISTINCT FROM NEW.delivery_proof_url AND NEW.delivery_proof_url IS NOT NULL THEN 'delivery_document_added'
      WHEN OLD.driver_id IS DISTINCT FROM NEW.driver_id OR OLD.vehicle_id IS DISTINCT FROM NEW.vehicle_id THEN 'assignment_changed'
      WHEN OLD.status IS DISTINCT FROM NEW.status THEN 'status_changed'
      ELSE 'updated'
    END;
  END IF;

  INSERT INTO public.shipment_events(
    shipment_id,shipment_code,event_type,old_status,new_status,changed_fields,
    actor_id,actor_email,actor_role,source
  ) VALUES (
    coalesce(NEW.id,OLD.id),coalesce(NEW.shipment_code,OLD.shipment_code),v_type,
    CASE WHEN TG_OP='INSERT' THEN NULL ELSE OLD.status END,
    CASE WHEN TG_OP='DELETE' THEN NULL ELSE NEW.status END,
    v_changes,v_actor,v_email,v_role,
    CASE WHEN v_actor IS NULL THEN 'system' ELSE 'portal' END
  );
  IF TG_OP='DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS rex_shipments_audit ON public.shipments;
CREATE TRIGGER rex_shipments_audit
AFTER INSERT OR UPDATE OR DELETE ON public.shipments
FOR EACH ROW EXECUTE FUNCTION public.rex_audit_shipment_change();

INSERT INTO public.shipment_events(
  shipment_id,shipment_code,event_type,old_status,new_status,changed_fields,source,note,event_at
)
SELECT s.id,s.shipment_code,'history_enabled',s.status,s.status,'{}'::jsonb,'system',
       'Sevkiyat geçmişi bu kayıt için etkinleştirildi',now()
FROM public.shipments s
WHERE NOT EXISTS (
  SELECT 1 FROM public.shipment_events e WHERE e.shipment_id=s.id
);

REVOKE ALL ON public.shipment_events FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.shipment_events TO authenticated;
REVOKE ALL ON FUNCTION public.rex_audit_shipment_change() FROM PUBLIC;
