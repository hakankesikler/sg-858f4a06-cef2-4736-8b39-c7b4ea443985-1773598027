BEGIN;

-- shipment_cargo_items.alt_toplam is generated from adet * kg_ds.
-- The work-order approval path must not supply a value for that column.
CREATE OR REPLACE FUNCTION public.rex_review_transport_job(p_job_id uuid,p_decision text,p_reason text DEFAULT NULL)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE v_job public.transport_jobs%ROWTYPE; v_shipment uuid; v_code text;
BEGIN
  IF NOT public.rex_has_role(ARRAY['admin','operations']) THEN RAISE EXCEPTION 'Bu işlem için yetkiniz bulunmuyor'; END IF;
  IF p_decision NOT IN ('onayla','reddet') THEN RAISE EXCEPTION 'Geçersiz onay kararı'; END IF;
  SELECT * INTO v_job FROM public.transport_jobs WHERE id=p_job_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'İş kaydı bulunamadı'; END IF;
  IF v_job.status <> 'onay_bekliyor' THEN RAISE EXCEPTION 'Bu iş kaydı daha önce sonuçlandırılmış'; END IF;
  IF p_decision='reddet' THEN
    IF nullif(trim(p_reason),'') IS NULL THEN RAISE EXCEPTION 'Ret nedeni zorunludur'; END IF;
    UPDATE public.transport_jobs SET status='reddedildi',rejection_reason=trim(p_reason),approved_by=auth.uid(),approved_at=now(),updated_at=now() WHERE id=p_job_id;
    RETURN NULL;
  END IF;
  PERFORM pg_advisory_xact_lock(hashtext('rex_shipment_code'));
  SELECT 'SHP-'||lpad((coalesce(max((regexp_match(shipment_code,'^SHP-(\d+)$'))[1]::integer),0)+1)::text,6,'0') INTO v_code FROM public.shipments;
  INSERT INTO public.shipments(
    shipment_code,source_job_id,customer_id,supplier_id,origin,destination,pickup_date,cost,cost_currency,currency,status,
    sender_name,sender_ii,receiver,receiver_district,receiver_ii,adet,cinsi,kg_ds,toplam_kg_ds,satis_birim,satis_tutar,invoice_status
  ) VALUES (
    v_code,v_job.id,v_job.customer_id,v_job.supplier_id,coalesce(v_job.sender_city,v_job.sender_address,'Belirtilmedi'),
    coalesce(v_job.receiver_city,v_job.receiver_address,'Belirtilmedi'),v_job.job_date,v_job.cost,v_job.currency,v_job.currency,'atama_bekliyor',
    v_job.sender_name,v_job.sender_city,v_job.receiver_name,v_job.receiver_district,v_job.receiver_city,v_job.quantity,v_job.cargo_type,
    v_job.unit_weight,v_job.total_weight,v_job.sales_unit_price,v_job.sales_total,'beklemede'
  ) RETURNING id INTO v_shipment;
  INSERT INTO public.shipment_cargo_items(shipment_id,adet,cinsi,kg_ds,sira_no,birim_fiyat,alt_toplam_fiyat)
  VALUES(v_shipment,v_job.quantity,v_job.cargo_type,v_job.unit_weight,1,v_job.sales_unit_price,v_job.sales_total);
  UPDATE public.transport_jobs SET status='onaylandi',shipment_id=v_shipment,approved_by=auth.uid(),approved_at=now(),updated_at=now() WHERE id=p_job_id;
  RETURN v_shipment;
END $$;

COMMIT;
