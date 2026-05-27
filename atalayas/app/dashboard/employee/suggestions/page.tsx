'use client';

import { useEffect, useState, useCallback } from "react";
import { API_ROUTES } from "@/lib/utils";
import Sidebar from "@/components/ui/Sidebar";
import PageHeader from "@/components/ui/pageHeader";

// --- TIPOS ---
type SuggestionStatus = 'ALL' | 'PENDING' | 'ACCEPTED' | 'REJECTED';

interface Suggestion {
  id: string;
  title: string;
  content: string;
  status: Exclude<SuggestionStatus, 'ALL'>;
  targetRole: "ADMIN" | "GENERAL_ADMIN";
  response?: string;
  createdAt: string;
}

const statusConfig: Record<Exclude<SuggestionStatus, 'ALL'>, { label: string; textColor: string; bgClass: string }> = {
  PENDING: { label: "Pendiente", textColor: "text-amber-500", bgClass: "bg-amber-500/10 border-amber-500/20" },
  ACCEPTED: { label: "Aceptada", textColor: "text-emerald-600", bgClass: "bg-emerald-500/10 border-emerald-500/20" },
  REJECTED: { label: "Rechazada", textColor: "text-destructive", bgClass: "bg-destructive/10 border-destructive/20" },
};

export default function EmployeeSuggestionsPage() {
  const [mounted, setMounted] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filter, setFilter] = useState<SuggestionStatus>('PENDING');

  // Estados para el Modal de Confirmación
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [suggestionToDelete, setSuggestionToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [targetRole, setTargetRole] = useState<"ADMIN" | "GENERAL_ADMIN">("ADMIN");

  const getToken = () => typeof window !== "undefined" ? localStorage.getItem("token") : "";

  const fetchMySuggestions = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(API_ROUTES.SUGGESTIONS.GET_MINE, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setSuggestions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error cargando sugerencias:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    fetchMySuggestions();
  }, [fetchMySuggestions]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const userStr = localStorage.getItem("user");
    const user = userStr ? JSON.parse(userStr) : null;
    
    if (!user?.id) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(API_ROUTES.SUGGESTIONS.CREATE, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          title,
          content,
          targetRole,
          authorId: user.id,
          authorRole: "EMPLOYEE",
        }),
      });

      if (res.ok) {
        setTitle("");
        setContent("");
        fetchMySuggestions();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Abre el modal y guarda la referencia de ID
  const openDeleteModal = (id: string) => {
    setSuggestionToDelete(id);
    setIsDeleteModalOpen(true);
  };

  // Ejecuta el borrado final desde el modal
  const confirmDelete = async () => {
    if (!suggestionToDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`${API_ROUTES.SUGGESTIONS.DELETE(suggestionToDelete)}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) {
        fetchMySuggestions();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
      setSuggestionToDelete(null);
    }
  };

  if (!mounted) return null;

  const filteredSuggestions = suggestions.filter(s => 
    filter === 'ALL' ? true : s.status === filter
  );

  return (
    <div className="flex min-h-screen bg-background font-sans text-foreground relative">

      <main className="flex-1 flex flex-col overflow-hidden">
        <PageHeader 
          title="Sugerencias"
          description="Envía tus propuestas a la empresa o a Atalayas EGM"
          icon={<i className="bi bi-chat-left-dots"></i>}
        />

        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          
          {/* FORMULARIO DE ENVÍO */}
          <div className="w-full lg:w-112.5 p-8 border-r border-border bg-card overflow-y-auto no-scrollbar">
            <h3 className="text-xl font-black mb-2 text-foreground">Tu voz cuenta</h3>
            <p className="text-sm text-muted-foreground mb-8">Participa en la mejora de tu entorno.</p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3 block">
                  Destinatario
                </label>
                <div className="flex bg-muted p-1.5 rounded-2xl border border-border">
                  <button 
                    type="button" 
                    onClick={() => setTargetRole("ADMIN")} 
                    className={`flex-1 py-2.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${targetRole === "ADMIN" ? "bg-card shadow-sm text-primary" : "text-muted-foreground"}`}
                  >
                    Mi empresa
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setTargetRole("GENERAL_ADMIN")} 
                    className={`flex-1 py-2.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${targetRole === "GENERAL_ADMIN" ? "bg-card shadow-sm text-primary" : "text-muted-foreground"}`}
                  >
                    Atalayas EGM
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <input 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  placeholder="Título breve..." 
                  className="w-full p-4 bg-background border border-border rounded-2xl text-sm font-bold focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-muted-foreground/50" 
                  required 
                />
                <textarea 
                  value={content} 
                  onChange={(e) => setContent(e.target.value)} 
                  placeholder="Explica tu sugerencia en detalle..." 
                  rows={8} 
                  className="w-full p-4 bg-background border border-border rounded-2xl text-sm focus:ring-1 focus:ring-primary outline-none resize-none transition-all placeholder:text-muted-foreground/50" 
                  required 
                />
              </div>

              <button 
                disabled={isSubmitting} 
                type="submit" 
                className="w-full py-4 bg-primary text-primary-foreground rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:shadow-lg hover:shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {isSubmitting ? "Enviando..." : "Enviar sugerencia"}
              </button>
            </form>
          </div>

          {/* LISTADO / HISTORIAL */}
          <div className="flex-1 p-8 bg-background/50 overflow-y-auto no-scrollbar">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Mi Historial</h3>
              
              <div className="flex gap-1.5 bg-card p-1 rounded-xl border border-border shadow-sm">
                {(['ALL', 'PENDING', 'ACCEPTED', 'REJECTED'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all cursor-pointer ${
                      filter === f ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {f === 'ALL' ? 'Todo' : statusConfig[f as Exclude<SuggestionStatus, 'ALL'>].label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-6 max-w-4xl mx-auto">
              {loading ? (
                <div className="space-y-4 animate-pulse">
                  {[1, 2, 3].map(i => <div key={i} className="h-32 bg-card rounded-[28px] border border-border" />)}
                </div>
              ) : filteredSuggestions.length === 0 ? (
                <div className="py-20 text-center border-2 border-dashed border-border rounded-[40px] opacity-40">
                  <p className="text-sm italic text-muted-foreground">No hay sugerencias en esta categoría.</p>
                </div>
              ) : (
                filteredSuggestions.map((s) => {
                  const config = statusConfig[s.status];
                  return (
                    <div key={s.id} className="group bg-card border border-border rounded-[32px] p-8 shadow-sm hover:shadow-md transition-all relative">
                      
                      <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-3">
                          <span className={`px-3 py-1 rounded-lg border text-[9px] font-black uppercase tracking-widest ${config.bgClass} ${config.textColor}`}>
                            {config.label}
                          </span>
                          <span className="text-[11px] text-muted-foreground font-bold">
                            Para: {s.targetRole === "ADMIN" ? "Mi Empresa" : "Atalayas EGM"}
                          </span>
                        </div>

                        <div className="flex items-center gap-4">
                          <span className="text-[10px] text-muted-foreground/60 font-bold">{new Date(s.createdAt).toLocaleDateString()}</span>
                          {s.status === "PENDING" && (
                            <button 
                              onClick={() => openDeleteModal(s.id)} // 👈 CAMBIO AQUÍ
                              className="w-8 h-8 rounded-xl bg-destructive/10 text-destructive opacity-0 group-hover:opacity-100 transition-all hover:bg-destructive hover:text-white flex items-center justify-center cursor-pointer"
                            >
                              <i className="bi bi-trash3 text-xs"></i>
                            </button>
                          )}
                        </div>
                      </div>

                      <h4 className="text-lg font-black text-foreground mb-2 group-hover:text-primary transition-colors">{s.title}</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed mb-6 whitespace-pre-wrap">{s.content}</p>

                      {s.response && (
                        <div className="bg-muted/50 p-5 rounded-2xl border border-border relative mt-4">
                          <div className="absolute -top-2 left-4 px-2 bg-card border border-border rounded text-[8px] font-black uppercase text-primary">
                            Respuesta Oficial
                          </div>
                          <p className="text-xs font-bold italic text-foreground/80 mt-1 leading-relaxed">
                            "{s.response}"
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </main>

      {/* --- MODAL DE CONFIRMACIÓN DE BORRADO --- */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Fondo desenfocado */}
          <div 
            className="absolute inset-0 bg-background/40 backdrop-blur-md transition-opacity"
            onClick={() => !isDeleting && setIsDeleteModalOpen(false)}
          />
          
          {/* Caja del Modal */}
          <div className="bg-card border border-border rounded-[32px] p-8 max-w-md w-full shadow-2xl relative z-10 scale-100 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mb-6">
              <i className="bi bi-exclamation-triangle text-xl"></i>
            </div>
            
            <h3 className="text-xl font-black text-foreground mb-2">¿Eliminar sugerencia?</h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-8">
              Esta acción es irreversible. Tu propuesta se borrará de forma permanente de tu historial y de los buzones correspondientes.
            </p>
            
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={confirmDelete}
                className="px-6 py-3 bg-destructive text-destructive-foreground rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-destructive/90 hover:shadow-lg hover:shadow-destructive/20 transition-all disabled:opacity-50"
              >
                {isDeleting ? "Eliminando..." : "Sí, eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}