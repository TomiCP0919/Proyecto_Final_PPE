import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

interface Stats {
  total: number;
  active: number;
  drafts: number;
  categories: number;
  lowStock: number;
  recent: Array<{ id: string; name: string; status: string; created_at: string; price: number }>;
}

export default function DashboardHome() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [all, act, dft, cat, low, rec] = await Promise.all([
          supabase.from('products').select('id', { count: 'exact', head: true }),
          supabase.from('products').select('id', { count: 'exact', head: true }).eq('status', 'active'),
          supabase.from('products').select('id', { count: 'exact', head: true }).eq('status', 'draft'),
          supabase.from('categories').select('id', { count: 'exact', head: true }),
          supabase.from('products').select('id', { count: 'exact', head: true }).lt('stock', 10).eq('status', 'active'),
          supabase.from('products').select('id, name, status, created_at, price').order('created_at', { ascending: false }).limit(5),
        ]);
        setStats({ total: all.count||0, active: act.count||0, drafts: dft.count||0, categories: cat.count||0, lowStock: low.count||0, recent: rec.data||[] });
      } catch(e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  const fmt = (n: number) => new Intl.NumberFormat('es-CR',{style:'currency',currency:'USD'}).format(n);
  const fmtDate = (d: string) => new Date(d).toLocaleDateString('es-ES',{day:'numeric',month:'short'});
  const statusLabel: Record<string,string> = { active:'Activo', draft:'Borrador', archived:'Archivado' };
  const statusCls: Record<string,string> = { active:'status-badge status-active', draft:'status-badge status-draft', archived:'status-badge status-archived' };

  const cards = [
    { label:'Total Productos', value:stats?.total??0, color:'#3b82f6', bg:'rgba(59,130,246,0.1)', icon:'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
    { label:'Activos', value:stats?.active??0, color:'#10b981', bg:'rgba(16,185,129,0.1)', icon:'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
    { label:'Borradores', value:stats?.drafts??0, color:'#f59e0b', bg:'rgba(245,158,11,0.1)', icon:'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' },
    { label:'Stock Bajo', value:stats?.lowStock??0, color:'#ef4444', bg:'rgba(239,68,68,0.1)', icon:'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' },
  ];

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white">Dashboard</h2>
        <p className="text-sm mt-0.5" style={{color:'#64748b'}}>Resumen general del inventario</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map(c=>(
          <div key={c.label} className="glass-card glass-card-hover p-5">
            {loading ? (
              <div className="space-y-3">
                <div className="h-10 w-10 rounded-xl animate-pulse" style={{background:'rgba(148,163,184,0.1)'}}/>
                <div className="h-8 w-16 rounded animate-pulse" style={{background:'rgba(148,163,184,0.1)'}}/>
              </div>
            ):(
              <>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{background:c.bg,color:c.color}}>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75"><path strokeLinecap="round" strokeLinejoin="round" d={c.icon}/></svg>
                </div>
                <p className="text-2xl font-bold text-white">{c.value}</p>
                <p className="text-xs mt-0.5" style={{color:'#64748b'}}>{c.label}</p>
              </>
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-6">
          <h3 className="text-sm font-semibold text-white mb-4">Acciones Rápidas</h3>
          <div className="space-y-2">
            {[
              {href:'/dashboard/products/new',label:'Nuevo Producto',desc:'Agregar un componente',clr:'#60a5fa',bg:'rgba(59,130,246,0.15)',icon:'M12 4v16m8-8H4'},
              {href:'/dashboard/categories',label:'Gestionar Categorías',desc:'Organiza el catálogo',clr:'#a78bfa',bg:'rgba(139,92,246,0.15)',icon:'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z'},
              {href:'/dashboard/products',label:'Ver Inventario',desc:'Revisa stock y precios',clr:'#34d399',bg:'rgba(16,185,129,0.15)',icon:'M4 6h16M4 10h16M4 14h16M4 18h16'},
            ].map(a=>(
              <a key={a.href} href={a.href} className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all" style={{border:'1px solid rgba(148,163,184,0.08)'}}
                onMouseEnter={e=>(e.currentTarget.style.background='rgba(148,163,184,0.05)')} onMouseLeave={e=>(e.currentTarget.style.background='transparent')}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{background:a.bg,color:a.clr}}>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d={a.icon}/></svg>
                </div>
                <div><p className="text-sm font-medium text-white">{a.label}</p><p className="text-xs" style={{color:'#64748b'}}>{a.desc}</p></div>
              </a>
            ))}
          </div>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">Productos Recientes</h3>
            <a href="/dashboard/products" className="text-xs font-medium" style={{color:'#60a5fa'}}>Ver todos →</a>
          </div>
          {loading ? <div className="space-y-3">{Array.from({length:5}).map((_,i)=>(<div key={i} className="h-10 rounded animate-pulse" style={{background:'rgba(148,163,184,0.06)'}}/>))}</div>
          : stats?.recent.length===0 ? <p className="text-sm py-8 text-center" style={{color:'#475569'}}>No hay productos aún</p>
          : <div className="space-y-1">{stats?.recent.map(p=>(
            <a key={p.id} href={`/dashboard/products/${p.id}`} className="flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors"
              onMouseEnter={e=>(e.currentTarget.style.background='rgba(148,163,184,0.05)')} onMouseLeave={e=>(e.currentTarget.style.background='transparent')}>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{p.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs" style={{color:'#64748b'}}>{fmtDate(p.created_at)}</span>
                  <span className={(statusCls[p.status]||'status-badge')+' text-[10px] py-0 px-1.5'}>{statusLabel[p.status]||p.status}</span>
                </div>
              </div>
              <span className="text-sm font-semibold text-white shrink-0 ml-3">{fmt(p.price)}</span>
            </a>
          ))}</div>}
        </div>
      </div>
    </div>
  );
}
