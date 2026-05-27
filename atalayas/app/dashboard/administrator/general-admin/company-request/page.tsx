'use client';

import { useEffect, useState } from 'react';
import { API_ROUTES } from '@/lib/utils';
import Sidebar from '@/components/ui/Sidebar';
import PageHeader from '@/components/ui/pageHeader';
import SearchBar from '@/components/ui/Searchbar';

interface CompanyRequest {
  id: string;
  companyName: string;
  cif: string;
  contactName: string;
  contactEmail: string;
  phone?: string;
  address?: string;
  activity?: string;
  documentUrl: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'ARCHIVED';
  rejectReason?: string;
  created_at: string;
  archivedAt?: string | null;
}

const statusConfig = {
  PENDING: { label: 'Pendiente', textColor: 'text-amber-600 dark:text-amber-400', bgClass: 'bg-amber-100 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20', icon: 'bi-clock-history' },
  APPROVED: { label: 'Aprobada', textColor: 'text-emerald-700 dark:text-emerald-400', bgClass: 'bg-emerald-100 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20', icon: 'bi-check-circle' },
  REJECTED: { label: 'Rechazada', textColor: 'text-destructive', bgClass: 'bg-destructive/10 border-destructive/20', icon: 'bi-x-circle' },
  ARCHIVED: { label: 'Archivada', textColor: 'text-muted-foreground', bgClass: 'bg-muted border-border', icon: 'bi-archive' },
};

// El degradado sutil que ahora solo usaremos en detalles muy finos
const PREMIUM_GRADIENT = "bg-gradient-to-r from-teal-400 via-amber-400 to-orange-500";

export default function CompanyRequestsPage() {
  const [requests, setRequests] = useState<CompanyRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<CompanyRequest | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'ARCHIVED'>('PENDING');
  const [pendingCount, setPendingCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  const getToken = () => typeof window !== 'undefined' ? localStorage.getItem('token') : '';

  // --- FUNCIÓN DE UTILIDAD PARA ACTUALIZAR EL SIDEBAR ---
  const updateSidebarCounter = () => {
    const current = Number(localStorage.getItem('count_requests')) || 0;
    const newValue = Math.max(0, current - 1);
    localStorage.setItem('count_requests', newValue.toString());
    window.dispatchEvent(new CustomEvent('local-storage-update', { 
      detail: { requests: newValue } 
    }));
  };

  const fetchRequests = async () => {
    setRequests([]);
    setLoading(true);
    try {
      const url = filter === 'ARCHIVED'
        ? API_ROUTES.COMPANY_REQUESTS.GET_ARCHIVED
        : API_ROUTES.COMPANY_REQUESTS.GET_ALL;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      setRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingCount = async () => {
    try {
      const res = await fetch(API_ROUTES.COMPANY_REQUESTS.GET_ALL, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      const data = await res.json();
      const count = Array.isArray(data) ? data.filter((r: any) => r.status === 'PENDING').length : 0;
      setPendingCount(count);
      
      // Sincronizar storage inicial
      localStorage.setItem('count_requests', count.toString());
      window.dispatchEvent(new CustomEvent('local-storage-update', { detail: { requests: count } }));
    } catch { }
  };

  useEffect(() => { fetchRequests(); fetchPendingCount() }, [filter]);

  const handleApprove = async (id: string) => {
    setActionLoading(true);
    try {
      const res = await fetch(API_ROUTES.COMPANY_REQUESTS.APPROVE(id), {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error('Error al aprobar');
      
      updateSidebarCounter(); // Actualización instantánea
      await fetchRequests();
      await fetchPendingCount();
      setSelected(null);
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selected || !rejectReason.trim()) return;
    setActionLoading(true);
    try {
      const res = await fetch(API_ROUTES.COMPANY_REQUESTS.REJECT(selected.id), {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${getToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rejectReason }),
      });
      if (!res.ok) throw new Error('Error al rechazar');
      
      updateSidebarCounter(); // Actualización instantánea
      await fetchRequests();
      await fetchPendingCount();
      setSelected(null);
      setShowRejectModal(false);
      setRejectReason('');
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleArchive = async () => {
    if (!selected) return;
    try {
      const res = await fetch(API_ROUTES.COMPANY_REQUESTS.ARCHIVE(selected.id), {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok && selected.status === 'PENDING') {
        updateSidebarCounter(); // Solo restamos si archivamos algo que estaba pendiente
      }
      await fetchRequests();
      setSelected(null);
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = (filter === 'ALL' || filter === 'ARCHIVED' ? requests : requests.filter(r => r.status === filter))
    .filter(r =>
      r.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.cif.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.contactName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.contactEmail.toLowerCase().includes(searchQuery.toLowerCase())
    );

  return (
    <div className="flex min-h-screen bg-background font-sans text-foreground">

      <main className="flex-1 flex flex-col overflow-hidden relative">
        
        <PageHeader 
          title="Gestión de Solicitudes"
          description={pendingCount > 0 
            ? `Pendiente de revisión: ${pendingCount} nueva${pendingCount > 1 ? 's' : ''} petición${pendingCount > 1 ? 'es' : ''}.` 
            : "Registro histórico y validación de empresas."
          }
          icon={<i className={`bi bi-envelope-open bg-clip-text ${PREMIUM_GRADIENT}`}></i>}
          action={
            <div className="w-full md:w-80">
              <SearchBar 
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Buscar CIF, empresa o contacto..."
              />
            </div>
          }
        />

        <div className="flex-1 flex flex-col overflow-hidden max-w-350 mx-auto w-full px-6 lg:px-10 pb-10">
          
          {/* FILTROS NORMALES (Limpios y corporativos) */}
          <div className="flex flex-wrap gap-2 my-8 bg-card border border-border p-1.5 rounded-2xl shadow-sm w-fit">
            {(['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'ARCHIVED'] as const).map((f) => (
              <button
                key={f}
                onClick={() => { setFilter(f); setSelected(null); }}
                className={`relative px-5 py-2 text-[10px] font-black uppercase tracking-widest transition-all duration-300 rounded-xl border ${
                  filter === f 
                    ? 'bg-primary/10 text-primary border-primary/20 shadow-sm' 
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                <span className="relative z-10 flex items-center justify-center">
                  {f === 'ALL' ? 'Todas' : statusConfig[f].label}
                  {f === 'PENDING' && pendingCount > 0 && (
                    <span className={`ml-2 px-1.5 py-0.5 rounded-md text-[9px] font-black ${filter === f ? 'bg-primary text-white' : 'bg-primary text-white animate-pulse'}`}>
                      {pendingCount}
                    </span>
                  )}
                </span>
              </button>
            ))}
          </div>

          {/* LISTADO TIPO TABLA CORPORATIVA (Sin la línea superior) */}
          <div className="flex-1 flex flex-col bg-card border border-border rounded-[2rem] shadow-sm overflow-hidden">
            
            <div className="grid grid-cols-12 gap-4 px-8 py-5 border-b border-border/50 bg-muted/10 text-[10px] font-black uppercase tracking-widest text-muted-foreground/80">
              <div className="col-span-5 md:col-span-4 text-left">Empresa / CIF</div>
              <div className="hidden md:block col-span-3">Solicitante</div>
              <div className="col-span-3 md:col-span-2">Estado</div>
              <div className="col-span-4 md:col-span-3 text-right pr-4">Acciones</div>
            </div>

            <div className="overflow-y-auto flex-1 no-scrollbar p-2">
              {loading ? (
                <div className="space-y-2">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-20 bg-muted/30 rounded-2xl animate-pulse w-full" />
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-32 opacity-40">
                  <i className="bi bi-envelope-open text-5xl mb-4"></i>
                  <p className="text-sm font-bold uppercase tracking-widest">Sin solicitudes pendientes</p>
                </div>
              ) : (
                <div className="flex flex-col">
                  {filtered.map((req) => {
                    const status = statusConfig[req.status];
                    const isSelected = selected?.id === req.id;

                    return (
                      <div 
                        key={req.id} 
                        className="relative group/row transition-all duration-300 border-b border-border/40 last:border-b-0"
                      >
                        {/* BORDE HOVER EXTRA-FINO (1px y opacidad reducida a 40%) */}
                        <div className={`absolute inset-px rounded-[24px] ${PREMIUM_GRADIENT} opacity-0 group-hover/row:opacity-40 transition-opacity duration-300 p-px pointer-events-none z-0`}>
                          <div className="w-full h-full bg-card rounded-[23px]"></div>
                        </div>

                        {/* CONTENIDO DE LA FILA */}
                        <div className="relative z-10 flex flex-col">
                          
                          {/* FILA VISIBLE */}
                          <div 
                            onClick={() => setSelected(isSelected ? null : req)}
                            className="grid grid-cols-12 gap-4 px-6 py-4 items-center cursor-pointer"
                          >
                            <div className="col-span-5 md:col-span-4 flex items-center gap-4">
                              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-lg bg-muted text-muted-foreground group-hover/row:bg-primary/5 group-hover/row:text-primary transition-colors">
                                <i className="bi bi-building"></i>
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-bold text-foreground truncate">{req.companyName}</p>
                                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-tight">{req.cif}</p>
                              </div>
                            </div>

                            <div className="hidden md:block col-span-3">
                              <p className="text-xs font-bold text-foreground">{req.contactName}</p>
                              <p className="text-[11px] text-muted-foreground truncate">{req.contactEmail}</p>
                            </div>

                            <div className="col-span-3 md:col-span-2">
                              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border text-[9px] font-black uppercase tracking-wider ${status.bgClass} ${status.textColor}`}>
                                <i className={`bi ${status.icon}`}></i> {status.label}
                              </span>
                            </div>

<div className="col-span-4 md:col-span-3 flex items-center justify-end gap-1 pr-0">                              {req.status === 'PENDING' && (
                                <>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleApprove(req.id); }}
                                    className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500 hover:text-white flex items-center justify-center transition-all shadow-sm"
                                    title="Aprobar"
                                  >
                                    <i className="bi bi-check-lg text-lg"></i>
                                  </button>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); setSelected(req); setShowRejectModal(true); }}
                                    className="w-8 h-8 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive hover:text-white flex items-center justify-center transition-all shadow-sm"
                                    title="Rechazar"
                                  >
                                    <i className="bi bi-x-lg text-lg"></i>
                                  </button>
                                </>
                              )}
                            </div>
                          </div>

                          {/* DESPLEGABLE */}
                          <div className={`overflow-hidden transition-all duration-500 ${isSelected ? 'max-h-250' : 'max-h-0'}`}>
                            <div className="px-10 py-8 bg-muted/5 grid grid-cols-1 lg:grid-cols-12 gap-10 border-t border-border/40 rounded-b-[22.5px]">
                              
                              {/* COLUMNA 1: DATOS EMPRESA */}
                              <div className="lg:col-span-4 space-y-6">
                                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-teal-500/80 mb-4 flex items-center gap-2">
                                  <i className="bi bi-buildings"></i> Datos de la Entidad
                                </h4>
                                <div className="space-y-3">
                                  <div className="bg-card p-4 rounded-2xl border border-border/40">
                                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">Actividad</p>
                                    <p className="text-sm font-bold text-foreground">{req.activity || 'No definida'}</p>
                                  </div>
                                  <div className="bg-card p-4 rounded-2xl border border-border/40">
                                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">Dirección Sede</p>
                                    <p className="text-sm font-bold text-foreground leading-snug">{req.address || 'No proporcionada'}</p>
                                  </div>
                                </div>
                              </div>

                              {/* COLUMNA 2: DATOS SOLICITANTE */}
                              <div className="lg:col-span-4 space-y-6">
                                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-teal-500/80 mb-4 flex items-center gap-2">
                                  <i className="bi bi-person-badge"></i> Representante / Solicitante
                                </h4>
                                <div className="space-y-3">
                                  <div className="bg-card p-4 rounded-2xl border border-border/40 flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-teal-500/10 flex items-center justify-center text-teal-600 font-black text-xs">
                                      {req.contactName.charAt(0)}
                                    </div>
                                    <div className="min-w-0">
                                      <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-0.5">Nombre Completo</p>
                                      <p className="text-sm font-bold text-foreground truncate">{req.contactName}</p>
                                    </div>
                                  </div>
                                  <div className="bg-card p-4 rounded-2xl border border-border/40">
                                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">Email / Teléfono</p>
                                    <p className="text-sm font-bold text-foreground">{req.contactEmail}</p>
                                    <p className="text-xs font-medium text-muted-foreground mt-1">{req.phone || 'Sin teléfono'}</p>
                                  </div>
                                </div>
                              </div>

                              {/* COLUMNA 3: DOCUMENTACIÓN Y ACCIÓN */}
                              <div className="lg:col-span-4 space-y-6">
                                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-teal-500/80 mb-4 flex items-center gap-2">
                                  <i className="bi bi-file-earmark-check"></i> Verificación
                                </h4>
                                
                                <a
                                  href={req.documentUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="flex items-center gap-4 p-5 bg-background border-2 border-dashed border-border hover:border-teal-500/40 hover:bg-teal-500/2 rounded-3xl transition-all group"
                                >
                                  <div className="w-12 h-12 bg-teal-500/10 text-teal-600 rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                                    <i className="bi bi-file-earmark-pdf"></i>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-black uppercase tracking-widest text-foreground">Escritura / CIF</p>
                                    <p className="text-[10px] font-medium text-muted-foreground">Clic para ver documento</p>
                                  </div>
                                  <i className="bi bi-box-arrow-up-right text-muted-foreground/40 group-hover:text-teal-500 transition-colors"></i>
                                </a>

                                {(req.status === 'APPROVED' || req.status === 'REJECTED') && !req.archivedAt && (
                                  <button
                                    onClick={async (e) => {
                                      e.stopPropagation();
                                      await fetch(API_ROUTES.COMPANY_REQUESTS.ARCHIVE(req.id), {
                                        method: 'PATCH',
                                        headers: { Authorization: `Bearer ${getToken()}` },
                                      });
                                      await fetchRequests();
                                      setSelected(null);
                                    }}
                                    className="w-full py-4 rounded-2xl border border-border text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:bg-muted/50 transition-all flex items-center justify-center gap-3"
                                  >
                                    <i className="bi bi-archive"></i> Archivar Solicitud
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>

                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* MODAL RECHAZO */}
        {showRejectModal && selected && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-md flex items-center justify-center z-100 p-4 animate-in fade-in duration-200">
            <div className="bg-card border border-border rounded-[2.5rem] p-10 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-300 relative overflow-hidden">
              
              <div className={`absolute top-0 left-0 right-0 h-1 z-10 ${PREMIUM_GRADIENT} opacity-80`}></div>

              <div className="flex flex-col items-center text-center mt-2">
                <div className="w-16 h-16 bg-destructive/10 text-destructive rounded-2xl flex items-center justify-center text-3xl mb-6">
                  <i className="bi bi-slash-circle"></i>
                </div>
                <h3 className="text-xl font-bold tracking-tight mb-2">Rechazar Solicitud</h3>
                <p className="text-xs font-medium text-muted-foreground mb-8">Indica el motivo por el cual la empresa {selected.companyName} no puede ser admitida.</p>
                
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Ej: El documento CIF no coincide..."
                  className="w-full bg-muted/30 border border-border focus:border-destructive outline-none rounded-2xl p-4 text-sm font-medium mb-6 resize-none h-32 transition-all"
                />

                <div className="grid grid-cols-2 gap-4 w-full">
                  <button
                    onClick={() => { setShowRejectModal(false); setRejectReason(''); setSelected(null); }}
                    className="py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest text-muted-foreground bg-muted hover:bg-muted/80 transition-all"
                  >
                    Volver
                  </button>
                  <button
                    onClick={handleReject}
                    disabled={!rejectReason.trim() || actionLoading}
                    className="py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest text-white bg-destructive hover:opacity-90 transition-all disabled:opacity-50 shadow-lg shadow-destructive/20"
                  >
                    Confirmar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}