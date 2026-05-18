-- =========================
-- SEED: categories
-- =========================

insert into public.categories (name, slug, description)
values
('Procesadores', 'procesadores', 'CPUs para gaming, productividad y estaciones de trabajo'),
('Tarjetas Gráficas', 'tarjetas-graficas', 'GPUs para gaming, renderizado, IA y diseño'),
('Teclados', 'teclados', 'Teclados mecánicos, inalámbricos y gamers'),
('Monitores', 'monitores', 'Pantallas para gaming, diseño y productividad'),
('Almacenamiento', 'almacenamiento', 'SSD, NVMe y discos de alto rendimiento')
on conflict (slug) do nothing;

-- =========================
-- SEED: brands
-- =========================

insert into public.brands (name, slug, logo_url)
values
('AMD', 'amd', null),
('Intel', 'intel', null),
('NVIDIA', 'nvidia', null),
('Keychron', 'keychron', null),
('Logitech', 'logitech', null),
('Samsung', 'samsung', null),
('Western Digital', 'western-digital', null)
on conflict (slug) do nothing;

-- =========================
-- SEED: products
-- =========================

insert into public.products (
  name,
  slug,
  description,
  short_description,
  price,
  compare_at_price,
  stock,
  sku,
  category_id,
  brand_id,
  status,
  specifications,
  weight_kg
)
values
(
  'AMD Ryzen 7 7800X3D',
  'amd-ryzen-7-7800x3d',
  'Procesador de alto rendimiento ideal para gaming competitivo, streaming y tareas exigentes.',
  'CPU gaming AM5 con tecnología 3D V-Cache.',
  389.99,
  449.99,
  12,
  'CPU-AMD-7800X3D',
  (select id from public.categories where slug = 'procesadores'),
  (select id from public.brands where slug = 'amd'),
  'active',
  '{"nucleos": 8, "hilos": 16, "frecuencia_base": "4.2 GHz", "socket": "AM5", "consumo": "120W"}',
  0.10
),
(
  'Intel Core i7-14700K',
  'intel-core-i7-14700k',
  'Procesador potente para gaming, creación de contenido, productividad avanzada y multitarea.',
  'CPU Intel de alto rendimiento para gaming y productividad.',
  419.99,
  469.99,
  9,
  'CPU-INTEL-14700K',
  (select id from public.categories where slug = 'procesadores'),
  (select id from public.brands where slug = 'intel'),
  'active',
  '{"nucleos": 20, "hilos": 28, "frecuencia_maxima": "5.6 GHz", "socket": "LGA1700", "consumo": "125W"}',
  0.12
),
(
  'NVIDIA GeForce RTX 4070 Super',
  'nvidia-geforce-rtx-4070-super',
  'Tarjeta gráfica para gaming en 1440p, creación de contenido, renderizado e inteligencia artificial.',
  'GPU potente para gaming 1440p e IA.',
  599.99,
  649.99,
  7,
  'GPU-NVIDIA-RTX4070S',
  (select id from public.categories where slug = 'tarjetas-graficas'),
  (select id from public.brands where slug = 'nvidia'),
  'active',
  '{"vram": "12GB GDDR6X", "consumo": "220W", "resolucion_recomendada": "1440p", "ray_tracing": true}',
  1.20
),
(
  'AMD Radeon RX 7800 XT',
  'amd-radeon-rx-7800-xt',
  'GPU potente para gaming en alta resolución con gran relación calidad-precio.',
  'GPU AMD con 16GB de VRAM para 1440p.',
  499.99,
  549.99,
  6,
  'GPU-AMD-RX7800XT',
  (select id from public.categories where slug = 'tarjetas-graficas'),
  (select id from public.brands where slug = 'amd'),
  'active',
  '{"vram": "16GB GDDR6", "consumo": "263W", "resolucion_recomendada": "1440p", "ray_tracing": true}',
  1.40
),
(
  'Keychron K2 Pro',
  'keychron-k2-pro',
  'Teclado mecánico compacto inalámbrico ideal para programación, productividad y escritura diaria.',
  'Teclado mecánico 75% inalámbrico.',
  129.99,
  149.99,
  20,
  'KEY-KEYCHRON-K2PRO',
  (select id from public.categories where slug = 'teclados'),
  (select id from public.brands where slug = 'keychron'),
  'active',
  '{"tipo": "mecanico", "switches": "brown", "layout": "75%", "conexion": "Bluetooth/USB-C", "rgb": true}',
  0.90
),
(
  'Logitech G Pro X TKL',
  'logitech-g-pro-x-tkl',
  'Teclado gamer profesional de formato TKL con respuesta rápida para entornos competitivos.',
  'Teclado TKL competitivo inalámbrico.',
  149.99,
  179.99,
  15,
  'KEY-LOGITECH-GPROXTKL',
  (select id from public.categories where slug = 'teclados'),
  (select id from public.brands where slug = 'logitech'),
  'active',
  '{"tipo": "mecanico", "switches": "GX", "layout": "TKL", "conexion": "inalambrico", "rgb": true}',
  0.85
),
(
  'Samsung Odyssey G5 27',
  'samsung-odyssey-g5-27',
  'Monitor curvo de 27 pulgadas para gaming fluido en alta resolución.',
  'Monitor gaming curvo QHD de 165Hz.',
  279.99,
  329.99,
  10,
  'MON-SAMSUNG-G5-27',
  (select id from public.categories where slug = 'monitores'),
  (select id from public.brands where slug = 'samsung'),
  'active',
  '{"pulgadas": 27, "resolucion": "2560x1440", "hz": 165, "panel": "VA", "curvo": true}',
  4.50
),
(
  'WD Black SN850X 1TB',
  'wd-black-sn850x-1tb',
  'SSD NVMe Gen4 de alto rendimiento para gaming, edición y cargas rápidas.',
  'SSD NVMe Gen4 de 1TB.',
  109.99,
  139.99,
  25,
  'SSD-WD-SN850X-1TB',
  (select id from public.categories where slug = 'almacenamiento'),
  (select id from public.brands where slug = 'western-digital'),
  'active',
  '{"capacidad": "1TB", "tipo": "NVMe Gen4", "lectura": "7300 MB/s", "formato": "M.2"}',
  0.05
)
on conflict (slug) do nothing;

-- =========================
-- SEED: product_images
-- Se usan imágenes placeholder.
-- Luego el admin podrá subir imágenes reales a Supabase Storage.
-- =========================

insert into public.product_images (
  product_id,
  storage_path,
  alt_text,
  display_order,
  is_primary
)
values
(
  (select id from public.products where slug = 'amd-ryzen-7-7800x3d'),
  'https://placehold.co/800x600?text=Ryzen+7+7800X3D',
  'AMD Ryzen 7 7800X3D',
  0,
  true
),
(
  (select id from public.products where slug = 'intel-core-i7-14700k'),
  'https://placehold.co/800x600?text=Intel+Core+i7',
  'Intel Core i7 14700K',
  0,
  true
),
(
  (select id from public.products where slug = 'nvidia-geforce-rtx-4070-super'),
  'https://placehold.co/800x600?text=RTX+4070+Super',
  'NVIDIA GeForce RTX 4070 Super',
  0,
  true
),
(
  (select id from public.products where slug = 'amd-radeon-rx-7800-xt'),
  'https://placehold.co/800x600?text=RX+7800+XT',
  'AMD Radeon RX 7800 XT',
  0,
  true
),
(
  (select id from public.products where slug = 'keychron-k2-pro'),
  'https://placehold.co/800x600?text=Keychron+K2+Pro',
  'Keychron K2 Pro',
  0,
  true
),
(
  (select id from public.products where slug = 'logitech-g-pro-x-tkl'),
  'https://placehold.co/800x600?text=Logitech+G+Pro+X',
  'Logitech G Pro X TKL',
  0,
  true
),
(
  (select id from public.products where slug = 'samsung-odyssey-g5-27'),
  'https://placehold.co/800x600?text=Samsung+Odyssey+G5',
  'Samsung Odyssey G5 27',
  0,
  true
),
(
  (select id from public.products where slug = 'wd-black-sn850x-1tb'),
  'https://placehold.co/800x600?text=WD+Black+SN850X',
  'WD Black SN850X 1TB',
  0,
  true
)
on conflict do nothing;