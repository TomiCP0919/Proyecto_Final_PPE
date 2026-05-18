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
  full_name text,
  role text not null default 'editor' check (role in ('admin', 'editor')),
  avatar_url text,
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