import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { createProduct, updateProduct, getProductById } from '../../hooks/useProducts';
import { useImageUpload } from '../../hooks/useImageUpload';
import { productSchema } from '../../lib/validators';
import Toast from '../ui/Toast';
import ImageUploader from './ImageUploader';
import type { Category, Brand, ProductWithRelations } from '../../lib/types';

interface ProductFormProps {
  productId?: string; /* If set, it's an edit */
}

export default function ProductForm({ productId }: ProductFormProps) {
  const isEdit = !!productId;

  const [form, setForm] = useState({
    name: '',
    description: '',
    short_description: '',
    price: 0,
    compare_at_price: null as number | null,
    stock: 0,
    sku: '',
    category_id: '',
    brand_id: '',
    status: 'draft' as const,
    specifications: {} as Record<string, string | number | boolean>,
    weight_kg: null as number | null,
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [existingProduct, setExistingProduct] = useState<ProductWithRelations | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  /* Spec editor state */
  const [specKey, setSpecKey] = useState('');
  const [specValue, setSpecValue] = useState('');

  const { previews, addFiles, removePreview, uploadAll, reset: resetImages } = useImageUpload();

  /* Load categories, brands, and product if editing */
  useEffect(() => {
    const loadData = async () => {
      try {
        const [catRes, brandRes] = await Promise.all([
          supabase.from('categories').select('*').eq('is_active', true).order('name'),
          supabase.from('brands').select('*').eq('is_active', true).order('name'),
        ]);

        setCategories((catRes.data as Category[]) || []);
        setBrands((brandRes.data as Brand[]) || []);

        if (productId) {
          const product = await getProductById(productId);
          if (product) {
            setExistingProduct(product);
            setForm({
              name: product.name,
              description: product.description || '',
              short_description: product.short_description || '',
              price: product.price,
              compare_at_price: product.compare_at_price,
              stock: product.stock,
              sku: product.sku || '',
              category_id: product.category_id || '',
              brand_id: product.brand_id || '',
              status: product.status,
              specifications: product.specifications || {},
              weight_kg: product.weight_kg,
            });
          }
        }
      } catch (err) {
        console.error('Error loading form data:', err);
      } finally {
        setLoadingData(false);
      }
    };

    loadData();
  }, [productId]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? 0 : parseFloat(value)) : value,
    }));
    /* Clear field error on change */
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const addSpec = () => {
    if (!specKey.trim()) return;
    setForm((prev) => ({
      ...prev,
      specifications: { ...prev.specifications, [specKey.trim()]: specValue.trim() },
    }));
    setSpecKey('');
    setSpecValue('');
  };

  const removeSpec = (key: string) => {
    setForm((prev) => {
      const specs = { ...prev.specifications };
      delete specs[key];
      return { ...prev, specifications: specs };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});

    /* Validate */
    const result = productSchema.safeParse(form);
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as string;
        if (!errors[field]) errors[field] = issue.message;
      });
      setFieldErrors(errors);
      return;
    }

    setSaving(true);
    try {
      const productData: Record<string, any> = {
        ...form,
        category_id: form.category_id || null,
        brand_id: form.brand_id || null,
        sku: form.sku || null,
      };

      let targetId: string;

      if (isEdit && productId) {
        await updateProduct(productId, productData);
        targetId = productId;
      } else {
        targetId = await createProduct(productData);
      }

      /* Upload new images */
      if (previews.length > 0) {
        const paths = await uploadAll(targetId);
        /* Save image records in DB */
        const imageRecords = paths.map((path, index) => ({
          product_id: targetId,
          storage_path: path,
          display_order: (existingProduct?.images?.length || 0) + index,
          is_primary: !existingProduct?.images?.length && index === 0,
        }));

        if (imageRecords.length > 0) {
          const { error: imgError } = await supabase
            .from('product_images')
            .insert(imageRecords);
          if (imgError) throw imgError;
        }
      }

      setToast({
        message: isEdit ? 'Producto actualizado exitosamente' : 'Producto creado exitosamente',
        type: 'success',
      });

      /* Redirect after brief delay */
      setTimeout(() => {
        window.location.href = '/dashboard/products';
      }, 1200);
    } catch (err: any) {
      setToast({ message: `Error: ${err.message}`, type: 'error' });
      setSaving(false);
    }
  };

  if (loadingData) {
    return (
      <div className="animate-fade-in space-y-6">
        <div className="h-8 w-48 rounded-lg animate-pulse" style={{ background: 'rgba(148, 163, 184, 0.1)' }} />
        <div className="glass-card p-6 space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-24 rounded animate-pulse" style={{ background: 'rgba(148, 163, 184, 0.1)' }} />
              <div className="h-10 rounded-lg animate-pulse" style={{ background: 'rgba(148, 163, 184, 0.06)' }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <a
          href="/dashboard/products"
          className="p-2 rounded-xl transition-colors"
          style={{ color: '#94a3b8', border: '1px solid rgba(148, 163, 184, 0.15)' }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(51, 65, 85, 0.4)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </a>
        <div>
          <h2 className="text-xl font-bold text-white">
            {isEdit ? 'Editar Producto' : 'Nuevo Producto'}
          </h2>
          <p className="text-sm" style={{ color: '#64748b' }}>
            {isEdit ? `Editando: ${existingProduct?.name}` : 'Completa la información del producto'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ── Main column ── */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic info */}
            <div className="glass-card p-6 space-y-4">
              <h3 className="text-sm font-semibold text-white mb-2">Información Básica</h3>

              <div>
                <label htmlFor="product-name" className="input-label">Nombre *</label>
                <input
                  id="product-name"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Ej: AMD Ryzen 7 7800X3D"
                  className={`input-field ${fieldErrors.name ? 'input-error' : ''}`}
                />
                {fieldErrors.name && <p className="error-text">{fieldErrors.name}</p>}
              </div>

              <div>
                <label htmlFor="product-short-desc" className="input-label">Descripción corta</label>
                <input
                  id="product-short-desc"
                  name="short_description"
                  value={form.short_description}
                  onChange={handleChange}
                  placeholder="Breve resumen para listados"
                  className={`input-field ${fieldErrors.short_description ? 'input-error' : ''}`}
                  maxLength={300}
                />
                {fieldErrors.short_description && <p className="error-text">{fieldErrors.short_description}</p>}
              </div>

              <div>
                <label htmlFor="product-desc" className="input-label">Descripción completa</label>
                <textarea
                  id="product-desc"
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Describe las características del producto..."
                  className="input-field min-h-[120px] resize-y"
                  rows={5}
                />
              </div>
            </div>

            {/* Pricing & Stock */}
            <div className="glass-card p-6 space-y-4">
              <h3 className="text-sm font-semibold text-white mb-2">Precio e Inventario</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="product-price" className="input-label">Precio (USD) *</label>
                  <input
                    id="product-price"
                    name="price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.price}
                    onChange={handleChange}
                    className={`input-field ${fieldErrors.price ? 'input-error' : ''}`}
                  />
                  {fieldErrors.price && <p className="error-text">{fieldErrors.price}</p>}
                </div>

                <div>
                  <label htmlFor="product-compare-price" className="input-label">Precio anterior (tachado)</label>
                  <input
                    id="product-compare-price"
                    name="compare_at_price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.compare_at_price ?? ''}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        compare_at_price: e.target.value ? parseFloat(e.target.value) : null,
                      }))
                    }
                    className="input-field"
                    placeholder="Opcional"
                  />
                </div>

                <div>
                  <label htmlFor="product-stock" className="input-label">Stock *</label>
                  <input
                    id="product-stock"
                    name="stock"
                    type="number"
                    min="0"
                    step="1"
                    value={form.stock}
                    onChange={handleChange}
                    className={`input-field ${fieldErrors.stock ? 'input-error' : ''}`}
                  />
                  {fieldErrors.stock && <p className="error-text">{fieldErrors.stock}</p>}
                </div>

                <div>
                  <label htmlFor="product-sku" className="input-label">SKU</label>
                  <input
                    id="product-sku"
                    name="sku"
                    value={form.sku}
                    onChange={handleChange}
                    placeholder="Ej: AMD-R7-7800X3D"
                    className="input-field font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Images */}
            <div className="glass-card p-6">
              <ImageUploader
                productId={productId}
                existingImages={existingProduct?.images || []}
              />
            </div>

            {/* Specifications */}
            <div className="glass-card p-6">
              <h3 className="text-sm font-semibold text-white mb-4">Especificaciones Técnicas</h3>

              {/* Existing specs */}
              {Object.entries(form.specifications).length > 0 && (
                <div className="space-y-2 mb-4">
                  {Object.entries(form.specifications).map(([key, value]) => (
                    <div
                      key={key}
                      className="flex items-center justify-between px-3 py-2 rounded-lg"
                      style={{ background: 'rgba(15, 23, 42, 0.5)', border: '1px solid rgba(148, 163, 184, 0.08)' }}
                    >
                      <div>
                        <span className="text-xs font-medium" style={{ color: '#94a3b8' }}>{key}:</span>
                        <span className="text-sm text-white ml-2">{String(value)}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeSpec(key)}
                        className="p-1 rounded transition-colors"
                        style={{ color: '#64748b' }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = '#f87171')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = '#64748b')}
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add spec */}
              <div className="flex gap-2">
                <input
                  value={specKey}
                  onChange={(e) => setSpecKey(e.target.value)}
                  placeholder="Ej: Socket"
                  className="input-field flex-1"
                />
                <input
                  value={specValue}
                  onChange={(e) => setSpecValue(e.target.value)}
                  placeholder="Ej: AM5"
                  className="input-field flex-1"
                />
                <button type="button" onClick={addSpec} className="btn-secondary shrink-0">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* ── Side column ── */}
          <div className="space-y-6">
            {/* Status & Publish */}
            <div className="glass-card p-6 space-y-4">
              <h3 className="text-sm font-semibold text-white mb-2">Publicación</h3>

              <div>
                <label htmlFor="product-status" className="input-label">Estado</label>
                <select
                  id="product-status"
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  className="input-field"
                >
                  <option value="draft">Borrador</option>
                  <option value="active">Activo</option>
                  <option value="archived">Archivado</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="btn-primary w-full justify-center py-3"
                id="product-submit-btn"
              >
                {saving ? (
                  <>
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Guardando...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    {isEdit ? 'Guardar Cambios' : 'Crear Producto'}
                  </>
                )}
              </button>
            </div>

            {/* Organization */}
            <div className="glass-card p-6 space-y-4">
              <h3 className="text-sm font-semibold text-white mb-2">Organización</h3>

              <div>
                <label htmlFor="product-category" className="input-label">Categoría</label>
                <select
                  id="product-category"
                  name="category_id"
                  value={form.category_id}
                  onChange={handleChange}
                  className="input-field"
                >
                  <option value="">Sin categoría</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="product-brand" className="input-label">Marca</label>
                <select
                  id="product-brand"
                  name="brand_id"
                  value={form.brand_id}
                  onChange={handleChange}
                  className="input-field"
                >
                  <option value="">Sin marca</option>
                  {brands.map((brand) => (
                    <option key={brand.id} value={brand.id}>{brand.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="product-weight" className="input-label">Peso (kg)</label>
                <input
                  id="product-weight"
                  name="weight_kg"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.weight_kg ?? ''}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      weight_kg: e.target.value ? parseFloat(e.target.value) : null,
                    }))
                  }
                  className="input-field"
                  placeholder="Opcional"
                />
              </div>
            </div>
          </div>
        </div>
      </form>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}
