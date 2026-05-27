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
  companyId: string | null; // Cambiado a null posible
  Company?: { name: string };
  _count?: { EventAttendees: number };
}

type TabType = 'empresa' | 'publicos';

export default function EventsAdminPage() {
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
    } catch (err) { console.error(err); } 
    finally { setLoading(false); }
  };

  // Filtrado por búsqueda y por Tab
  const filtered = useMemo(() => {
    return events.filter(ev => {
      const matchesSearch = ev.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            ev.location?.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Lógica de Tabs: 
      // 'empresa' -> tiene companyId
      // 'publicos' -> companyId es null o undefined
      const matchesTab = activeTab === 'empresa' ? ev.companyId !== null : ev.companyId === null;

      return matchesSearch && matchesTab;
    });
  }, [events, searchQuery, activeTab]);

  return (
    <div className="flex h-screen bg-[#f5f5f7] dark:bg-[#0d0d0f] overflow-hidden">
      <main className="flex-1 flex flex-col min-w-0 bg-white/40 dark:bg-transparent backdrop-blur-3xl overflow-hidden transition-all duration-300">
        <PageHeader 
  title="Gestión de Eventos" 
  description="Organiza la agenda corporativa y eventos abiertos."
  icon={<i className="bi bi-calendar-event-fill" />}
  action={
    <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-end">
      {/* Buscador: Se expande en móvil, tamaño fijo en desktop */}
      <div className="flex-1 sm:flex-none max-w-40 sm:max-w-none">
        <SearchInput 
          value={searchQuery} 
          onChange={setSearchQuery} 
          placeholder="Buscar..." 
        />
      </div>

      {/* Botón: Icono en móvil, Texto en desktop */}
      <button 
        onClick={() => router.push(`/dashboard/administrator/admin/events/new`)}
        className="bg-secondary text-secondary-foreground rounded-xl text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-sm w-10 h-10 sm:w-auto sm:h-auto sm:px-5 sm:py-2.5 shrink-0"
        title="Crear Evento"
      >
        <i className="bi bi-plus-lg text-lg sm:text-base"></i>
        <span className="hidden sm:inline whitespace-nowrap">
          Crear Evento
        </span>
      </button>
    </div>
  }
/>

        {/* SELECTOR DE TABS */}
        <div className="px-10 mt-4 flex gap-8 border-b border-black/5 dark:border-white/5">
          <button 
            onClick={() => setActiveTab('empresa')}
            className={`pb-4 text-xs font-black uppercase tracking-widest transition-all relative ${activeTab === 'empresa' ? 'text-primary' : 'text-muted-foreground opacity-50'}`}
          >
            Eventos de Empresa
            {activeTab === 'empresa' && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-full" />}
          </button>
          <button 
            onClick={() => setActiveTab('publicos')}
            className={`pb-4 text-xs font-black uppercase tracking-widest transition-all relative ${activeTab === 'publicos' ? 'text-primary' : 'text-muted-foreground opacity-50'}`}
          >
            Eventos Públicos
            {activeTab === 'publicos' && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-full" />}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 lg:p-10 no-scrollbar w-full">
          <div className="w-full px-6 lg:px-10 py-6 lg:py-10 ">
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
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full"
                >
                  {filtered.length > 0 ? (
                    filtered.map((event) => (
                      <EventCard 
                        key={event.id} 
                        event={event} 
                        onClick={() => router.push(`/dashboard/administrator/admin/events/${event.id}`)} 
                      />
                    ))
                  ) : (
                    <div className="col-span-full py-20 text-center">
                      <i className="bi bi-calendar-x text-4xl opacity-20 mb-4 block" />
                      <p className="text-muted-foreground font-medium">No se encontraron eventos en esta categoría.</p>
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
          <h4 className="font-black text-xl group-hover:text-primary transition-colors line-clamp-1">{event.title}</h4>
          <div className="flex items-center gap-2 text-muted-foreground text-xs font-bold mt-1">
            <i className="bi bi-geo-alt" />
            <span>{event.location || 'Ubicación no definida'}</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-gray-50 dark:border-white/5">
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase text-muted-foreground/50 tracking-widest">Asistentes</span>
            <span className="text-sm font-bold text-primary">Confirmados: {event._count?.EventAttendees || 0}</span>
          </div>
          <div className="w-10 h-10 rounded-full bg-gray-50 dark:bg-white/5 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
            <i className="bi bi-arrow-right" />
          </div>
        </div>
      </div>
    </div>
  );
}