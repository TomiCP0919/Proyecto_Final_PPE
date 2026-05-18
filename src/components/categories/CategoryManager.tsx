import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { categorySchema, brandSchema } from '../../lib/validators';
import ConfirmDialog from '../ui/ConfirmDialog';
import Toast from '../ui/Toast';
import type { Category, Brand } from '../../lib/types';

export default function CategoryManager() {
  const [activeTab, setActiveTab] = useState<'categories' | 'brands'>('categories');
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState(''); // Only for Category
  const [logoUrl, setLogoUrl] = useState(''); // Only for Brand
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Delete states
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'category' | 'brand'; item: Category | Brand } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const fetchCategories = useCallback(async () => {
    const { data } = await supabase.from('categories').select('*').order('name');
    setCategories((data as Category[]) || []);
  }, []);

  const fetchBrands = useCallback(async () => {
    const { data } = await supabase.from('brands').select('*').order('name');
    setBrands((data as Brand[]) || []);
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchCategories(), fetchBrands()]);
    setLoading(false);
  }, [fetchCategories, fetchBrands]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const resetForm = () => {
    setName('');
    setDescription('');
    setLogoUrl('');
    setEditingId(null);
    setErrors({});
  };

  const startEditCategory = (cat: Category) => {
    setName(cat.name);
    setDescription(cat.description || '');
    setEditingId(cat.id);
    setErrors({});
  };

  const startEditBrand = (brand: Brand) => {
    setName(brand.name);
    setLogoUrl(brand.logo_url || '');
    setEditingId(brand.id);
    setErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (activeTab === 'categories') {
      const result = categorySchema.safeParse({ name, description });
      if (!result.success) {
        const errs: Record<string, string> = {};
        result.error.issues.forEach(i => {
          errs[i.path[0] as string] = i.message;
        });
        setErrors(errs);
        return;
      }

      setSaving(true);
      try {
        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        if (editingId) {
          const { error } = await supabase
            .from('categories')
            .update({ name, slug, description: description || null })
            .eq('id', editingId);
          if (error) throw error;
          setToast({ message: 'Categoría actualizada correctamente', type: 'success' });
        } else {
          const { error } = await supabase
            .from('categories')
            .insert({ name, slug, description: description || null, is_active: true });
          if (error) throw error;
          setToast({ message: 'Categoría creada correctamente', type: 'success' });
        }
        resetForm();
        fetchCategories();
      } catch (err: any) {
        setToast({ message: err.message, type: 'error' });
      } finally {
        setSaving(false);
      }
    } else {
      // Brands tab
      const result = brandSchema.safeParse({ name, logo_url: logoUrl || null });
      if (!result.success) {
        const errs: Record<string, string> = {};
        result.error.issues.forEach(i => {
          errs[i.path[0] as string] = i.message;
        });
        setErrors(errs);
        return;
      }

      setSaving(true);
      try {
        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        if (editingId) {
          const { error } = await supabase
            .from('brands')
            .update({ name, slug, logo_url: logoUrl || null })
            .eq('id', editingId);
          if (error) throw error;
          setToast({ message: 'Marca actualizada correctamente', type: 'success' });
        } else {
          const { error } = await supabase
            .from('brands')
            .insert({ name, slug, logo_url: logoUrl || null, is_active: true });
          if (error) throw error;
          setToast({ message: 'Marca creada correctamente', type: 'success' });
        }
        resetForm();
        fetchBrands();
      } catch (err: any) {
        setToast({ message: err.message, type: 'error' });
      } finally {
        setSaving(false);
      }
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const { type, item } = deleteTarget;
      if (type === 'category') {
        const { error } = await supabase.from('categories').delete().eq('id', item.id);
        if (error) throw error;
        setToast({ message: `Categoría "${item.name}" eliminada`, type: 'success' });
        fetchCategories();
      } else {
        const { error } = await supabase.from('brands').delete().eq('id', item.id);
        if (error) throw error;
        setToast({ message: `Marca "${item.name}" eliminada`, type: 'success' });
        fetchBrands();
      }
      setDeleteTarget(null);
    } catch (err: any) {
      setToast({ message: err.message, type: 'error' });
    } finally {
      setDeleting(false);
    }
  };

  const toggleCategoryActive = async (cat: Category) => {
    const { error } = await supabase
      .from('categories')
      .update({ is_active: !cat.is_active })
      .eq('id', cat.id);
    if (!error) fetchCategories();
  };

  const toggleBrandActive = async (brand: Brand) => {
    const { error } = await supabase
      .from('brands')
      .update({ is_active: !brand.is_active })
      .eq('id', brand.id);
    if (!error) fetchBrands();
  };

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-white">Categorías y Marcas</h2>
          <p className="text-sm mt-0.5" style={{ color: '#64748b' }}>
            Gestiona las clasificaciones y marcas de tus productos
          </p>
        </div>

        {/* Beautiful Pill-based Tab Selector */}
        <div className="flex space-x-1 bg-[#1e293b]/40 p-1 rounded-xl border border-[#334155]/20 backdrop-blur-sm self-start md:self-auto">
          <button
            onClick={() => {
              setActiveTab('categories');
              resetForm();
            }}
            className={`px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all duration-300 ${
              activeTab === 'categories'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20'
                : 'text-slate-400 hover:text-white hover:bg-[#334155]/30'
            }`}
          >
            Categorías
          </button>
          <button
            onClick={() => {
              setActiveTab('brands');
              resetForm();
            }}
            className={`px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all duration-300 ${
              activeTab === 'brands'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20'
                : 'text-slate-400 hover:text-white hover:bg-[#334155]/30'
            }`}
          >
            Marcas
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Column */}
        <div className="glass-card p-6 h-fit">
          <h3 className="text-sm font-semibold text-white mb-4">
            {editingId
              ? `Editar ${activeTab === 'categories' ? 'Categoría' : 'Marca'}`
              : `Nueva ${activeTab === 'categories' ? 'Categoría' : 'Marca'}`}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="input-label">Nombre *</label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder={activeTab === 'categories' ? 'Ej: Procesadores' : 'Ej: Asus'}
                className={`input-field ${errors.name ? 'input-error' : ''}`}
                id="manager-name-input"
              />
              {errors.name && <p className="error-text">{errors.name}</p>}
            </div>

            {activeTab === 'categories' ? (
              <div>
                <label className="input-label">Descripción</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Descripción opcional..."
                  className="input-field resize-y"
                  rows={3}
                />
                {errors.description && <p className="error-text">{errors.description}</p>}
              </div>
            ) : (
              <div>
                <label className="input-label">URL del Logo</label>
                <input
                  type="url"
                  value={logoUrl}
                  onChange={e => setLogoUrl(e.target.value)}
                  placeholder="https://ejemplo.com/logo.png (Opcional)"
                  className={`input-field ${errors.logo_url ? 'input-error' : ''}`}
                  id="manager-logo-input"
                />
                {errors.logo_url && <p className="error-text">{errors.logo_url}</p>}
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="btn-primary flex-1 justify-center"
                id="manager-submit-btn"
              >
                {saving ? 'Guardando...' : editingId ? 'Actualizar' : 'Crear'}
              </button>
              {editingId && (
                <button type="button" onClick={resetForm} className="btn-secondary">
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </div>

        {/* List Column */}
        <div className="lg:col-span-2 glass-card overflow-hidden">
          <div className="overflow-x-auto">
            {activeTab === 'categories' ? (
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(148,163,184,0.1)' }}>
                    <th className="text-left px-4 py-3 font-medium" style={{ color: '#64748b' }}>
                      Nombre
                    </th>
                    <th className="text-left px-4 py-3 font-medium" style={{ color: '#64748b' }}>
                      Estado
                    </th>
                    <th className="text-right px-4 py-3 font-medium" style={{ color: '#64748b' }}>
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid rgba(148,163,184,0.06)' }}>
                        {[1, 2, 3, 4].map(j => (
                          <td key={j} className="px-4 py-3">
                            <div
                              className="h-4 rounded animate-pulse"
                              style={{
                                background: 'rgba(148,163,184,0.1)',
                                width: `${50 + Math.random() * 50}%`,
                              }}
                            />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : categories.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-12" style={{ color: '#64748b' }}>
                        No hay categorías cargadas
                      </td>
                    </tr>
                  ) : (
                    categories.map(cat => (
                      <tr key={cat.id} style={{ borderBottom: '1px solid rgba(148,163,184,0.06)' }}>
                        <td className="px-4 py-3">
                          <p className="font-medium text-white">{cat.name}</p>
                          {cat.description && (
                            <p className="text-xs mt-0.5 truncate max-w-[200px]" style={{ color: '#64748b' }}>
                              {cat.description}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => toggleCategoryActive(cat)}
                            className={cat.is_active ? 'status-badge status-active' : 'status-badge status-archived'}
                          >
                            {cat.is_active ? 'Activa' : 'Inactiva'}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-1">
                            <button
                              onClick={() => startEditCategory(cat)}
                              className="p-2 rounded-lg transition-colors"
                              style={{ color: '#94a3b8' }}
                              title="Editar"
                              onMouseEnter={e => {
                                e.currentTarget.style.background = 'rgba(59,130,246,0.1)';
                                e.currentTarget.style.color = '#60a5fa';
                              }}
                              onMouseLeave={e => {
                                e.currentTarget.style.background = 'transparent';
                                e.currentTarget.style.color = '#94a3b8';
                              }}
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => setDeleteTarget({ type: 'category', item: cat })}
                              className="p-2 rounded-lg transition-colors"
                              style={{ color: '#94a3b8' }}
                              title="Eliminar"
                              onMouseEnter={e => {
                                e.currentTarget.style.background = 'rgba(239,68,68,0.1)';
                                e.currentTarget.style.color = '#f87171';
                              }}
                              onMouseLeave={e => {
                                e.currentTarget.style.background = 'transparent';
                                e.currentTarget.style.color = '#94a3b8';
                              }}
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(148,163,184,0.1)' }}>
                    <th className="text-left px-4 py-3 font-medium" style={{ color: '#64748b' }}>
                      Marca
                    </th>
                    <th className="text-left px-4 py-3 font-medium" style={{ color: '#64748b' }}>
                      Estado
                    </th>
                    <th className="text-right px-4 py-3 font-medium" style={{ color: '#64748b' }}>
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid rgba(148,163,184,0.06)' }}>
                        {[1, 2, 3, 4].map(j => (
                          <td key={j} className="px-4 py-3">
                            <div
                              className="h-4 rounded animate-pulse"
                              style={{
                                background: 'rgba(148,163,184,0.1)',
                                width: `${50 + Math.random() * 50}%`,
                              }}
                            />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : brands.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-12" style={{ color: '#64748b' }}>
                        No hay marcas cargadas
                      </td>
                    </tr>
                  ) : (
                    brands.map(brand => (
                      <tr key={brand.id} style={{ borderBottom: '1px solid rgba(148,163,184,0.06)' }}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden flex-shrink-0">
                              {brand.logo_url ? (
                                <img
                                  src={brand.logo_url}
                                  alt={brand.name}
                                  className="w-full h-full object-contain p-1"
                                  onError={e => {
                                    e.currentTarget.style.display = 'none';
                                    const sibling = e.currentTarget.nextElementSibling as HTMLElement;
                                    if (sibling) sibling.style.display = 'block';
                                  }}
                                />
                              ) : null}
                              <span
                                className="text-xs font-semibold text-slate-400"
                                style={{ display: brand.logo_url ? 'none' : 'block' }}
                              >
                                {brand.name.slice(0, 2).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-white">{brand.name}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => toggleBrandActive(brand)}
                            className={brand.is_active ? 'status-badge status-active' : 'status-badge status-archived'}
                          >
                            {brand.is_active ? 'Activa' : 'Inactiva'}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-1">
                            <button
                              onClick={() => startEditBrand(brand)}
                              className="p-2 rounded-lg transition-colors"
                              style={{ color: '#94a3b8' }}
                              title="Editar"
                              onMouseEnter={e => {
                                e.currentTarget.style.background = 'rgba(59,130,246,0.1)';
                                e.currentTarget.style.color = '#60a5fa';
                              }}
                              onMouseLeave={e => {
                                e.currentTarget.style.background = 'transparent';
                                e.currentTarget.style.color = '#94a3b8';
                              }}
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => setDeleteTarget({ type: 'brand', item: brand })}
                              className="p-2 rounded-lg transition-colors"
                              style={{ color: '#94a3b8' }}
                              title="Eliminar"
                              onMouseEnter={e => {
                                e.currentTarget.style.background = 'rgba(239,68,68,0.1)';
                                e.currentTarget.style.color = '#f87171';
                              }}
                              onMouseLeave={e => {
                                e.currentTarget.style.background = 'transparent';
                                e.currentTarget.style.color = '#94a3b8';
                              }}
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        title={deleteTarget?.type === 'category' ? 'Eliminar categoría' : 'Eliminar marca'}
        message={
          deleteTarget?.type === 'category' ? (
            <>
              ¿Eliminar la categoría <strong>{deleteTarget?.item.name}</strong>? Los productos asociados perderán esta
              categoría.
            </>
          ) : (
            <>
              ¿Eliminar la marca <strong>{deleteTarget?.item.name}</strong>? Los productos asociados perderán esta marca.
            </>
          )
        }
        confirmLabel="Eliminar"
        variant="danger"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
