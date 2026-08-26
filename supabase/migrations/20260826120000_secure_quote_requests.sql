BEGIN;

CREATE TABLE IF NOT EXISTS public.quote_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued','sending','sent','retry_wait','failed')),
  full_name text NOT NULL,
  company_name text NOT NULL,
  email text,
  phone text,
  service_type text NOT NULL CHECK (service_type IN ('domestic','international')),
  transport_mode text NOT NULL CHECK (transport_mode IN ('road','air','sea')),
  transport_detail text,
  loading_point text NOT NULL,
  delivery_point text NOT NULL,
  cargos jsonb NOT NULL CHECK (jsonb_typeof(cargos) = 'array'),
  special_requirements text,
  kvkk_acknowledged boolean NOT NULL CHECK (kvkk_acknowledged),
  commercial_consent boolean NOT NULL DEFAULT false,
  privacy_notice_version text NOT NULL,
  consent_recorded_at timestamptz NOT NULL DEFAULT now(),
  request_fingerprint text NOT NULL,
  user_agent_hash text,
  provider_message_id text,
  delivery_attempts integer NOT NULL DEFAULT 0 CHECK (delivery_attempts >= 0),
  next_attempt_at timestamptz NOT NULL DEFAULT now(),
  last_delivery_error text,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS quote_requests_delivery_queue_idx
  ON public.quote_requests(next_attempt_at, created_at)
  WHERE status IN ('queued','retry_wait');

CREATE TABLE IF NOT EXISTS public.quote_consent_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  quote_request_id uuid NOT NULL REFERENCES public.quote_requests(id) ON DELETE RESTRICT,
  event_type text NOT NULL CHECK (event_type IN ('privacy_notice_acknowledged','commercial_consent_granted','commercial_consent_not_granted','commercial_consent_withdrawn')),
  notice_version text NOT NULL,
  communication_channels text[] NOT NULL DEFAULT '{}',
  source text NOT NULL DEFAULT 'public_quote_form',
  request_fingerprint text NOT NULL,
  recorded_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS quote_consent_events_request_idx
  ON public.quote_consent_events(quote_request_id, recorded_at);

CREATE TABLE IF NOT EXISTS public.quote_rate_limits (
  request_key text PRIMARY KEY,
  window_started_at timestamptz NOT NULL DEFAULT now(),
  request_count integer NOT NULL DEFAULT 0 CHECK (request_count >= 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.quote_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_consent_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_rate_limits ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.quote_requests FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.quote_consent_events FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.quote_rate_limits FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.quote_requests TO service_role;
GRANT ALL ON public.quote_consent_events TO service_role;
GRANT ALL ON public.quote_rate_limits TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.quote_consent_events_id_seq TO service_role;

CREATE OR REPLACE FUNCTION public.rex_consume_quote_rate_limit(
  p_request_key text,
  p_limit integer DEFAULT 3,
  p_window_seconds integer DEFAULT 900
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_count integer;
BEGIN
  IF auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'Teklif hız sınırı yalnızca güvenilir sunucu tarafından kullanılabilir';
  END IF;
  IF nullif(trim(p_request_key), '') IS NULL OR p_limit < 1 OR p_window_seconds < 60 THEN
    RETURN false;
  END IF;

  INSERT INTO public.quote_rate_limits(request_key, window_started_at, request_count, updated_at)
  VALUES (p_request_key, now(), 1, now())
  ON CONFLICT (request_key) DO UPDATE SET
    window_started_at = CASE
      WHEN public.quote_rate_limits.window_started_at <= now() - make_interval(secs => p_window_seconds)
        THEN now()
      ELSE public.quote_rate_limits.window_started_at
    END,
    request_count = CASE
      WHEN public.quote_rate_limits.window_started_at <= now() - make_interval(secs => p_window_seconds)
        THEN 1
      ELSE public.quote_rate_limits.request_count + 1
    END,
    updated_at = now()
  RETURNING request_count INTO v_count;

  DELETE FROM public.quote_rate_limits
  WHERE updated_at < now() - interval '2 days';

  RETURN v_count <= p_limit;
END;
$$;

CREATE OR REPLACE FUNCTION public.rex_claim_quote_delivery_job()
RETURNS SETOF public.quote_requests
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'Teklif kuyruğu yalnızca güvenilir sunucu tarafından işlenebilir';
  END IF;

  RETURN QUERY
  UPDATE public.quote_requests q
  SET status = 'sending',
      delivery_attempts = q.delivery_attempts + 1,
      updated_at = now()
  WHERE q.id = (
    SELECT candidate.id
    FROM public.quote_requests candidate
    WHERE (
        (candidate.status IN ('queued','retry_wait') AND candidate.next_attempt_at <= now())
        OR (candidate.status = 'sending' AND candidate.updated_at < now() - interval '10 minutes')
      )
      AND candidate.delivery_attempts < 6
    ORDER BY candidate.next_attempt_at, candidate.created_at
    FOR UPDATE SKIP LOCKED
    LIMIT 1
  )
  RETURNING q.*;
END;
$$;

CREATE OR REPLACE FUNCTION public.rex_record_quote_delivery_result(
  p_quote_request_id uuid,
  p_success boolean,
  p_provider_message_id text DEFAULT NULL,
  p_error text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'Teklif teslimat sonucu yalnızca güvenilir sunucu tarafından kaydedilebilir';
  END IF;

  UPDATE public.quote_requests
  SET status = CASE
        WHEN p_success THEN 'sent'
        WHEN delivery_attempts >= 6 THEN 'failed'
        ELSE 'retry_wait'
      END,
      provider_message_id = CASE WHEN p_success THEN left(p_provider_message_id, 300) ELSE provider_message_id END,
      last_delivery_error = CASE WHEN p_success THEN NULL ELSE left(coalesce(p_error, 'Bilinmeyen teslimat hatası'), 1000) END,
      sent_at = CASE WHEN p_success THEN now() ELSE sent_at END,
      next_attempt_at = CASE
        WHEN p_success THEN next_attempt_at
        ELSE now() + make_interval(mins => LEAST(240, GREATEST(5, power(2, LEAST(delivery_attempts, 6))::integer * 5)))
      END,
      updated_at = now()
  WHERE id = p_quote_request_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.rex_quote_consent_immutable()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  RAISE EXCEPTION 'Teklif onay kayıtları değiştirilemez veya silinemez';
END;
$$;

DROP TRIGGER IF EXISTS quote_consent_events_immutable ON public.quote_consent_events;
CREATE TRIGGER quote_consent_events_immutable
BEFORE UPDATE OR DELETE ON public.quote_consent_events
FOR EACH ROW EXECUTE FUNCTION public.rex_quote_consent_immutable();

REVOKE ALL ON FUNCTION public.rex_consume_quote_rate_limit(text,integer,integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.rex_claim_quote_delivery_job() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.rex_record_quote_delivery_result(uuid,boolean,text,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rex_consume_quote_rate_limit(text,integer,integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.rex_claim_quote_delivery_job() TO service_role;
GRANT EXECUTE ON FUNCTION public.rex_record_quote_delivery_result(uuid,boolean,text,text) TO service_role;

COMMIT;
