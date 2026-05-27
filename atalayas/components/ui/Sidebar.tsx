'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { API_ROUTES } from '@/lib/utils';

interface SidebarProps {
  role: 'GENERAL_ADMIN' | 'ADMIN' | 'EMPLOYEE' | 'PUBLIC';
}

type NavItem = { label: string; href: string; icon: string; badge?: number };
type NavGroup = { group: string; items: NavItem[] };

const navItems = {
  GENERAL_ADMIN: [
    { label: 'Panel', href: '/dashboard/administrator/general-admin', icon: <i className="bi bi-grid-fill"></i> },
    { label: 'Perfil Empresa', href: '/dashboard/administrator/general-admin/edit-company', icon: <i className="bi bi-building-fill"></i> },
    { label: 'Empresas', href: '/dashboard/administrator/general-admin/companies', icon: <i className="bi bi-buildings-fill"></i> },
    { label: 'Usuarios', href: '/dashboard/administrator/general-admin/employees', icon: <i className="bi bi-people-fill"></i>},
    { label: 'Cursos', href: '/dashboard/administrator/general-admin/courses/manage', icon: <i className="bi bi-journal-bookmark-fill"></i> },
    { label: 'Documentos', href: '/dashboard/administrator/general-admin/documents', icon: <i className="bi bi-folder-fill"></i> },
    { label: 'Servicios', href: '/dashboard/administrator/general-admin/services', icon: <i className="bi bi-briefcase-fill"></i> },
    { label: 'Anuncios', href: '/dashboard/administrator/general-admin/announcements', icon: <i className="bi bi-megaphone-fill"></i> },
    { label: 'Eventos', href: '/dashboard/administrator/general-admin/events', icon: <i className="bi bi-calendar-event-fill"></i> },
    { label: 'Ecosistema', href: '/dashboard/administrator/general-admin/community', icon: <i className="bi bi-diagram-3-fill"></i>},
    { label: 'Solicitudes', href: '/dashboard/administrator/general-admin/company-request', icon: <i className="bi bi-envelope-open-fill "></i> },
    { label: 'Sugerencias', href: '/dashboard/administrator/general-admin/suggestions', icon: <i className="bi bi-mailbox2"></i>},
    /* label: 'Matriculación masiva', href: '/dashboard/administrator/bulk-enroll', icon: <i className="bi bi-bar-chart-fill"></i> */
    { label: 'Estadísticas', href: '/dashboard/administrator/general-admin/stats', icon: <i className="bi bi-bar-chart-fill"></i> },
  ],
  ADMIN: [
    { label: 'Panel', href: '/dashboard/administrator/admin', icon: <i className="bi bi-house-fill"></i> },
    { label: 'Mi Empresa', href: '/dashboard/administrator/admin/company', icon: <i className="bi bi-building-fill"></i> },
    { label: 'Empleados', href: '/dashboard/administrator/admin/employees', icon: <i className="bi bi-people-fill"></i>},
    { label: 'Onboarding', href: '/dashboard/administrator/admin/onboarding', icon: <i className="bi bi-rocket-takeoff-fill"></i>},
    { label: 'Cursos', href: '/dashboard/administrator/admin/courses/manage', icon: <i className="bi bi-mortarboard-fill"></i> },
    { label: 'Documentos', href: '/dashboard/administrator/admin/documents', icon: <i className="bi bi-file-earmark-text-fill"></i> },
    { label: 'Servicios', href: '/dashboard/administrator/admin/services', icon: <i className="bi bi-suitcase-lg-fill"></i> },
    { label: 'Anuncios', href: '/dashboard/administrator/admin/announcements', icon: <i className="bi bi-megaphone-fill"></i> },
    { label: 'Eventos', href: '/dashboard/administrator/admin/events', icon: <i className="bi bi-calendar-event-fill"></i> },
    { label: 'Ecosistema', href: '/dashboard/administrator/admin/community', icon: <i className="bi bi-diagram-3-fill"></i>},
    { label: 'Sugerencias', href: '/dashboard/administrator/admin/suggestions', icon: <i className="bi bi-mailbox"></i>},
    { label: 'Estadísticas', href: '/dashboard/administrator/admin/stats', icon: <i className="bi bi-bar-chart-fill"></i> },

  ],
  EMPLOYEE: [
    { label: 'Panel', href: '/dashboard/employee', icon: <i className="bi bi-grid-fill"></i> },
    { label: 'Onboarding', href: '/dashboard/employee/onboarding', icon: <i className="bi bi-rocket-takeoff-fill"></i> },
    { label: 'Mis Cursos', href: '/dashboard/employee/courses', icon: <i className="bi bi-journal-bookmark-fill"></i> },
    { label: 'Documentos', href: '/dashboard/employee/documents', icon: <i className="bi bi-folder-fill"></i> },
    { label: 'Servicios', href: '/dashboard/employee/services', icon: <i className="bi bi-briefcase-fill"></i> },
    { label: 'Anuncios', href: '/dashboard/employee/announcements', icon: <i className="bi bi-megaphone-fill "></i> },
    { label: 'Eventos', href: '/dashboard/employee/events', icon: <i className="bi bi-calendar-event-fill"></i> },
    { label: 'Ecosistema', href: '/dashboard/employee/community', icon: <i className="bi bi-diagram-3-fill"></i>},
    { label: 'Sugerencias', href: '/dashboard/employee/suggestions', icon: <i className="bi bi-mailbox2"></i>},
  ],
  PUBLIC: [
    { label: 'Panel', href: '/dashboard/public', icon: <i className="bi bi-grid-fill"></i> },
    { label: 'Cursos', href: '/dashboard/public/courses', icon: <i className="bi bi-journal-bookmark-fill"></i> },
    { label: 'Servicios', href: '/dashboard/public/services', icon: <i className="bi bi-briefcase-fill"></i> },
  ],
};

const roleLabels = {
  GENERAL_ADMIN: 'Admin General',
  ADMIN: 'Administrador',
  EMPLOYEE: 'Empleado',
  PUBLIC: 'Usuario',
};

const roleColors = {
  GENERAL_ADMIN: 'bg-primary text-primary-foreground border-transparent', 
  ADMIN: 'bg-primary/20 text-primary border-primary/30', 
  EMPLOYEE: 'bg-secondary/20 text-secondary border-secondary/30', 
  PUBLIC: 'bg-muted text-muted-foreground border-border', 
};

export default function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isDark, setIsDark] = useState(false);
  
  const [user, setUser] = useState<any>(null);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [pendingSuggestionsCount, setPendingSuggestionsCount] = useState(0);

  // Variable de utilidad para saber si debemos mostrar el texto
  // En mobile (mobileOpen) siempre mostramos texto. En desktop, depende de collapsed.
  const showText = mobileOpen || !collapsed;

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) setUser(JSON.parse(savedUser));
    
    const savedTheme = document.cookie.split('; ').find(row => row.startsWith('theme='))?.split('=')[1];
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    const initialTheme = savedTheme === 'dark' || (!savedTheme && prefersDark);
    setIsDark(initialTheme);
    
    if (initialTheme) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    setMounted(true);

    const checkResizing = () => {
      if (window.innerWidth < 1024) setCollapsed(true);
    };
    window.addEventListener('resize', checkResizing);
    return () => window.removeEventListener('resize', checkResizing);
  }, []);

  // Dentro de tu componente Sidebar...

useEffect(() => {
  const fetchPendingCounts = async () => {
    // Solo hacemos la petición si el usuario es administrador
    if (role !== 'GENERAL_ADMIN') return;

    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const res = await fetch(API_ROUTES.COMPANY_REQUESTS.GET_PENDING , {
        method: 'GET',
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });

      if (res.ok) {
        const data = await res.json();
        
        // 1. Actualizamos el estado local para que se vea YA
        setPendingRequestsCount(data.requests || 0);

        // 2. Sincronizamos el localStorage para que otros componentes lo sepan
        localStorage.setItem('count_requests', String(data.requests || 0));
      }
    } catch (error) {
      console.error("Error al obtener conteos iniciales:", error);
    }
  };

  if (mounted) {
    fetchPendingCounts();
  }
}, [mounted, role]); // Se ejecuta al montar y si el rol cambia

  useEffect(() => {
    const updateCounts = () => {
      setPendingRequestsCount(Number(localStorage.getItem('count_requests')) || 0);
    };
    window.addEventListener('local-storage-update', updateCounts);
    updateCounts();
    return () => window.removeEventListener('local-storage-update', updateCounts);
  }, []);

  useEffect(() => {
  // Función centralizada para cargar el usuario
  const loadUser = () => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) setUser(JSON.parse(savedUser));
  };

  // Carga inicial
  loadUser();

  // 👇 NUEVO: Escuchar el evento personalizado 👇
  const handleLogoUpdate = () => {
    console.log("🟠 Sidebar: Escuchando evento de actualización de logo, recargando usuario...");
    loadUser(); // Recargamos el usuario del localStorage (donde estará el nuevo logo)
  };

  // Añadimos el listener para nuestro evento custom
  window.addEventListener('company_logo_updated', handleLogoUpdate);

  // Configuración del tema y listeners existentes...
  const savedTheme = document.cookie.split('; ').find(row => row.startsWith('theme='))?.split('=')[1];
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const initialTheme = savedTheme === 'dark' || (!savedTheme && prefersDark);
  setIsDark(initialTheme);
  
  if (initialTheme) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }

  setMounted(true);

  const checkResizing = () => {
    if (window.innerWidth < 1024) setCollapsed(true);
  };
  window.addEventListener('resize', checkResizing);

  // 👇 NUEVO: Limpieza del listener en el desmontado 👇
  return () => {
    window.removeEventListener('resize', checkResizing);
    window.removeEventListener('company_logo_updated', handleLogoUpdate);
    };
  }, []);


  const toggleTheme = () => {
    const root = document.documentElement;
    const newTheme = !isDark;
    
    if (newTheme) {
      root.classList.add('dark');
      document.cookie = "theme=dark; path=/; max-age=31536000";
    } else {
      root.classList.remove('dark');
      document.cookie = "theme=light; path=/; max-age=31536000";
    }
    setIsDark(newTheme);
  };

  const handleLogout = () => {
    localStorage.clear();
    window.dispatchEvent(new Event('user:logout')); // Para que otros componentes escuchen el logout
    router.push('/login');
  };

  const checkActive = (href: string) => {
  // 1. Si son exactamente iguales, activo (esto sirve para todas)
  if (pathname === href) return true;

  // 2. Definimos qué rutas NO deben usar "startsWith" para evitar el efecto cascada
  const isPanel = href.endsWith('/admin') || href.endsWith('/general-admin') || href.endsWith('/employee');

  if (isPanel) {
    return pathname === href; // Coincidencia estricta para el Panel
  }

  // 3. Para lo demás (Cursos, Empresas, etc.), permitimos que se mantengan 
  // activos si estamos en una sub-ruta (ej: /companies/edit/123)
  return pathname.startsWith(href);
};

  if (!mounted) return null;

  const currentMenu = navItems[role] || [];
  const displayLogo = user?.company?.logoUrl || "/images/logo-atalayas.png";

  return (
    <>
      {!mobileOpen && (
        <button 
          onClick={() => setMobileOpen(true)}
className="lg:hidden fixed bottom-6 left-6 z-50 w-14 h-14 bg-primary text-white shadow-2xl rounded-full flex items-center justify-center active:scale-90"        >
          <i className="bi bi-list text-2xl"></i>
        </button>
      )}

      <div 
        className={`fixed inset-0 bg-background/60 backdrop-blur-sm z-10000 lg:hidden transition-opacity duration-300 ${
          mobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setMobileOpen(false)}
      />

      {/* Estructura del Aside Corregida */}
      <aside className={`
        fixed lg:sticky top-0 left-0 h-screen bg-card border-r border-border flex flex-col transition-[width, transform] duration-300 z-10001 shrink-0 font-sans
        ${mobileOpen ? 'translate-x-0 w-70' : '-translate-x-full lg:translate-x-0'}
        ${collapsed ? 'w-16 lg:w-16' : 'w-60'}
      `}>
        
        <div className={`flex items-center justify-between border-b border-border transition-all duration-300 ${!showText ? 'h-20 px-0 justify-center' : 'h-24 px-4 gap-3'}`}>
          <div className={`
            bg-white rounded-[18px] shadow-sm border border-gray-200/60 dark:border-white/10 flex items-center justify-center overflow-hidden transition-all
            ${!showText ? 'w-12 h-12' : 'w-full h-20 flex items-center justify-center'}
          `}>
            <img src={displayLogo} alt="Logo" className="max-w-full max-h-full object-contain" />
          </div>
          
          {showText && !mobileOpen && (
            <button onClick={() => setCollapsed(true)} className="hidden lg:flex text-muted-foreground p-2 rounded-lg hover:bg-muted transition-colors">
              <i className="bi bi-text-indent-right text-lg"></i>
            </button>
          )}

          <button onClick={() => setMobileOpen(false)} className="lg:hidden text-muted-foreground p-2 mr-2">
            <i className="bi bi-x-lg text-xl"></i>
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto no-scrollbar">
          {!showText && (
              <button onClick={() => setCollapsed(false)} className="hidden lg:flex w-12 h-12 mx-auto text-muted-foreground rounded-xl hover:bg-muted items-center justify-center mb-4">
                <i className="bi bi-text-indent-left text-xl"></i>
              </button>
          )}

          {currentMenu.map((item) => {
            const isActive = checkActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-[13px] relative group
                  ${isActive ? 'bg-primary/10 text-primary shadow-sm' : 'text-muted-foreground hover:bg-muted/80'}
                  ${!showText ? 'justify-center w-12 h-12 mx-auto px-0' : ''}
                `}
              >
                <span className={`text-xl transition-transform group-hover:scale-110 ${isActive ? 'text-primary' : ''}`}>
                  {item.icon}
                </span>
                {showText && <span className="flex-1 truncate tracking-tight">{item.label}</span>}

                {item.label === 'Solicitudes' && pendingRequestsCount > 0 && showText && (
                   <span className="bg-destructive text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">{pendingRequestsCount}</span>
                )}
                {item.label === 'Sugerencias' && pendingSuggestionsCount > 0 && showText && (
                   <span className="bg-destructive text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">{pendingSuggestionsCount}</span>
                )}

                {!showText && item.label === 'Solicitudes' && pendingRequestsCount > 0 && (
                  <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-destructive rounded-full border-2 border-card"></span>
                )}

                {!showText && item.label === 'Sugerencias' && pendingSuggestionsCount > 0 && (
                  <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-destructive rounded-full border-2 border-card"></span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border bg-card space-y-2">
          <Link href="/dashboard/profile" onClick={() => setMobileOpen(false)} className="block w-full mb-2">
            <div className={`flex items-center gap-3 p-2 rounded-2xl hover:bg-muted/70 transition-all ${!showText ? 'justify-center p-0' : ''}`}>
               <div className={`rounded-full overflow-hidden shrink-0 border-2 border-border ${!showText ? 'w-10 h-10' : 'w-9 h-9'}`}>
                  {user?.avatarUrl ? (
                    <img src={user.avatarUrl} alt="Perfil" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                      <span className="text-primary text-xs font-black">{user?.name?.charAt(0) || 'U'}</span>
                    </div>
                  )}
               </div>
               {showText && (
                 <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold truncate text-foreground">{user?.name || 'Usuario'}</p>
                    <span className={`text-[8px] uppercase font-black px-1.5 py-0.5 rounded border ${roleColors[role]}`}>{roleLabels[role]}</span>
                 </div>
               )}
            </div>
          </Link>

          <div className="space-y-1">
            <button 
              onClick={toggleTheme} 
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-muted-foreground hover:bg-muted font-bold text-[13px] transition-all ${!showText ? 'justify-center' : ''}`}
            >
              <span className="text-lg w-6 flex justify-center">
                <i className={`bi ${isDark ? 'bi-sun-fill text-amber-400' : 'bi-moon-stars-fill text-indigo-400'}`}></i>
              </span>
              {showText && <span>{isDark ? 'Modo Claro' : 'Modo Oscuro'}</span>}
            </button>

            <button 
              onClick={handleLogout} 
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 font-bold text-[13px] transition-all ${!showText ? 'justify-center' : ''}`}
            >
              <span className="text-lg w-6 flex justify-center">
                <i className="bi bi-box-arrow-right"></i>
              </span>
              {showText && <span>Cerrar sesión</span>}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
