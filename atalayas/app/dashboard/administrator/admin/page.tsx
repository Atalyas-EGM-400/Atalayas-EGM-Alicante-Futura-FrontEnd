'use client';

import { useEffect, useState } from 'react';
import Sidebar from '@/components/ui/Sidebar';
import PageHeader from '@/components/ui/pageHeader';
import Link from 'next/link';
import { API_ROUTES } from '@/lib/utils';

interface Stats {
  employees: number;
  courses: number;
  documents: number;
  avgProgress: number;
  pendingSuggestions: number;
  employeesWithoutOnboarding: number;
}

interface Course {
  id: string;
  title: string;
  isPublic: boolean;
  _count?: { Enrollment: number };
  avgProgress?: number;
}

interface Announcement {
  id: string;
  title: string;
  isPublic: boolean;
  createdAt: string;
}

interface Suggestion {
  id: string;
  title: string;
  createdAt: string;
  status: string;
}

function formatRelativeDate(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  if (diff === 0) return 'Hoy';
  if (diff === 1) return 'Ayer';
  if (diff < 7) return `Hace ${diff} días`;
  return new Date(dateStr).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    employees: 0, courses: 0, documents: 0,
    avgProgress: 0, pendingSuggestions: 0, employeesWithoutOnboarding: 0,
  });
  const [courses, setCourses] = useState<Course[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);

  const getHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem('token')}`,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersRes, coursesRes, announcementsRes, suggestionsRes, documentsRes, statsRes, enrollmentsRes] = 
          await Promise.all([
            fetch(API_ROUTES.USERS.GET_ALL, { headers: getHeaders() }),
            fetch(API_ROUTES.COURSES.GET_ALL, { headers: getHeaders() }),
            fetch(API_ROUTES.ANNOUNCEMENTS.GET_ALL, { headers: getHeaders() }),
            // 1. FILTRADO POR TARGET: Asegura que el Admin vea sugerencias DE empleados
            fetch(`${API_ROUTES.SUGGESTIONS.GET_ALL}?target=ADMIN`, { headers: getHeaders() }),
            fetch(API_ROUTES.DOCUMENTS.GET_ALL, { headers: getHeaders() }),
            fetch(API_ROUTES.STATS.GET_ADMIN, { headers: getHeaders() }),
            fetch(API_ROUTES.ENROLLMENTS.BASE, { headers: getHeaders() }),
          ]);

        const [users, coursesData, announcementsData, suggestionsData, documentsData, statsData, enrollmentsData] =
          await Promise.all([
            usersRes.json(), coursesRes.json(), announcementsRes.json(),
            suggestionsRes.json(), documentsRes.json(), statsRes.json(), enrollmentsRes.json(),
          ]);

          const sortedCourses = Array.isArray(coursesData) 
  ? [...coursesData].sort((a, b) => {
      // Si a es privado y b público, a va primero (-1)
      if (a.isPublic === b.isPublic) return 0;
      return a.isPublic ? 1 : -1;
    })
  : [];

        // 2. PROCESAMIENTO SEGURO DE SUGERENCIAS
        // Convertimos a array por si el backend envía un objeto de mapeo
        const allSuggestions = Array.isArray(suggestionsData) 
          ? suggestionsData 
          : (suggestionsData ? Object.values(suggestionsData) : []);

        // 3. FILTRADO ESTRICTO DE PENDIENTES
        // Esto soluciona que las "Rechazadas" sigan apareciendo
        const pendingSuggestionsList = allSuggestions.filter((s: any) => s.status === 'PENDING');

        const employees = Array.isArray(users)
          ? users.filter((u: any) => u.role === 'EMPLOYEE')
          : [];

        const employeesWithoutOnboarding = 
          (statsData?.onboarding?.total ?? 0) - (statsData?.onboarding?.finished ?? 0);

        // Actualización de estados
setCourses(sortedCourses.slice(0, 5));        setAnnouncements(Array.isArray(announcementsData) ? announcementsData.slice(0, 3) : []);
        
        // Solo mostramos las 3 sugerencias pendientes más recientes en la lista visual
        setSuggestions(pendingSuggestionsList.slice(0, 3));

        setStats({
          employees: statsData?.overview?.totalEmployees ?? employees.length,
          courses: statsData?.overview?.totalCourses ?? coursesData.length,
          documents: statsData?.overview?.totalDocuments ?? documentsData.length,
          avgProgress: statsData?.overview?.avgProgress ?? 0,
          // 4. CONTEO REAL: Usamos la longitud del array filtrado localmente
          pendingSuggestions: pendingSuggestionsList.length,
          employeesWithoutOnboarding,
        });

      } catch (err) {
        console.error("Error en Dashboard:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const statCards = [
    {
      label: 'Empleados',
      value: stats.employees,
      sub: stats.employeesWithoutOnboarding > 0,
      subColor: stats.employeesWithoutOnboarding > 0 ? 'text-amber-500' : 'text-emerald-500',
      icon: 'bi-people',
      iconColor: 'text-primary',
    },
    {
      label: 'Cursos activos',
      value: stats.courses,
      subColor: 'text-muted-foreground',
      icon: 'bi-journal-bookmark',
      iconColor: 'text-secondary',
    },
    {
      label: 'Progreso medio',
      value: `${stats.avgProgress}%`,
      sub: null,
      progress: stats.avgProgress,
      icon: 'bi-graph-up-arrow',
      iconColor: 'text-primary',
    },
    {
      label: 'Sugerencias',
      value: stats.pendingSuggestions,
      sub: stats.pendingSuggestions > 0
        ? ` `
        : 'Al día',
      subColor: stats.pendingSuggestions > 0 ? 'text-amber-500' : 'text-emerald-500',
      icon: 'bi-chat-left-text',
      iconColor: 'text-secondary',
    },
  ];

  const quickActions = [
    { label: 'Nuevo empleado',  icon: 'bi-person-add',   href: '/dashboard/administrator/employees/new' },
    { label: 'Nuevo curso',     icon: 'bi-journal-plus', href: '/dashboard/administrator/admin/courses/manage/new' },
    { label: 'Nuevo anuncio',   icon: 'bi-megaphone',    href: '/dashboard/administrator/admin/announcements/new' },
    { label: 'Documentos',      icon: 'bi-folder2-open', href: '/dashboard/documents' },
  ];

  return (
    <div className="flex min-h-screen bg-background font-sans">

      <main className="flex-1 overflow-auto flex flex-col">
        <PageHeader
          title="Atalayas Hub"
          description="Panel de gestión. Coordina formación, empleados y recursos de tu empresa."
          icon={<i className="bi bi-buildings-fill" />}
        />

        <div className="p-6 lg:p-10 flex-1 space-y-6">

          {/* ── STATS ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {statCards.map((stat) => (
              <div key={stat.label} className="bg-card rounded-3xl border border-border p-6 shadow-sm hover:shadow-md transition-all group">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{stat.label}</span>
                  <div className={`w-9 h-9 bg-muted/50 border border-border rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform ${stat.iconColor}`}>
                    <i className={`bi ${stat.icon}`} />
                  </div>
                </div>
                <div className="text-3xl font-black text-foreground tracking-tight mb-2">
                  {loading ? <div className="h-8 w-12 bg-muted animate-pulse rounded-md" /> : stat.value}
                </div>
                {stat.progress !== undefined && (
                  <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-700"
                      style={{ width: `${stat.progress}%` }}
                    />
                  </div>
                )}
                {stat.sub && (
                  <p className={`text-[11px] font-semibold mt-1 ${stat.subColor}`}>{stat.sub}</p>
                )}
              </div>
            ))}
          </div>

          {/* ── ALERTA ONBOARDING ── */}
          {/*{stats.employeesWithoutOnboarding > 0 && (
            <Link
              href="/dashboard/administrator/employees"
              className="flex items-center gap-3 px-5 py-3 bg-amber-50 border border-amber-200 rounded-2xl text-amber-700 text-xs font-semibold hover:bg-amber-100 transition-colors"
            >
              <i className="bi bi-exclamation-triangle-fill text-base" />
              <span>{stats.employeesWithoutOnboarding} empleado(s) no han completado el onboarding</span>
              <i className="bi bi-arrow-right ml-auto" />
            </Link>
          )}*/}

          {/* ── GRID PRINCIPAL ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Cursos con progreso */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-card border border-border rounded-[2rem] p-8 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-foreground tracking-tight">Cursos</h2>
                  <Link href="/dashboard/administrator/admin/courses/manage" className="text-xs font-black text-secondary uppercase tracking-widest hover:underline flex items-center gap-1">
                    Ver todos <i className="bi bi-arrow-right-short text-lg" />
                  </Link>
                </div>

                {loading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => <div key={i} className="h-14 bg-muted rounded-2xl animate-pulse" />)}
                  </div>
                ) : courses.length === 0 ? (
                  <div className="text-center py-10 border-2 border-dashed border-border rounded-3xl">
                    <p className="text-muted-foreground text-sm font-bold mb-4">Sin cursos</p>
                    <Link href="/dashboard/administrator/admin/courses/manage/new" className="bg-secondary text-secondary-foreground px-5 py-2.5 rounded-xl text-xs font-bold hover:opacity-90 transition">
                      Crear curso
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {courses.map((course) => {
                      const enrolled = course._count?.Enrollment ?? 0;
                      const prog = course.avgProgress ?? 0;
                      return (
                        <Link
                          key={course.id}
                          href={`/dashboard/administrator/admin/courses/manage/${course.id}`}
                          className="flex items-center gap-4 p-4 bg-background border border-border rounded-2xl hover:border-secondary/50 hover:shadow-sm transition-all group"
                        >
                          <div className="w-10 h-10 bg-muted border border-border rounded-xl flex items-center justify-center group-hover:text-secondary group-hover:bg-secondary/10 transition-colors text-muted-foreground">
                            <i className="bi bi-journal-bookmark text-lg" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-foreground truncate">{course.title}</p>
                            {/*<p className="text-[11px] text-muted-foreground">{enrolled} inscrito(s)</p>*/}
                          </div>
                          {enrolled > 0 && (
                            <div className="flex items-center gap-2 shrink-0">
                              <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                                <div className="h-full bg-secondary rounded-full" style={{ width: `${prog}%` }} />
                              </div>
                              <span className="text-[11px] font-bold text-muted-foreground w-8 text-right">{prog}%</span>
                            </div>
                          )}
                          <span className={`text-[10px] px-2.5 py-1 rounded-full font-black uppercase tracking-wider shrink-0 ${course.isPublic ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-muted text-muted-foreground border border-border'}`}>
                            {course.isPublic ? 'EGM' : 'Privado'}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Últimos anuncios */}
              <div className="bg-card border border-border rounded-[2rem] p-8 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-foreground tracking-tight">Últimos anuncios</h2>
                  <Link href="/dashboard/administrator/admin/announcements" className="text-xs font-black text-secondary uppercase tracking-widest hover:underline flex items-center gap-1">
                    Ver todos <i className="bi bi-arrow-right-short text-lg" />
                  </Link>
                </div>
                {loading ? (
                  <div className="space-y-3">{[1,2].map(i => <div key={i} className="h-12 bg-muted rounded-2xl animate-pulse" />)}</div>
                ) : announcements.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-6">Sin anuncios recientes</p>
                ) : (
                  <div className="space-y-3">
                    {announcements.map((a) => (
                      <Link
                        key={a.id}
                        href={`/dashboard/administrator/admin/announcements/${a.id}`}
                        className="flex items-center gap-4 p-4 bg-background border border-border rounded-2xl hover:border-secondary/50 transition-all group"
                      >
                        <div className="w-9 h-9 bg-muted rounded-xl flex items-center justify-center text-muted-foreground group-hover:text-secondary transition-colors">
                          <i className="bi bi-megaphone" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-foreground truncate">{a.title}</p>
                          <p className="text-[11px] text-muted-foreground">{formatRelativeDate(a.createdAt)}</p>
                        </div>
                        <span className={`text-[10px] px-2.5 py-1 rounded-full font-black uppercase tracking-wider shrink-0 ${a.isPublic ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-purple-50 text-purple-700 border border-purple-200'}`}>
                          {a.isPublic ? 'Global' : 'Empresa'}
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Columna derecha */}
            <div className="space-y-6">

              {/* Acciones rápidas */}
              <div className="bg-card border border-border rounded-[2rem] p-8 shadow-sm">
                <h2 className="text-xl font-bold text-foreground tracking-tight mb-6">Acciones rápidas</h2>
                <div className="flex flex-col gap-2">
                  {quickActions.map((action) => (
                    <Link
                      key={action.label}
                      href={action.href}
                      className="flex items-center gap-3 p-4 bg-muted/30 border border-border rounded-2xl hover:bg-background hover:border-secondary hover:shadow-md transition-all group"
                    >
                      <i className={`bi ${action.icon} text-xl text-primary group-hover:text-secondary group-hover:scale-110 transition-all`} />
                      <span className="text-sm font-bold text-foreground">{action.label}</span>
                      <i className="bi bi-chevron-right ml-auto text-xs text-muted-foreground group-hover:text-secondary transition-colors" />
                    </Link>
                  ))}
                </div>
              </div>

              {/* Sugerencias pendientes */}
              <div className="bg-card border border-border rounded-[2rem] p-8 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-foreground tracking-tight">Sugerencias</h2>
                </div>
                {loading ? (
                  <div className="space-y-3">{[1,2].map(i => <div key={i} className="h-10 bg-muted rounded-xl animate-pulse" />)}</div>
                ) : suggestions.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">Sin sugerencias pendientes</p>
                ) : (
                  <div className="space-y-4">
                    {suggestions.map((s) => (
                      <Link
                        key={s.id}
                        href={`/dashboard/administrator/admin/suggestions/${s.id}`}
                        className="flex items-start gap-3 group"
                      >
                        <div className="w-2 h-2 rounded-full bg-amber-400 border-2 border-amber-200 mt-1.5 shrink-0" />
                        <div>
                          <p className="text-sm font-bold text-foreground group-hover:text-secondary transition-colors leading-tight">{s.title}</p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">{formatRelativeDate(s.createdAt)}</p>
                        </div>
                      </Link>
                    ))}
                    <Link href="/dashboard/administrator/admin/suggestions" className="block text-xs text-secondary font-bold hover:underline mt-2">
                      Ver todas →
                    </Link>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      </main>
    </div>
  );
}