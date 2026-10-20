-- ==============================================================================
-- DUTA RAB S1 : MASTER DATABASE SCHEMA & SECURITY DEFINER SETUP (SUPABASE)
-- Standard SE Bina Konstruksi No. 47/2026
-- Pengembang: Duta Digital Agensi (dutamik.id) - Sukoharjo, Jawa Tengah
-- Master Secret Passcode: Surabaya123
-- SHA256: 4d02994612948232fb18bb34df323a62a83e6bcd7e86d9df21ce1d55d86093eb
-- ==============================================================================

create extension if not exists "pgcrypto";

-- ------------------------------------------------------------------------------
-- 1. TABEL TIER LISENSI
-- ------------------------------------------------------------------------------
create table if not exists public.member_tiers (
  tier_id text primary key,
  name text not null,
  description text,
  allowed_menus text[] not null,
  max_projects integer default 2,
  can_custom_ahsp boolean default false,
  can_bap_termin boolean default false,
  can_export_all boolean default false,
  created_at timestamptz default now()
);

insert into public.member_tiers (tier_id, name, description, allowed_menus, max_projects, can_custom_ahsp, can_bap_termin, can_export_all)
values
  ('free_trial', 'Lisensi Gratis', 'Akses dasar untuk estimasi RAB standar dengan batas waktu 20 menit', array['info-proyek', 'rekap-rab', 'detail-rab', 'katalog', 'proyek', 'auth-license', 'cloud-sync'], 2, false, false, true),
  ('client_viewer', 'Klien / Pemilik Tugas', 'Akses tinjauan laporan proyek dan dokumen penagihan', array['info-proyek', 'rekap-rab', 'detail-rab', 'kurva-s', 'kalender', 'proposal', 'bap', 'proyek', 'auth-license', 'cloud-sync'], 5, false, false, false),
  ('estimator_pro', 'Lisensi Berbayar', 'Akses penuh seluruh modul teknis konstruksi & BAP tanpa batasan waktu', array['info-proyek', 'rekap-rab', 'detail-rab', 'volume', 'ahsp', 'katalog', 'sumberdaya', 'kurva-s', 'kalender', 'koreksi', 'bap', 'proposal', 'proyek', 'auth-license', 'cloud-sync'], 9999, true, true, true),
  ('admin', 'Administrator Sistem', 'Akses penuh sistem dan panel pengelolaan member', array['info-proyek', 'rekap-rab', 'detail-rab', 'volume', 'ahsp', 'katalog', 'sumberdaya', 'kurva-s', 'kalender', 'koreksi', 'bap', 'proposal', 'proyek', 'auth-license', 'cloud-sync'], 9999, true, true, true)
on conflict (tier_id) do update set
  name = excluded.name,
  description = excluded.description,
  allowed_menus = excluded.allowed_menus,
  max_projects = excluded.max_projects,
  can_custom_ahsp = excluded.can_custom_ahsp,
  can_bap_termin = excluded.can_bap_termin,
  can_export_all = excluded.can_export_all;

-- ------------------------------------------------------------------------------
-- 2. TABEL PROFIL PENGGUNA (USER PROFILES) DENGAN KODE ACAK 3 DIGIT
-- ------------------------------------------------------------------------------
create table if not exists public.user_profiles (

  id uuid primary key,
  email text not null,
  full_name text,
  avatar_url text,
  unique_code integer not null default floor(random() * 900 + 100)::int,
  role text not null default 'free_trial' references public.member_tiers(tier_id),
  plan_type text not null default 'STANDAR_FREE',
  status text not null default 'ACTIVE',
  allowed_features jsonb default '{"canExportAll": true, "canCustomAhsp": false, "canBapTermin": false}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create unique index if not exists user_profiles_email_idx on public.user_profiles (lower(trim(email)));

-- Pastikan kolom id default gen_random_uuid dan constraint unique pada email selalu ada
do 
begin
  alter table public.user_profiles alter column id set default gen_random_uuid();
  if not exists (select 1 from pg_constraint where conname = 'user_profiles_email_key') then
    alter table public.user_profiles add constraint user_profiles_email_key unique (email);
  end if;
end ;


-- Pastikan kolom unique_code ada jika tabel sudah pernah dibuat sebelumnya
do $$
begin
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='user_profiles' and column_name='unique_code') then
    alter table public.user_profiles add column unique_code integer default floor(random() * 900 + 100)::int;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='user_profiles' and column_name='plan_type') then
    alter table public.user_profiles add column plan_type text default 'STANDAR_FREE';
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='user_profiles' and column_name='allowed_features') then
    alter table public.user_profiles add column allowed_features jsonb default '{"canExportAll": true, "canCustomAhsp": false, "canBapTermin": false}'::jsonb;
  end if;
end $$;

-- ------------------------------------------------------------------------------
-- 3. TABEL KUNCI KOLABORASI REAL-TIME (GOOGLE SHEET STYLE LOCK)
-- ------------------------------------------------------------------------------
create table if not exists public.collaboration_locks (
  project_id text primary key,
  project_name text,
  locked_by_email text not null,
  locked_by_name text,
  client_instance_id text,
  is_locked boolean not null default true,
  last_heartbeat timestamptz not null default now(),
  version integer not null default 1,
  project_data jsonb,
  updated_at timestamptz default now()
);

-- ------------------------------------------------------------------------------
-- 4. TABEL PESANAN & PEMBAYARAN (BILLING ORDERS)
-- ------------------------------------------------------------------------------
create table if not exists public.billing_orders (
  id serial primary key,
  order_id text unique not null,
  user_email text not null,
  user_name text,
  amount numeric not null,
  unique_code integer,
  status text not null default 'PENDING_VERIFICATION',
  created_at timestamptz default now(),
  verified_at timestamptz,
  notes text
);

-- ------------------------------------------------------------------------------
-- 5. TABEL DOMAIN LOCK & MASTER SECRETS
-- ------------------------------------------------------------------------------
create table if not exists public.app_domain_locks (
  id serial primary key,
  domain text unique not null,
  is_active boolean default true,
  notes text,
  created_at timestamptz default now()
);

insert into public.app_domain_locks (domain, is_active, notes)
values
  ('rab.dutamik.id', true, 'Domain Utama Produksi'),
  ('dutamik.id', true, 'Domain Induk Agensi'),
  ('localhost', true, 'Lingkungan Pengujian Lokal')
on conflict (domain) do update set
  is_active = excluded.is_active;

create table if not exists public.system_secrets (
  id uuid default gen_random_uuid() primary key,
  secret_key text unique not null,
  secret_hash text not null,
  description text,
  created_at timestamptz default now()
);

insert into public.system_secrets (secret_key, secret_hash, description)
values
  ('admin_master_passcode', '4d02994612948232fb18bb34df323a62a83e6bcd7e86d9df21ce1d55d86093eb', 'Master passkey hash untuk verifikasi akses admin Surabaya123')
on conflict (secret_key) do update set
  secret_hash = excluded.secret_hash;

-- ------------------------------------------------------------------------------
-- 6. TRIGGER OTOMATIS SAAT USER LOGIN / DAFTAR DENGAN GOOGLE
-- ------------------------------------------------------------------------------
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_random_code integer;
  v_user_name text;
  v_avatar text;
begin
  -- Buat angka 3 digit acak unik (100 sampai 999)
  v_random_code := floor(random() * (999 - 100 + 1) + 100)::int;

  v_user_name := coalesce(
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'name',
    split_part(new.email, '@', 1)
  );

  v_avatar := coalesce(
    new.raw_user_meta_data->>'avatar_url',
    new.raw_user_meta_data->>'picture',
    ''
  );

  insert into public.user_profiles (
    id,
    email,
    full_name,
    avatar_url,
    unique_code,
    role,
    plan_type,
    status,
    allowed_features,
    created_at,
    updated_at
  )
  values (
    new.id,
    new.email,
    v_user_name,
    v_avatar,
    v_random_code,
    'free_trial',
    'STANDAR_FREE',
    'ACTIVE',
    '{"canExportAll": true, "canCustomAhsp": false, "canBapTermin": false}'::jsonb,
    now(),
    now()
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = coalesce(excluded.full_name, public.user_profiles.full_name),
    avatar_url = coalesce(excluded.avatar_url, public.user_profiles.avatar_url),
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- Backfill data akun yang sebelumnya sudah ada di auth.users tetapi belum masuk ke user_profiles
insert into public.user_profiles (id, email, full_name, avatar_url, unique_code, role, plan_type, status, created_at, updated_at)
select 
  u.id,
  u.email,
  coalesce(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', split_part(u.email, '@', 1)),
  coalesce(u.raw_user_meta_data->>'avatar_url', u.raw_user_meta_data->>'picture', ''),
  floor(random() * (999 - 100 + 1) + 100)::int,
  'free_trial',
  'STANDAR_FREE',
  'ACTIVE',
  now(),
  now()
from auth.users u
where not exists (select 1 from public.user_profiles p where p.id = u.id)
on conflict (id) do nothing;

-- ------------------------------------------------------------------------------
-- 7. SISTEM SINKRONISASI KOLABORASI REAL-TIME (GOOGLE SHEET LOCK)
-- ------------------------------------------------------------------------------
create or replace function public.acquire_project_lock(
  p_project_id text,
  p_project_name text,
  p_user_email text,
  p_user_name text,
  p_instance_id text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_lock record;
  v_now timestamptz := now();
  v_timeout_seconds int := 30; -- Timeout 30 detik tanpa heartbeat otomatis dianggap idle
begin
  select * into v_lock from public.collaboration_locks where project_id = p_project_id for update;

  if not found then
    insert into public.collaboration_locks (
      project_id, project_name, locked_by_email, locked_by_name, client_instance_id, is_locked, last_heartbeat, version, updated_at
    ) values (
      p_project_id, p_project_name, p_user_email, p_user_name, p_instance_id, true, v_now, 1, v_now
    );
    return jsonb_build_object('success', true, 'action', 'acquired', 'is_locked_by_me', true, 'version', 1);
  end if;

  -- Jika lock dipegang oleh instance yang sama, perbarui heartbeat
  if v_lock.client_instance_id = p_instance_id or v_lock.locked_by_email = p_user_email then
    update public.collaboration_locks
    set is_locked = true, last_heartbeat = v_now, updated_at = v_now
    where project_id = p_project_id;
    return jsonb_build_object('success', true, 'action', 'heartbeat_renewed', 'is_locked_by_me', true, 'version', v_lock.version);
  end if;

  -- Jika lock sebelumnya sudah kadaluarsa (lebih dari 30 detik tanpa heartbeat)
  if v_lock.is_locked = false or (extract(epoch from (v_now - v_lock.last_heartbeat)) > v_timeout_seconds) then
    update public.collaboration_locks
    set locked_by_email = p_user_email,
        locked_by_name = p_user_name,
        client_instance_id = p_instance_id,
        is_locked = true,
        last_heartbeat = v_now,
        updated_at = v_now
    where project_id = p_project_id;
    return jsonb_build_object('success', true, 'action', 'lock_stolen_expired', 'is_locked_by_me', true, 'version', v_lock.version);
  end if;

  -- Jika masih aktif disunting oleh PC/User lain: TOLAK input PC B
  return jsonb_build_object(
    'success', false,
    'action', 'blocked',
    'is_locked_by_me', false,
    'locked_by_email', v_lock.locked_by_email,
    'locked_by_name', v_lock.locked_by_name,
    'version', v_lock.version,
    'project_data', v_lock.project_data,
    'seconds_since_heartbeat', round(extract(epoch from (v_now - v_lock.last_heartbeat)))
  );
end;
$$;

create or replace function public.release_project_lock(
  p_project_id text,
  p_instance_id text,
  p_project_data jsonb default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_lock record;
  v_now timestamptz := now();
begin
  select * into v_lock from public.collaboration_locks where project_id = p_project_id;

  if not found then
    return jsonb_build_object('success', true, 'message', 'Lock tidak ditemukan');
  end if;

  if v_lock.client_instance_id = p_instance_id then
    update public.collaboration_locks
    set is_locked = false,
        last_heartbeat = v_now,
        version = v_lock.version + 1,
        project_data = coalesce(p_project_data, v_lock.project_data),
        updated_at = v_now
    where project_id = p_project_id;

    return jsonb_build_object('success', true, 'action', 'released', 'version', v_lock.version + 1);
  end if;

  return jsonb_build_object('success', false, 'message', 'Bukan pemilik lock saat ini');
end;
$$;

create or replace function public.check_project_sync_state(
  p_project_id text,
  p_my_instance_id text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_lock record;
  v_now timestamptz := now();
begin
  select * into v_lock from public.collaboration_locks where project_id = p_project_id;
  if not found then
    return jsonb_build_object('exists', false, 'is_locked', false);
  end if;

  -- Cek timeout
  if v_lock.is_locked and (extract(epoch from (v_now - v_lock.last_heartbeat)) > 30) then
    update public.collaboration_locks set is_locked = false where project_id = p_project_id;
    v_lock.is_locked := false;
  end if;

  return jsonb_build_object(
    'exists', true,
    'is_locked', v_lock.is_locked,
    'is_locked_by_me', (v_lock.client_instance_id = p_my_instance_id),
    'locked_by_email', v_lock.locked_by_email,
    'locked_by_name', v_lock.locked_by_name,
    'version', v_lock.version,
    'project_data', v_lock.project_data,
    'updated_at', v_lock.updated_at
  );
end;
$$;

-- ------------------------------------------------------------------------------
-- 8. FUNGSI ADMIN LENGKAP DENGAN SECRET KEY 'Surabaya123'
-- ------------------------------------------------------------------------------
create or replace function public.verify_admin_secret(passcode text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  matched_key text := null;
begin
  if passcode = 'Surabaya123' or passcode = '4d02994612948232fb18bb34df323a62a83e6bcd7e86d9df21ce1d55d86093eb' then
    matched_key := 'admin_master_passcode';
  else
    select secret_key into matched_key from public.system_secrets
    where secret_key = 'admin_master_passcode' and secret_hash = passcode;
  end if;

  if matched_key is not null then
    return jsonb_build_object('success', true, 'role', 'admin', 'message', 'Passkey admin terverifikasi');
  else
    return jsonb_build_object('success', false, 'role', null, 'message', 'Passkey admin tidak valid');
  end if;
end;
$$;

create or replace function public.admin_list_all_members(passcode text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  computed_hash text;
  matched_key text;
  v_users jsonb;
begin
  if passcode = 'Surabaya123' or passcode = '4d02994612948232fb18bb34df323a62a83e6bcd7e86d9df21ce1d55d86093eb' then
    matched_key := 'admin_master_passcode';
  else
    select secret_key into matched_key from public.system_secrets
    where secret_key = 'admin_master_passcode' and secret_hash = passcode;
  end if;

  if matched_key is null then
    return jsonb_build_object('success', false, 'message', 'Akses ditolak: Passkey salah');
  end if;

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
  ) order by p.created_at desc), '[]'::jsonb)
  into v_users from public.user_profiles p;

  return jsonb_build_object('success', true, 'data', v_users);
end;
$$;

create or replace function public.admin_update_member_role(
  passcode text,
  target_user_id uuid,
  new_role text,
  new_status text default 'ACTIVE',
  new_features jsonb default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  computed_hash text;
  matched_key text;
  v_plan text;
begin
  if passcode = 'Surabaya123' or passcode = '4d02994612948232fb18bb34df323a62a83e6bcd7e86d9df21ce1d55d86093eb' then
    matched_key := 'admin_master_passcode';
  else
    select secret_key into matched_key from public.system_secrets
    where secret_key = 'admin_master_passcode' and secret_hash = passcode;
  end if;

  if matched_key is null then
    return jsonb_build_object('success', false, 'message', 'Akses ditolak: Passkey salah');
  end if;

  v_plan := case 
    when new_role in ('estimator_pro', 'admin') then 'LIFETIME'
    else 'STANDAR_FREE'
  end;

  update public.user_profiles
  set role = new_role,
      plan_type = v_plan,
      status = coalesce(new_status, 'ACTIVE'),
      allowed_features = coalesce(new_features, allowed_features),
      updated_at = now()
  where id = target_user_id;

  return jsonb_build_object('success', true, 'message', 'Data member berhasil diperbarui');
end;
$$;

create or replace function public.admin_delete_member(
  passcode text,
  target_user_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  computed_hash text;
  matched_key text;
begin
  if passcode = 'Surabaya123' or passcode = '4d02994612948232fb18bb34df323a62a83e6bcd7e86d9df21ce1d55d86093eb' then
    matched_key := 'admin_master_passcode';
  else
    select secret_key into matched_key from public.system_secrets
    where secret_key = 'admin_master_passcode' and secret_hash = passcode;
  end if;

  if matched_key is null then
    return jsonb_build_object('success', false, 'message', 'Akses ditolak: Passkey salah');
  end if;

  delete from public.user_profiles where id = target_user_id;
  return jsonb_build_object('success', true, 'message', 'Member berhasil dihapus dari sistem');
end;
$$;

create or replace function public.admin_add_manual_member(
  passcode text,
  p_email text,
  p_name text,
  p_role text default 'free_trial',
  p_features jsonb default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  computed_hash text;
  matched_key text;
  v_new_id uuid := gen_random_uuid();
  v_code integer;
begin
  if passcode = 'Surabaya123' or passcode = '4d02994612948232fb18bb34df323a62a83e6bcd7e86d9df21ce1d55d86093eb' then
    matched_key := 'admin_master_passcode';
  else
    select secret_key into matched_key from public.system_secrets
    where secret_key = 'admin_master_passcode' and secret_hash = passcode;
  end if;

  if matched_key is null then
    return jsonb_build_object('success', false, 'message', 'Akses ditolak: Passkey salah');
  end if;

  v_code := floor(random() * (999 - 100 + 1) + 100)::int;

  insert into public.user_profiles (id, email, full_name, unique_code, role, plan_type, status, allowed_features)
  values (
    v_new_id,
    p_email,
    p_name,
    v_code,
    p_role,
    case when p_role in ('estimator_pro', 'admin') then 'LIFETIME' else 'STANDAR_FREE' end,
    'ACTIVE',
    coalesce(p_features, '{"canExportAll": true, "canCustomAhsp": true, "canBapTermin": true}'::jsonb)
  );

  return jsonb_build_object('success', true, 'message', 'Member manual berhasil ditambahkan', 'id', v_new_id, 'unique_code', v_code);
end;
$$;

-- ------------------------------------------------------------------------------
-- 9. KEBIJAKAN ROW LEVEL SECURITY (RLS) TINGKAT TINGGI
-- ------------------------------------------------------------------------------
alter table public.member_tiers enable row level security;
alter table public.user_profiles enable row level security;
alter table public.collaboration_locks enable row level security;
alter table public.app_domain_locks enable row level security;
alter table public.system_secrets enable row level security;
alter table public.billing_orders enable row level security;

-- Hapus kebijakan lama
drop policy if exists "Tiers viewable by authenticated" on public.member_tiers;
drop policy if exists "Tiers viewable by everyone" on public.member_tiers;
drop policy if exists "Users can only read own profile" on public.user_profiles;
drop policy if exists "Users can update own basic info" on public.user_profiles;
drop policy if exists "Users can read profiles" on public.user_profiles;
drop policy if exists "Users can insert profiles" on public.user_profiles;
drop policy if exists "Users can update profiles" on public.user_profiles;
drop policy if exists "Locks manageable by authenticated" on public.collaboration_locks;
drop policy if exists "Billing orders readable by owner" on public.billing_orders;
drop policy if exists "Billing orders readable by everyone" on public.billing_orders;
drop policy if exists "Billing orders insertable" on public.billing_orders;
drop policy if exists "Billing orders updateable" on public.billing_orders;

-- Tiers: Siapa saja bisa baca tier (publik)
create policy "Tiers viewable by everyone" on public.member_tiers
  for select using (true);

-- User Profiles: Anon & Authenticated dapat membaca profil berdasarkan email
create policy "Users can read profiles" on public.user_profiles
  for select using (true);

-- User Profiles: Anon & Authenticated dapat mendaftarkan profil baru
create policy "Users can insert profiles" on public.user_profiles
  for insert with check (true);

-- User Profiles: Pembaruan profil dasar
create policy "Users can update profiles" on public.user_profiles
  for update using (true);

create policy "Users can delete profiles" on public.user_profiles
  for delete using (true);

-- Collaboration Locks: Terbuka untuk koordinasi multi-perangkat user terautentikasi
create policy "Locks manageable by authenticated" on public.collaboration_locks
  for all using (true) with check (true);

-- Billing orders: Terbuka untuk pembuatan order dan verifikasi
create policy "Billing orders readable by everyone" on public.billing_orders
  for select using (true);

create policy "Billing orders insertable" on public.billing_orders
  for insert with check (true);

create policy "Billing orders updateable" on public.billing_orders
  for update using (true);

-- Revoke akses tabel sensitif dari anonim publik
revoke all on public.system_secrets from anon, authenticated;

-- Berikan izin akses tabel ke anon dan authenticated
grant select on public.member_tiers to anon, authenticated;
grant select, insert, update, delete on public.user_profiles to anon, authenticated;
grant select, insert, update on public.billing_orders to anon, authenticated;
grant select, insert, update, delete on public.collaboration_locks to anon, authenticated;

-- Berikan izin eksekusi RPC fungsi
grant execute on function public.verify_admin_secret(text) to anon, authenticated;
grant execute on function public.admin_list_all_members(text) to anon, authenticated;
grant execute on function public.admin_update_member_role(text, uuid, text, text, jsonb) to anon, authenticated;
grant execute on function public.admin_delete_member(text, uuid) to anon, authenticated;
grant execute on function public.admin_add_manual_member(text, text, text, text, jsonb) to anon, authenticated;
grant execute on function public.acquire_project_lock(text, text, text, text, text) to anon, authenticated;
grant execute on function public.release_project_lock(text, text, jsonb) to anon, authenticated;
grant execute on function public.check_project_sync_state(text, text) to anon, authenticated;

-- 10. RPC PROFILE GET OR CREATE DENGAN KODE 3 DIGIT OTOMATIS
-- ------------------------------------------------------------------------------
create or replace function public.get_or_create_user_profile(
  p_email text,
  p_full_name text default null,
  p_avatar_url text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user record;
  v_random_code integer;
begin
  select * into v_user from public.user_profiles where lower(email) = lower(p_email);
  if found then
    return jsonb_build_object(
      'id', v_user.id,
      'email', v_user.email,
      'full_name', v_user.full_name,
      'avatar_url', v_user.avatar_url,
      'unique_code', v_user.unique_code,
      'role', v_user.role,
      'plan_type', v_user.plan_type,
      'status', v_user.status,
      'allowed_features', v_user.allowed_features
    );
  end if;

  v_random_code := floor(random() * (999 - 100 + 1) + 100)::int;
  insert into public.user_profiles (
    id, email, full_name, avatar_url, unique_code, role, plan_type, status, allowed_features
  ) values (
    gen_random_uuid(), p_email, coalesce(p_full_name, split_part(p_email, '@', 1)), coalesce(p_avatar_url, ''),
    v_random_code, 'free_trial', 'STANDAR_FREE', 'ACTIVE',
    '{"canExportAll": true, "canCustomAhsp": false, "canBapTermin": false}'::jsonb
  )
  returning * into v_user;

  return jsonb_build_object(
    'id', v_user.id,
    'email', v_user.email,
    'full_name', v_user.full_name,
    'avatar_url', v_user.avatar_url,
    'unique_code', v_user.unique_code,
    'role', v_user.role,
    'plan_type', v_user.plan_type,
    'status', v_user.status,
    'allowed_features', v_user.allowed_features
  );
end;
$$;

grant execute on function public.get_or_create_user_profile(text, text, text) to anon, authenticated;

-- ------------------------------------------------------------------------------
-- 11. RPC ADMIN WORKSPACE GATEWAY DENGAN SECRET KEY Surabaya123
-- ------------------------------------------------------------------------------
create or replace function public.admin_workspace_gateway(
  passcode text,
  action text,
  payload jsonb default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  computed_hash text;
  matched_key text;
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
  v_domain text;
  v_order_id text;
begin
  if passcode = 'Surabaya123' or passcode = '4d02994612948232fb18bb34df323a62a83e6bcd7e86d9df21ce1d55d86093eb' then
    matched_key := 'admin_master_passcode';
  else
    select secret_key into matched_key from public.system_secrets
    where secret_key = 'admin_master_passcode' and secret_hash = passcode;
  end if;

  if matched_key is null then
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
      'tiers', v_tiers,
      'users', v_users,
      'domains', v_domains,
      'orders', v_orders
    );

  elsif action = 'save_tier' then
    update public.member_tiers
    set allowed_menus = (select array_agg(x) from jsonb_array_elements_text(payload->'allowed_menus') t(x))
    where tier_id = payload->>'tier_id';
    return jsonb_build_object('success', true, 'message', 'Tier berhasil disimpan');

  elsif action = 'save_user_role' then
    v_target_user_id := (payload->>'user_id')::uuid;
    v_new_role := payload->>'role';
    v_new_status := coalesce(payload->>'status', 'ACTIVE');
    v_features := payload->'allowed_features';

    update public.user_profiles
    set role = v_new_role,
        status = v_new_status,
        plan_type = case when v_new_role in ('estimator_pro', 'admin') then 'LIFETIME' else 'STANDAR_FREE' end,
        allowed_features = coalesce(v_features, allowed_features),
        updated_at = now()
    where id = v_target_user_id;
    return jsonb_build_object('success', true, 'message', 'Peran member berhasil disimpan');

  elsif action = 'delete_user' then
    v_target_user_id := (payload->>'user_id')::uuid;
    delete from public.user_profiles where id = v_target_user_id;
    return jsonb_build_object('success', true, 'message', 'Member berhasil dihapus');

  elsif action = 'add_user' then
    v_email := lower(trim(payload->>'email'));
    v_name := coalesce(payload->>'full_name', split_part(v_email, '@', 1));
    v_new_role := coalesce(payload->>'role', 'free_trial');
    v_random_code := floor(random() * (999 - 100 + 1) + 100)::int;

    insert into public.user_profiles (id, email, full_name, unique_code, role, plan_type, status, allowed_features)
    values (
      gen_random_uuid(),
      v_email,
      v_name,
      v_random_code,
      v_new_role,
      case when v_new_role in ('estimator_pro', 'admin') then 'LIFETIME' else 'STANDAR_FREE' end,
      'ACTIVE',
      coalesce(payload->'allowed_features', '{"canExportAll": true, "canCustomAhsp": true, "canBapTermin": true}'::jsonb)
    );
    return jsonb_build_object('success', true, 'message', 'Member baru berhasil ditambahkan', 'unique_code', v_random_code);

  elsif action = 'toggle_domain' then
    update public.app_domain_locks
    set is_active = (payload->>'is_active')::boolean
    where id = (payload->>'id')::integer;
    return jsonb_build_object('success', true, 'message', 'Status domain berhasil diubah');

  elsif action = 'add_domain' then
    insert into public.app_domain_locks (domain, is_active, notes)
    values (payload->>'domain', true, payload->>'notes');
    return jsonb_build_object('success', true, 'message', 'Domain berhasil ditambahkan');

  elsif action = 'approve_order' then
    v_order_id := payload->>'order_id';
    update public.billing_orders
    set status = 'APPROVED', verified_at = now()
    where order_id = v_order_id
    returning user_email into v_email;

    if v_email is not null then
      update public.user_profiles
      set role = 'estimator_pro', plan_type = 'LIFETIME', status = 'ACTIVE', updated_at = now()
      where lower(email) = lower(v_email);
    end if;
    return jsonb_build_object('success', true, 'message', 'Order disetujui & lisensi diaktifkan');

  elsif action = 'reject_order' then
    update public.billing_orders
    set status = 'REJECTED'
    where order_id = payload->>'order_id';
    return jsonb_build_object('success', true, 'message', 'Order ditolak');

  elsif action = 'update_passcode' then
    update public.system_secrets
    set secret_hash = encode(digest(payload->>'new_passcode', 'sha256'), 'hex')
    where secret_key = 'admin_master_passcode';
    return jsonb_build_object('success', true, 'message', 'Kunci rahasia berhasil diperbarui');

  else
    return jsonb_build_object('success', false, 'message', 'Aksi tidak dikenal');
  end if;
end;
$$;

grant execute on function public.admin_workspace_gateway(text, text, jsonb) to anon, authenticated;

-- ------------------------------------------------------------------------------
-- SEED ADMINISTRATOR RESMI
-- ------------------------------------------------------------------------------
insert into public.user_profiles (id, email, full_name, role, plan_type, status, unique_code, allowed_features)
values
  (gen_random_uuid(), 'mivakhorim@gmail.com', 'M Iva Khorim', 'admin', 'LIFETIME', 'ACTIVE', 754, '{"canExportAll": true, "canCustomAhsp": true, "canBapTermin": true}'::jsonb),
  (gen_random_uuid(), 'dutadigitalagensi@gmail.com', 'Duta Digital Agensi', 'admin', 'LIFETIME', 'ACTIVE', 714, '{"canExportAll": true, "canCustomAhsp": true, "canBapTermin": true}'::jsonb)
on conflict (email) do update set
  role = 'admin',
  plan_type = 'LIFETIME',
  status = 'ACTIVE',
  allowed_features = '{"canExportAll": true, "canCustomAhsp": true, "canBapTermin": true}'::jsonb;
