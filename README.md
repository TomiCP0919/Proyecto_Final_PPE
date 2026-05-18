## Configuración de Supabase

La base de datos del proyecto usa Supabase con las siguientes tablas:

- `profiles`: usuarios administrativos y roles.
- `categories`: categorías de productos.
- `brands`: marcas de productos.
- `products`: productos del e-commerce.
- `product_images`: imágenes asociadas a cada producto.

Los scripts SQL se encuentran en la carpeta `database/`.

## Orden de ejecución recomendado en Supabase

1. `profiles.sql`
2. `categories.sql`
3. `brands.sql`
4. `products.sql`
5. `product_images.sql`
6. `seed.sql`
7. Crear bucket público `product-images`
8. `policies.sql`
9. `storage-policies.sql`

## Variables de entorno

Cada integrante debe crear un archivo `.env` tomando como base `.env.example`.

Ejemplo:

PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
PUBLIC_SUPABASE_ANON_KEY=tu_clave_publica

Estos datos se encuentran en Supabase:

Project Settings → API

Importante: el archivo `.env` no debe subirse a GitHub.