'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link'; // Error: Faltaba importar Link
import Sidebar from '@/components/ui/Sidebar';
import PageHeader from '@/components/ui/pageHeader';
import { API_ROUTES } from '@/lib/utils';
import CompanyDropdown from '@/components/ui/CompanyDropdown';

interface Service {
  id: string;
  title: string;
  isPublic: boolean;
  Company?: {
    name: string;
  };
}

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCompany, setSelectedCompany] = useState<string>('PUBLIC');
  const [searchQuery, setSearchQuery] = useState(''); // Error: No estaba definido el estado de búsqueda
  const router = useRouter();

  useEffect(() => {
    const fetchServices = async () => {
      setLoading(true);
      try {
        const res = await fetch(API_ROUTES.SERVICES.GET_ALL, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const data = await res.json();
        setServices(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error al cargar servicios:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, []);

  // Usamos useMemo para agrupar empresas y filtrar, evitando cálculos innecesarios en cada render
  const { filteredServices, byCompany, companies } = useMemo(() => {
    // 1. Filtrado por texto
    const filtered = services.filter(s =>
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.Company?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // 2. Agrupación por empresa (usando un objeto Record, no un Set)
    const grouped = filtered.reduce((acc, s) => {
      if (!s.isPublic) {
        const name = s.Company?.name || 'Sin empresa';
        if (!acc[name]) acc[name] = [];
        acc[name].push(s);
      }
      return acc;
    }, {} as Record<string, Service[]>); // Error: El acumulador inicial debe ser un objeto {}

    // 3. Lista de nombres para el dropdown
    const companyNames = ['PUBLIC', ...Object.keys(grouped)];

    return { filteredServices: filtered, byCompany: grouped, companies: companyNames };
  }, [services, searchQuery]);

  // Determinar la lista que se muestra actualmente
  const currentList = selectedCompany === 'PUBLIC' 
    ? filteredServices.filter(s => s.isPublic) 
    : byCompany[selectedCompany] || [];

  return (
    <div className="flex min-h-screen bg-background font-sans text-foreground">

      <main className="flex-1 overflow-auto flex flex-col relative">
        <PageHeader 
  title="Gestión de Servicios"
  description="Organiza y supervisa todos los servicios del ecosistema corporativo."
  icon={<i className="bi bi-briefcase-fill"></i>}
  action={
    <div className="flex items-center justify-end">
      <Link 
        href="/dashboard/administrator/general-admin/services/new"
        className="bg-secondary text-secondary-foreground rounded-xl text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-sm w-10 h-10 sm:w-auto sm:h-auto sm:px-5 sm:py-2.5 shrink-0"
        title="Nuevo servicio"
      >
        <i className="bi bi-plus-lg text-lg sm:text-base"></i>
        <span className="hidden sm:inline whitespace-nowrap">
          Nuevo servicio
        </span>
      </Link>
    </div>
  }
/>

        <div className="p-6 lg:p-10 flex-1 max-w-7xl mx-auto w-full space-y-6">
          
          <div className="bg-card rounded-3xl border border-border overflow-hidden shadow-sm flex flex-col">
            <div className="p-5 border-b border-border flex flex-col sm:flex-row items-center justify-between gap-4 bg-muted/20">
              <div className="flex-1 w-full max-w-sm">
                <CompanyDropdown companies={companies} selected={selectedCompany} onChange={setSelectedCompany} />
              </div>
              <div className="relative w-full sm:max-w-xs">
                <i className="bi bi-search absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm"></i>
                <input 
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar servicio..."
                  className="w-full bg-background border border-input rounded-xl pl-10 pr-4 py-2 text-sm outline-none focus:border-primary transition-all font-medium"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-muted/40 border-b border-border">
                    <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest w-3/5">Servicio</th>
                    <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest w-1/5">Visibilidad</th>
                    <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest w-1/5 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {loading ? (
                    [1, 2, 3].map(i => (
                      <tr key={i} className="animate-pulse">
                        <td colSpan={3} className="px-6 py-8">
                          <div className="h-4 bg-muted rounded w-full"></div>
                        </td>
                      </tr>
                    ))
                  ) : currentList.length > 0 ? (
                    currentList.map((service) => (
                      <tr key={service.id} 
                        onClick={() => router.push(`/dashboard/administrator/general-admin/services/${service.id}`)} 
                        className="hover:bg-muted/30 cursor-pointer transition-colors group"
                      >
                        <td className="px-6 py-5">
                          <div className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">
                            {service.title}
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-md border ${service.isPublic ? 'bg-primary/5 text-primary border-primary/10' : 'bg-muted text-muted-foreground border-border'}`}>
                            {service.isPublic ? 'Global' : 'Privado'}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <i className="bi bi-chevron-right text-muted-foreground/30 group-hover:text-primary group-hover:translate-x-1 transition-all"></i>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="px-6 py-20 text-center text-muted-foreground font-medium text-sm italic">
                        No se han encontrado servicios.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}