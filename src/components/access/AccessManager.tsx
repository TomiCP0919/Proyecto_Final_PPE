import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import ConfirmDialog from '../ui/ConfirmDialog';
import Toast from '../ui/Toast';
import type { Profile } from '../../lib/types';

export default function AccessManager() {
  const { profile: currentUserProfile } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchEmail, setSearchEmail] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  // Confirmation modal states
  const [confirmTarget, setConfirmTarget] = useState<{
    action: 'approve' | 'reject' | 'delete' | 'change_role';
    profile: Profile;
    newRole?: 'admin' | 'editor';
  } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const fetchProfiles = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProfiles((data as Profile[]) || []);
    } catch (err: any) {
      setToast({ message: `Error al cargar perfiles: ${err.message}`, type: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  const handleAction = async () => {
    if (!confirmTarget) return;
    const { action, profile, newRole } = confirmTarget;
    setActionLoading(true);

    try {
      if (action === 'approve') {
        const { error } = await supabase
          .from('profiles')
          .update({ approval_status: 'approved' })
          .eq('id', profile.id);
        if (error) throw error;
        setToast({ message: `Usuario ${profile.email} aprobado correctamente.`, type: 'success' });
      } else if (action === 'reject') {
        const { error } = await supabase
          .from('profiles')
          .update({ approval_status: 'rejected' })
          .eq('id', profile.id);
        if (error) throw error;
        setToast({ message: `Acceso para ${profile.email} rechazado/revocado.`, type: 'success' });
      } else if (action === 'delete') {
        const { error } = await supabase
          .from('profiles')
          .delete()
          .eq('id', profile.id);
        if (error) throw error;
        setToast({ message: `Registro y credenciales de ${profile.email} eliminados correctamente.`, type: 'success' });
      } else if (action === 'change_role' && newRole) {
        const { error } = await supabase
          .from('profiles')
          .update({ role: newRole })
          .eq('id', profile.id);
        if (error) throw error;
        setToast({ message: `Rol de ${profile.email} cambiado a ${newRole === 'admin' ? 'Administrador' : 'Editor'}.`, type: 'success' });
      }
      setConfirmTarget(null);
      await fetchProfiles();
    } catch (err: any) {
      setToast({ message: `Error al procesar acción: ${err.message}`, type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const formatColombianDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleString('es-CO', {
        timeZone: 'America/Bogota',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      });
    } catch {
      return dateStr;
    }
  };

  // Filtro en vivo: buscador de correo y filtro por estado
  const filteredProfiles = profiles.filter((p) => {
    const matchesEmail = p.email?.toLowerCase().includes(searchEmail.toLowerCase().trim()) ?? false;
    const matchesStatus = statusFilter === 'all' || p.approval_status === statusFilter;
    return matchesEmail && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Gestión de Accesos</h2>
          <p className="text-sm" style={{ color: '#94a3b8' }}>
            Controla quién puede ingresar a administrar la plataforma TechHub.
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="glass-card p-4 flex flex-col md:flex-row md:items-center gap-4">
        {/* Buscador de Correo */}
        <div className="relative flex-1">
          <svg
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
            style={{ color: '#64748b' }}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="search"
            value={searchEmail}
            onChange={(e) => setSearchEmail(e.target.value)}
            placeholder="Buscar por correo electrónico..."
            className="input-field pl-9"
          />
        </div>

        {/* Selector de Estado */}
        <div className="w-full md:w-56">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="input-field"
          >
            <option value="all">Todos los estados</option>
            <option value="pending">Pendientes</option>
            <option value="approved">Aprobados</option>
            <option value="rejected">Rechazados</option>
          </select>
        </div>
      </div>

      {/* Tabla de Usuarios */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <svg className="animate-spin h-8 w-8 text-blue-500 mb-3" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <p className="text-sm" style={{ color: '#94a3b8' }}>
                Cargando lista de accesos...
              </p>
            </div>
          ) : filteredProfiles.length > 0 ? (
            <table className="w-full border-collapse text-left">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(148, 163, 184, 0.08)', background: 'rgba(15, 23, 42, 0.2)' }}>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-400">Correo Electrónico</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-400">Fecha de Registro (Col)</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-400">Rol</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-400">Estado</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-400 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredProfiles.map((p) => {
                  const isSelf = currentUserProfile?.id === p.id;
                  return (
                    <tr key={p.id} className="hover:bg-white/[0.01] transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-white truncate max-w-[240px]">
                        {p.email}
                        {isSelf && (
                          <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                            Tú
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm whitespace-nowrap" style={{ color: '#94a3b8' }}>
                        {formatColombianDate(p.created_at)}
                      </td>
                      <td className="px-6 py-4 text-sm whitespace-nowrap">
                        {isSelf ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20">
                            {p.role === 'admin' ? 'Administrador' : 'Editor'}
                          </span>
                        ) : (
                          <select
                            value={p.role}
                            onChange={(e) =>
                              setConfirmTarget({
                                action: 'change_role',
                                profile: p,
                                newRole: e.target.value as any,
                              })
                            }
                            className="bg-[#0f172a] border border-slate-700/50 rounded-lg text-xs px-2.5 py-1 text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
                          >
                            <option value="editor">Editor</option>
                            <option value="admin">Administrador</option>
                          </select>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm whitespace-nowrap">
                        {p.approval_status === 'approved' && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            Aprobado
                          </span>
                        )}
                        {p.approval_status === 'pending' && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse">
                            Pendiente
                          </span>
                        )}
                        {p.approval_status === 'rejected' && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                            Rechazado
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          {p.approval_status !== 'approved' && (
                            <button
                              onClick={() => setConfirmTarget({ action: 'approve', profile: p })}
                              disabled={isSelf}
                              title="Aprobar acceso"
                              className="p-1.5 rounded-lg border border-emerald-500/10 bg-emerald-500/5 hover:bg-emerald-500/20 text-emerald-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            </button>
                          )}
                          {p.approval_status !== 'rejected' && (
                            <button
                              onClick={() => setConfirmTarget({ action: 'reject', profile: p })}
                              disabled={isSelf}
                              title="Rechazar/Revocar acceso"
                              className="p-1.5 rounded-lg border border-amber-500/10 bg-amber-500/5 hover:bg-amber-500/20 text-amber-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                              </svg>
                            </button>
                          )}
                          <button
                            onClick={() => setConfirmTarget({ action: 'delete', profile: p })}
                            disabled={isSelf}
                            title="Eliminar petición y cuenta"
                            className="p-1.5 rounded-lg border border-red-500/10 bg-red-500/5 hover:bg-red-500/20 text-red-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <svg className="h-12 w-12 text-slate-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-md font-semibold text-slate-200">No se encontraron accesos</h3>
              <p className="text-xs text-slate-500 mt-1">Prueba a cambiar los filtros o el texto de búsqueda.</p>
            </div>
          )}
        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Confirm Action Dialog */}
      {confirmTarget && (
        <ConfirmDialog
          open={!!confirmTarget}
          title={
            confirmTarget.action === 'approve'
              ? 'Aprobar Acceso'
              : confirmTarget.action === 'reject'
              ? 'Rechazar/Revocar Acceso'
              : confirmTarget.action === 'delete'
              ? 'Eliminar Petición de Registro'
              : 'Cambiar Rol de Usuario'
          }
          message={
            confirmTarget.action === 'approve' ? (
              <span>
                ¿Estás seguro de que deseas aprobar a <strong>{confirmTarget.profile.email}</strong>? Este usuario tendrá acceso al panel de administración.
              </span>
            ) : confirmTarget.action === 'reject' ? (
              <span>
                ¿Estás seguro de que deseas rechazar/revocar el acceso a <strong>{confirmTarget.profile.email}</strong>? El usuario será bloqueado y no podrá entrar al panel.
              </span>
            ) : confirmTarget.action === 'delete' ? (
              <span>
                ¿Estás seguro de que deseas eliminar el registro de <strong>{confirmTarget.profile.email}</strong>? Se borrará su perfil y su cuenta de autenticación de forma permanente. Esto le permitirá registrarse nuevamente.
              </span>
            ) : (
              <span>
                ¿Estás seguro de que deseas cambiar el rol de <strong>{confirmTarget.profile.email}</strong> a <strong>{confirmTarget.newRole === 'admin' ? 'Administrador' : 'Editor'}</strong>?
              </span>
            )
          }
          variant={confirmTarget.action === 'delete' || confirmTarget.action === 'reject' ? 'danger' : 'default'}
          confirmLabel={
            confirmTarget.action === 'approve'
              ? 'Aprobar'
              : confirmTarget.action === 'reject'
              ? 'Rechazar'
              : confirmTarget.action === 'delete'
              ? 'Eliminar'
              : 'Cambiar Rol'
          }
          loading={actionLoading}
          onConfirm={handleAction}
          onCancel={() => setConfirmTarget(null)}
        />
      )}
    </div>
  );
}
