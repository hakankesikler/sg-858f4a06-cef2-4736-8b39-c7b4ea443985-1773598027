-- REX TYS International platform foundation.
-- Additive only: existing Domestic, International Express, Accounting and KolayBi flows remain unchanged.

CREATE TABLE IF NOT EXISTS public.international_partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  legal_name text NOT NULL,
  trading_name text,
  partner_type text NOT NULL DEFAULT 'agent' CHECK (partner_type IN ('agent','carrier','consolidator','broker','supplier','hybrid')),
  country_code text NOT NULL CHECK (country_code ~ '^[A-Z]{2}$'),
  city text,
  website text,
  corporate_email text,
  phone text,
  registration_no text,
  tax_no text,
  status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','C','B','A')),
  credit_limit numeric(18,2) NOT NULL DEFAULT 0 CHECK (credit_limit >= 0),
  credit_currency text NOT NULL DEFAULT 'USD',
  cargo_exposure_limit numeric(18,2) NOT NULL DEFAULT 0 CHECK (cargo_exposure_limit >= 0),
  cargo_exposure_currency text NOT NULL DEFAULT 'USD',
  release_requires_rex_approval boolean NOT NULL DEFAULT true,
  test_shipments_required integer NOT NULL DEFAULT 3 CHECK (test_shipments_required >= 0),
  test_shipments_completed integer NOT NULL DEFAULT 0 CHECK (test_shipments_completed >= 0),
  verification_completed_at timestamptz,
  next_review_at timestamptz,
  notes text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid DEFAULT auth.uid(),
  updated_by uuid DEFAULT auth.uid()
);

CREATE UNIQUE INDEX IF NOT EXISTS international_partners_legal_country_uq
  ON public.international_partners (lower(legal_name), country_code);
CREATE INDEX IF NOT EXISTS international_partners_status_idx
  ON public.international_partners (status, country_code, is_active);

CREATE TABLE IF NOT EXISTS public.international_partner_capabilities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES public.international_partners(id) ON DELETE CASCADE,
  mode text NOT NULL CHECK (mode IN ('ROAD','AIR','SEA','EXPRESS')),
  service_type text,
  origin_location text,
  destination_location text,
  is_primary boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (partner_id, mode, service_type, origin_location, destination_location)
);

CREATE TABLE IF NOT EXISTS public.international_partner_bank_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES public.international_partners(id) ON DELETE CASCADE,
  beneficiary_name text NOT NULL,
  bank_name text NOT NULL,
  bank_country_code text CHECK (bank_country_code IS NULL OR bank_country_code ~ '^[A-Z]{2}$'),
  account_no text,
  iban text,
  swift_code text,
  currency text NOT NULL DEFAULT 'USD',
  verification_status text NOT NULL DEFAULT 'PENDING' CHECK (verification_status IN ('PENDING','APPROVED','REJECTED','SUSPENDED')),
  verified_at timestamptz,
  verified_by uuid,
  verification_method text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS international_partner_banks_partner_idx
  ON public.international_partner_bank_accounts (partner_id, verification_status, is_active);

CREATE TABLE IF NOT EXISTS public.international_partner_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES public.international_partners(id) ON DELETE CASCADE,
  network_name text NOT NULL,
  member_id text,
  valid_from date,
  valid_until date,
  financial_protection boolean NOT NULL DEFAULT false,
  protection_notes text,
  verification_url text,
  verified_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS international_partner_memberships_expiry_idx
  ON public.international_partner_memberships (valid_until, is_active);

CREATE TABLE IF NOT EXISTS public.international_shipments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_code text NOT NULL UNIQUE,
  customer_id uuid REFERENCES public.customers(id),
  direction text NOT NULL CHECK (direction IN ('IMPORT','EXPORT','CROSS_TRADE')),
  primary_mode text NOT NULL CHECK (primary_mode IN ('ROAD','AIR','SEA','MULTIMODAL','EXPRESS')),
  status text NOT NULL DEFAULT 'RFQ' CHECK (status IN ('RFQ','QUOTED','APPROVED','BOOKED','PICKED_UP','IN_TRANSIT','ARRIVED','CUSTOMS','DELIVERY','DELIVERED','CANCELLED')),
  origin_country_code text CHECK (origin_country_code IS NULL OR origin_country_code ~ '^[A-Z]{2}$'),
  destination_country_code text CHECK (destination_country_code IS NULL OR destination_country_code ~ '^[A-Z]{2}$'),
  origin_location text,
  destination_location text,
  incoterm text,
  commodity text,
  package_count integer CHECK (package_count IS NULL OR package_count >= 0),
  gross_weight_kg numeric(18,3) CHECK (gross_weight_kg IS NULL OR gross_weight_kg >= 0),
  volume_cbm numeric(18,4) CHECK (volume_cbm IS NULL OR volume_cbm >= 0),
  cargo_value numeric(18,2) CHECK (cargo_value IS NULL OR cargo_value >= 0),
  cargo_value_currency text,
  dangerous_goods boolean NOT NULL DEFAULT false,
  insurance_required boolean NOT NULL DEFAULT false,
  express_shipment_id uuid REFERENCES public.shipments(id),
  owner_user_id uuid,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid DEFAULT auth.uid(),
  updated_by uuid DEFAULT auth.uid()
);

CREATE INDEX IF NOT EXISTS international_shipments_customer_idx ON public.international_shipments(customer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS international_shipments_status_idx ON public.international_shipments(status, primary_mode, created_at DESC);

CREATE TABLE IF NOT EXISTS public.international_shipment_legs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  international_shipment_id uuid NOT NULL REFERENCES public.international_shipments(id) ON DELETE CASCADE,
  leg_no integer NOT NULL CHECK (leg_no > 0),
  mode text NOT NULL CHECK (mode IN ('ROAD','AIR','SEA','EXPRESS')),
  service_type text,
  partner_id uuid REFERENCES public.international_partners(id),
  domestic_shipment_id uuid REFERENCES public.shipments(id),
  origin_location text,
  destination_location text,
  etd timestamptz,
  eta timestamptz,
  actual_departure_at timestamptz,
  actual_arrival_at timestamptz,
  carrier_name text,
  booking_reference text,
  master_document_no text,
  house_document_no text,
  vessel_flight_vehicle text,
  voyage_flight_no text,
  container_no text,
  seal_no text,
  chargeable_weight_kg numeric(18,3),
  volume_cbm numeric(18,4),
  cost_amount numeric(18,2),
  cost_currency text,
  status text NOT NULL DEFAULT 'PLANNED',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (international_shipment_id, leg_no),
  CHECK (domestic_shipment_id IS NULL OR mode='ROAD')
);

CREATE INDEX IF NOT EXISTS international_legs_partner_idx ON public.international_shipment_legs(partner_id, status);
CREATE INDEX IF NOT EXISTS international_legs_domestic_idx ON public.international_shipment_legs(domestic_shipment_id) WHERE domestic_shipment_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.international_release_controls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  international_shipment_id uuid NOT NULL REFERENCES public.international_shipments(id) ON DELETE CASCADE,
  leg_id uuid REFERENCES public.international_shipment_legs(id) ON DELETE CASCADE,
  release_type text,
  release_status text NOT NULL DEFAULT 'HOLD' CHECK (release_status IN ('HOLD','REQUESTED','APPROVED','RELEASED')),
  financial_status text NOT NULL DEFAULT 'UNCONFIRMED' CHECK (financial_status IN ('UNCONFIRMED','CLEARED','BLOCKED')),
  requested_at timestamptz,
  requested_by uuid,
  approved_at timestamptz,
  approved_by uuid,
  released_at timestamptz,
  released_by uuid,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS international_release_status_idx
  ON public.international_release_controls(release_status, financial_status);

ALTER TABLE public.international_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.international_partner_capabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.international_partner_bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.international_partner_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.international_shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.international_shipment_legs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.international_release_controls ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS international_partners_staff_read ON public.international_partners;
CREATE POLICY international_partners_staff_read ON public.international_partners
  FOR SELECT TO authenticated USING (public.rex_has_role(ARRAY['admin','operations','sales','accounting']));

DROP POLICY IF EXISTS international_partners_admin_ops_write ON public.international_partners;
CREATE POLICY international_partners_admin_ops_write ON public.international_partners
  FOR ALL TO authenticated USING (public.rex_has_role(ARRAY['admin','operations']))
  WITH CHECK (public.rex_has_role(ARRAY['admin','operations']));

DROP POLICY IF EXISTS international_capabilities_staff_read ON public.international_partner_capabilities;
CREATE POLICY international_capabilities_staff_read ON public.international_partner_capabilities
  FOR SELECT TO authenticated USING (public.rex_has_role(ARRAY['admin','operations','sales','accounting']));
DROP POLICY IF EXISTS international_capabilities_admin_ops_write ON public.international_partner_capabilities;
CREATE POLICY international_capabilities_admin_ops_write ON public.international_partner_capabilities
  FOR ALL TO authenticated USING (public.rex_has_role(ARRAY['admin','operations']))
  WITH CHECK (public.rex_has_role(ARRAY['admin','operations']));

DROP POLICY IF EXISTS international_banks_staff_read ON public.international_partner_bank_accounts;
CREATE POLICY international_banks_staff_read ON public.international_partner_bank_accounts
  FOR SELECT TO authenticated USING (public.rex_has_role(ARRAY['admin','operations','accounting']));
DROP POLICY IF EXISTS international_banks_admin_accounting_write ON public.international_partner_bank_accounts;
CREATE POLICY international_banks_admin_accounting_write ON public.international_partner_bank_accounts
  FOR ALL TO authenticated USING (public.rex_has_role(ARRAY['admin','accounting']))
  WITH CHECK (public.rex_has_role(ARRAY['admin','accounting']));

DROP POLICY IF EXISTS international_memberships_staff_read ON public.international_partner_memberships;
CREATE POLICY international_memberships_staff_read ON public.international_partner_memberships
  FOR SELECT TO authenticated USING (public.rex_has_role(ARRAY['admin','operations','sales','accounting']));
DROP POLICY IF EXISTS international_memberships_admin_ops_write ON public.international_partner_memberships;
CREATE POLICY international_memberships_admin_ops_write ON public.international_partner_memberships
  FOR ALL TO authenticated USING (public.rex_has_role(ARRAY['admin','operations']))
  WITH CHECK (public.rex_has_role(ARRAY['admin','operations']));

DROP POLICY IF EXISTS international_shipments_staff_read ON public.international_shipments;
CREATE POLICY international_shipments_staff_read ON public.international_shipments
  FOR SELECT TO authenticated USING (public.rex_has_role(ARRAY['admin','operations','sales','accounting']));
DROP POLICY IF EXISTS international_shipments_admin_ops_write ON public.international_shipments;
CREATE POLICY international_shipments_admin_ops_write ON public.international_shipments
  FOR ALL TO authenticated USING (public.rex_has_role(ARRAY['admin','operations']))
  WITH CHECK (public.rex_has_role(ARRAY['admin','operations']));

DROP POLICY IF EXISTS international_legs_staff_read ON public.international_shipment_legs;
CREATE POLICY international_legs_staff_read ON public.international_shipment_legs
  FOR SELECT TO authenticated USING (public.rex_has_role(ARRAY['admin','operations','sales','accounting']));
DROP POLICY IF EXISTS international_legs_admin_ops_write ON public.international_shipment_legs;
CREATE POLICY international_legs_admin_ops_write ON public.international_shipment_legs
  FOR ALL TO authenticated USING (public.rex_has_role(ARRAY['admin','operations']))
  WITH CHECK (public.rex_has_role(ARRAY['admin','operations']));

DROP POLICY IF EXISTS international_release_staff_read ON public.international_release_controls;
CREATE POLICY international_release_staff_read ON public.international_release_controls
  FOR SELECT TO authenticated USING (public.rex_has_role(ARRAY['admin','operations','accounting']));
DROP POLICY IF EXISTS international_release_admin_ops_write ON public.international_release_controls;
CREATE POLICY international_release_admin_ops_write ON public.international_release_controls
  FOR ALL TO authenticated USING (public.rex_has_role(ARRAY['admin','operations']))
  WITH CHECK (public.rex_has_role(ARRAY['admin','operations']));

REVOKE ALL ON public.international_partner_bank_accounts FROM anon;
REVOKE ALL ON public.international_partners FROM anon;
REVOKE ALL ON public.international_shipments FROM anon;
REVOKE ALL ON public.international_shipment_legs FROM anon;
REVOKE ALL ON public.international_release_controls FROM anon;

GRANT SELECT ON public.international_partners, public.international_partner_capabilities,
  public.international_partner_memberships, public.international_shipments,
  public.international_shipment_legs, public.international_release_controls TO authenticated;
GRANT SELECT ON public.international_partner_bank_accounts TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.international_partners, public.international_partner_capabilities,
  public.international_partner_memberships, public.international_shipments,
  public.international_shipment_legs, public.international_release_controls TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.international_partner_bank_accounts TO authenticated;
