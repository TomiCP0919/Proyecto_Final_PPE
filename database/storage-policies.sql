-- =========================
-- STORAGE POLICIES
-- Bucket requerido: product-images
-- =========================

drop policy if exists "Lectura publica del bucket product-images" on storage.objects;

create policy "Lectura publica del bucket product-images"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'product-images');

drop policy if exists "Admins y editores suben imagenes a product-images" on storage.objects;

create policy "Admins y editores suben imagenes a product-images"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'product-images'
  and public.has_admin_access()
);

drop policy if exists "Admins y editores actualizan imagenes de product-images" on storage.objects;

create policy "Admins y editores actualizan imagenes de product-images"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'product-images'
  and public.has_admin_access()
)
with check (
  bucket_id = 'product-images'
  and public.has_admin_access()
);

drop policy if exists "Admins y editores eliminan imagenes de product-images" on storage.objects;

create policy "Admins y editores eliminan imagenes de product-images"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'product-images'
  and public.has_admin_access()
);