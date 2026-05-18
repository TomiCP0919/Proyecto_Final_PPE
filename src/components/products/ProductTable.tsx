import { useState } from 'react';
import { useProducts, deleteProduct } from '../../hooks/useProducts';
import { deleteAllProductImages } from '../../lib/storage';
import { getImageUrl } from '../../lib/storage';
import ConfirmDialog from '../ui/ConfirmDialog';
import Toast from '../ui/Toast';
import type { ProductWithRelations } from '../../lib/types';

export default function ProductTable() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<ProductWithRelations | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const { products, loading, error, totalCount, totalPages, refetch } = useProducts({
    page,
    pageSize: 10,
    search,
    status: statusFilter || undefined,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteAllProductImages(deleteTarget.id);
      await deleteProduct(deleteTarget.id);
      setToast({ message: `"${deleteTarget.name}" eliminado exitosamente`, type: 'success' });
      setDeleteTarget(null);
      refetch();
    } catch (err: any) {
      setToast({ message: `Error al eliminar: ${err.message}`, type: 'error' });
    } finally {
      setDeleting(false);
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'active': return 'status-badge status-active';
      case 'draft': return 'status-badge status-draft';
      case 'archived': return 'status-badge status-archived';
      default: return 'status-badge';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Activo';
      case 'draft': return 'Borrador';
      case 'archived': return 'Archivado';
      default: return status;
    }
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('es-CR', { style: 'currency', currency: 'USD' }).format(price);

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-white">Productos</h2>
          <p className="text-sm mt-0.5" style={{ color: '#64748b' }}>
            {totalCount} producto{totalCount !== 1 ? 's' : ''} en total
          </p>
        </div>
        <a href="/dashboard/products/new" className="btn-primary" id="new-product-btn">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Nuevo Producto
        </a>
      </div>

      {/* Filters */}
      <div className="glass-card p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <form onSubmit={handleSearch} className="flex-1 flex gap-2">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Buscar por nombre o SKU..."
              className="input-field flex-1"
              id="product-search-input"
            />
            <button type="submit" className="btn-secondary shrink-0">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Buscar
            </button>
          </form>

          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="input-field sm:w-44"
            id="product-status-filter"
          >
            <option value="">Todos los estados</option>
            <option value="active">Activo</option>
            <option value="draft">Borrador</option>
            <option value="archived">Archivado</option>
          </select>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="glass-card p-4 mb-6 text-sm" style={{ borderColor: 'rgba(239, 68, 68, 0.3)', color: '#fca5a5' }}>
          {error}
        </div>
      )}

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(148, 163, 184, 0.1)' }}>
                <th className="text-left px-4 py-3 font-medium" style={{ color: '#64748b' }}>Producto</th>
                <th className="text-left px-4 py-3 font-medium hidden md:table-cell" style={{ color: '#64748b' }}>SKU</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: '#64748b' }}>Precio</th>
                <th className="text-left px-4 py-3 font-medium hidden sm:table-cell" style={{ color: '#64748b' }}>Stock</th>
                <th className="text-left px-4 py-3 font-medium hidden lg:table-cell" style={{ color: '#64748b' }}>Categoría</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: '#64748b' }}>Estado</th>
                <th className="text-right px-4 py-3 font-medium" style={{ color: '#64748b' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(148, 163, 184, 0.06)' }}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 rounded-md animate-pulse" style={{ background: 'rgba(148, 163, 184, 0.1)', width: `${60 + Math.random() * 40}%` }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12" style={{ color: '#64748b' }}>
                    <svg className="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    <p className="font-medium">No se encontraron productos</p>
                    <p className="text-xs mt-1">Intenta cambiar los filtros o crea uno nuevo</p>
                  </td>
                </tr>
              ) : (
                products.map((product) => {
                  const primaryImage = product.images?.find((img) => img.is_primary) || product.images?.[0];
                  return (
                    <tr
                      key={product.id}
                      className="transition-colors duration-150"
                      style={{ borderBottom: '1px solid rgba(148, 163, 184, 0.06)' }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(148, 163, 184, 0.04)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-lg overflow-hidden shrink-0 flex items-center justify-center"
                            style={{ background: 'rgba(148, 163, 184, 0.08)' }}
                          >
                            {primaryImage ? (
                              <img
                                src={getImageUrl(primaryImage.storage_path)}
                                alt={primaryImage.alt_text || product.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <svg className="w-5 h-5" style={{ color: '#475569' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-white truncate max-w-[200px]">{product.name}</p>
                            {product.brand && (
                              <p className="text-xs" style={{ color: '#64748b' }}>{product.brand.name}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="font-mono text-xs" style={{ color: '#94a3b8' }}>
                          {product.sku || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <span className="font-semibold text-white">{formatPrice(product.price)}</span>
                          {product.compare_at_price && product.compare_at_price > product.price && (
                            <span className="block text-xs line-through" style={{ color: '#64748b' }}>
                              {formatPrice(product.compare_at_price)}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span
                          className="font-medium"
                          style={{ color: product.stock === 0 ? '#ef4444' : product.stock < 10 ? '#f59e0b' : '#94a3b8' }}
                        >
                          {product.stock}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <span style={{ color: '#94a3b8' }}>
                          {product.category?.name || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={getStatusClass(product.status)}>
                          {getStatusLabel(product.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <a
                            href={`/dashboard/products/edit?id=${product.id}`}
                            className="p-2 rounded-lg transition-colors"
                            style={{ color: '#94a3b8' }}
                            title="Editar"
                            onMouseEnter={(e) => {
                              (e.currentTarget as HTMLElement).style.background = 'rgba(59, 130, 246, 0.1)';
                              (e.currentTarget as HTMLElement).style.color = '#60a5fa';
                            }}
                            onMouseLeave={(e) => {
                              (e.currentTarget as HTMLElement).style.background = 'transparent';
                              (e.currentTarget as HTMLElement).style.color = '#94a3b8';
                            }}
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </a>
                          <button
                            onClick={() => setDeleteTarget(product)}
                            className="p-2 rounded-lg transition-colors"
                            style={{ color: '#94a3b8' }}
                            title="Eliminar"
                            onMouseEnter={(e) => {
                              (e.currentTarget as HTMLElement).style.background = 'rgba(239, 68, 68, 0.1)';
                              (e.currentTarget as HTMLElement).style.color = '#f87171';
                            }}
                            onMouseLeave={(e) => {
                              (e.currentTarget as HTMLElement).style.background = 'transparent';
                              (e.currentTarget as HTMLElement).style.color = '#94a3b8';
                            }}
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ borderTop: '1px solid rgba(148, 163, 184, 0.08)' }}
          >
            <p className="text-xs" style={{ color: '#64748b' }}>
              Página {page} de {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn-secondary text-xs px-3 py-1.5"
              >
                Anterior
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="btn-secondary text-xs px-3 py-1.5"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Eliminar producto"
        message={
          <>
            ¿Estás seguro de que deseas eliminar <strong>{deleteTarget?.name}</strong>?
            Esta acción eliminará también todas las imágenes asociadas y no se puede deshacer.
          </>
        }
        confirmLabel="Eliminar"
        variant="danger"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
