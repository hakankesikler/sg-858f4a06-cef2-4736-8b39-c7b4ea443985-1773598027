begin;
create table public.website_conversion_events (
 id uuid primary key,
 recorded_at timestamptz not null default now(),
 page_path text not null check (page_path = '/izmir-parsiyel-tasimacilik'),
 event_name text not null check (event_name in ('quote_open','whatsapp_click','quote_whatsapp_click')),
 source_category text not null check (source_category in ('google_referral','bing_referral','other_referral','direct_or_unknown'))
);
create index website_conversion_events_recorded_at_idx on public.website_conversion_events (recorded_at desc);
alter table public.website_conversion_events enable row level security;
revoke all on public.website_conversion_events from anon, authenticated;
grant select, insert on public.website_conversion_events to service_role;
grant select on public.website_conversion_events to authenticated;
create policy conversion_analytics_read on public.website_conversion_events for select to authenticated using ((select public.rex_has_permission('analytics.web','view')));
create function public.rex_conversion_counts(p_days integer default 30)
returns table(event_name text, source_category text, event_count bigint)
language plpgsql stable security invoker set search_path = '' as $$
begin
 if p_days not in (7,30,90) or p_days is null then raise exception 'Invalid range' using errcode='22023'; end if;
 if not coalesce(public.rex_has_permission('analytics.web','view'),false) then raise exception 'Analytics access required' using errcode='42501'; end if;
 return query select e.event_name,e.source_category,count(*) from public.website_conversion_events e
 where e.recorded_at >= now() - make_interval(days=>p_days) group by e.event_name,e.source_category;
end; $$;
revoke all on function public.rex_conversion_counts(integer) from public,anon;
grant execute on function public.rex_conversion_counts(integer) to authenticated;
comment on table public.website_conversion_events is 'Click intent only; no form values. Google referral does not establish organic attribution or a sent message.';
commit;