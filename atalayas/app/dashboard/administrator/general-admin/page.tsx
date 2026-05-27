'use client';

import { useEffect, useState } from 'react';
import Sidebar from '@/components/ui/Sidebar';
import PageHeader from '@/components/ui/pageHeader';
import Link from 'next/link';
import { API_ROUTES } from '@/lib/utils';

interface Stats {
  employees: number;
  publicCourses: number;
  publicServices: number;
  suggestions: number;
}

interface Course {
  id: string;
  title: string;
  isPublic: boolean;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({ 
    employees: 0, 
    publicCourses: 0, 
    publicServices: 0, 
    suggestions: 0 
  });
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };
        
        // Ejecutamos peticiones en paralelo
        const [usersRes, coursesRes, servicesRes, suggestionsRes] = await Promise.all([
          fetch(API_ROUTES.USERS.GET_ALL, { headers }),
          fetch(API_ROUTES.COURSES.GET_ALL, { headers }),
          fetch(API_ROUTES.SERVICES.GET_ALL, { headers }),
          fetch(`${API_ROUTES.SUGGESTIONS.GET_ALL}?target=ADMIN`, { headers }),
        ]);

        const usersData = await usersRes.json();
        const coursesData = await coursesRes.json();
        const servicesData = await servicesRes.json();
        const suggestionsData = await suggestionsRes.json();

        // --- PROCESAMIENTO Y FILTRADO ---

        // 1. Filtrar solo cursos públicos para la lista y el conteo
        const allCourses = Array.isArray(coursesData) ? coursesData : [];
        const publicCoursesList = allCourses.filter((c: any) => c.isPublic === true);

        // 2. Filtrar servicios públicos
        const allServices = Array.isArray(servicesData) ? servicesData : (servicesData?.data || []);
        const publicServicesCount = allServices.filter((s: any) => s.isPublic === true).length;

        // 3. Usuarios (Filtrar por rol EMPLOYEE)
        const employeesCount = Array.isArray(usersData) 
          ? usersData.filter((u: any) => u.role === 'EMPLOYEE').length 
          : 0;

        // 4. Sugerencias pendientes
        const pendingSuggestions = Array.isArray(suggestionsData) 
          ? suggestionsData.filter((s: any) => s.status === 'PENDING').length 
          : 0;

        setCourses(publicCoursesList);
        setStats({
          employees: employeesCount,
          publicCourses: publicCoursesList.length,
          publicServices: publicServicesCount,
          suggestions: pendingSuggestions,
        });
      } catch (error) {
        console.error("Error cargando datos del dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const statCards = [
    { label: 'Total de Usuarios', value: stats.employees, icon: 'bi-people' },
    { label: 'Cursos Públicos', value: stats.publicCourses, icon: 'bi-journal-code' },
    { label: 'Servicios Públicos', value: stats.publicServices, icon: 'bi-briefcase' },
    { 
      label: 'Sugerencias Pendientes', 
      value: stats.suggestions, 
      icon: 'bi-chat-left-dots',
      alert: stats.suggestions > 0 
    },
  ];

  const quickActions = [
    { label: 'Alta de empleado', icon: 'bi-person-plus', href: '/dashboard/administrator/employees/new' },
    { label: 'Diseñar curso', icon: 'bi-journal-plus', href: '/dashboard/administrator/general-admin/courses/manage/new' },
    { label: 'Añadir servicio', icon: 'bi-briefcase', href: '/dashboard/administrator/general-admin/services/new' },
    { label: 'Ver sugerencias', icon: 'bi-chat-right-text', href: '/dashboard/administrator/general-admin/suggestions' },
  ];

  return (
    <div className="flex min-h-screen bg-background font-sans text-foreground transition-colors duration-300">

      <main className="flex-1 overflow-auto flex flex-col relative">
        <PageHeader 
          title="Panel de Control Público"
          description="Gestión y supervisión de los activos visibles del ecosistema."
          icon={<i className="bi bi-grid-fill"></i>}
        />

        <div className="p-6 lg:p-10 space-y-8 max-w-7xl mx-auto w-full">
          
          {/* ── STATS GRID ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {statCards.map((stat) => (
              <div 
                key={stat.label} 
                className={`bg-card rounded-[20px] p-6 border border-border shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group flex flex-col justify-between h-35 ${stat.alert ? 'ring-1 ring-primary/50' : ''}`}
              >
                <div className="absolute top-0 left-0 w-full h-0.75 bg-linear-to-r from-primary to-secondary opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                <div className="flex items-start justify-between w-full">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mt-1">{stat.label}</h3>
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center shadow-sm transition-all duration-300 ${stat.alert ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-muted border border-border text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary group-hover:border-primary/30'}`}>
                    <i className={`bi ${stat.icon} text-sm`}></i>
                  </div>
                </div>
                
                <div>
                  <p className="text-4xl font-extrabold tracking-tighter text-foreground group-hover:text-primary transition-colors">
                    {loading ? <span className="animate-pulse text-muted">—</span> : stat.value}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-[1fr_400px] gap-8">
            
            {/* ── CURSOS PÚBLICOS RECIENTES ── */}
            <div className="bg-card rounded-[20px] border border-border shadow-sm flex flex-col overflow-hidden h-full transition-colors duration-300">
              <div className="px-7 py-5 border-b border-border flex justify-between items-center">
                <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-foreground">Cursos Públicos</h2>
                <Link href="/dashboard/administrator/general-admin/courses/manage" className="text-xs font-bold text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
                  Ver todos <i className="bi bi-arrow-right"></i>
                </Link>
              </div>
              
              <div className="p-3">
                {loading ? (
                  <div className="space-y-2 p-2">
                    {[1, 2, 3].map(i => <div key={i} className="h-16 bg-muted animate-pulse rounded-xl" />)}
                  </div>
                ) : courses.length === 0 ? (
                  <div className="py-20 text-center flex flex-col items-center justify-center">
                    <div className="w-14 h-14 bg-muted rounded-2xl flex items-center justify-center text-muted-foreground text-xl mb-4 border border-border shadow-inner">
                      <i className="bi bi-journal-x"></i>
                    </div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">No hay cursos públicos</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {courses.slice(0, 5).map((course) => (
                      <div key={course.id} className="flex items-center gap-4 p-3.5 rounded-xl hover:bg-muted/50 border border-transparent hover:border-border transition-all group cursor-pointer">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-muted text-muted-foreground group-hover:bg-background group-hover:text-primary group-hover:shadow-sm border border-transparent group-hover:border-border transition-all">
                          <i className="bi bi-mortarboard-fill"></i>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">{course.title}</p>
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md border bg-primary/10 text-primary border-primary/20">
                          Público
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ── ACCESOS DIRECTOS ── */}
            <div className="bg-card rounded-[20px] border border-border shadow-sm p-7 h-fit transition-colors duration-300">
              <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-foreground mb-6">Accesos rápidos</h2>
              
              <div className="flex flex-col gap-3">
                {quickActions.map((action) => (
                  <Link 
                    key={action.label} 
                    href={action.href} 
                    className="group relative flex items-center gap-4 p-4 bg-muted/30 border border-border rounded-2xl hover:bg-background hover:border-primary/30 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
                  >
                    <div className="w-10 h-10 rounded-[10px] bg-background border border-border shadow-sm flex items-center justify-center text-muted-foreground group-hover:text-primary group-hover:border-primary/30 transition-colors">
                      <i className={`bi ${action.icon} text-lg`}></i>
                    </div>
                    
                    <span className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
                      {action.label}
                    </span>

                    <i className="bi bi-chevron-right ml-auto text-muted-foreground/50 group-hover:text-primary transition-all opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0"></i>
                  </Link>
                ))}
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}