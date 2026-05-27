'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/ui/Sidebar';
import PageHeader from '@/components/ui/pageHeader';
import SearchInput from '@/components/ui/Searchbar';
import { API_ROUTES, fetchWithApiFallback } from '@/lib/utils';

interface Event {
  id: string;
  title: string;
  description: string;
  event_date: string;
  location?: string;
  image_url?: string | null;
  max_capacity?: number;
  companyId: string | null;
  Company?: { name: string };
  _count?: { EventAttendees: number };
}

type TabType = 'empresa' | 'publicos';

export default function EmployeeEventsPage() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('empresa');

  useEffect(() => { fetchEvents(); }, []);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const data = await fetchWithApiFallback(API_ROUTES.EVENTS.GET_ALL, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEvents(Array.isArray(data) ? data : []);
    } catch (err) { 
      console.error("Error cargando eventos:", err); 
    } finally { 
      setLoading(false); 
    }
  };

 const filtered = useMemo(() => {
    return events.filter(ev => {
      const matchesSearch = ev.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            ev.location?.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Verificamos si tiene una empresa válida asignada
      // Consideramos "Público" si es null, undefined, o el string "null"
      const hasCompany = ev.companyId !== null && 
                         ev.companyId !== undefined && 
                         ev.companyId !== "null" && 
                         ev.companyId !== "";

      const matchesTab = activeTab === 'empresa' ? hasCompany : !hasCompany;

      return matchesSearch && matchesTab;
    });
  }, [events, searchQuery, activeTab]);

  return (
    <div className="flex h-screen bg-[#f5f5f7] dark:bg-[#0d0d0f] overflow-hidden">
      
      <main className="flex-1 flex flex-col min-w-0 bg-white/40 dark:bg-transparent backdrop-blur-3xl">
        <PageHeader 
          title="Próximos Eventos" 
          description="Explora y confirma tu asistencia a los eventos de tu empresa y globales."
          icon={<i className="bi bi-calendar2-check-fill" />}
          action={
            <div className="flex gap-4">
              <SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="Buscar evento..." />
            </div>
          }
        />

        {/* SELECTOR DE TABS */}
        <div className="px-10 mt-4 flex gap-8 border-b border-black/5 dark:border-white/5">
          <button 
            onClick={() => setActiveTab('empresa')}
            className={`pb-4 text-xs font-black uppercase tracking-widest transition-all relative ${activeTab === 'empresa' ? 'text-primary' : 'text-muted-foreground opacity-50'}`}
          >
            Mi Empresa
            {activeTab === 'empresa' && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-full" />}
          </button>
          <button 
            onClick={() => setActiveTab('publicos')}
            className={`pb-4 text-xs font-black uppercase tracking-widest transition-all relative ${activeTab === 'publicos' ? 'text-primary' : 'text-muted-foreground opacity-50'}`}
          >
            Eventos Globales
            {activeTab === 'publicos' && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-full" />}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 lg:p-auto no-scrollbar">
          <div className="w-full px-6 lg:px-10 py-6 lg:py-10">
            {loading ? (
               <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div></div>
            ) : (
              <AnimatePresence mode="wait">
                <motion.div 
                  layout
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                >
                  {filtered.length > 0 ? (
                    filtered.map((event) => (
                      <EventCard 
                        key={event.id} 
                        event={event} 
                        onClick={() => router.push(`/dashboard/employee/events/${event.id}`)} 
                      />
                    ))
                  ) : (
                    <div className="col-span-full py-20 text-center">
                      <i className="bi bi-calendar-x text-4xl opacity-20 mb-4 block" />
                      <p className="text-muted-foreground font-medium italic text-xs uppercase tracking-widest">
                        No hay eventos en la categoría {activeTab === 'empresa' ? 'empresa' : 'global'}
                      </p>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function EventCard({ event, onClick }: { event: Event, onClick: () => void }) {
  const date = new Date(event.event_date);
  
  return (
    <div onClick={onClick} className="group bg-white dark:bg-[#1c1c1e] rounded-[2.5rem] border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-2xl transition-all cursor-pointer overflow-hidden">
      <div className="h-48 relative bg-gray-200 dark:bg-neutral-800 flex items-center justify-center overflow-hidden">        {event.image_url ? (
    <img 
      src={event.image_url} 
      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
      alt={event.title}
    />
  ) : (
    <i className="bi bi-calendar-date text-4xl text-muted-foreground opacity-50" />
  )}
        <div className="absolute top-4 left-4 bg-white/90 dark:bg-black/60 backdrop-blur-md rounded-2xl p-2 px-4 text-center">
          <span className="block text-xs font-black text-primary uppercase">{date.toLocaleString('es-ES', { month: 'short' })}</span>
          <span className="block text-xl font-black">{date.getDate()}</span>
        </div>
      </div>
      
      <div className="p-6 space-y-4">
        <div>
          <h4 className="font-black text-xl group-hover:text-primary transition-colors line-clamp-1 italic">{event.title}</h4>
          <div className="flex items-center gap-2 text-muted-foreground text-[10px] font-bold mt-1 uppercase tracking-wider">
            <i className="bi bi-geo-alt text-primary" />
            <span>{event.location || 'Ubicación por confirmar'}</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-gray-50 dark:border-white/5">
          <div className="flex flex-col">
            <span className="text-[9px] font-black uppercase text-muted-foreground/50 tracking-widest italic">Asistencia</span>
            <span className="text-xs font-bold text-primary">
              {event._count?.EventAttendees || 0} confirmados
            </span>
          </div>
          <div className="flex items-center gap-2 text-[9px] font-black uppercase text-primary opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
            Detalles <i className="bi bi-arrow-right" />
          </div>
        </div>
      </div>
    </div>
  );
}