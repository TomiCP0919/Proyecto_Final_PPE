-- =========================
-- TABLA: brands
-- Marcas de productos
-- =========================

create table if not exists public.brands (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  logo_url text,
  is_active boolean not null default true,
  created_at timestamptz default now()
);