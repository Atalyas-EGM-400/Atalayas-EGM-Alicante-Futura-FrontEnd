"use client";

import { useState, useEffect, useCallback } from "react";
import Sidebar from "@/components/ui/Sidebar";
import PageHeader from "@/components/ui/pageHeader";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { API_ROUTES, fetchWithApiFallback } from "@/lib/utils";
import NotificationBell from "@/components/ui/NotificationBell";

const PREMIUM_GRADIENT_COLS = "from-teal-400 via-amber-400 to-orange-500";

// Interfaz unificada para Announcements y Events
interface UnifiedItem {
  id: string;
  title: string;
  displayContent: string;
  media: string | null;
  type: "ANUNCIO" | "EVENTO";
  badge: string;
  href: string;
  date: string;
}

interface ActivityItem {
  id: string;
  type:
    | "CONTENT_COMPLETED"
    | "COURSE_ENROLLED"
    | "DOCUMENT_ADDED"
    | "ANNOUNCEMENT"
    | "TASK_COMPLETED";
  title: string;
  description: string;
  icon: string;
  createdAt: string;
  href?: string;
}

export default function EmployeeDashboard() {
  const [mounted, setMounted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [slides, setSlides] = useState<UnifiedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [activityLoading, setActivityLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastResetDate, setLastResetDate] = useState<Date | null>(null);

  useEffect(() => {
    setMounted(true);
    fetchDashboardData();
    fetchActivity();
    fetchUnreadCount();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      // Traemos ambos recursos en paralelo
      const [announcementsData, eventsData] = await Promise.all([
        fetchWithApiFallback(API_ROUTES.ANNOUNCEMENTS.GET_ALL, { headers }),
        fetchWithApiFallback(API_ROUTES.EVENTS?.GET_ALL || "/api/events", { headers }),
      ]);

      // Normalización de Anuncios
      const mappedAnnouncements: UnifiedItem[] = (Array.isArray(announcementsData) ? announcementsData : []).map((a) => ({
        id: a.id,
        title: a.title,
        displayContent: a.content,
        media: a.imageUrl,
        type: "ANUNCIO",
        badge: a.isPublic ? "Público" : a.Company?.name || "Mi Empresa",
        href: `/dashboard/employee/announcements/${a.id}`,
        date: a.createdAt,
      }));

      // Normalización de Eventos (mapeando image_url y created_at del esquema)
      const mappedEvents: UnifiedItem[] = (Array.isArray(eventsData) ? eventsData : []).map((e) => ({
        id: e.id,
        title: e.title,
        displayContent: e.description || `Evento programado para el ${new Date(e.event_date).toLocaleDateString()}`,
        media: e.image_url,
        type: "EVENTO",
        badge: e.companyId === null ? "Público" : (e.Company?.name || "Mi empresa"),
        href: `/dashboard/employee/events/${e.id}`,
        date: e.created_at || e.event_date,
      }));

      // Unificar y ordenar por fecha descendente
      const combined = [...mappedAnnouncements, ...mappedEvents].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      setSlides(combined.slice(0, 6));
    } catch (err) {
      console.error("Error al cargar datos del carrusel:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchActivity = async () => {
    try {
      const token = localStorage.getItem("token");
      const data = await fetchWithApiFallback(API_ROUTES.ACTIVITY.GET_MY(3), {
        headers: { Authorization: `Bearer ${token}` },
      });
      setActivity(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error al cargar actividad:", err);
    } finally {
      setActivityLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const token = localStorage.getItem("token");
      const data = await fetchWithApiFallback(API_ROUTES.NOTIFICATIONS.COUNT, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUnreadCount(data ?? 0);
    } catch (err) {
      console.error("Error al cargar contador:", err);
    }
  };

  const handleNotificationReset = async () => {
    if (unreadCount === 0) return;
    try {
      const token = localStorage.getItem("token");
      const now = new Date();
      setLastResetDate(now);
      setUnreadCount(0);
      
      await fetchWithApiFallback(API_ROUTES.NOTIFICATIONS.RESET, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err) {
      console.error("Error al resetear notificaciones:", err);
    }
  };

  function formatRelativeDate(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Hoy";
    if (diffDays === 1) return "Ayer";
    if (diffDays < 7) return `Hace ${diffDays} días`;
    return date.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
  }

  const nextSlide = useCallback(() => {
    if (slides.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  const prevSlide = useCallback(() => {
    if (slides.length === 0) return;
    setCurrentIndex((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  }, [slides.length]);

  useEffect(() => {
    if (!mounted || slides.length <= 1) return;
    const timer = setTimeout(() => nextSlide(), 10000);
    return () => clearTimeout(timer);
  }, [currentIndex, mounted, nextSlide, slides.length]);

  if (!mounted) return null;

  const actualItem = slides[currentIndex];

  const quickActions = [
    { title: "Mis Cursos", desc: "Continúa con tu progreso.", icon: "bi-journal-bookmark-fill", color: "text-primary", href: "/dashboard/employee/courses" },
    { title: "Onboarding", desc: "Explora tu ruta actual.", icon: "bi-rocket-takeoff-fill", color: "text-secondary", href: "/dashboard/employee/onboarding" },
    { title: "Documentos", desc: "Manuales y normativas.", icon: "bi-file-earmark-text-fill", color: "text-primary", href: "/dashboard/documents" },
    { title: "Servicios", desc: "Descubre tus beneficios", icon: "bi-briefcase-fill", color: "text-secondary", href: "/dashboard/employee/services" },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-background font-sans">

      <motion.main
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="flex-1 overflow-y-auto flex flex-col relative no-scrollbar"
      >
        <PageHeader
          title="Mi Panel"
          description="Bienvenido. Mantente al día con las novedades y eventos corporativos."
          icon={<i className="bi bi-person-workspace"></i>}
          action={
            <NotificationBell
              unreadCount={unreadCount}
              onReset={handleNotificationReset}
              latestItems={slides}
              lastResetDate={lastResetDate} // Usamos los slides unificados para la campana
            />
          }
        />

        <div className="p-6 lg:p-10 flex-1 space-y-8">
          {/* ── CARRUSEL DINÁMICO ── */}
          <section className="space-y-4">
            <div className="px-4">
              <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/70">
                Destacados de la empresa
              </h2>
            </div>

            {loading ? (
              <div className="w-full aspect-video md:aspect-21/9 lg:aspect-25/8 bg-muted animate-pulse rounded-[3.5rem]" />
            ) : slides.length > 0 && actualItem ? (
              <div className={`relative p-[1.5px] rounded-[3.5rem] transition-all duration-500 bg-transparent hover:bg-linear-to-r ${PREMIUM_GRADIENT_COLS} shadow-2xl group`}>
                <Link
                  href={actualItem.href}
                  className="relative block w-full aspect-video md:aspect-21/9 lg:aspect-25/8 rounded-[calc(3.5rem-1.5px)] overflow-hidden bg-card cursor-pointer"
                >
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={`${actualItem.type}-${actualItem.id}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.25, ease: "linear" }}
                      className="absolute inset-0"
                    >
                      <div
                        className="absolute inset-0 bg-cover bg-center transition-transform duration-[2s] ease-out group-hover:scale-105"
                        style={{
                          backgroundImage: `url(${actualItem.media || "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070"})`,
                        }}
                      />
                      <div className="absolute inset-0 bg-linear-to-r from-black/90 via-black/30 to-transparent z-10" />

                      <div className="absolute inset-0 z-20 flex flex-col justify-center p-10 md:p-20">
                        <div className="max-w-3xl space-y-4">
                          <div className="flex gap-2">
                            <span
                              className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-[0.2em] backdrop-blur-md text-white border border-white/20 ${actualItem.type === "EVENTO" ? "bg-orange-500/40" : "bg-blue-500/40"}`}
                            >
                              {actualItem.badge}
                            </span>
                            <span className="px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-[0.2em] backdrop-blur-md text-white border border-white/10 bg-purple-700">
                              {actualItem.type}
                            </span>
                          </div>

                          <h3 className="text-4xl md:text-6xl font-black tracking-tighter leading-[0.95] text-white">
                            {actualItem.title}
                          </h3>
                          <p className="text-white/70 text-base md:text-lg font-medium max-w-xl leading-relaxed line-clamp-2">
                            {actualItem.displayContent}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  </AnimatePresence>

                  {slides.length > 1 && (
                    <>
                      <button
                        onClick={(e) => { e.preventDefault(); prevSlide(); }}
                        className="absolute left-1 inset-y-0 z-30 flex items-center bg-transparent border-none text-white/20 hover:text-white transition-all duration-300"
                      >
                        <i className="bi bi-chevron-left text-7xl scale-y-[1.5] scale-x-[0.5] font-thin"></i>
                      </button>
                      <button
                        onClick={(e) => { e.preventDefault(); nextSlide(); }}
                        className="absolute right-1 inset-y-0 z-30 flex items-center bg-transparent border-none text-white/20 hover:text-white transition-all duration-300"
                      >
                        <i className="bi bi-chevron-right text-7xl scale-y-[1.5] scale-x-[0.5] font-thin"></i>
                      </button>
                    </>
                  )}
                </Link>
              </div>
            ) : (
              <div className="w-full aspect-video md:aspect-21/9 lg:aspect-25/8 bg-muted rounded-[3.5rem] flex items-center justify-center border-2 border-dashed border-border">
                <p className="text-muted-foreground font-bold uppercase tracking-widest text-xs">
                  No hay novedades disponibles
                </p>
              </div>
            )}
          </section>

          {/* ── GRID DE CONTENIDO ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2 space-y-6">
              <h2 className="text-xl font-bold tracking-tight px-2 text-foreground">Accesos Rápidos</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {quickActions.map((item, i) => (
                  <Link key={i} href={item.href} className="p-8 bg-card border border-border rounded-[2.5rem] hover:border-primary/50 hover:shadow-xl transition-all group flex items-start gap-5">
                    <div className={`w-14 h-14 rounded-2xl bg-muted flex items-center justify-center text-2xl ${item.color} group-hover:scale-110 transition-transform`}>
                      <i className={`bi ${item.icon}`}></i>
                    </div>
                    <div>
                      <h4 className="font-extrabold text-foreground tracking-tight">{item.title}</h4>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{item.desc}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            <div className="space-y-6 pb-10">
              <h2 className="text-xl font-bold tracking-tight px-2 text-foreground">Última Actividad</h2>
              <div className="bg-card border border-border rounded-[2.5rem] p-8 shadow-sm space-y-8">
                {activityLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="pl-6 border-l-2 border-muted space-y-2 animate-pulse">
                      <div className="h-2 w-16 bg-muted rounded" />
                      <div className="h-3 w-32 bg-muted rounded" />
                    </div>
                  ))
                ) : activity.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">Sin actividad reciente</p>
                ) : (
                  activity.map((item) => (
                    <div key={item.id} className="relative pl-6 border-l-2 border-muted hover:border-primary transition-colors group">
                      <div className="absolute -left-1.75 top-0 w-3 h-3 rounded-full bg-background border-2 border-primary" />
                      <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">{formatRelativeDate(item.createdAt)}</p>
                      {item.href ? (
                        <Link href={item.href}>
                          <h5 className="text-sm font-bold text-foreground leading-none mb-2 flex items-center gap-2 group-hover:text-primary transition-colors">
                            <i className={`bi ${item.icon} text-xs`} /> {item.title}
                          </h5>
                        </Link>
                      ) : (
                        <h5 className="text-sm font-bold text-foreground leading-none mb-2 flex items-center gap-2">
                          <i className={`bi ${item.icon} text-xs`} /> {item.title}
                        </h5>
                      )}
                      <p className="text-xs text-muted-foreground leading-snug">{item.description}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.main>
    </div>
  );
}