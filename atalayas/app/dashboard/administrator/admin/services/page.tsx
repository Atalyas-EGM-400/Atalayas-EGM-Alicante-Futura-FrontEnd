'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Sidebar from '@/components/ui/Sidebar';
import PageHeader from '@/components/ui/pageHeader';
import { API_ROUTES } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface Service {
  id: string;
  title: string;
  description: string;
  isPublic: boolean;
  Company?: { id: string; name: string };
}

// Variantes estandarizadas de la aplicación
const pageVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const sectionVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } },
};

const rowVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.2, ease: 'easeOut' } },
  exit: { opacity: 0, x: -10, transition: { duration: 0.15 } }
};

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'PUBLIC' | 'COMPANY'>('COMPANY');
  const router = useRouter();

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(API_ROUTES.SERVICES.GET_ALL, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        setServices(Array.isArray(data) ? data : []);
      } catch (err) {
        setServices([]);
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, []);

  const filteredServices = services
    .filter(s => {
      const matchesSearch =
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.Company?.name?.toLowerCase().includes(searchQuery.toLowerCase());
      let matchesTab = true;
      if (filter === 'PUBLIC') matchesTab = s.isPublic === true;
      if (filter === 'COMPANY') matchesTab = s.isPublic === false;
      return matchesSearch && matchesTab;
    })
    .sort((a, b) => a.title.localeCompare(b.title));

  return (
    <motion.div 
      className="flex min-h-screen w-full bg-background font-sans text-foreground overflow-hidden" 
      initial="hidden" 
      animate="show" 
      variants={pageVariants}
    >
      <main className="flex-1 flex flex-col relative w-full overflow-y-auto no-scrollbar">
        <motion.div variants={sectionVariants}>
          <PageHeader
            title="Servicios"
            description="Administra el catálogo de servicios corporativos y globales."
            icon={<i className="bi bi-briefcase"></i>}
            action={
              <Link href="/dashboard/administrator/admin/services/new" className="bg-secondary text-secondary-foreground px-5 py-2 rounded-xl text-xs font-bold uppercase hover:opacity-90 transition-all flex items-center gap-2 shadow-sm">
                <i className="bi bi-plus-lg"></i> Nuevo Servicio
              </Link>
            }
          />
        </motion.div>

        <motion.div className="p-4 sm:p-6 lg:p-10 flex-1 max-w-7xl mx-auto w-full" variants={sectionVariants}>
          <motion.div className="bg-card rounded-3xl border border-border overflow-hidden shadow-sm flex flex-col min-h-[400px]" variants={sectionVariants}>
            <div className="p-4 sm:p-5 border-b border-border flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-muted/10">
              
              <div className="flex flex-wrap gap-1 bg-card border border-border p-1 rounded-xl shadow-sm">
                {['ALL', 'COMPANY', 'PUBLIC'].map((type) => (
                  <button 
                    key={type} 
                    type="button" 
                    onClick={() => setFilter(type as any)} 
                    className={`relative px-4 py-2 text-[11px] font-bold rounded-lg transition-colors ${filter === type ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    <span className="relative z-10">
                        {type === 'ALL' ? 'Todos' : type === 'PUBLIC' ? 'Globales' : 'Mi Empresa'}
                    </span>
                    {filter === type && (
                      <motion.div layoutId="servicesFilterPill" className="absolute inset-0 bg-primary/10 rounded-lg" />
                    )}
                  </button>
                ))}
              </div>
              
              <div className="relative w-full xl:max-w-xs">
                  <i className="bi bi-search absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm"></i>
                  <input 
                      type="text" 
                      value={searchQuery} 
                      onChange={(e) => setSearchQuery(e.target.value)} 
                      placeholder="Buscar..." 
                      className="w-full bg-background border border-input rounded-xl pl-10 pr-4 py-2 text-sm outline-none focus:border-primary transition-all font-medium shadow-sm" 
                  />
              </div>
            </div>

            <div className="w-full">
              {loading ? (
                // Círculo de carga moderno unificado
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary" />
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-muted/40 border-b border-border">
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Nombre</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center">Visibilidad</th>
                      <th className="px-6 py-4"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    <AnimatePresence mode="wait">
                      {filteredServices.length > 0 ? (
                        filteredServices.map((service, index) => (
                          <motion.tr 
                            key={service.id} 
                            variants={rowVariants} 
                            initial="hidden" 
                            animate="show" 
                            exit="exit" 
                            transition={{ delay: index * 0.03 }}
                            onClick={() => router.push(`/dashboard/administrator/admin/services/${service.id}`)} 
                            className="hover:bg-muted/30 cursor-pointer group transition-colors"
                          >
                            <td className="px-6 py-4 text-sm font-bold group-hover:text-primary transition-colors">{service.title}</td>
                            <td className="px-6 py-4 text-center">
                                <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md border ${service.isPublic ? 'bg-primary/5 text-primary border-primary/10' : 'bg-muted text-muted-foreground border-border/50'}`}>
                                    {service.isPublic ? 'Global' : 'Privado'}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-right text-muted-foreground/30 group-hover:text-primary group-hover:translate-x-1 transition-all">
                                <i className="bi bi-chevron-right text-lg"></i>
                            </td>
                          </motion.tr>
                        ))
                      ) : (
                        <motion.tr variants={rowVariants} initial="hidden" animate="show">
                          <td colSpan={3} className="py-20 text-center text-muted-foreground">
                            <i className="bi bi-inbox text-3xl mb-3 block opacity-50"></i>
                            <p className="text-sm font-bold uppercase tracking-widest">No se encontraron servicios</p>
                          </td>
                        </motion.tr>
                      )}
                    </AnimatePresence>
                  </tbody>
                </table>
              )}
            </div>
          </motion.div>
        </motion.div>
      </main>
    </motion.div>
  );
}