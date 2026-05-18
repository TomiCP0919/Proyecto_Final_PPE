import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { categorySchema } from '../../lib/validators';
import ConfirmDialog from '../ui/ConfirmDialog';
import Toast from '../ui/Toast';
import type { Category } from '../../lib/types';

export default function CategoryManager() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [editingId, setEditingId] = useState<string|null>(null);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string,string>>({});
  const [deleteTarget, setDeleteTarget] = useState<Category|null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<{message:string;type:'success'|'error'}|null>(null);

  const fetchCategories = useCallback(async () => {
    const { data } = await supabase.from('categories').select('*').order('name');
    setCategories((data as Category[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  const resetForm = () => { setName(''); setDescription(''); setEditingId(null); setErrors({}); };

  const startEdit = (cat: Category) => {
    setName(cat.name);
    setDescription(cat.description || '');
    setEditingId(cat.id);
    setErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const result = categorySchema.safeParse({ name, description });
    if (!result.success) {
      const errs: Record<string,string> = {};
      result.error.issues.forEach(i => { errs[i.path[0] as string] = i.message; });
      setErrors(errs);
      return;
    }

    setSaving(true);
    try {
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');
      if (editingId) {
        const { error } = await supabase.from('categories').update({ name, slug, description: description||null }).eq('id', editingId);
        if (error) throw error;
        setToast({ message:'Categoría actualizada', type:'success' });
      } else {
        const { error } = await supabase.from('categories').insert({ name, slug, description: description||null, is_active: true });
        if (error) throw error;
        setToast({ message:'Categoría creada', type:'success' });
      }
      resetForm();
      fetchCategories();
    } catch (err: any) {
      setToast({ message: err.message, type:'error' });
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const { error } = await supabase.from('categories').delete().eq('id', deleteTarget.id);
      if (error) throw error;
      setToast({ message:`"${deleteTarget.name}" eliminada`, type:'success' });
      setDeleteTarget(null);
      fetchCategories();
    } catch (err: any) {
      setToast({ message: err.message, type:'error' });
    } finally { setDeleting(false); }
  };

  const toggleActive = async (cat: Category) => {
    const { error } = await supabase.from('categories').update({ is_active: !cat.is_active }).eq('id', cat.id);
    if (!error) fetchCategories();
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white">Categorías</h2>
        <p className="text-sm mt-0.5" style={{color:'#64748b'}}>Gestiona las categorías de productos</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="glass-card p-6">
          <h3 className="text-sm font-semibold text-white mb-4">
            {editingId ? 'Editar Categoría' : 'Nueva Categoría'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="input-label">Nombre *</label>
              <input value={name} onChange={e=>setName(e.target.value)} placeholder="Ej: Procesadores"
                className={`input-field ${errors.name?'input-error':''}`} id="category-name-input"/>
              {errors.name && <p className="error-text">{errors.name}</p>}
            </div>
            <div>
              <label className="input-label">Descripción</label>
              <textarea value={description} onChange={e=>setDescription(e.target.value)} placeholder="Descripción opcional..."
                className="input-field resize-y" rows={3}/>
              {errors.description && <p className="error-text">{errors.description}</p>}
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center" id="category-submit-btn">
                {saving ? 'Guardando...' : editingId ? 'Actualizar' : 'Crear'}
              </button>
              {editingId && <button type="button" onClick={resetForm} className="btn-secondary">Cancelar</button>}
            </div>
          </form>
        </div>

        {/* List */}
        <div className="lg:col-span-2 glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{borderBottom:'1px solid rgba(148,163,184,0.1)'}}>
                  <th className="text-left px-4 py-3 font-medium" style={{color:'#64748b'}}>Nombre</th>
                  <th className="text-left px-4 py-3 font-medium hidden sm:table-cell" style={{color:'#64748b'}}>Slug</th>
                  <th className="text-left px-4 py-3 font-medium" style={{color:'#64748b'}}>Estado</th>
                  <th className="text-right px-4 py-3 font-medium" style={{color:'#64748b'}}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? Array.from({length:4}).map((_,i)=>(
                  <tr key={i} style={{borderBottom:'1px solid rgba(148,163,184,0.06)'}}>
                    {[1,2,3,4].map(j=><td key={j} className="px-4 py-3"><div className="h-4 rounded animate-pulse" style={{background:'rgba(148,163,184,0.1)',width:`${50+Math.random()*50}%`}}/></td>)}
                  </tr>
                )) : categories.length===0 ? (
                  <tr><td colSpan={4} className="text-center py-12" style={{color:'#64748b'}}>No hay categorías</td></tr>
                ) : categories.map(cat=>(
                  <tr key={cat.id} style={{borderBottom:'1px solid rgba(148,163,184,0.06)'}}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-white">{cat.name}</p>
                      {cat.description && <p className="text-xs mt-0.5 truncate max-w-[200px]" style={{color:'#64748b'}}>{cat.description}</p>}
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell"><span className="font-mono text-xs" style={{color:'#94a3b8'}}>{cat.slug}</span></td>
                    <td className="px-4 py-3">
                      <button onClick={()=>toggleActive(cat)} className={cat.is_active ? 'status-badge status-active':'status-badge status-archived'}>
                        {cat.is_active ? 'Activa' : 'Inactiva'}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button onClick={()=>startEdit(cat)} className="p-2 rounded-lg transition-colors" style={{color:'#94a3b8'}} title="Editar"
                          onMouseEnter={e=>{e.currentTarget.style.background='rgba(59,130,246,0.1)';e.currentTarget.style.color='#60a5fa'}}
                          onMouseLeave={e=>{e.currentTarget.style.background='transparent';e.currentTarget.style.color='#94a3b8'}}>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                          </svg>
                        </button>
                        <button onClick={()=>setDeleteTarget(cat)} className="p-2 rounded-lg transition-colors" style={{color:'#94a3b8'}} title="Eliminar"
                          onMouseEnter={e=>{e.currentTarget.style.background='rgba(239,68,68,0.1)';e.currentTarget.style.color='#f87171'}}
                          onMouseLeave={e=>{e.currentTarget.style.background='transparent';e.currentTarget.style.color='#94a3b8'}}>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <ConfirmDialog open={!!deleteTarget} title="Eliminar categoría"
        message={<>¿Eliminar <strong>{deleteTarget?.name}</strong>? Los productos asociados perderán esta categoría.</>}
        confirmLabel="Eliminar" variant="danger" loading={deleting} onConfirm={handleDelete} onCancel={()=>setDeleteTarget(null)}/>
      {toast && <Toast message={toast.message} type={toast.type} onClose={()=>setToast(null)}/>}
    </div>
  );
}
