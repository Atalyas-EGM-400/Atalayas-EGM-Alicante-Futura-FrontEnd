"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import PageHeader from "@/components/ui/pageHeader";
import { API_ROUTES, fetchWithApiFallback } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isRsvping, setIsRsvping] = useState(false);

  const [isEditMode, setIsEditMode] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => { fetchDetail(); }, [params.id]);

  useEffect(() => {
    if (selectedFile) {
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewUrl(null);
    }
  }, [selectedFile]);

  const fetchDetail = async () => {
    try {
      if (typeof params.id !== "string") return;
      const token = localStorage.getItem("token");
      const data = await fetchWithApiFallback(API_ROUTES.EVENTS.GET_BY_ID(params.id), {
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

  const enterEditMode = () => {
    setEditForm({
      ...event,
      event_date: event.event_date
        ? new Date(event.event_date).toISOString().slice(0, 16)
        : "",
    });
    setSelectedFile(null);
    setPreviewUrl(null);
    setIsEditMode(true);
  };

  const cancelEdit = () => {
    setIsEditMode(false);
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  const handleDownloadCSV = () => {
    if (!event.EventAttendees || event.EventAttendees.length === 0) {
      alert("No hay asistentes para exportar");
      return;
    }
    const confirmed = event.EventAttendees.filter((a: any) => a.status === true);
    const headers = ["Nombre", "Email", "Estado"];
    const rows = confirmed.map((rsvp: any) => [
      rsvp.User?.name || "N/A",
      rsvp.User?.email || "N/A",
      "Confirmado",
    ]);
    const csvContent = [headers.join(","), ...rows.map((e: string[]) => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `asistentes_${event.title.replace(/\s+/g, "_")}.csv`);
    link.style.visibility = "hidden";
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
      const res = await fetch(`${API_ROUTES.EVENTS.GET_ALL}/${params.id}/rsvp`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      fetchDetail();
    } catch {
      setEvent(previousEvent);
      alert("No se pudo actualizar tu asistencia");
    } finally {
      setIsRsvping(false);
    }
  };

  const handleUpdate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setEditLoading(true);
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("title", editForm.title);
      formData.append("description", editForm.description);
      formData.append("event_date", editForm.event_date);
      formData.append("location", editForm.location);
      if (editForm.max_capacity) formData.append("max_capacity", editForm.max_capacity);
      if (selectedFile) formData.append("file", selectedFile);

      const res = await fetch(API_ROUTES.EVENTS.UPDATE(params.id as string), {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (res.ok) {
        setSaveSuccess(true);
        await fetchDetail();
        setTimeout(() => {
          setIsEditMode(false);
          setSaveSuccess(false);
          setSelectedFile(null);
          setPreviewUrl(null);
        }, 900);
      } else {
        const errorData = await res.json();
        alert(errorData.message || "Error al actualizar");
      }
    } catch {
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
    } catch {
      alert("Error al eliminar");
    }
  };

  if (loading || !event)
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f5f7] dark:bg-[#0d0d0f]">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );

  const eventDate = new Date(event.event_date);
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const canEdit = event.companyId !== null && event.companyId === user.companyId;
  const userRSVP = event.EventAttendees?.find((a: any) => a.user_id === user.id);
  const isConfirmed = userRSVP !== undefined && !!userRSVP.status;
  const isDeclined = userRSVP !== undefined && !userRSVP.status;
  const confirmedCount = event.EventAttendees?.filter((a: any) => a.status === true).length || 0;
  const displayImage = previewUrl || event.image_url;

  return (
    <div className="flex min-h-screen bg-[#f5f5f7] dark:bg-[#0d0d0f] font-sans text-foreground">
      <main className="flex-1 flex flex-col overflow-auto no-scrollbar">

        {/* HEADER */}
        <PageHeader
          title={event.title}
          description="Panel de control del evento"
          icon={<i className="bi bi-calendar-event-fill" />}
          backUrl="/dashboard/administrator/admin/events"
          action={canEdit && (
            <div className="flex items-center gap-2">
              {isEditMode ? (
                <>
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-zinc-200 hover:bg-zinc-300 dark:bg-white/10 dark:hover:bg-white/15 text-zinc-700 dark:text-zinc-300 text-[10px] font-black uppercase tracking-widest transition-all hover:scale-105 cursor-pointer"
                  >
                    <i className="bi bi-x-lg" /> Salir de edición
                  </button>
                  <button
                    type="button"
                    onClick={handleUpdate}
                    disabled={editLoading}
                    className="flex items-center gap-1.5 px-5 py-2.5 rounded-2xl bg-primary hover:opacity-90 text-white text-[10px] font-black uppercase tracking-widest shadow-md hover:scale-[1.02] transition-all disabled:opacity-60 cursor-pointer"
                  >
                    {editLoading ? (
                      <><span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Guardando</>
                    ) : saveSuccess ? (
                      <><i className="bi bi-check2-circle" /> Guardado</>
                    ) : (
                      <><i className="bi bi-floppy2-fill" /> Guardar cambios</>
                    )}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={enterEditMode}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-primary hover:opacity-90 text-white text-[10px] font-black uppercase tracking-widest transition-all hover:scale-105 shadow-lg cursor-pointer"
                >
                  <i className="bi bi-pencil-fill" /> Editar evento
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(true)}
                className="w-10 h-10 flex items-center justify-center rounded-2xl bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-all hover:scale-105 cursor-pointer"
              >
                <i className="bi bi-trash3-fill" />
              </button>
            </div>
          )}
        />

        {/* BARRA MODO EDICIÓN */}
        <AnimatePresence initial={false}>
          {isEditMode && (
            <motion.div
              key="edit-bar"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              style={{ overflow: "hidden" }}
            >
              <div className="bg-primary/[0.07] border-b border-primary/20 px-6 lg:px-10">
                <div className="max-w-7xl mx-auto py-2.5 flex items-center justify-between gap-4">
                  <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.15em] text-primary">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    Modo edición — guarda los cambios para aplicarlos
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="px-4 py-2 rounded-xl bg-white dark:bg-white/5 border border-black/10 dark:border-white/10 text-[10px] font-black uppercase tracking-widest hover:bg-zinc-50 dark:hover:bg-white/10 transition-all"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleUpdate}
                      disabled={editLoading}
                      className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-primary hover:opacity-90 text-white text-[10px] font-black uppercase tracking-widest shadow-md hover:scale-[1.02] transition-all disabled:opacity-60"
                    >
                      {editLoading ? (
                        <><span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Guardando</>
                      ) : saveSuccess ? (
                        <><i className="bi bi-check2-circle" /> Guardado</>
                      ) : (
                        <><i className="bi bi-floppy2-fill" /> Guardar cambios</>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* CONTENIDO */}
        <div className="p-6 lg:p-10 flex-1">
          <div className="max-w-7xl mx-auto">
            <form onSubmit={handleUpdate}>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                {/* CUERPO PRINCIPAL */}
                <div className="lg:col-span-8 space-y-6">
                  <div className="bg-white dark:bg-[#1c1c1e] border border-black/5 dark:border-white/5 rounded-[3rem] overflow-hidden shadow-sm">

                    {/* Imagen */}
                    {displayImage ? (
                      <div className="relative group overflow-hidden">
                        <img
                          src={displayImage}
                          alt={event.title}
                          className="w-full object-cover max-h-105 transition-transform duration-700 group-hover:scale-[1.01]"
                        />
                        {isEditMode && (
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              className="px-5 py-2.5 bg-white text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl"
                            >
                              <i className="bi bi-image mr-2" />Cambiar
                            </button>
                            <button
                              type="button"
                              onClick={() => { setSelectedFile(null); setPreviewUrl(null); }}
                              className="px-5 py-2.5 bg-red-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl"
                            >
                              <i className="bi bi-trash3 mr-2" />Eliminar
                            </button>
                          </div>
                        )}
                      </div>
                    ) : isEditMode ? (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full h-40 flex flex-col items-center justify-center gap-3 border-b border-dashed border-black/10 dark:border-white/10 hover:border-primary/50 bg-zinc-50/50 dark:bg-zinc-900/30 text-zinc-400 hover:text-primary transition-all"
                      >
                        <i className="bi bi-cloud-arrow-up text-3xl" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Añadir imagen del evento</span>
                      </button>
                    ) : null}

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    />

                    {/* Texto */}
                    <div className="p-8 lg:p-12 space-y-6">
                      {/* Título */}
                      {isEditMode ? (
                        <input
                          type="text"
                          value={editForm.title ?? ""}
                          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                          required
                          placeholder="Título del evento"
                          className="w-full text-2xl lg:text-3xl font-black tracking-tight bg-transparent border-b-2 border-primary/40 focus:border-primary outline-none pb-2 transition-colors placeholder:text-zinc-300 dark:placeholder:text-zinc-600"
                        />
                      ) : (
                        <h1 className="text-2xl lg:text-3xl font-black tracking-tight leading-snug">
                          {event.title}
                        </h1>
                      )}

                      {/* Descripción */}
                      {isEditMode ? (
                        <textarea
                          rows={8}
                          value={editForm.description ?? ""}
                          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                          placeholder="Describe el evento…"
                          className="w-full p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-black/5 dark:border-white/5 outline-none text-base leading-relaxed font-medium resize-none focus:ring-2 ring-primary/30 transition-all placeholder:text-zinc-300 dark:placeholder:text-zinc-600"
                        />
                      ) : (
                        <p className="text-zinc-600 dark:text-zinc-400 text-base lg:text-lg leading-relaxed font-medium whitespace-pre-wrap">
                          {event.description || "Sin descripción disponible."}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Lista de confirmados */}
                  {!isEditMode && confirmedCount > 0 && (
                    <div className="bg-white dark:bg-[#1c1c1e] border border-black/5 dark:border-white/5 rounded-[3rem] p-8 lg:p-12 shadow-sm">
                      <h3 className="text-sm font-black mb-6 uppercase tracking-widest text-primary">
                        Confirmados ({confirmedCount})
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {event.EventAttendees?.filter((a: any) => a.status === true).map((rsvp: any) => (
                          <div
                            key={rsvp.user_id}
                            className="flex items-center gap-3 p-3 rounded-2xl bg-zinc-50 dark:bg-white/5 border border-black/5"
                          >
                            <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-[10px] font-black uppercase overflow-hidden shrink-0">
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
                  )}
                </div>

                {/* SIDEBAR */}
                <aside className="lg:col-span-4">
                  <div className="sticky top-6 space-y-4">
                    <AnimatePresence mode="wait">

                      {/* MODO EDICIÓN: campos logísticos */}
                      {isEditMode ? (
                        <motion.div
                          key="edit-options"
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 6 }}
                          transition={{ duration: 0.18 }}
                          className="bg-white dark:bg-[#1c1c1e] border border-black/5 dark:border-white/5 rounded-[2.5rem] p-7 shadow-sm space-y-5"
                        >
                          <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">
                            Datos del Evento
                          </h3>

                          <div className="space-y-3">
                            <div>
                              <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400 ml-1 block mb-1">Fecha y hora</label>
                              <input
                                type="datetime-local"
                                value={editForm.event_date ?? ""}
                                onChange={(e) => setEditForm({ ...editForm, event_date: e.target.value })}
                                className="w-full p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-black/5 dark:border-white/5 outline-none font-bold text-sm focus:ring-2 ring-primary/20"
                              />
                            </div>
                            <div>
                              <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400 ml-1 block mb-1">Ubicación</label>
                              <input
                                type="text"
                                value={editForm.location ?? ""}
                                onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                                className="w-full p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-black/5 dark:border-white/5 outline-none font-bold text-sm focus:ring-2 ring-primary/20"
                              />
                            </div>
                          </div>
                        </motion.div>

                      ) : (
                        /* MODO VISTA */
                        <motion.div
                          key="view-meta"
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 6 }}
                          transition={{ duration: 0.18 }}
                          className="space-y-4"
                        >
                          {/* Info logística */}
                          <div className="bg-white dark:bg-[#1c1c1e] border border-black/5 dark:border-white/5 rounded-[2.5rem] p-7 shadow-sm space-y-4">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">Información</h3>

                            <div className="flex items-start gap-3">
                              <span className="w-8 h-8 rounded-xl bg-zinc-100 dark:bg-white/5 flex items-center justify-center text-zinc-400 shrink-0 text-xs">
                                <i className="bi bi-calendar3" />
                              </span>
                              <div>
                                <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400 mb-0.5">Fecha</p>
                                <p className="text-sm font-bold">
                                  {eventDate.toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" })}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-start gap-3">
                              <span className="w-8 h-8 rounded-xl bg-zinc-100 dark:bg-white/5 flex items-center justify-center text-zinc-400 shrink-0 text-xs">
                                <i className="bi bi-clock" />
                              </span>
                              <div>
                                <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400 mb-0.5">Hora</p>
                                <p className="text-sm font-bold">
                                  {eventDate.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-start gap-3">
                              <span className="w-8 h-8 rounded-xl bg-zinc-100 dark:bg-white/5 flex items-center justify-center text-zinc-400 shrink-0 text-xs">
                                <i className="bi bi-geo-alt-fill" />
                              </span>
                              <div>
                                <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400 mb-0.5">Ubicación</p>
                                <p className="text-sm font-bold">{event.location}</p>
                              </div>
                            </div>
                          </div>

                          {/* RSVP */}
                          <div className="bg-white dark:bg-[#1c1c1e] border border-black/5 dark:border-white/5 rounded-[2.5rem] p-7 shadow-sm">
                            <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400 mb-4 text-center">¿Confirmarás tu asistencia?</p>
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                type="button"
                                onClick={() => handleRSVP(true)}
                                disabled={isRsvping}
                                className={`py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer disabled:opacity-60 ${
                                  isConfirmed
                                    ? "bg-primary text-white shadow-lg shadow-primary/20"
                                    : "bg-zinc-100 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-white/10"
                                }`}
                              >
                                {isConfirmed ? <><i className="bi bi-check-circle-fill mr-1" />Asistiré</> : "Asistiré"}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRSVP(false)}
                                disabled={isRsvping}
                                className={`py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer disabled:opacity-60 ${
                                  isDeclined
                                    ? "bg-red-500 text-white shadow-lg shadow-red-500/20"
                                    : "bg-zinc-100 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-white/10"
                                }`}
                              >
                                {isDeclined ? <><i className="bi bi-x-circle-fill mr-1" />No iré</> : "No iré"}
                              </button>
                            </div>
                          </div>

                          {/* CSV */}
                          {canEdit && (
                            <button
                              type="button"
                              onClick={handleDownloadCSV}
                              className="w-full py-5 bg-white dark:bg-[#1c1c1e] rounded-[2rem] border border-black/5 flex items-center justify-center gap-3 hover:bg-zinc-50 dark:hover:bg-white/5 transition-all shadow-sm cursor-pointer"
                            >
                              <i className="bi bi-download text-green-500"></i>
                              <span className="text-[10px] font-black uppercase tracking-widest">Exportar asistentes (.CSV)</span>
                            </button>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </aside>

              </div>
            </form>
          </div>
        </div>
      </main>

      {/* MODAL ELIMINAR */}
      <AnimatePresence>
        {isDeleteModalOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-110 flex items-end sm:items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ y: 40, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 40, opacity: 0, scale: 0.98 }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="bg-white dark:bg-[#1c1c1e] w-full max-w-md rounded-[3rem] p-10 shadow-2xl border border-white/10"
            >
              <div className="flex items-center justify-center mb-8">
                <div className="relative">
                  <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center">
                    <i className="bi bi-trash3-fill text-3xl text-red-500" />
                  </div>
                  <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                    <i className="bi bi-exclamation text-white text-sm font-black" />
                  </span>
                </div>
              </div>

              <div className="text-center mb-8">
                <h3 className="text-2xl font-black uppercase tracking-tight italic mb-3">¿Eliminar evento?</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Esta acción es <strong>permanente e irreversible</strong>. El evento desaparecerá para todos los usuarios de inmediato.
                </p>
              </div>

              <div className="bg-zinc-50 dark:bg-zinc-900/60 rounded-2xl px-5 py-4 mb-8 flex items-center gap-3 border border-black/5 dark:border-white/5">
                <i className="bi bi-calendar-event text-zinc-400" />
                <p className="text-sm font-bold truncate">{event.title}</p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleDelete}
                  className="w-full py-4 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-black uppercase tracking-widest transition-colors shadow-lg shadow-red-500/20"
                >
                  Sí, eliminar permanentemente
                </button>
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="w-full py-4 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}