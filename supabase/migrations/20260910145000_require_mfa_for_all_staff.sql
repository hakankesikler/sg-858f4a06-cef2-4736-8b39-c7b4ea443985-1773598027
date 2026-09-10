-- Every active staff role handles business or personal data. Permission checks
-- therefore remain ineffective until the JWT carries an AAL2 MFA assertion.

CREATE OR REPLACE FUNCTION public.rex_role_requires_mfa(p_role text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
SET search_path = public, pg_temp
AS $$
  SELECT p_role IN ('admin','sales','operations','accounting','hr','viewer','demo');
$$;

CREATE OR REPLACE FUNCTION public.rex_permission_level(p_key text)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT CASE
    WHEN r.user_id IS NULL OR NOT r.active THEN 'none'
    WHEN public.rex_role_requires_mfa(r.role)
      AND coalesce(auth.jwt() ->> 'aal', 'aal1') <> 'aal2' THEN 'none'
    ELSE coalesce(o.access_level, public.rex_base_permission_level(r.role, p_key))
  END
  FROM (SELECT auth.uid() AS current_user_id) u
  LEFT JOIN public.app_user_roles r ON r.user_id = u.current_user_id
  LEFT JOIN public.staff_permission_overrides o
    ON o.user_id = r.user_id AND o.permission_key = p_key;
$$;

REVOKE ALL ON FUNCTION public.rex_role_requires_mfa(text) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.rex_permission_level(text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.rex_role_requires_mfa(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rex_permission_level(text) TO authenticated;

COMMENT ON FUNCTION public.rex_role_requires_mfa(text) IS
  'Requires AAL2 MFA for every active REX staff role.';
