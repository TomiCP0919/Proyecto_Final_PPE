import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { ProductWithRelations } from '../lib/types';

interface UseProductsOptions {
  page?: number;
  pageSize?: number;
  search?: string;
  categoryId?: string;
  status?: string;
}

interface UseProductsReturn {
  products: ProductWithRelations[];
  loading: boolean;
  error: string | null;
  totalCount: number;
  totalPages: number;
  refetch: () => void;
}

export function useProducts(options: UseProductsOptions = {}): UseProductsReturn {
  const { page = 1, pageSize = 10, search = '', categoryId, status } = options;

  const [products, setProducts] = useState<ProductWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      /* Build query */
      let query = supabase
        .from('products')
        .select(
          '*, category:categories(*), brand:brands(*), images:product_images(*)',
          { count: 'exact' }
        )
        .order('created_at', { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1);

      /* Apply filters */
      if (search) {
        query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%`);
      }

      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error: fetchError, count } = await query;

      if (fetchError) throw fetchError;

      setProducts((data as unknown as ProductWithRelations[]) || []);
      setTotalCount(count || 0);
    } catch (err: any) {
      setError(err.message || 'Error al cargar productos');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, categoryId, status]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return {
    products,
    loading,
    error,
    totalCount,
    totalPages: Math.ceil(totalCount / pageSize),
    refetch: fetchProducts,
  };
}

/**
 * Fetch a single product by ID with all relations.
 */
export async function getProductById(
  id: string
): Promise<ProductWithRelations | null> {
  const { data, error } = await supabase
    .from('products')
    .select(
      '*, category:categories(*), brand:brands(*), images:product_images(*)'
    )
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching product:', error.message);
    return null;
  }

  return data as unknown as ProductWithRelations;
}

/**
 * Create a new product.
 */
export async function createProduct(
  productData: Record<string, any>
): Promise<string> {
  /* Generate slug from name */
  const slug = productData.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  const { data, error } = await supabase
    .from('products')
    .insert({ ...productData, slug })
    .select('id')
    .single();

  if (error) throw error;
  return data.id;
}

/**
 * Update an existing product.
 */
export async function updateProduct(
  id: string,
  productData: Record<string, any>
): Promise<void> {
  const updatePayload: Record<string, any> = {
    ...productData,
    updated_at: new Date().toISOString(),
  };

  /* Regenerate slug if name changed */
  if (productData.name) {
    updatePayload.slug = productData.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  const { error } = await supabase
    .from('products')
    .update(updatePayload)
    .eq('id', id);

  if (error) throw error;
}

/**
 * Delete a product.
 */
export async function deleteProduct(id: string): Promise<void> {
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) throw error;
}
