"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Sidebar from "@/components/ui/Sidebar";
import PageHeader from "@/components/ui/pageHeader";
import { API_ROUTES, fetchWithApiFallback } from "@/lib/utils";
import { motion } from "framer-motion";

export default function EventDetailPageEmployee() {
  const params = useParams();
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isRsvping, setIsRsvping] = useState(false);

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
    } catch (err) {
      console.error("Error al cargar el detalle:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRSVP = async (status: boolean) => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (!user.id || isRsvping) return;

    const previousEvent = { ...event };
    const newAttendees = [...(event.EventAttendees || [])];
    const index = newAttendees.findIndex((a) => a.user_id === user.id);

    // Optimistic Update
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
      fetchDetail(); // Refrescar para sincronizar con el servidor
    } catch (err) {
      setEvent(previousEvent);
      alert("No se pudo actualizar tu asistencia");
    } finally {
      setIsRsvping(false);
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

  const userRSVP = event.EventAttendees?.find((a: any) => a.user_id === user.id);
  const isConfirmed = userRSVP?.status === true;
  const isDeclined = userRSVP?.status === false;

  return (
    <div className="flex min-h-screen bg-[#f5f5f7] dark:bg-[#0d0d0f] font-sans">

      <main className="flex-1 overflow-auto flex flex-col no-scrollbar">
        <PageHeader
          title={event.title}
          description="Detalles del evento y asistencia"
          icon={<i className="bi bi-calendar-event"></i>}
          backUrl="/dashboard/employee/events"
        />

        <div className="p-6 lg:p-10 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* COLUMNA IZQUIERDA: CONTENIDO */}
          <div className="lg:col-span-8 space-y-6">
            <motion.section 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-[#1c1c1e] rounded-[3rem] p-8 lg:p-12 border border-black/5 shadow-sm"
            >
              {event.image_url && (
                <div className="mb-8 rounded-[2rem] overflow-hidden border border-black/5 shadow-inner">
                  <img
                    src={event.image_url}
                    alt={event.title}
                    className="w-full h-80 object-cover"
                  />
                </div>
              )}
              
              <h3 className="text-xl font-black mb-4 uppercase tracking-tighter italic">
                Sobre este evento
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
                      <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 flex items-center justify-center text-[10px] font-black uppercase overflow-hidden">
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

          {/* COLUMNA DERECHA: LOGÍSTICA Y ACCIONES */}
          <aside className="lg:col-span-4 space-y-6">
            <div className="sticky top-6 space-y-4">
              <div className="bg-white dark:bg-[#1c1c1e] rounded-[2.5rem] p-8 border border-black/5 shadow-sm">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-6 text-center italic">
                  Información clave
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
                    <span className="text-xs font-bold truncate">{event.location || "Ubicación por definir"}</span>
                  </div>
                </div>

                <div className="pt-6 border-t border-black/5">
                  <p className="text-[9px] font-black uppercase mb-4 text-center tracking-tighter italic">¿Vas a participar?</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleRSVP(true)}
                      disabled={isRsvping}
                      className={`py-3 rounded-xl text-[10px] font-black uppercase transition-all cursor-pointer ${
                        isConfirmed 
                          ? "bg-primary text-white shadow-lg scale-105" 
                          : "bg-zinc-100 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-white/10"
                      }`}
                    >
                      {isConfirmed ? <i className="bi bi-check-lg mr-1"></i> : null}
                      Asistiré
                    </button>
                    <button
                      onClick={() => handleRSVP(false)}
                      disabled={isRsvping}
                      className={`py-3 rounded-xl text-[10px] font-black uppercase transition-all cursor-pointer ${
                        isDeclined 
                          ? "bg-red-500/10 text-red-500 border border-red-500/20" 
                          : "bg-zinc-100 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-white/10"
                      }`}
                    >
                      No iré
                    </button>
                  </div>
                  {isConfirmed && (
                    <p className="text-[8px] text-primary font-bold text-center mt-4 uppercase tracking-widest animate-pulse">
                      ¡Tu lugar está reservado!
                    </p>
                  )}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}