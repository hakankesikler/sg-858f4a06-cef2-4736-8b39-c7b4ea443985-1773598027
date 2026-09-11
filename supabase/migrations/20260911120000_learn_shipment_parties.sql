BEGIN;

ALTER TABLE public.shipment_route_stops
  ADD COLUMN IF NOT EXISTS party_type text NOT NULL DEFAULT 'corporate',
  ADD COLUMN IF NOT EXISTS identity_no text,
  ADD COLUMN IF NOT EXISTS source_customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname='shipment_route_stops_party_type_check'
      AND conrelid='public.shipment_route_stops'::regclass
  ) THEN
    ALTER TABLE public.shipment_route_stops
      ADD CONSTRAINT shipment_route_stops_party_type_check
      CHECK (party_type IN ('corporate','individual'));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname='shipment_route_stops_identity_no_check'
      AND conrelid='public.shipment_route_stops'::regclass
  ) THEN
    ALTER TABLE public.shipment_route_stops
      ADD CONSTRAINT shipment_route_stops_identity_no_check
      CHECK (
        identity_no IS NULL OR trim(identity_no)='' OR
        (party_type='corporate' AND regexp_replace(identity_no,'\D','','g') ~ '^[0-9]{10}$') OR
        (party_type='individual' AND regexp_replace(identity_no,'\D','','g') ~ '^[0-9]{11}$')
      );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS shipment_route_stops_source_customer_idx
  ON public.shipment_route_stops(source_customer_id)
  WHERE source_customer_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.shipment_party_directory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  party_type text NOT NULL DEFAULT 'corporate' CHECK (party_type IN ('corporate','individual')),
  identity_no text,
  company_name text NOT NULL CHECK (length(trim(company_name)) > 0),
  normalized_name text NOT NULL,
  location_key text NOT NULL,
  address_line text,
  district text,
  city text,
  contact_name text,
  contact_phone text,
  use_count integer NOT NULL DEFAULT 1 CHECK (use_count > 0),
  last_used_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (normalized_name,location_key)
);

CREATE INDEX IF NOT EXISTS shipment_party_directory_search_idx
  ON public.shipment_party_directory(normalized_name,last_used_at DESC);
CREATE INDEX IF NOT EXISTS shipment_party_directory_customer_idx
  ON public.shipment_party_directory(customer_id)
  WHERE customer_id IS NOT NULL;

ALTER TABLE public.shipment_party_directory ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.shipment_party_directory FROM PUBLIC,anon,authenticated;
GRANT SELECT ON TABLE public.shipment_party_directory TO authenticated;

DROP POLICY IF EXISTS rex_permission_select ON public.shipment_party_directory;
CREATE POLICY rex_permission_select ON public.shipment_party_directory
  FOR SELECT TO authenticated
  USING (
    public.rex_has_permission('operations.shipments','view') OR
    public.rex_has_permission('operations.shipments','manage')
  );

INSERT INTO public.shipment_party_directory(
  customer_id,party_type,identity_no,company_name,normalized_name,location_key,
  address_line,district,city,contact_name,contact_phone,use_count,last_used_at
)
SELECT
  c.id,
  CASE WHEN nullif(regexp_replace(coalesce(c.tc_no,''),'\D','','g'),'') IS NOT NULL
          AND nullif(regexp_replace(coalesce(c.vergi_no,''),'\D','','g'),'') IS NULL
       THEN 'individual' ELSE 'corporate' END,
  nullif(regexp_replace(coalesce(nullif(c.vergi_no,''),nullif(c.tc_no,''),''),'\D','','g'),''),
  trim(coalesce(nullif(c.company,''),c.name)),
  regexp_replace(lower(trim(coalesce(nullif(c.company,''),c.name))),'\s+',' ','g'),
  md5(concat_ws('|',
    regexp_replace(lower(trim(coalesce(nullif(c.branch_address,''),c.address,''))),'\s+',' ','g'),
    regexp_replace(lower(trim(coalesce(c.district,''))),'\s+',' ','g'),
    regexp_replace(lower(trim(coalesce(c.city,''))),'\s+',' ','g')
  )),
  nullif(trim(coalesce(nullif(c.branch_address,''),c.address,'')),''),
  nullif(trim(c.district),''),nullif(trim(c.city),''),
  nullif(trim(c.authorized_person_name),''),
  nullif(trim(coalesce(nullif(c.authorized_person_phone,''),c.phone,'')),''),
  1,coalesce(c.updated_at,c.created_at,now())
FROM public.customers c
WHERE nullif(trim(coalesce(nullif(c.company,''),c.name)), '') IS NOT NULL
  AND c.archived_at IS NULL
ON CONFLICT (normalized_name,location_key) DO UPDATE SET
  customer_id=coalesce(EXCLUDED.customer_id,shipment_party_directory.customer_id),
  party_type=EXCLUDED.party_type,
  identity_no=coalesce(EXCLUDED.identity_no,shipment_party_directory.identity_no),
  company_name=EXCLUDED.company_name,
  address_line=coalesce(EXCLUDED.address_line,shipment_party_directory.address_line),
  district=coalesce(EXCLUDED.district,shipment_party_directory.district),
  city=coalesce(EXCLUDED.city,shipment_party_directory.city),
  contact_name=coalesce(EXCLUDED.contact_name,shipment_party_directory.contact_name),
  contact_phone=coalesce(EXCLUDED.contact_phone,shipment_party_directory.contact_phone),
  updated_at=now();

INSERT INTO public.shipment_party_directory(
  customer_id,party_type,identity_no,company_name,normalized_name,location_key,
  address_line,district,city,contact_name,contact_phone,use_count,last_used_at
)
SELECT
  rs.source_customer_id,coalesce(rs.party_type,'corporate'),nullif(regexp_replace(coalesce(rs.identity_no,''),'\D','','g'),''),
  trim(rs.company_name),regexp_replace(lower(trim(rs.company_name)),'\s+',' ','g'),
  md5(concat_ws('|',
    regexp_replace(lower(trim(coalesce(rs.address_line,''))),'\s+',' ','g'),
    regexp_replace(lower(trim(coalesce(rs.district,''))),'\s+',' ','g'),
    regexp_replace(lower(trim(coalesce(rs.city,''))),'\s+',' ','g')
  )),
  nullif(trim(rs.address_line),''),nullif(trim(rs.district),''),nullif(trim(rs.city),''),
  nullif(trim(rs.contact_name),''),nullif(trim(rs.contact_phone),''),count(*)::integer,max(coalesce(s.updated_at,s.created_at,now()))
FROM public.shipment_route_stops rs
JOIN public.shipments s ON s.id=rs.shipment_id
GROUP BY rs.source_customer_id,rs.party_type,rs.identity_no,rs.company_name,rs.address_line,rs.district,rs.city,rs.contact_name,rs.contact_phone
ON CONFLICT (normalized_name,location_key) DO UPDATE SET
  customer_id=coalesce(EXCLUDED.customer_id,shipment_party_directory.customer_id),
  party_type=EXCLUDED.party_type,
  identity_no=coalesce(EXCLUDED.identity_no,shipment_party_directory.identity_no),
  company_name=EXCLUDED.company_name,
  address_line=coalesce(EXCLUDED.address_line,shipment_party_directory.address_line),
  district=coalesce(EXCLUDED.district,shipment_party_directory.district),
  city=coalesce(EXCLUDED.city,shipment_party_directory.city),
  contact_name=coalesce(EXCLUDED.contact_name,shipment_party_directory.contact_name),
  contact_phone=coalesce(EXCLUDED.contact_phone,shipment_party_directory.contact_phone),
  use_count=greatest(shipment_party_directory.use_count,EXCLUDED.use_count),
  last_used_at=greatest(shipment_party_directory.last_used_at,EXCLUDED.last_used_at),
  updated_at=now();

CREATE OR REPLACE FUNCTION public.rex_save_shipment_multistop(
  p_shipment_id uuid,
  p_shipment jsonb,
  p_cargo_items jsonb,
  p_route_stops jsonb,
  p_uetds_details jsonb DEFAULT '{}'::jsonb
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE
  v_id uuid;
  v_stop jsonb;
  v_item jsonb;
  v_pickup jsonb;
  v_delivery jsonb;
  v_shipment jsonb:=coalesce(p_shipment,'{}'::jsonb);
  v_stop_count integer;
  v_distinct_stop_count integer;
  v_identity text;
BEGIN
  IF jsonb_typeof(p_route_stops) IS DISTINCT FROM 'array' OR jsonb_array_length(p_route_stops)<2 THEN
    RAISE EXCEPTION 'En az bir alım ve bir teslim noktası gereklidir';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM jsonb_array_elements(p_route_stops) s WHERE s->>'stop_type'='pickup')
     OR NOT EXISTS (SELECT 1 FROM jsonb_array_elements(p_route_stops) s WHERE s->>'stop_type'='delivery') THEN
    RAISE EXCEPTION 'En az bir alım ve bir teslim noktası gereklidir';
  END IF;

  SELECT count(*),count(DISTINCT value->>'stop_key')
    INTO v_stop_count,v_distinct_stop_count
  FROM jsonb_array_elements(p_route_stops);
  IF v_stop_count<>v_distinct_stop_count THEN RAISE EXCEPTION 'Rota noktası anahtarları benzersiz olmalıdır'; END IF;

  FOR v_stop IN SELECT value FROM jsonb_array_elements(p_route_stops) LOOP
    IF coalesce(v_stop->>'stop_type','') NOT IN ('pickup','delivery')
       OR coalesce(v_stop->>'party_type','corporate') NOT IN ('corporate','individual')
       OR nullif(trim(v_stop->>'stop_key'),'') IS NULL
       OR nullif(trim(v_stop->>'company_name'),'') IS NULL
       OR nullif(trim(v_stop->>'city'),'') IS NULL THEN
      RAISE EXCEPTION 'Her rota noktası için tür, firma/kişi ve il zorunludur';
    END IF;
    v_identity:=nullif(regexp_replace(coalesce(v_stop->>'identity_no',''),'\D','','g'),'');
    IF v_identity IS NOT NULL AND (
      (coalesce(v_stop->>'party_type','corporate')='corporate' AND v_identity !~ '^[0-9]{10}$') OR
      (v_stop->>'party_type'='individual' AND v_identity !~ '^[0-9]{11}$')
    ) THEN
      RAISE EXCEPTION 'Kurumsal Vergi No 10, bireysel T.C. Kimlik No 11 haneli olmalıdır';
    END IF;
  END LOOP;

  IF jsonb_typeof(p_cargo_items) IS DISTINCT FROM 'array' OR jsonb_array_length(p_cargo_items)=0 THEN
    RAISE EXCEPTION 'En az bir yük kalemi gereklidir';
  END IF;
  FOR v_item IN SELECT value FROM jsonb_array_elements(p_cargo_items) LOOP
    IF NOT EXISTS (
      SELECT 1 FROM jsonb_array_elements(p_route_stops) s
      WHERE s->>'stop_type'='pickup' AND s->>'stop_key'=v_item->>'pickup_stop_key'
    ) OR NOT EXISTS (
      SELECT 1 FROM jsonb_array_elements(p_route_stops) s
      WHERE s->>'stop_type'='delivery' AND s->>'stop_key'=v_item->>'delivery_stop_key'
    ) THEN
      RAISE EXCEPTION 'Her yük kalemi geçerli bir alım ve teslim noktasına bağlanmalıdır';
    END IF;
  END LOOP;

  SELECT value INTO v_pickup FROM jsonb_array_elements(p_route_stops)
    WHERE value->>'stop_type'='pickup'
    ORDER BY coalesce(nullif(value->>'sequence_no','')::integer,1) LIMIT 1;
  SELECT value INTO v_delivery FROM jsonb_array_elements(p_route_stops)
    WHERE value->>'stop_type'='delivery'
    ORDER BY coalesce(nullif(value->>'sequence_no','')::integer,1) LIMIT 1;

  v_shipment:=v_shipment||jsonb_build_object(
    'sender_name',trim(v_pickup->>'company_name'),
    'sender_ii',trim(v_pickup->>'city'),
    'origin',trim(v_pickup->>'city'),
    'receiver',trim(v_delivery->>'company_name'),
    'receiver_district',nullif(trim(v_delivery->>'district'),''),
    'receiver_ii',trim(v_delivery->>'city'),
    'destination',trim(v_delivery->>'city')
  );

  v_id:=public.rex_save_shipment_with_uetds(
    p_shipment_id,v_shipment,p_cargo_items,coalesce(p_uetds_details,'{}'::jsonb)
  );

  DELETE FROM public.shipment_route_stops WHERE shipment_id=v_id;
  INSERT INTO public.shipment_route_stops(
    shipment_id,stop_key,stop_type,sequence_no,company_name,party_type,identity_no,source_customer_id,
    address_line,district,city,contact_name,contact_phone,instructions,planned_at
  )
  SELECT v_id,trim(s->>'stop_key'),s->>'stop_type',row_number() OVER (
      PARTITION BY s->>'stop_type' ORDER BY coalesce(nullif(s->>'sequence_no','')::integer,1)
    ),trim(s->>'company_name'),coalesce(nullif(s->>'party_type',''),'corporate'),
    nullif(regexp_replace(coalesce(s->>'identity_no',''),'\D','','g'),''),
    nullif(s->>'source_customer_id','')::uuid,
    nullif(trim(s->>'address_line'),''),nullif(trim(s->>'district'),''),
    trim(s->>'city'),nullif(trim(s->>'contact_name'),''),nullif(trim(s->>'contact_phone'),''),
    nullif(trim(s->>'instructions'),''),nullif(s->>'planned_at','')::timestamptz
  FROM jsonb_array_elements(p_route_stops) s;

  INSERT INTO public.shipment_party_directory(
    customer_id,party_type,identity_no,company_name,normalized_name,location_key,
    address_line,district,city,contact_name,contact_phone,use_count,last_used_at,created_by
  )
  SELECT
    rs.source_customer_id,rs.party_type,rs.identity_no,rs.company_name,
    regexp_replace(lower(trim(rs.company_name)),'\s+',' ','g'),
    md5(concat_ws('|',
      regexp_replace(lower(trim(coalesce(rs.address_line,''))),'\s+',' ','g'),
      regexp_replace(lower(trim(coalesce(rs.district,''))),'\s+',' ','g'),
      regexp_replace(lower(trim(coalesce(rs.city,''))),'\s+',' ','g')
    )),
    rs.address_line,rs.district,rs.city,rs.contact_name,rs.contact_phone,1,now(),auth.uid()
  FROM public.shipment_route_stops rs
  WHERE rs.shipment_id=v_id
  ON CONFLICT (normalized_name,location_key) DO UPDATE SET
    customer_id=coalesce(EXCLUDED.customer_id,shipment_party_directory.customer_id),
    party_type=EXCLUDED.party_type,
    identity_no=coalesce(EXCLUDED.identity_no,shipment_party_directory.identity_no),
    company_name=EXCLUDED.company_name,
    address_line=coalesce(EXCLUDED.address_line,shipment_party_directory.address_line),
    district=coalesce(EXCLUDED.district,shipment_party_directory.district),
    city=coalesce(EXCLUDED.city,shipment_party_directory.city),
    contact_name=coalesce(EXCLUDED.contact_name,shipment_party_directory.contact_name),
    contact_phone=coalesce(EXCLUDED.contact_phone,shipment_party_directory.contact_phone),
    use_count=shipment_party_directory.use_count+1,
    last_used_at=now(),updated_at=now();

  UPDATE public.shipment_cargo_items c
  SET pickup_stop_id=pickup.id,
      delivery_stop_id=delivery.id,
      route_description=nullif(left(trim(coalesce(ci.item->>'route_description','')),1000),'')
  FROM jsonb_array_elements(p_cargo_items) WITH ORDINALITY ci(item,ordinality)
  JOIN public.shipment_route_stops pickup
    ON pickup.shipment_id=v_id AND pickup.stop_type='pickup'
   AND pickup.stop_key=ci.item->>'pickup_stop_key'
  JOIN public.shipment_route_stops delivery
    ON delivery.shipment_id=v_id AND delivery.stop_type='delivery'
   AND delivery.stop_key=ci.item->>'delivery_stop_key'
  WHERE c.shipment_id=v_id AND c.sira_no=ci.ordinality;

  IF EXISTS (
    SELECT 1 FROM public.shipment_cargo_items c
    WHERE c.shipment_id=v_id AND (c.pickup_stop_id IS NULL OR c.delivery_stop_id IS NULL)
  ) THEN
    RAISE EXCEPTION 'Yük kalemlerinin rota bağlantısı tamamlanamadı';
  END IF;
  RETURN v_id;
END $$;

REVOKE ALL ON FUNCTION public.rex_save_shipment_multistop(uuid,jsonb,jsonb,jsonb,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.rex_save_shipment_multistop(uuid,jsonb,jsonb,jsonb,jsonb) TO authenticated;

COMMENT ON TABLE public.shipment_party_directory IS
  'Learns reusable sender and receiver identity, address and contact details from customers and shipment history.';

COMMIT;
