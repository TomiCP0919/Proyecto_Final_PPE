import { supabase } from './supabase';

const BUCKET = 'product-images';

/**
 * Upload an image file to Supabase Storage.
 * Path format: product-images/{productId}/{uuid}.webp
 */
export async function uploadProductImage(
  productId: string,
  file: File
): Promise<string> {
  const fileExt = file.name.split('.').pop() || 'webp';
  const fileName = `${crypto.randomUUID()}.${fileExt}`;
  const filePath = `${productId}/${fileName}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) throw error;
  return filePath;
}

/**
 * Delete an image from Supabase Storage.
 */
export async function deleteProductImage(storagePath: string): Promise<void> {
  const { error } = await supabase.storage.from(BUCKET).remove([storagePath]);
  if (error) throw error;
}

/**
 * Get the public URL for an image in storage.
 */
export function getImageUrl(storagePath: string): string {
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
  return data.publicUrl;
}

/**
 * Delete all images for a product (cleanup on product delete).
 */
export async function deleteAllProductImages(
  productId: string
): Promise<void> {
  const { data: files, error: listError } = await supabase.storage
    .from(BUCKET)
    .list(productId);

  if (listError) throw listError;

  if (files && files.length > 0) {
    const paths = files.map((f) => `${productId}/${f.name}`);
    const { error } = await supabase.storage.from(BUCKET).remove(paths);
    if (error) throw error;
  }
}
