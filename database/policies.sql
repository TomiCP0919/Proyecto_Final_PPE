-- =========================
-- ACTIVAR RLS
-- =========================

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.brands enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;

-- =========================
-- FUNCIONES DE SEGURIDAD
-- =========================

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
    and role = 'admin'
  );
$$;

create or replace function public.has_admin_access()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
    and role in ('admin', 'editor')
  );
$$;

-- =========================
-- POLÍTICAS: profiles
-- =========================

drop policy if exists "Usuarios ven su propio perfil" on public.profiles;

create policy "Usuarios ven su propio perfil"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

drop policy if exists "Admins ven todos los perfiles" on public.profiles;

create policy "Admins ven todos los perfiles"
on public.profiles
for select
to authenticated
using (public.is_admin());

drop policy if exists "Admins gestionan perfiles" on public.profiles;

create policy "Admins gestionan perfiles"
on public.profiles
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- =========================
-- POLÍTICAS: categories
-- =========================

drop policy if exists "Lectura publica de categorias activas" on public.categories;

create policy "Lectura publica de categorias activas"
on public.categories
for select
to anon, authenticated
using (is_active = true);

drop policy if exists "Admins y editores gestionan categorias" on public.categories;

create policy "Admins y editores gestionan categorias"
on public.categories
for all
to authenticated
using (public.has_admin_access())
with check (public.has_admin_access());

-- =========================
-- POLÍTICAS: brands
-- =========================

drop policy if exists "Lectura publica de marcas activas" on public.brands;

create policy "Lectura publica de marcas activas"
on public.brands
for select
to anon, authenticated
using (is_active = true);

drop policy if exists "Admins y editores gestionan marcas" on public.brands;

create policy "Admins y editores gestionan marcas"
on public.brands
for all
to authenticated
using (public.has_admin_access())
with check (public.has_admin_access());

-- =========================
-- POLÍTICAS: products
-- =========================

drop policy if exists "Lectura publica de productos activos" on public.products;

create policy "Lectura publica de productos activos"
on public.products
for select
to anon, authenticated
using (status = 'active');

drop policy if exists "Admins y editores ven todos los productos" on public.products;

create policy "Admins y editores ven todos los productos"
on public.products
for select
to authenticated
using (public.has_admin_access());

drop policy if exists "Admins y editores crean productos" on public.products;

create policy "Admins y editores crean productos"
on public.products
for insert
to authenticated
with check (public.has_admin_access());

drop policy if exists "Admins y editores actualizan productos" on public.products;

create policy "Admins y editores actualizan productos"
on public.products
for update
to authenticated
using (public.has_admin_access())
with check (public.has_admin_access());

drop policy if exists "Admins y editores eliminan productos" on public.products;

create policy "Admins y editores eliminan productos"
on public.products
for delete
to authenticated
using (public.has_admin_access());

-- =========================
-- POLÍTICAS: product_images
-- =========================

drop policy if exists "Lectura publica de imagenes de productos activos" on public.product_images;

create policy "Lectura publica de imagenes de productos activos"
on public.product_images
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.products
    where products.id = product_images.product_id
    and products.status = 'active'
  )
);

drop policy if exists "Admins y editores ven todas las imagenes" on public.product_images;

create policy "Admins y editores ven todas las imagenes"
on public.product_images
for select
to authenticated
using (public.has_admin_access());

drop policy if exists "Admins y editores crean imagenes" on public.product_images;

create policy "Admins y editores crean imagenes"
on public.product_images
for insert
to authenticated
with check (public.has_admin_access());

drop policy if exists "Admins y editores actualizan imagenes" on public.product_images;

create policy "Admins y editores actualizan imagenes"
on public.product_images
for update
to authenticated
using (public.has_admin_access())
with check (public.has_admin_access());

drop policy if exists "Admins y editores eliminan imagenes" on public.product_images;

create policy "Admins y editores eliminan imagenes"
on public.product_images
for delete
to authenticated
using (public.has_admin_access());