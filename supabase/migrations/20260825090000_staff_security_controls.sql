BEGIN;

-- Administrative and accounting roles must use an AAL2 (MFA verified)
-- session before role-based database privileges become effective.
CREATE OR REPLACE FUNCTION public.rex_role_requires_mfa(p_role text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT p_role IN ('admin', 'accounting');
$$;

REVOKE ALL ON FUNCTION public.rex_role_requires_mfa(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rex_role_requires_mfa(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.rex_has_role(required_roles text[])
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.app_user_roles
    WHERE user_id = auth.uid()
      AND active = true
      AND role = ANY(required_roles)
      AND (
        NOT public.rex_role_requires_mfa(role)
        OR coalesce(auth.jwt() ->> 'aal', 'aal1') = 'aal2'
      )
  );
$$;

REVOKE ALL ON FUNCTION public.rex_has_role(text[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rex_has_role(text[]) TO authenticated;

CREATE OR REPLACE FUNCTION public.rex_is_owner_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.app_user_roles
    WHERE user_id = auth.uid()
      AND active = true
      AND role = 'admin'
      AND lower(email) = 'info@rexlojistik.com'
      AND coalesce(auth.jwt() ->> 'aal', 'aal1') = 'aal2'
  );
$$;

REVOKE ALL ON FUNCTION public.rex_is_owner_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rex_is_owner_admin() TO authenticated;

CREATE TABLE IF NOT EXISTS public.staff_security_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  email text NOT NULL,
  event_type text NOT NULL CHECK (event_type IN (
    'login_success',
    'mfa_enrolled',
    'mfa_verified',
    'mfa_removed',
    'password_changed',
    'other_sessions_revoked',
    'session_timeout'
  )),
  description text NOT NULL DEFAULT '',
  event_metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS staff_security_events_user_created_idx
  ON public.staff_security_events (user_id, created_at DESC);

ALTER TABLE public.staff_security_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS rex_staff_security_events_select ON public.staff_security_events;
CREATE POLICY rex_staff_security_events_select ON public.staff_security_events
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.rex_is_owner_admin());

CREATE OR REPLACE FUNCTION public.rex_record_security_event(
  p_event_type text,
  p_description text DEFAULT '',
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_id uuid;
  v_email text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Oturum doğrulanamadı';
  END IF;

  IF p_event_type NOT IN (
    'login_success', 'mfa_enrolled', 'mfa_verified', 'mfa_removed',
    'password_changed', 'other_sessions_revoked', 'session_timeout'
  ) THEN
    RAISE EXCEPTION 'Geçersiz güvenlik olayı';
  END IF;

  SELECT email INTO v_email
  FROM public.app_user_roles
  WHERE user_id = auth.uid() AND active = true;

  IF v_email IS NULL THEN
    RAISE EXCEPTION 'Aktif personel hesabı bulunamadı';
  END IF;

  INSERT INTO public.staff_security_events (
    user_id, email, event_type, description, event_metadata
  ) VALUES (
    auth.uid(), v_email, p_event_type, left(coalesce(p_description, ''), 500),
    coalesce(p_metadata, '{}'::jsonb)
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.rex_record_security_event(text,text,jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rex_record_security_event(text,text,jsonb) TO authenticated;

CREATE OR REPLACE FUNCTION public.rex_security_events_append_only()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'Güvenlik kayıtları değiştirilemez veya silinemez';
  END IF;
  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$;

DROP TRIGGER IF EXISTS rex_staff_security_events_append_only ON public.staff_security_events;
CREATE TRIGGER rex_staff_security_events_append_only
  BEFORE UPDATE OR DELETE ON public.staff_security_events
  FOR EACH ROW EXECUTE FUNCTION public.rex_security_events_append_only();

REVOKE INSERT, UPDATE, DELETE ON public.staff_security_events FROM anon, authenticated;
GRANT SELECT ON public.staff_security_events TO authenticated;

COMMIT;
