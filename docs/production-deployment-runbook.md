# Production deployment runbook

## Platform layout

- Vercel Pro serves the Next.js application and runs Node.js functions in `fra1` (Frankfurt).
- Supabase Pro remains in `eu-central-1` (Frankfurt).
- `vercel.json` is authoritative for function region, Fluid Compute, cron schedules, and function durations.
- Node.js is fixed to 22.x and pnpm to 10.34.5. Keep only `pnpm-lock.yaml`.

## Environment separation

Create variables in Vercel with the narrowest applicable target. Never paste values into the repository.

| Variable group | Production | Preview | Development |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | `https://www.rexlojistik.com` | Preview URL or omit; browser origin is used | `http://localhost:3000` |
| Supabase URL/anon key | Production project | Prefer a branch or separate preview project | Local/preview project |
| `SUPABASE_SERVICE_ROLE_KEY` | Production only | Preview project key only | Local/preview key |
| Turnstile keys | Production hostname keys | Separate preview/test keys | Cloudflare test keys |
| KolayBi, U-ETDS, QuickShipper | Live credentials | Sandbox credentials | Sandbox credentials |
| Resend/webhook/cron secrets | Production values | Separate preview values | Local values |

Supabase Auth must allow production callback URLs and a controlled Vercel Preview URL pattern. Do not use a broad wildcard outside the team-owned Vercel domain. Turnstile production keys must accept only `rexlojistik.com` hostnames.

## Deployment gate

1. Run `pnpm install --frozen-lockfile`.
2. Run `pnpm run security:scan`, `pnpm run lint`, and `pnpm run test`.
3. Run `pnpm run build` with the same environment-variable names used in Vercel.
4. Deploy to Preview and run `SMOKE_BASE_URL=<preview-url> pnpm run test:smoke`.
5. Promote only after Supabase/Auth/CAPTCHA, quote submission, login, and cron authentication checks pass.

## Scheduled functions

Schedules are UTC: KolayBi queue 02:00, office sync 02:15, quote queue 02:30, purchase invoices 02:45, CRM reminders 06:00. `CRON_SECRET` is mandatory. Keep queue operations idempotent and review Vercel logs after deployments.

## Backup and restore

- Supabase daily database backups are enabled on Pro. Test a restore quarterly in an isolated project.
- Database backups do not include Storage objects. Export private buckets to a separately controlled encrypted object store daily and test sample restores monthly.
- Point-in-Time Recovery is a paid add-on. Enable it only after cost approval when the recovery-point objective must be shorter than one day.
- Keep an encrypted off-platform export of critical configuration and migration history; never store service-role keys in that repository.

## Supabase advisor follow-up

Apply migrations to a disposable branch/project first and re-run Security and Performance Advisors. Multiple permissive RLS policies and authenticated RPC grants require role-by-role tests before consolidation; do not change them in bulk on Production.
