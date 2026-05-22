"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Sidebar from "@/components/ui/Sidebar";
import PageHeader from "@/components/ui/pageHeader";
import { API_ROUTES, fetchWithApiFallback } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isRsvping, setIsRsvping] = useState(false);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [editForm, setEditForm] = useState<any>({});
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [editLoading, setEditLoading] = useState(false);

  useEffect(() => {
    fetchDetail();
  }, [params.id]);

  const fetchDetail = async () => {
    try {
      if (typeof params.id !== "string") return;
      const token = localStorage.getItem("token");
      const url = API_ROUTES.EVENTS.GET_BY_ID(params.id);
      const data = await fetchWithApiFallback(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEvent(data);
      setEditForm({
        ...data,
        event_date: data.event_date
          ? new Date(data.event_date).toISOString().slice(0, 16)
          : "",
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // --- FUNCIÓN PARA GENERAR Y DESCARGAR CSV ---
  const handleDownloadCSV = () => {
    if (!event.EventAttendees || event.EventAttendees.length === 0) {
      alert("No hay asistentes para exportar");
      return;
    }

    const confirmedAttendees = event.EventAttendees.filter((a: any) => a.status === true);
    
    // Cabeceras
    const headers = ["Nombre", "Email", "Estado"];
    
    // Filas
    const rows = confirmedAttendees.map((rsvp: any) => [
      rsvp.User?.name || "N/A",
      rsvp.User?.email || "N/A",
      "Confirmado"
    ]);

    // Construir contenido
    const csvContent = [
      headers.join(","),
      ...rows.map((e: string[]) => e.join(","))
    ].join("\n");

    // Crear Blob y descargar
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `asistentes_${event.title.replace(/\s+/g, '_')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleRSVP = async (status: boolean) => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (!user.id) return;

    const previousEvent = { ...event };
    const newAttendees = [...(event.EventAttendees || [])];
    const index = newAttendees.findIndex((a) => a.user_id === user.id);

    if (index !== -1) {
      newAttendees[index] = { ...newAttendees[index], status };
    } else {
      newAttendees.push({ user_id: user.id, status, User: user });
    }

    setEvent({ ...event, EventAttendees: newAttendees });
    setIsRsvping(true);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${API_ROUTES.EVENTS.GET_ALL}/${params.id}/rsvp`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status }),
        },
      );

      if (!res.ok) throw new Error();
      fetchDetail();
    } catch (err) {
      setEvent(previousEvent);
      alert("No se pudo actualizar tu asistencia");
    } finally {
      setIsRsvping(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditLoading(true);
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("title", editForm.title);
      formData.append("description", editForm.description);
      formData.append("event_date", editForm.event_date);
      formData.append("location", editForm.location);
      if (editForm.max_capacity) formData.append("max_capacity", editForm.max_capacity);
      if (selectedFile) formData.append("file", selectedFile); // Envío del archivo

      // USANDO TU RUTA DE UPDATE
      const res = await fetch(API_ROUTES.EVENTS.UPDATE(params.id as string), {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (res.ok) {
        setIsEditModalOpen(false);
        setSelectedFile(null);
        fetchDetail();
      } else {
        const errorData = await res.json();
        alert(errorData.message || "Error al actualizar");
      }
    } catch (err) {
      alert("Error de conexión");
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(API_ROUTES.EVENTS.DELETE(params.id as string), {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) router.push("/dashboard/administrator/admin/events");
    } catch (err) {
      alert("Error al eliminar");
    }
  };

  if (loading || !event)
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary" />
      </div>
    );

  const eventDate = new Date(event.event_date);
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const canEdit = event.companyId !== null && event.companyId === user.companyId;

  const userRSVP = event.EventAttendees?.find((a: any) => a.user_id === user.id);
  const hasRSVP = userRSVP !== undefined && userRSVP !== null;
  const isConfirmed = hasRSVP && !!userRSVP.status;
  const isDeclined = hasRSVP && !userRSVP.status;

  return (
    <div className="flex min-h-screen bg-[#f5f5f7] dark:bg-[#0d0d0f] font-sans">

      <main className="flex-1 overflow-auto flex flex-col no-scrollbar">
        <PageHeader
          title={event.title}
          description="Panel de control del evento"
          icon={<i className="bi bi-calendar-event"></i>}
          backUrl="/dashboard/administrator/admin/events"
          action={
            canEdit && (
      <button
        onClick={() => setIsEditModalOpen(true)}
        className="p-3 px-6 rounded-2xl bg-primary text-white text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg cursor-pointer"
      >
        <i className="bi bi-pencil-fill mr-2 "></i> Editar Evento
      </button>
    )
          }
        />

        <div className="p-6 lg:p-10 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-6">
            <motion.section className="bg-white dark:bg-[#1c1c1e] rounded-[3rem] p-8 lg:p-12 border border-black/5 shadow-sm">
              {event.image_url && (
                <div className="mb-8 rounded-[2rem] overflow-hidden border border-black/5 max-w-2xl mx-auto">
                  <img
                    src={event.image_url}
                    alt={event.title}
                    className="w-full h-64 object-cover"
                  />
                </div>
              )}
              <h3 className="text-xl font-black mb-4 uppercase tracking-tighter italic">
                Descripción
              </h3>
              <p className="text-zinc-500 dark:text-zinc-400 text-lg leading-relaxed whitespace-pre-wrap">
                {event.description || "Sin descripción disponible."}
              </p>

              <div className="mt-12 pt-12 border-t border-black/5">
                <h3 className="text-sm font-black mb-6 uppercase tracking-widest text-primary italic">
                  Confirmados ({event.EventAttendees?.filter((a: any) => a.status === true).length || 0})
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {event.EventAttendees?.filter((a: any) => a.status === true).map((rsvp: any) => (
                    <div key={rsvp.user_id} className="flex items-center gap-3 p-3 rounded-2xl bg-zinc-50 dark:bg-white/5 border border-black/5">
                      <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-[10px] font-black uppercase overflow-hidden">
                        {rsvp.User?.avatarUrl ? (
                          <img src={rsvp.User.avatarUrl} alt={rsvp.User.name} className="w-full h-full object-cover" />
                        ) : (
                          <span>{rsvp.User?.name?.charAt(0)}</span>
                        )}
                      </div>
                      <span className="text-[10px] font-bold truncate">{rsvp.User?.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.section>
          </div>

          <aside className="lg:col-span-4 space-y-6">
            <div className="sticky top-6 space-y-4">
              <div className="bg-white dark:bg-[#1c1c1e] rounded-[2.5rem] p-8 border border-black/5 shadow-sm">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-6 text-center italic">
                  Logística y RSVP
                </h4>
                <div className="space-y-4 mb-8">
                  <div className="flex items-center gap-3 p-4 bg-zinc-50 dark:bg-white/5 rounded-2xl">
                    <i className="bi bi-calendar3 text-primary"></i>
                    <span className="text-xs font-bold">
                      {eventDate.toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" })}
                    </span>
                  </div>
                   <div className="flex items-center gap-3 p-4 bg-zinc-50 dark:bg-white/5 rounded-2xl">
                    <i className="bi bi-clock text-primary"></i>
                    <span className="text-xs font-bold">
                      {eventDate.toLocaleTimeString("es-ES", { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-zinc-50 dark:bg-white/5 rounded-2xl">
                    <i className="bi bi-geo-alt-fill text-primary"></i>
                    <span className="text-xs font-bold truncate">{event.location}</span>
                  </div>
                </div>

                <div className="pt-6 border-t border-black/5">
                  <p className="text-[9px] font-black uppercase mb-4 text-center tracking-tighter">¿Confirmarás tu asistencia?</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleRSVP(true)}
                      className={`py-3 rounded-xl text-[10px] font-black uppercase transition-all cursor-pointer ${
                        isConfirmed ? "bg-primary text-white shadow-lg" : "bg-zinc-100 dark:bg-white/5 hover:bg-zinc-200"
                      }`}
                    >Asistiré</button>
                    <button
                      onClick={() => handleRSVP(false)}
                      className={`py-3 rounded-xl text-[10px] font-black uppercase transition-all cursor-pointer ${
                        isDeclined ? "bg-red-500 text-white shadow-lg" : "bg-zinc-100 dark:bg-white/5 hover:bg-zinc-200"
                      }`}
                    >No iré</button>
                  </div>
                </div>
              </div>

              {/* BOTÓN CSV ACTUALIZADO */}
              {canEdit && (
              <button 
                onClick={handleDownloadCSV}
                className="w-full py-5 bg-white dark:bg-[#1c1c1e] rounded-[2rem] border border-black/5 flex items-center justify-center gap-3 hover:bg-gray-50 transition-all group shadow-sm cursor-pointer"
              >
                <i className="bi bi-download text-green-500"></i>
                <span className="text-[10px] font-black uppercase tracking-widest">Lista de Asistentes (.CSV)</span>
              </button>
              )}
            {canEdit && (
              <button
                onClick={() => setIsDeleteModalOpen(true)}
                className="w-full py-4 text-red-500 text-[10px] font-black uppercase tracking-widest hover:underline transition-all cursor-pointer"
              >
                <i className="bi bi-trash3 mr-2"></i> Eliminar Evento
              </button>
            )}
            </div>
          </aside>
        </div>
      </main>

      {/* MODAL EDICIÓN ACTUALIZADO */}
      <AnimatePresence>
        {isEditModalOpen && (
          <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className="bg-white dark:bg-[#1c1c1e] w-full max-w-2xl rounded-[3rem] p-10 overflow-y-auto max-h-[90vh] shadow-2xl border border-white/10 no-scrollbar"
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-black italic tracking-tighter underline decoration-primary decoration-4">Editar Evento</h2>
                <button onClick={() => setIsEditModalOpen(false)} className="w-10 h-10 flex items-center justify-center rounded-full bg-zinc-100 dark:bg-white/5">
                  <i className="bi bi-x-lg"></i>
                </button>
              </div>
              <form onSubmit={handleUpdate} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="text-[10px] font-black uppercase ml-1 opacity-60 italic">Título del Evento</label>
                    <input
                      type="text"
                      value={editForm.title ?? ""}
                      onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                      className="w-full p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border-none outline-none font-bold focus:ring-2 ring-primary/20"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase ml-1 opacity-60 italic">Fecha y Hora</label>
                    <input
                      type="datetime-local"
                      value={editForm.event_date ?? ""}
                      onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })}
                      className="w-full p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border-none outline-none font-bold focus:ring-2 ring-primary/20"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase ml-1 opacity-60 italic">Ubicación</label>
                  <input
                    type="text"
                    value={editForm.location ?? ""}
                    onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                    className="w-full p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border-none outline-none font-bold focus:ring-2 ring-primary/20"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase ml-1 opacity-60 italic">Imagen del Evento (Opcional)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    className="w-full p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border-none outline-none font-bold focus:ring-2 ring-primary/20 text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase ml-1 opacity-60 italic">Descripción</label>
                  <textarea
                    rows={4}
                    value={editForm.description ?? ""}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    className="w-full p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border-none outline-none font-bold resize-none focus:ring-2 ring-primary/20"
                  />
                </div>
                <div className="pt-6 border-t border-black/5">
                  <button
                    type="submit"
                    disabled={editLoading}
                    className="w-full py-5 bg-primary text-white rounded-2xl font-black uppercase tracking-widest shadow-xl hover:scale-[1.02] transition-all disabled:opacity-50"
                  >
                    {editLoading ? "Sincronizando..." : "Actualizar Información"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL ELIMINAR */}
      <AnimatePresence>
        {isDeleteModalOpen && (
          <div className="fixed inset-0 z-110 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white dark:bg-[#1c1c1e] p-10 rounded-[3rem] max-w-sm text-center shadow-2xl">
              <div className="w-20 h-20 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <i className="bi bi-trash3-fill text-3xl"></i>
              </div>
              <h3 className="text-xl font-black mb-2 uppercase tracking-tighter italic">¿Borrar Evento?</h3>
              <p className="text-xs text-muted-foreground mb-8">Esta acción es irreversible.</p>
              <div className="flex flex-col gap-3">
                <button onClick={handleDelete} className="w-full py-4 bg-red-500 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-red-600 transition-colors shadow-lg">Confirmar Eliminación</button>
                <button onClick={() => setIsDeleteModalOpen(false)} className="w-full py-4 text-[10px] font-black uppercase opacity-60 hover:opacity-100 transition-opacity">Volver atrás</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}