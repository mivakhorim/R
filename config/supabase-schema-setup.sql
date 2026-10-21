create extension if not exists pgcrypto with schema extensions;

create table if not exists public.user_profiles (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  full_name text,
  avatar_url text,
  unique_code integer default floor(random() * (999 - 100 + 1) + 100)::int,
  role text not null default 'free_trial',
  plan_type text not null default 'STANDAR_FREE',
  status text not null default 'ACTIVE',
  allowed_features jsonb default '{"canExportAll": true, "canCustomAhsp": false, "canBapTermin": false}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $schema_fix$
begin
  alter table public.user_profiles drop constraint if exists user_profiles_id_fkey;
  alter table public.user_profiles alter column id set default gen_random_uuid();
  if not exists (select 1 from pg_constraint where conname = 'user_profiles_email_key') then
    alter table public.user_profiles add constraint user_profiles_email_key unique (email);
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'user_profiles' and column_name = 'unique_code') then
    alter table public.user_profiles add column unique_code integer default floor(random() * (999 - 100 + 1) + 100)::int;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'user_profiles' and column_name = 'plan_type') then
    alter table public.user_profiles add column plan_type text not null default 'STANDAR_FREE';
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'user_profiles' and column_name = 'allowed_features') then
    alter table public.user_profiles add column allowed_features jsonb default '{"canExportAll": true, "canCustomAhsp": false, "canBapTermin": false}'::jsonb;
  end if;
exception when others then
  null;
end;
$schema_fix$;

create table if not exists public.billing_orders (
  id serial primary key,
  order_id text not null unique,
  user_email text not null,
  user_name text,
  amount integer not null,
  unique_code integer not null,
  status text not null default 'PENDING_VERIFICATION',
  created_at timestamptz not null default now(),
  verified_at timestamptz,
  notes text
);

create table if not exists public.member_tiers (
  tier_id text primary key,
  name text not null,
  description text,
  allowed_menus text[],
  max_projects integer default 9999,
  can_custom_ahsp boolean default true,
  can_bap_termin boolean default true,
  can_export_all boolean default true
);

create table if not exists public.app_domain_locks (
  id serial primary key,
  domain text not null unique,
  is_active boolean default true,
  notes text,
  created_at timestamptz default now()
);

insert into public.member_tiers (tier_id, name, description, allowed_menus, max_projects, can_custom_ahsp, can_bap_termin, can_export_all)
values
('free_trial', 'Lisensi Gratis (Free Trial)', 'Akses dasar perhitungan estimasi dan katalog material', array['info-proyek', 'rekap-rab', 'detail-rab', 'katalog', 'proyek', 'auth-license', 'cloud-sync'], 2, false, false, true),
('client_viewer', 'Client Viewer', 'Akses pratinjau proyek, jadwal, dan kurva S untuk owner', array['info-proyek', 'rekap-rab', 'detail-rab', 'kurva-s', 'kalender', 'proposal', 'bap', 'proyek', 'auth-license', 'cloud-sync'], 5, false, false, false),
('estimator_pro', 'Estimator Pro (Lisensi Berbayar)', 'Akses penuh tanpa batas seluruh fitur profesional', array['info-proyek', 'rekap-rab', 'detail-rab', 'volume', 'ahsp', 'katalog', 'sumberdaya', 'kurva-s', 'kalender', 'koreksi', 'bap', 'proposal', 'proyek', 'auth-license', 'cloud-sync'], 9999, true, true, true),
('admin', 'Administrator Sistem', 'Akses seluruh modul dan manajemen lisensi member', array['info-proyek', 'rekap-rab', 'detail-rab', 'volume', 'ahsp', 'katalog', 'sumberdaya', 'kurva-s', 'kalender', 'koreksi', 'bap', 'proposal', 'proyek', 'auth-license', 'cloud-sync'], 9999, true, true, true)
on conflict (tier_id) do nothing;

insert into public.app_domain_locks (domain, is_active, notes)
values
('rab.dutamik.id', true, 'Domain Utama Produksi'),
('dutamik.id', true, 'Portal Ekosistem'),
('localhost', true, 'Pengembangan Lokal'),
('127.0.0.1', true, 'Pengembangan Lokal')
on conflict (domain) do nothing;

alter table public.user_profiles enable row level security;
alter table public.billing_orders enable row level security;
alter table public.member_tiers enable row level security;
alter table public.app_domain_locks enable row level security;

drop policy if exists "Allow all on user_profiles" on public.user_profiles;
create policy "Allow all on user_profiles" on public.user_profiles for all using (true) with check (true);

drop policy if exists "Allow all on billing_orders" on public.billing_orders;
create policy "Allow all on billing_orders" on public.billing_orders for all using (true) with check (true);

drop policy if exists "Allow all on member_tiers" on public.member_tiers;
create policy "Allow all on member_tiers" on public.member_tiers for all using (true) with check (true);

drop policy if exists "Allow all on app_domain_locks" on public.app_domain_locks;
create policy "Allow all on app_domain_locks" on public.app_domain_locks for all using (true) with check (true);

grant select, insert, update, delete on public.user_profiles to anon, authenticated, service_role;
grant select, insert, update, delete on public.billing_orders to anon, authenticated, service_role;
grant select, insert, update, delete on public.member_tiers to anon, authenticated, service_role;
grant select, insert, update, delete on public.app_domain_locks to anon, authenticated, service_role;
grant usage, select on sequence public.billing_orders_id_seq to anon, authenticated, service_role;
grant usage, select on sequence public.app_domain_locks_id_seq to anon, authenticated, service_role;

create or replace function public.admin_workspace_gateway(
  passcode text,
  action text,
  payload jsonb default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $body$
declare
  is_valid_passcode boolean := false;
  v_tiers jsonb;
  v_users jsonb;
  v_domains jsonb;
  v_orders jsonb;
  v_target_user_id uuid;
  v_target_email text;
  v_new_role text;
  v_new_status text;
  v_features jsonb;
  v_email text;
  v_name text;
  v_order_id text;
  v_random_code integer;
begin
  if passcode = 'Surabaya123' or passcode = '4d02994612948232fb18bb34df323a62a83e6bcd7e86d9df21ce1d55d86093eb' then
    is_valid_passcode := true;
  else
    begin
      if encode(digest(passcode, 'sha256'), 'hex') = '4d02994612948232fb18bb34df323a62a83e6bcd7e86d9df21ce1d55d86093eb' then
        is_valid_passcode := true;
      end if;
    exception when others then
      is_valid_passcode := false;
    end;
  end if;

  if not is_valid_passcode then
    return jsonb_build_object('success', false, 'message', 'Akses Ditolak: Kunci Rahasia Admin Tidak Valid');
  end if;

  if action = 'load_all' then
    select coalesce(jsonb_agg(jsonb_build_object(
      'tier_id', t.tier_id,
      'name', t.name,
      'description', t.description,
      'allowed_menus', t.allowed_menus,
      'max_projects', t.max_projects,
      'can_custom_ahsp', t.can_custom_ahsp,
      'can_bap_termin', t.can_bap_termin,
      'can_export_all', t.can_export_all
    ) order by t.max_projects asc), '[]'::jsonb) into v_tiers from public.member_tiers t;

    select coalesce(jsonb_agg(jsonb_build_object(
      'id', p.id,
      'email', p.email,
      'full_name', p.full_name,
      'avatar_url', p.avatar_url,
      'unique_code', p.unique_code,
      'role', p.role,
      'plan_type', p.plan_type,
      'status', p.status,
      'allowed_features', p.allowed_features,
      'created_at', p.created_at,
      'updated_at', p.updated_at
    ) order by p.created_at desc), '[]'::jsonb) into v_users from public.user_profiles p;

    select coalesce(jsonb_agg(jsonb_build_object(
      'id', d.id,
      'domain', d.domain,
      'is_active', d.is_active,
      'notes', d.notes,
      'created_at', d.created_at
    ) order by d.id asc), '[]'::jsonb) into v_domains from public.app_domain_locks d;

    select coalesce(jsonb_agg(jsonb_build_object(
      'id', o.id,
      'order_id', o.order_id,
      'user_email', o.user_email,
      'user_name', o.user_name,
      'amount', o.amount,
      'unique_code', o.unique_code,
      'status', o.status,
      'created_at', o.created_at,
      'verified_at', o.verified_at,
      'notes', o.notes
    ) order by o.created_at desc), '[]'::jsonb) into v_orders from public.billing_orders o;

    return jsonb_build_object(
      'success', true,
      'data', jsonb_build_object(
        'tiers', v_tiers,
        'users', v_users,
        'domains', v_domains,
        'orders', v_orders
      )
    );

  elsif action = 'approve_order' then
    v_order_id := payload->>'order_id';
    update public.billing_orders
    set status = 'PAID_VERIFIED', verified_at = now()
    where order_id = v_order_id
    returning user_email into v_target_email;

    if v_target_email is not null then
      update public.user_profiles
      set
        role = 'estimator_pro',
        plan_type = 'LIFETIME',
        status = 'ACTIVE',
        allowed_features = '{"canExportAll": true, "canCustomAhsp": true, "canBapTermin": true}'::jsonb,
        updated_at = now()
      where lower(trim(email)) = lower(trim(v_target_email));
    end if;

    return jsonb_build_object('success', true, 'message', 'Pesanan berhasil disetujui & akun pengguna di-upgrade ke Estimator Pro (LIFETIME)');

  elsif action = 'reject_order' then
    v_order_id := payload->>'order_id';
    update public.billing_orders
    set status = 'REJECTED'
    where order_id = v_order_id;
    return jsonb_build_object('success', true, 'message', 'Pesanan ditolak');

  elsif action = 'update_user_role' then
    v_target_user_id := (payload->>'user_id')::uuid;
    v_new_role := payload->>'role';
    v_new_status := coalesce(payload->>'status', 'ACTIVE');
    v_features := payload->'allowed_features';

    update public.user_profiles
    set
      role = coalesce(v_new_role, role),
      plan_type = case when v_new_role in ('estimator_pro', 'admin') then 'LIFETIME' else 'STANDAR_FREE' end,
      status = coalesce(v_new_status, status),
      allowed_features = coalesce(v_features, allowed_features),
      updated_at = now()
    where id = v_target_user_id;

    return jsonb_build_object('success', true, 'message', 'Status dan Peran Member Berhasil Diperbarui');

  elsif action = 'add_user' then
    v_email := lower(trim(payload->>'email'));
    v_name := trim(payload->>'full_name');
    v_new_role := coalesce(payload->>'role', 'estimator_pro');
    v_random_code := floor(random() * (999 - 100 + 1) + 100)::int;

    insert into public.user_profiles (
      id, email, full_name, role, plan_type, status, unique_code, allowed_features
    ) values (
      gen_random_uuid(),
      v_email,
      coalesce(v_name, split_part(v_email, '@', 1)),
      v_new_role,
      case when v_new_role in ('estimator_pro', 'admin') then 'LIFETIME' else 'STANDAR_FREE' end,
      'ACTIVE',
      v_random_code,
      jsonb_build_object(
        'canExportAll', true,
        'canCustomAhsp', (v_new_role in ('estimator_pro', 'admin')),
        'canBapTermin', (v_new_role in ('estimator_pro', 'admin'))
      )
    )
    on conflict (email) do update
    set
      role = excluded.role,
      plan_type = excluded.plan_type,
      status = 'ACTIVE',
      allowed_features = excluded.allowed_features,
      updated_at = now();

    return jsonb_build_object('success', true, 'message', 'Member Baru Berhasil Ditambahkan');

  elsif action = 'delete_user' then
    v_target_user_id := (payload->>'user_id')::uuid;
    delete from public.user_profiles where id = v_target_user_id;
    return jsonb_build_object('success', true, 'message', 'Member Berhasil Dihapus');

  else
    return jsonb_build_object('success', false, 'message', 'Aksi Tidak Dikenali');
  end if;
end;
$body$;

grant execute on function public.admin_workspace_gateway(text, text, jsonb) to anon, authenticated, service_role;

insert into public.user_profiles (
  id, email, full_name, avatar_url, unique_code, role, plan_type, status, allowed_features
) values 
(
  gen_random_uuid(), 'mivakhorim@gmail.com', 'M Iva Khorim', '', 754, 'admin', 'LIFETIME', 'ACTIVE',
  '{"canExportAll": true, "canCustomAhsp": true, "canBapTermin": true}'::jsonb
),
(
  gen_random_uuid(), 'dutadigitalagensi@gmail.com', 'Duta Digital Agensi', '', 714, 'admin', 'LIFETIME', 'ACTIVE',
  '{"canExportAll": true, "canCustomAhsp": true, "canBapTermin": true}'::jsonb
)
on conflict (email) do update
set 
  role = 'admin',
  plan_type = 'LIFETIME',
  status = 'ACTIVE',
  allowed_features = '{"canExportAll": true, "canCustomAhsp": true, "canBapTermin": true}'::jsonb,
  updated_at = now();
