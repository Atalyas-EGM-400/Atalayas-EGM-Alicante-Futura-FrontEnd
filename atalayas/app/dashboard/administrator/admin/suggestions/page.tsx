'use client';

import { useEffect, useState, useCallback } from 'react';
import { API_ROUTES } from '@/lib/utils';
import Sidebar from '@/components/ui/Sidebar';
import PageHeader from '@/components/ui/pageHeader';
import { motion, AnimatePresence } from 'framer-motion';

// --- Tipos e Interfaces ---
type SuggestionStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED';
interface Suggestion {
  id: string; 
  title: string; 
  content: string; 
  status: SuggestionStatus;
  targetRole: 'ADMIN' | 'GENERAL_ADMIN'; 
  response?: string; 
  createdAt: string;
  User?: { name: string; email: string; id: string; avatarUrl?: string };
}

// Configuración visual de los estados
const statusConfig: Record<SuggestionStatus, { label: string; textClass: string; bgClass: string; icon: string }> = {
  PENDING: { label: 'Pendiente', textClass: 'text-amber-500', bgClass: 'bg-amber-500/10 border-amber-500/20', icon: 'bi-hourglass-split' },
  ACCEPTED: { label: 'Aceptada', textClass: 'text-emerald-500', bgClass: 'bg-emerald-500/10 border-emerald-500/20', icon: 'bi-check-circle-fill' },
  REJECTED: { label: 'Rechazada', textClass: 'text-destructive', bgClass: 'bg-destructive/10 border-destructive/20', icon: 'bi-x-circle-fill' },
};

export default function AdminSuggestionsPage() {
  const [mounted, setMounted] = useState(false);
  const [view, setView] = useState<'RECEIVED' | 'SENT'>('RECEIVED');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [selected, setSelected] = useState<Suggestion | null>(null);
  const [filter, setFilter] = useState<'ALL' | SuggestionStatus>('PENDING');
  const [loading, setLoading] = useState(true);
  
  // Formulario
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [responseBody, setResponseBody] = useState('');

  const fetchData = useCallback(async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
    if (!token) return;
    setLoading(true);
    try {
      const url = view === 'RECEIVED' 
        ? `${API_ROUTES.SUGGESTIONS.GET_ALL}?target=ADMIN`
        : `${API_ROUTES.SUGGESTIONS.GET_MINE}`;
      const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      setSuggestions(Array.isArray(data) ? data : []);
    } catch (err) { 
      console.error(err); 
    } finally { 
      setLoading(false); 
    }
  }, [view]);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (mounted) {
      fetchData();
      setSelected(null);
      setFilter('PENDING');
    }
  }, [view, mounted, fetchData]);

  const handleSubmitSuggestion = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(API_ROUTES.SUGGESTIONS.CREATE, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ 
          title: newTitle, 
          content: newContent, 
          targetRole: "GENERAL_ADMIN", 
          authorId: user?.id, 
          authorRole: "ADMIN" 
        }),
      });
      if (res.ok) { 
        setNewTitle(""); 
        setNewContent(""); 
        fetchData(); 
      }
    } catch (err) { 
      console.error(err); 
    } finally { 
      setIsSubmitting(false); 
    }
  };

  const handleRespond = async (status: SuggestionStatus) => {
    if (!selected) return;
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(API_ROUTES.SUGGESTIONS.RESPOND(selected.id), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ response: responseBody.trim() || "Procesado.", status }),
      });
      if (res.ok) {
        const currentCount = Number(localStorage.getItem('count_suggestions')) || 0;
        localStorage.setItem('count_suggestions', Math.max(0, currentCount - 1).toString());
        window.dispatchEvent(new Event('local-storage-update'));
        setSelected(null); 
        setResponseBody(''); 
        fetchData();
      } else { 
        alert("Error al procesar la respuesta"); 
      }
    } catch (err) { 
      console.error(err); 
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Seguro que deseas eliminar esta propuesta?')) return;
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(API_ROUTES.SUGGESTIONS.DELETE(id), {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) fetchData();
    } catch (err) { 
      console.error(err); 
    }
  };

  if (!mounted) return null;

  const filteredSuggestions = suggestions.filter(s => filter === 'ALL' ? true : s.status === filter);

  return (
    <div className="flex min-h-screen bg-background font-sans text-foreground">
      
      {/* Scroll natural sin barras visibles */}
      <main className="flex-1 flex flex-col relative overflow-y-auto no-scrollbar">
        
        <PageHeader 
          title="Buzón"
          description={
            // Ocultamos la descripción en móvil para que no se aplaste contra los botones
            <span className="hidden sm:block">
              {view === 'RECEIVED' 
                ? "Gestiona el feedback de los empleados." 
                : "Comunícate con la administración general."}
            </span> as any
          }
          icon={<i className="bi bi-mailbox"></i>}
          action={
            <div className="flex shrink-0 bg-muted/40 p-1 rounded-xl border border-border/50 ml-auto">
              {(['RECEIVED', 'SENT'] as const).map((v) => (
                <button 
                  key={v} 
                  onClick={() => setView(v)}
                  className={`px-3 sm:px-6 py-2 rounded-lg text-[10px] sm:text-xs font-semibold transition-all flex items-center justify-center gap-1.5 sm:gap-2 ${
                    view === v ? 'bg-orange-500 text-white shadow-sm' : 'text-muted-foreground hover:bg-muted'
                  }`}
                >
                  <i className={`bi ${v === 'RECEIVED' ? 'bi-inbox-fill' : 'bi-send-fill'} text-sm sm:text-base`}></i>
                  {/* En PC mostramos texto largo, en móvil texto corto */}
                  <span className="hidden sm:inline">{v === 'RECEIVED' ? 'Bandeja de entrada' : 'Mis propuestas'}</span>
                  <span className="sm:hidden">{v === 'RECEIVED' ? 'Recibidos' : 'Enviados'}</span>
                </button>
              ))}
            </div>
          }
        />

        {/* Contenedor fluido sin alturas forzadas */}
        <div className="flex-1 flex flex-col lg:flex-row relative">
          
          {/* ─── VISTA RECIBIDOS ─── */}
          {view === 'RECEIVED' && (
            <>
              {/* Lista lateral de correos */}
              <div className={`w-full lg:w-100 xl:w-112.5 lg:border-r border-border/40 flex flex-col bg-background/50 ${selected ? 'hidden lg:flex' : 'flex'}`}>
                
                {/* Cabecera de filtros */}
                <div className="p-4 border-b border-border/40 shrink-0 bg-card/30 overflow-x-auto no-scrollbar">
                  <div className="flex flex-nowrap lg:flex-wrap gap-2 min-w-max lg:min-w-0">
                    {(['ALL', 'PENDING', 'ACCEPTED', 'REJECTED'] as const).map((f) => (
                      <button 
                        key={f} 
                        onClick={() => { setFilter(f); setSelected(null); }}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border whitespace-nowrap ${
                          filter === f 
                            ? 'bg-foreground text-background border-foreground' 
                            : 'bg-card text-muted-foreground border-border/60 hover:border-foreground/30'
                        }`}
                      >
                        {f === 'ALL' ? 'Todas' : statusConfig[f as SuggestionStatus].label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Lista */}
                <div className="p-4 space-y-3">
                  {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 opacity-50 space-y-3">
                      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      <p className="text-sm font-medium">Cargando buzón...</p>
                    </div>
                  ) : filteredSuggestions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center text-muted-foreground py-20">
                      <i className="bi bi-inbox text-4xl mb-3 opacity-50"></i>
                      <p className="text-sm font-medium">No hay sugerencias {filter !== 'ALL' ? 'en este estado' : ''}</p>
                    </div>
                  ) : (
                    filteredSuggestions.map((s) => (
                      <motion.div 
                        initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                        key={s.id} 
                        onClick={() => setSelected(s)} 
                        className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                          selected?.id === s.id 
                            ? 'bg-primary/5 border-primary shadow-sm' 
                            : 'bg-card border-border/50 hover:border-primary/30 hover:shadow-sm'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2 gap-3">
                          <h4 className="font-semibold text-sm line-clamp-1">{s.title}</h4>
                          <span className={`shrink-0 flex items-center justify-center w-6 h-6 rounded-full ${statusConfig[s.status].bgClass} ${statusConfig[s.status].textClass}`}>
                            <i className={`bi ${statusConfig[s.status].icon} text-xs`}></i>
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{s.content}</p>
                        <div className="flex items-center justify-between text-[10px] font-medium text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <i className="bi bi-person-circle"></i>
                            <span className="truncate max-w-30">{s.User?.name || 'Usuario Anónimo'}</span>
                          </div>
                          <span>{new Date(s.createdAt).toLocaleDateString()}</span>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </div>

              {/* Panel de Lectura (Derecha) */}
              <div className={`flex-1 flex flex-col bg-card/20 ${!selected ? 'hidden lg:flex items-center justify-center py-20' : 'flex'}`}>
                {selected ? (
                  <div className="w-full max-w-4xl mx-auto p-4 sm:p-6 lg:p-10 animate-in fade-in zoom-in-95 duration-300">
                    
                    <button onClick={() => setSelected(null)} className="lg:hidden flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 text-sm font-medium">
                      <i className="bi bi-arrow-left"></i> Volver a la lista
                    </button>

                    <div className="bg-card border border-border shadow-sm rounded-3xl overflow-hidden">
                      {/* Cabecera del Mensaje */}
                      <div className="p-6 sm:p-8 border-b border-border/50 bg-muted/10">
                        <div className="flex items-center justify-between gap-4 mb-6">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold border ${statusConfig[selected.status].bgClass} ${statusConfig[selected.status].textClass}`}>
                            <i className={`bi ${statusConfig[selected.status].icon}`}></i>
                            {statusConfig[selected.status].label}
                          </span>
                          <span className="text-xs font-medium text-muted-foreground">
                            <i className="bi bi-calendar3 mr-1.5"></i>
                            {new Date(selected.createdAt).toLocaleDateString()} a las {new Date(selected.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        
                        <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-6 leading-tight">{selected.title}</h2>
                        
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center text-lg border border-primary/20 shrink-0">
                            {selected.User?.name?.charAt(0).toUpperCase() || 'A'}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-foreground">{selected.User?.name || 'Usuario Anónimo'}</p>
                            <p className="text-xs text-muted-foreground">{selected.User?.email || 'Sin correo asociado'}</p>
                          </div>
                        </div>
                      </div>

                      {/* Cuerpo del Mensaje */}
                      <div className="p-6 sm:p-8 space-y-8">
                        <div className="text-sm sm:text-base text-foreground/80 leading-relaxed whitespace-pre-wrap">
                          {selected.content}
                        </div>

                        {/* Zona de Respuesta */}
                        {selected.status === 'PENDING' ? (
                          <div className="bg-muted/30 border border-border/50 rounded-2xl p-5 sm:p-6 mt-8">
                            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                              <i className="bi bi-reply-fill text-primary"></i>
                              Responder a la sugerencia
                            </h4>
                            <textarea 
                              value={responseBody} 
                              onChange={e => setResponseBody(e.target.value)} 
                              placeholder="Escribe tu respuesta oficial aquí. El empleado recibirá una notificación..." 
                              className="w-full p-4 bg-background border border-border/60 rounded-xl text-sm min-h-30 focus:ring-2 focus:ring-primary/20 outline-none transition-all text-foreground resize-none" 
                            />
                            <div className="flex flex-col sm:flex-row gap-3 mt-4">
                              <button 
                                onClick={() => handleRespond('ACCEPTED')} 
                                className="flex-1 py-3 bg-emerald-500 text-white rounded-xl text-xs font-bold hover:bg-emerald-600 transition-colors shadow-sm flex items-center justify-center gap-2"
                              >
                                <i className="bi bi-check-lg"></i> Aprobar Sugerencia
                              </button>
                              <button 
                                onClick={() => handleRespond('REJECTED')} 
                                className="flex-1 py-3 bg-card border border-destructive/30 text-destructive rounded-xl text-xs font-bold hover:bg-destructive hover:text-white transition-all flex items-center justify-center gap-2"
                              >
                                <i className="bi bi-x-lg"></i> Rechazar
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className={`mt-8 p-5 sm:p-6 rounded-2xl border ${statusConfig[selected.status].bgClass}`}>
                            <div className="flex items-center gap-2 mb-2">
                              <i className={`bi ${statusConfig[selected.status].icon} ${statusConfig[selected.status].textClass}`}></i>
                              <h4 className="text-sm font-bold text-foreground">Resolución Oficial</h4>
                            </div>
                            <p className="text-sm text-foreground/80 italic mt-2 bg-background/50 p-4 rounded-xl border border-border/40">
                              "{selected.response}"
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground hidden lg:block opacity-60">
                    <i className="bi bi-envelope-open text-6xl mb-4 block"></i>
                    <p className="text-lg font-medium">Selecciona un mensaje de la lista</p>
                    <p className="text-sm">para leer su contenido y responder</p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* ─── VISTA ENVIADOS ─── */}
          {view === 'SENT' && (
             <>
             <div className="w-full lg:w-112.5 lg:border-r border-border/40 flex flex-col bg-background/50 p-6 lg:p-8">
               <h3 className="font-bold text-xl mb-2 text-foreground">
                 Escribir Propuesta
               </h3>
               <p className="text-sm text-muted-foreground mb-8">Esta sugerencia será enviada directamente a la administración del Polígono Atalayas.</p>
               
               <form onSubmit={handleSubmitSuggestion} className="space-y-5">
                 <div className="space-y-1.5">
                   <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Asunto</label>
                   <input 
                    placeholder="Ej: Mejora en iluminación de la calle X" 
                    value={newTitle} 
                    onChange={e => setNewTitle(e.target.value)} 
                    className="w-full p-4 bg-card border border-border/60 rounded-2xl text-sm font-medium focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-foreground transition-all shadow-sm" 
                    required 
                   />
                 </div>
                 <div className="space-y-1.5">
                   <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Detalles de la propuesta</label>
                   <textarea 
                    placeholder="Explica tu idea detalladamente..." 
                    value={newContent} 
                    onChange={e => setNewContent(e.target.value)} 
                    className="w-full p-4 bg-card border border-border/60 rounded-2xl text-sm min-h-50 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-foreground transition-all shadow-sm resize-none" 
                    required 
                   />
                 </div>
                 <button 
                  disabled={isSubmitting} 
                  className="w-full py-4 bg-orange-500 text-white rounded-2xl font-bold text-sm disabled:opacity-50 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
                 >
                   {isSubmitting ? (
                     <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Enviando...</>
                   ) : (
                     <><i className="bi bi-send-fill"></i> Enviar a Atalayas EGM</>
                   )}
                 </button>
               </form>
             </div>

             <div className="flex-1 p-6 lg:p-8 bg-card/20">
               <div className="max-w-4xl mx-auto">
                 <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-8">
                   <h3 className="text-xl font-bold text-foreground">Historial de envíos</h3>
                   
                   <div className="flex flex-wrap gap-1.5 bg-card p-1 rounded-xl border border-border/40 shadow-sm w-full xl:w-auto">
                     {(['ALL', 'PENDING', 'ACCEPTED', 'REJECTED'] as const).map((f) => (
                       <button 
                        key={f} 
                        onClick={() => setFilter(f)} 
                        className={`flex-1 xl:flex-none px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                          filter === f ? 'bg-primary text-white shadow-sm' : 'text-muted-foreground hover:bg-muted'
                        }`}
                       >
                         {f === 'ALL' ? 'Todo' : statusConfig[f as SuggestionStatus].label}
                       </button>
                     ))}
                   </div>
                 </div>

                 <div className="space-y-4">
                   {loading ? (
                     <p className="text-center text-muted-foreground py-10">Cargando historial...</p>
                   ) : filteredSuggestions.length === 0 ? (
                    <div className="text-center text-muted-foreground py-16 bg-card border border-dashed border-border rounded-3xl">
                      <i className="bi bi-journal-x text-4xl mb-3 opacity-50 block"></i>
                      <p className="text-sm font-medium">Aún no has enviado sugerencias {filter !== 'ALL' ? 'en este estado' : ''}.</p>
                    </div>
                   ) : (
                     <AnimatePresence>
                       {filteredSuggestions.map((s) => (
                         <motion.div 
                          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                          key={s.id} 
                          className="group bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-sm relative transition-all hover:shadow-md"
                         >
                           <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-4">
                             <div>
                               <h4 className="font-bold text-lg text-foreground mb-1 pr-8">{s.title}</h4>
                               <div className="flex items-center gap-3">
                                 <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${statusConfig[s.status].bgClass} ${statusConfig[s.status].textClass}`}>
                                   <i className={`bi ${statusConfig[s.status].icon}`}></i>
                                   {statusConfig[s.status].label}
                                 </span>
                                 <span className="text-[11px] text-muted-foreground font-medium">
                                  <i className="bi bi-calendar3 mr-1"></i> {new Date(s.createdAt).toLocaleDateString()}
                                 </span>
                               </div>
                             </div>
                             
                             {s.status === 'PENDING' && (
                               <button 
                                onClick={() => handleDelete(s.id)} 
                                className="absolute top-6 right-6 sm:relative sm:top-0 sm:right-0 w-8 h-8 rounded-lg bg-card border border-border text-muted-foreground hover:bg-destructive hover:text-white hover:border-destructive flex items-center justify-center transition-all shadow-sm"
                                title="Retirar propuesta"
                               >
                                 <i className="bi bi-trash3 text-sm"></i>
                               </button>
                             )}
                           </div>
                           
                           <p className="text-sm text-muted-foreground leading-relaxed bg-muted/20 p-4 rounded-xl border border-border/40">
                             {s.content}
                           </p>
                           
                           {s.response && (
                             <div className="mt-6 pt-6 border-t border-border/50">
                               <div className="flex items-center gap-2 mb-2">
                                 <i className="bi bi-reply-all-fill text-primary"></i>
                                 <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Respuesta de Administración:</p>
                               </div>
                               <p className="text-sm font-medium italic text-foreground bg-primary/5 p-4 rounded-xl border-l-2 border-primary">
                                 "{s.response}"
                               </p>
                             </div>
                           )}
                         </motion.div>
                       ))}
                     </AnimatePresence>
                   )}
                 </div>
               </div>
             </div>
           </>
          )}

        </div>
      </main>
    </div>
  );
}