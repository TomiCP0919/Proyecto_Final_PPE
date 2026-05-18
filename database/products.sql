-- =========================
-- TABLA: products
-- Productos principales del e-commerce
-- =========================

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),

  name text not null,
  slug text not null unique,
  description text,
  short_description text,

  price numeric(12, 2) not null check (price >= 0),

  compare_at_price numeric(12, 2) check (
    compare_at_price is null or compare_at_price >= price
  ),

  stock integer not null default 0 check (stock >= 0),

  sku text unique,

  category_id uuid references public.categories(id) on delete set null,
  brand_id uuid references public.brands(id) on delete set null,

  status text not null default 'draft' check (status in ('draft', 'active', 'archived')),

  specifications jsonb default '{}'::jsonb,

  weight_kg numeric(10, 2) check (
    weight_kg is null or weight_kg >= 0
  ),

  created_by uuid references public.profiles(id) on delete set null,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- =========================
-- ÍNDICES
-- =========================

create index if not exists idx_products_category_id
on public.products(category_id);

create index if not exists idx_products_brand_id
on public.products(brand_id);

create index if not exists idx_products_status
on public.products(status);

create index if not exists idx_products_price
on public.products(price);

create index if not exists idx_products_stock
on public.products(stock);

create index if not exists idx_products_created_at
on public.products(created_at);

-- =========================
-- TRIGGER: products updated_at
-- =========================

drop trigger if exists set_products_updated_at on public.products;

create trigger set_products_updated_at
before update on public.products
for each row
execute function public.set_updated_at();