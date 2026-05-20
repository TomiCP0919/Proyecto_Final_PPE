-- =========================
-- EXTENSIONES
-- =========================

create extension if not exists "pgcrypto";

-- =========================
-- TABLA: profiles
-- Usuarios administrativos del sistema
-- =========================

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  full_name text default 'Usuario pendiente',
  role text default 'editor' check (role is null or role in ('admin', 'editor')),
  approval_status text not null default 'pending' check (approval_status in ('pending', 'approved', 'rejected')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- =========================
-- FUNCIÓN PARA ACTUALIZAR updated_at
-- =========================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =========================
-- TRIGGER: profiles updated_at
-- =========================

drop trigger if exists set_profiles_updated_at on public.profiles;

create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

-- =========================
-- FUNCIÓN: normalizar estado del perfil
-- =========================

create or replace function public.normalize_profile_status()
returns trigger
language plpgsql
as $$
begin
  -- Si el usuario está rechazado, queda sin rol y con nombre claro
  if new.approval_status = 'rejected' then
    new.role := null;
    new.full_name := 'Usuario rechazado';
  end if;

  -- Si el usuario está pendiente, asegurar nombre de espera
  if new.approval_status = 'pending' then
    if new.full_name is null or btrim(new.full_name) = '' then
      new.full_name := 'Usuario pendiente';
    end if;
  end if;

  -- Si el usuario está aprobado como admin
  if new.approval_status = 'approved' and new.role = 'admin' then
    new.full_name := 'Administrador TechHub';
  end if;

  -- Si el usuario está aprobado como editor
  if new.approval_status = 'approved' and new.role = 'editor' then
    new.full_name := 'Editor TechHub';
  end if;

  return new;
end;
$$;

-- =========================
-- TRIGGER: normalizar estado del perfil
-- =========================

drop trigger if exists normalize_profile_status on public.profiles;

create trigger normalize_profile_status
before insert or update on public.profiles
for each row
execute function public.normalize_profile_status();

-- =========================
-- FUNCIÓN: crear profile pendiente al registrarse
-- =========================

create or replace function public.handle_new_admin_signup()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    email,
    full_name,
    role,
    approval_status
  )
  values (
    new.id,
    new.email,
    coalesce(
      nullif(new.raw_user_meta_data->>'full_name', ''),
      'Usuario pendiente'
    ),
    'editor',
    'pending'
  )
  on conflict (id) do update
  set 
    email = coalesce(public.profiles.email, excluded.email),
    full_name = case
      when public.profiles.full_name is null or btrim(public.profiles.full_name) = ''
      then excluded.full_name
      else public.profiles.full_name
    end;

  return new;
end;
$$;

-- =========================
-- TRIGGER: crear profile al registrarse en auth.users
-- =========================

drop trigger if exists on_auth_user_created_create_profile on auth.users;

create trigger on_auth_user_created_create_profile
after insert on auth.users
for each row
execute function public.handle_new_admin_signup();