# REX TYS International Platform Architecture

## Goal
Add International Road, Air, Sea and Multimodal operations without rewriting the existing Domestic Transport, International Express, Accounting or KolayBi integration.

## Compatibility rules
- Existing domestic shipments remain the source of truth for domestic transport.
- Existing `service_mode = international_express` remains valid and is not migrated destructively.
- Existing accounting, sales/purchase invoices, customer accounts and KolayBi workflows remain shared infrastructure.
- International operations use the same customer directory and accounting pipeline.
- Turkey-side road legs may link to an existing domestic shipment instead of duplicating domestic operations.
- New database objects are additive. Existing production columns and workflows are not renamed or removed.

## International core
One international shipment can contain one or more ordered legs.

Modes:
- ROAD
- AIR
- SEA
- MULTIMODAL
- EXPRESS (existing flow, linked progressively)

Directions:
- IMPORT
- EXPORT
- CROSS_TRADE

Sea service types:
- FCL
- LCL

Road service types:
- FTL
- LTL
- GROUPAGE
- EXPRESS
- MINIVAN

## Shared lifecycle
RFQ -> Agent/Supplier Quotes -> Customer Quote -> Booking -> Operations -> Documents -> Release/Delivery -> Accounting -> Profitability -> Partner Performance

## Agent security
Partner statuses:
- PENDING: not approved for shipment assignment
- C: blocked/unverified
- B: verified/new; controlled test period
- A: approved/experienced

Controls:
- verified company identity and documents
- approved bank accounts
- network membership and expiry
- insurance and expiry
- references
- credit limit
- cargo exposure limit
- release authority
- first-three-shipment test period
- incident/performance history
- audit trail

Credit exposure and cargo exposure are separate controls.

## Data model
New additive entities:
- international_shipments
- international_shipment_legs
- international_partners
- international_partner_capabilities
- international_partner_bank_accounts
- international_partner_memberships
- international_partner_documents
- international_partner_reviews
- international_rfq
- international_rfq_quotes
- international_release_controls
- international_incidents

Existing entities reused:
- customers / CRM
- shipments (domestic and International Express)
- sales invoices
- purchase invoices
- accounting transactions
- KolayBi mappings/sync
- staff/users/permissions

## Linking strategy
`international_shipment_legs.domestic_shipment_id` can point to an existing domestic shipment for Turkey-side pickup/final delivery.

`international_shipments.express_shipment_id` can progressively associate an existing International Express shipment with the International control tower without rewriting Express.

Accounting references use the international shipment/leg as operational context while preserving existing invoice and KolayBi pipelines.

## Release control
Release state is independent from payment state:
- HOLD
- REQUESTED
- APPROVED
- RELEASED

No automatic cargo release merely because a receivable was paid. Approval is explicit and auditable.

## Currency and profitability
Each cost/revenue line retains original currency and rate context. Quote FX and actual FX must be distinguishable so operational margin and FX difference can be reported separately.

## UI map
International
- Control Tower
- RFQ & Quotes
- Shipments
  - Road
  - Air
  - Sea
  - Multimodal
  - Express
- Agents & Suppliers
  - Verification
  - Banks
  - Networks
  - Insurance
  - Credit & Exposure
  - Performance
- Documents
- Release Control
- Incidents / Claims
- Reports

## Delivery phases
1. Foundation: schema, permissions, partner master, verification, banks, exposure, audit.
2. Operations: International shipment + legs + Road/Air/Sea fields.
3. Commercial: RFQ, quote comparison, customer quotation.
4. Controls: release, incidents, first-three-shipment reviews.
5. Integration: accounting/KolayBi links, domestic-leg linking, Express control-tower linking.
6. Reporting: control tower, profitability and partner performance.

## Non-negotiable migration rule
No phase may break or duplicate the existing Domestic, International Express, Accounting or KolayBi workflows. Every migration must be additive or explicitly backward compatible.
