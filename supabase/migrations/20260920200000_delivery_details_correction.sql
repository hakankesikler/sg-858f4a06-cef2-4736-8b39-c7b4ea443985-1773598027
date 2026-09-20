BEGIN;

-- Correct delivery details without reopening a shipment or extending public access.
CREATE OR REPLACE FUNCTION public.rex_correct_delivery_details(
  p_shipment_id uuid,
  p_delivered_to text,
  p_actual_delivery_date timestamptz,
  p_expected jsonb
)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE v_shipment public.shipments%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL OR NOT public.rex_has_permission('operations.delivery','manage')
    OR NOT public.rex_has_permission('operations.shipments','manage') THEN
    RAISE EXCEPTION 'Teslimat bilgilerini düzenleme yetkiniz bulunmuyor';
  END IF;
  IF nullif(trim(p_delivered_to),'') IS NULL OR length(trim(p_delivered_to))>200 THEN
    RAISE EXCEPTION 'Teslim alan kişi zorunludur ve 200 karakteri geçemez';
  END IF;
  IF p_actual_delivery_date IS NULL OR NOT isfinite(p_actual_delivery_date) THEN
    RAISE EXCEPTION 'Geçerli bir teslim tarihi girin';
  END IF;
  IF p_expected IS NULL OR NOT (p_expected ?& ARRAY['delivered_to','actual_delivery_date','delivery_date']) THEN
    RAISE EXCEPTION 'Güncel teslimat bilgileri yüklenemedi; pencereyi yeniden açın';
  END IF;
  SELECT * INTO v_shipment FROM public.shipments WHERE id=p_shipment_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Sevkiyat bulunamadı'; END IF;
  IF v_shipment.status NOT IN ('teslim_edildi','Teslim Edildi') THEN
    RAISE EXCEPTION 'Yalnızca teslim edilmiş sevkiyatın teslimat bilgileri düzeltilebilir';
  END IF;
  IF v_shipment.delivered_to IS DISTINCT FROM (p_expected->>'delivered_to')
    OR v_shipment.actual_delivery_date IS DISTINCT FROM (p_expected->>'actual_delivery_date')::timestamptz
    OR v_shipment.delivery_date IS DISTINCT FROM (p_expected->>'delivery_date')::date THEN
    RAISE EXCEPTION 'Teslimat bilgileri başka bir kullanıcı tarafından değiştirildi. Pencereyi yeniden açıp güncel bilgileri kontrol edin';
  END IF;
  -- The existing shipment audit trigger records before/after values and actor.
  -- delivered_at is deliberately untouched: correcting a date must not reopen the 24h link.
  UPDATE public.shipments SET delivered_to=trim(p_delivered_to),
    actual_delivery_date=p_actual_delivery_date,
    delivery_date=(p_actual_delivery_date AT TIME ZONE 'Europe/Istanbul')::date,
    updated_at=now()
  WHERE id=p_shipment_id
    AND (delivered_to IS DISTINCT FROM trim(p_delivered_to)
      OR actual_delivery_date IS DISTINCT FROM p_actual_delivery_date
      OR delivery_date IS DISTINCT FROM (p_actual_delivery_date AT TIME ZONE 'Europe/Istanbul')::date);
  RETURN (SELECT jsonb_build_object('delivered_to',delivered_to,
    'actual_delivery_date',actual_delivery_date,'delivery_date',delivery_date)
    FROM public.shipments WHERE id=p_shipment_id);
END $$;
REVOKE ALL ON FUNCTION public.rex_correct_delivery_details(uuid,text,timestamptz,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.rex_correct_delivery_details(uuid,text,timestamptz,jsonb) TO authenticated;

COMMIT;
