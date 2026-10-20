-- ==============================================================================
-- DUTA RAB S1 : SUPABASE QUICK FIX PATCH (EKSEKUSI DI SQL EDITOR SUPABASE)
-- Pengembang: Duta Digital Agensi (dutamik.id) - Sukoharjo, Jawa Tengah
-- Master Secret Passcode: Surabaya123
-- ==============================================================================

-- 1. Ekstensi pgcrypto
create extension if not exists pgcrypto with schema extensions;

-- 2. Default UUID dan Unique Constraint pada Kolom Email (Mengatasi Error 42P10)
alter table public.user_profiles alter column id set default gen_random_uuid();

do $init$
begin
  if not exists (select 1 from pg_constraint where conname = 'user_profiles_email_key') then
    alter table public.user_profiles add constraint user_profiles_email_key unique (email);
  end if;
end;
$init$;

-- 3. RLS dan Hak Akses Penuh Termasuk DELETE (Mengatasi Error Izin 42501)
alter table public.user_profiles enable row level security;

drop policy if exists "Users can delete profiles" on public.user_profiles;
create policy "Users can delete profiles" on public.user_profiles for delete using (true);

grant select, insert, update, delete on public.user_profiles to anon, authenticated, service_role;

-- 4. RPC admin_workspace_gateway (Bebas Error 42883 Digest & Bebas Error 42601 $)
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
  v_new_role text;
  v_new_status text;
  v_features jsonb;
  v_email text;
  v_name text;
  v_random_code integer;
begin
  -- Verifikasi passcode admin Surabaya123 langsung
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
      'expired_at', o.expired_at
    ) order by o.created_at desc), '[]'::jsonb) into v_orders from public.subscription_orders o;

    return jsonb_build_object(
      'success', true,
      'data', jsonb_build_object(
        'tiers', v_tiers,
        'users', v_users,
        'domains', v_domains,
        'orders', v_orders
      )
    );

  elsif action = 'update_user_role' then
    v_target_user_id := (payload->>'user_id')::uuid;
    v_new_role := payload->>'role';
    v_new_status := coalesce(payload->>'status', 'ACTIVE');
    v_features := payload->'allowed_features';

    update public.user_profiles
    set
      role = coalesce(v_new_role, role),
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
      id, email, full_name, role, status, unique_code, allowed_features
    ) values (
      gen_random_uuid(),
      v_email,
      coalesce(v_name, split_part(v_email, '@', 1)),
      v_new_role,
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

-- 5. Seed Administrator Resmi (Aman dengan constraint unique pada email)
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
