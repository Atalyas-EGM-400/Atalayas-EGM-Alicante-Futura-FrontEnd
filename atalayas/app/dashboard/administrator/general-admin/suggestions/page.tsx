"use client";

import { useEffect, useState } from "react";
import { API_ROUTES } from "@/lib/utils";
import Sidebar from "@/components/ui/Sidebar";
import PageHeader from "@/components/ui/pageHeader";
import SearchBar from "@/components/ui/Searchbar";

interface Suggestion {
  id: string;
  title: string;
  content: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED" | "ARCHIVED";
  targetRole: "ADMIN" | "GENERAL_ADMIN";
  response?: string;
  respondedAt?: string;
  createdAt: string;
  User?: {
    name: string;
    email: string;
  };
  Company?: {
    name: string;
  };
}

const statusConfig = {
  PENDING: { label: "Pendientes", textColor: "text-amber-500", bgClass: "bg-amber-500/10 border-amber-500/20", icon: "bi-clock-history" },
  ACCEPTED: { label: "Aceptadas", textColor: "text-emerald-600", bgClass: "bg-emerald-500/10 border-emerald-500/20", icon: "bi-check-circle" },
  REJECTED: { label: "Rechazadas", textColor: "text-destructive", bgClass: "bg-destructive/10 border-destructive/20", icon: "bi-x-circle" },
  ARCHIVED: { label: "Archivadas", textColor: "text-muted-foreground", bgClass: "bg-muted border-border/50", icon: "bi-archive" },
};

export default function GeneralAdminSuggestionsPage() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Suggestion | null>(null);
  const [responseBody, setResponseBody] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [filter, setFilter] = useState<keyof typeof statusConfig | "ALL">("PENDING");
  const [searchQuery, setSearchQuery] = useState("");
  const [pendingCount, setPendingCount] = useState(0);

  const getToken = () => (typeof window !== "undefined" ? localStorage.getItem("token") : "");

  const updateSidebarCounter = (newValue: number) => {
    localStorage.setItem("count_suggestions", newValue.toString());
    window.dispatchEvent(new CustomEvent("local-storage-update", { detail: { suggestions: newValue } }));
  };

  const fetchSuggestions = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_ROUTES.SUGGESTIONS.GET_ALL}?target=GENERAL_ADMIN`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      setSuggestions(list);

      const count = list.filter((s) => s.status === "PENDING").length;
      setPendingCount(count);
      updateSidebarCounter(count);
    } catch (err) {
      console.error("Error fetching suggestions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuggestions();
  }, []);

  const handleRespond = async (status: "ACCEPTED" | "REJECTED") => {
    if (!selected) return;
    setActionLoading(true);
    try {
      const res = await fetch(API_ROUTES.SUGGESTIONS.RESPOND(selected.id), {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${getToken()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          response: responseBody.trim() || "La administración global ha revisado y procesado esta sugerencia.",
          status,
        }),
      });

      if (!res.ok) throw new Error("Error al responder");

      await fetchSuggestions();
      setSelected(null);
      setResponseBody("");
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const filtered = suggestions
    .filter((s) => (filter === "ALL" ? true : s.status === filter))
    .filter((s) =>
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.User?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.Company?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

  return (
    <div className="flex min-h-screen bg-muted/30 font-sans text-foreground transition-colors duration-300">

      <main className="flex-1 flex flex-col overflow-hidden">
        <PageHeader
          title="Buzón de Sugerencias"
          description={
            pendingCount > 0
              ? `Hay ${pendingCount} sugerencia${pendingCount > 1 ? "s" : ""} sin procesar.`
              : "Revisa las propuestas de mejora enviadas por empresas y usuarios del ecosistema."
          }
          icon={<i className="bi bi-mailbox2"></i>}
          action={
            <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Buscar sugerencia, empresa..." />
          }
        />

        <div className="flex-1 flex flex-col overflow-hidden">
          {/* BARRA DE FILTROS */}
          <div className="px-8 py-4 bg-background/50 border-b border-border/60 flex items-center justify-start gap-2 overflow-x-auto no-scrollbar">
            {(["ALL", "PENDING", "ACCEPTED", "REJECTED", "ARCHIVED"] as const).map((f) => (
              <button
                key={f}
                onClick={() => { setFilter(f); setSelected(null); }}
                className={`px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all shrink-0 border ${
                  filter === f
                    ? "bg-primary text-white border-primary shadow-md"
                    : "bg-card text-muted-foreground border-border/60 hover:border-primary/40 hover:text-primary"
                }`}
              >
                {f === "ALL" ? "Todas las propuestas" : statusConfig[f as keyof typeof statusConfig].label}
              </button>
            ))}
          </div>

          <div className={`flex-1 grid overflow-hidden transition-all duration-500 ${selected ? "lg:grid-cols-[1fr_450px]" : "grid-cols-1"}`}>
            
            {/* COLUMNA LISTA */}
            <div className="overflow-y-auto p-6 lg:p-8 space-y-4 no-scrollbar">
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-32 bg-card border border-border/60 rounded-[24px] animate-pulse" />
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-32 bg-card rounded-[32px] border border-dashed border-border/60">
                  <div className="w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center text-muted-foreground/30 text-4xl mb-6 shadow-inner">
                    <i className="bi bi-chat-square-dots"></i>
                  </div>
                  <h3 className="text-foreground font-black text-xs uppercase tracking-[0.2em]">Sin resultados</h3>
                  <p className="text-muted-foreground text-xs mt-1">No se encontraron sugerencias bajo este criterio.</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {filtered.map((s) => {
                    const status = statusConfig[s.status];
                    const isSelected = selected?.id === s.id;
                    return (
                      <div
                        key={s.id}
                        onClick={() => setSelected(isSelected ? null : s)}
                        className={`group bg-card rounded-[24px] p-6 cursor-pointer border transition-all duration-300 flex items-center justify-between gap-6 ${
                          isSelected
                            ? "border-primary ring-4 ring-primary/5 shadow-xl -translate-y-1"
                            : "border-border/60 hover:border-primary/30 hover:shadow-lg"
                        }`}
                      >
                        <div className="flex items-center gap-5 min-w-0">
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 text-2xl transition-colors duration-300 ${isSelected ? "bg-primary text-white" : "bg-muted/50 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"}`}>
                            <i className="bi bi-lightbulb"></i>
                          </div>
                          <div className="min-w-0">
                            <p className="text-primary text-[10px] font-black uppercase tracking-widest mb-1 truncate">
                              {s.Company?.name || "Ecosistema"}
                            </p>
                            <h3 className="text-foreground text-base font-bold mb-1 truncate group-hover:text-primary transition-colors">
                              {s.title}
                            </h3>
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground text-xs">Por {s.User?.name}</span>
                              <span className="w-1 h-1 rounded-full bg-border" />
                              <span className="text-muted-foreground/50 text-[10px] uppercase font-black tracking-tighter">
                                {new Date(s.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 shrink-0">
                          <span className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[10px] font-black uppercase tracking-wider ${status.bgClass} ${status.textColor}`}>
                            <i className={`bi ${status.icon}`}></i>
                            {status.label.slice(0, -1)}
                          </span>
                          <i className={`bi bi-chevron-right text-muted-foreground/30 transition-transform duration-300 ${isSelected ? "rotate-90 text-primary" : "group-hover:translate-x-1"}`}></i>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* PANEL DE DETALLE */}
            {selected && (
              <div className="overflow-y-auto border-l border-border/60 bg-card p-8 shadow-[-20px_0_40px_rgba(0,0,0,0.03)] animate-in slide-in-from-right-10 duration-500 no-scrollbar">
                <div className="flex items-center justify-between mb-8">
                  <span className={`px-3 py-1.5 rounded-lg border text-[10px] font-black uppercase tracking-widest ${statusConfig[selected.status].bgClass} ${statusConfig[selected.status].textColor}`}>
                    {statusConfig[selected.status].label.slice(0, -1)}
                  </span>
                  <button
                    onClick={() => setSelected(null)}
                    className="w-10 h-10 rounded-full flex items-center justify-center bg-muted text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all hover:rotate-90"
                  >
                    <i className="bi bi-x-lg"></i>
                  </button>
                </div>

                <div className="mb-10">
                  <div className="w-16 h-16 bg-primary/5 text-primary rounded-[22px] flex items-center justify-center text-3xl mb-6 border border-primary/10">
                    <i className="bi bi-chat-quote"></i>
                  </div>
                  <h2 className="text-foreground text-2xl font-black mb-3 tracking-tight leading-tight">
                    {selected.title}
                  </h2>
                  <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-2xl border border-border/40">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs uppercase">
                      {selected.User?.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-foreground text-[11px] font-bold leading-none">{selected.User?.name}</p>
                      <p className="text-muted-foreground text-[10px] font-medium">{selected.Company?.name}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-muted/20 p-6 rounded-[24px] border border-border/40 mb-10">
                  <p className="text-muted-foreground/60 text-[9px] font-black uppercase tracking-[0.2em] mb-4">Mensaje de la Propuesta</p>
                  <p className="text-foreground text-sm font-medium leading-relaxed italic">
                    "{selected.content}"
                  </p>
                </div>

                {selected.status === "PENDING" ? (
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <label className="text-muted-foreground/60 text-[10px] font-black uppercase tracking-widest ml-1">Comentario de Respuesta</label>
                      <textarea
                        value={responseBody}
                        onChange={(e) => setResponseBody(e.target.value)}
                        placeholder="Explica los motivos de la decisión o pasos a seguir..."
                        className="w-full p-4 bg-card border-2 border-border focus:border-primary rounded-[20px] text-sm font-medium outline-none transition-all resize-none h-32 shadow-inner"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => handleRespond("ACCEPTED")}
                        disabled={actionLoading}
                        className="py-4 bg-emerald-500 text-white rounded-[18px] font-black text-[10px] uppercase tracking-[0.2em] hover:bg-emerald-600 hover:shadow-lg hover:shadow-emerald-500/20 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {actionLoading ? <i className="bi bi-arrow-repeat animate-spin"></i> : <i className="bi bi-check-lg"></i>}
                        Aceptar
                      </button>
                      <button
                        onClick={() => handleRespond("REJECTED")}
                        disabled={actionLoading}
                        className="py-4 bg-destructive/10 text-destructive border border-destructive/20 rounded-[18px] font-black text-[10px] uppercase tracking-[0.2em] hover:bg-destructive hover:text-white transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        <i className="bi bi-x-circle"></i>
                        Rechazar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-card border-2 border-dashed border-border/60 rounded-[28px] p-6 space-y-4">
                    <p className="text-muted-foreground/60 text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
                      <i className="bi bi-reply-all"></i> Seguimiento Administrativo
                    </p>
                    <p className="text-foreground text-sm font-bold leading-relaxed">
                      {selected.response || "No se proporcionaron comentarios adicionales."}
                    </p>
                    <p className="text-muted-foreground text-[10px] font-medium pt-2 border-t border-border/40">
                      Gestionado el {new Date(selected.respondedAt || selected.createdAt).toLocaleDateString("es-ES", { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}