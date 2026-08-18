-- Secure corporate customer portal.
-- Customer users never receive direct access to the internal shipment tables.

CREATE TABLE IF NOT EXISTS public.customer_portal_users (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  email text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS customer_portal_users_customer_idx
  ON public.customer_portal_users(customer_id, active);

CREATE TABLE IF NOT EXISTS public.customer_portal_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  email text NOT NULL,
  token text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  used_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS customer_portal_invites_lookup_idx
  ON public.customer_portal_invites(token, expires_at)
  WHERE used_at IS NULL;

ALTER TABLE public.customer_portal_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_portal_invites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS customer_portal_user_self_select ON public.customer_portal_users;
CREATE POLICY customer_portal_user_self_select
  ON public.customer_portal_users FOR SELECT TO authenticated
  USING (user_id = auth.uid() AND active = true);

-- Invitations contain login-enabling tokens and are only exposed through the
-- security-definer functions below.
REVOKE ALL ON public.customer_portal_invites FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.customer_portal_users FROM PUBLIC, anon;
GRANT SELECT ON public.customer_portal_users TO authenticated;

CREATE OR REPLACE FUNCTION public.rex_create_customer_portal_invite(
  p_customer_id uuid,
  p_email text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_customer public.customers%ROWTYPE;
  v_email text := lower(trim(coalesce(p_email, '')));
  v_token text := replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');
  v_expires_at timestamptz := now() + interval '72 hours';
BEGIN
  IF NOT public.rex_has_role(ARRAY['admin']) THEN
    RAISE EXCEPTION 'Bu işlem yalnızca yönetici tarafından yapılabilir';
  END IF;

  SELECT * INTO v_customer FROM public.customers WHERE id = p_customer_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Müşteri bulunamadı'; END IF;
  IF coalesce(v_customer.account_type, 'musteri') <> 'musteri' THEN
    RAISE EXCEPTION 'Müşteri portalı yalnızca müşteri carileri için açılabilir';
  END IF;
  IF v_email = '' OR v_email !~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' THEN
    RAISE EXCEPTION 'Geçerli bir e-posta adresi girin';
  END IF;

  UPDATE public.customer_portal_invites
  SET expires_at = now(), used_at = coalesce(used_at, now())
  WHERE customer_id = p_customer_id AND lower(email) = v_email AND used_at IS NULL;

  INSERT INTO public.customer_portal_invites(customer_id, email, token, expires_at, created_by)
  VALUES (p_customer_id, v_email, v_token, v_expires_at, auth.uid());

  RETURN jsonb_build_object(
    'customer_id', p_customer_id,
    'customer_name', v_customer.name,
    'email', v_email,
    'token', v_token,
    'expires_at', v_expires_at
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.rex_claim_customer_portal_invite(p_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_invite public.customer_portal_invites%ROWTYPE;
  v_email text;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Oturum açmanız gerekiyor'; END IF;
  SELECT lower(email) INTO v_email FROM auth.users WHERE id = auth.uid();

  SELECT * INTO v_invite
  FROM public.customer_portal_invites
  WHERE token = trim(coalesce(p_token, '')) AND used_at IS NULL AND expires_at > now()
  FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'Davet bağlantısı geçersiz veya süresi dolmuş'; END IF;
  IF lower(v_invite.email) <> v_email THEN RAISE EXCEPTION 'Davet farklı bir e-posta adresine ait'; END IF;

  INSERT INTO public.customer_portal_users(user_id, customer_id, email, active)
  VALUES (auth.uid(), v_invite.customer_id, v_email, true)
  ON CONFLICT (user_id) DO UPDATE SET
    customer_id = excluded.customer_id,
    email = excluded.email,
    active = true,
    updated_at = now();

  UPDATE public.customer_portal_invites
  SET used_at = now(), used_by = auth.uid()
  WHERE id = v_invite.id;

  RETURN jsonb_build_object('ok', true, 'customer_id', v_invite.customer_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.rex_link_customer_portal_invite_on_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_token text := NEW.raw_user_meta_data->>'rex_customer_invite_token';
  v_invite public.customer_portal_invites%ROWTYPE;
BEGIN
  IF nullif(trim(v_token), '') IS NULL THEN RETURN NEW; END IF;

  SELECT * INTO v_invite
  FROM public.customer_portal_invites
  WHERE token = trim(v_token) AND used_at IS NULL AND expires_at > now()
  FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'Davet bağlantısı geçersiz veya süresi dolmuş'; END IF;
  IF lower(v_invite.email) <> lower(NEW.email) THEN RAISE EXCEPTION 'Davet farklı bir e-posta adresine ait'; END IF;

  INSERT INTO public.customer_portal_users(user_id, customer_id, email, active)
  VALUES (NEW.id, v_invite.customer_id, lower(NEW.email), true)
  ON CONFLICT (user_id) DO UPDATE SET
    customer_id = excluded.customer_id,
    email = excluded.email,
    active = true,
    updated_at = now();

  UPDATE public.customer_portal_invites
  SET used_at = now(), used_by = NEW.id
  WHERE id = v_invite.id;

  UPDATE auth.users
  SET raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) - 'rex_customer_invite_token'
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS rex_customer_portal_invite_signup ON auth.users;
CREATE TRIGGER rex_customer_portal_invite_signup
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.rex_link_customer_portal_invite_on_signup();

CREATE OR REPLACE FUNCTION public.rex_customer_portal_profile()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT jsonb_build_object(
    'customer_id', c.id,
    'customer_code', c.customer_code,
    'name', c.name,
    'email', cpu.email,
    'authorized_person_name', c.authorized_person_name
  )
  FROM public.customer_portal_users cpu
  JOIN public.customers c ON c.id = cpu.customer_id
  WHERE cpu.user_id = auth.uid() AND cpu.active = true
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.rex_customer_portal_shipments()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_customer_id uuid;
  v_result jsonb;
BEGIN
  SELECT customer_id INTO v_customer_id
  FROM public.customer_portal_users
  WHERE user_id = auth.uid() AND active = true;
  IF v_customer_id IS NULL THEN RAISE EXCEPTION 'Müşteri portalı erişiminiz bulunmuyor'; END IF;

  SELECT coalesce(jsonb_agg(row_data ORDER BY row_data->>'pickup_date' DESC, row_data->>'created_at' DESC), '[]'::jsonb)
  INTO v_result
  FROM (
    SELECT jsonb_build_object(
      'id', s.id,
      'shipment_code', s.shipment_code,
      'tracking_number', s.tracking_number,
      'status', s.status,
      'created_at', s.created_at,
      'pickup_date', s.pickup_date,
      'estimated_delivery_date', s.estimated_delivery_date,
      'actual_delivery_date', s.actual_delivery_date,
      'delivery_date', s.delivery_date,
      'delivered_to', s.delivered_to,
      'delivery_proof_url', CASE WHEN s.status IN ('teslim_edildi','Teslim Edildi') THEN s.delivery_proof_url ELSE NULL END,
      'sender_name', s.sender_name,
      'origin', s.origin,
      'receiver', s.receiver,
      'receiver_district', s.receiver_district,
      'destination', s.destination,
      'adet', s.adet,
      'cinsi', s.cinsi,
      'kg_ds', s.kg_ds,
      'toplam_kg_ds', s.toplam_kg_ds,
      'cargo_items', coalesce((
        SELECT jsonb_agg(jsonb_build_object(
          'adet', sci.adet,
          'cinsi', sci.cinsi,
          'kg_ds', sci.kg_ds,
          'sira_no', sci.sira_no
        ) ORDER BY sci.sira_no)
        FROM public.shipment_cargo_items sci
        WHERE sci.shipment_id = s.id
      ), '[]'::jsonb)
    ) AS row_data
    FROM public.shipments s
    WHERE s.customer_id = v_customer_id
  ) safe_rows;

  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.rex_create_customer_portal_invite(uuid,text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.rex_claim_customer_portal_invite(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.rex_customer_portal_profile() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.rex_customer_portal_shipments() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rex_create_customer_portal_invite(uuid,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rex_claim_customer_portal_invite(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rex_customer_portal_profile() TO authenticated;
GRANT EXECUTE ON FUNCTION public.rex_customer_portal_shipments() TO authenticated;

DROP POLICY IF EXISTS rex_customer_delivery_proof_select ON storage.objects;
CREATE POLICY rex_customer_delivery_proof_select
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'shipment-documents'
    AND EXISTS (
      SELECT 1
      FROM public.customer_portal_users cpu
      JOIN public.shipments s ON s.customer_id = cpu.customer_id
      WHERE cpu.user_id = auth.uid()
        AND cpu.active = true
        AND s.status IN ('teslim_edildi','Teslim Edildi')
        AND s.delivery_proof_url IS NOT NULL
        AND right(s.delivery_proof_url, length(storage.objects.name)) = storage.objects.name
    )
  );
