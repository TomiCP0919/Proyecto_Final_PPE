-- =========================
-- TABLA: product_images
-- Imágenes asociadas a productos
-- =========================

create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),

  product_id uuid not null references public.products(id) on delete cascade,

  storage_path text not null,
  alt_text text,
  display_order integer not null default 0,
  is_primary boolean not null default false,

  created_at timestamptz default now()
);

-- =========================
-- ÍNDICES
-- =========================

create index if not exists idx_product_images_product_id
on public.product_images(product_id);

create index if not exists idx_product_images_is_primary
on public.product_images(is_primary);

-- Solo permite una imagen principal por producto
create unique index if not exists unique_primary_image_per_product
on public.product_images(product_id)
where is_primary = true;