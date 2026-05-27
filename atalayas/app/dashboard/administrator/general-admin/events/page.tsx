"use client";

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
  event_date: string;
  location?: string;
  image_url?: string | null;
  companyId: string | null;
  _count?: { EventAttendees: number };
}

export default function GAdminPublicEventsPage() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

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

  // Filtrado estricto: Solo eventos donde companyId es null
  const publicEvents = useMemo(() => {
    return events.filter(ev => {
      const isPublic = ev.companyId === null;
      const matchesSearch = ev.title.toLowerCase().includes(searchQuery.toLowerCase());
      return isPublic && matchesSearch;
    });
  }, [events, searchQuery]);

  return (
    <div className="flex h-screen bg-[#f5f5f7] dark:bg-[#0d0d0f] overflow-hidden">
      
      <main className="flex-1 flex flex-col min-w-0">
        <PageHeader 
  title="Eventos Públicos" 
  description="Gestión exclusiva de eventos globales del ecosistema."
  icon={<i className="bi bi-calendar-event" />}
  action={
    <div className="flex items-center gap-3">
              <div className="flex justify-end min-w-12">
        <SearchInput 
          value={searchQuery} 
          onChange={setSearchQuery} 
          placeholder="Buscar..." 
        />
      </div>

      {/* Botón de Crear: Icono en móvil, Texto completo en desktop */}
      <button 
        onClick={() => router.push(`/dashboard/administrator/general-admin/events/new`)} 
              className="bg-secondary text-secondary-foreground px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-all flex items-center gap-2 shadow-sm"
      >
        <i className="bi bi-plus-lg text-lg sm:text-base"></i>
        <span className="hidden sm:inline whitespace-nowrap">
          Crear Evento
        </span>
      </button>
    </div>
  }
/>

        <div className="flex-1 overflow-y-auto p-10 no-scrollbar">
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary" />
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div 
                key="grid-events"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
              >
                {publicEvents.length > 0 ? (
                  publicEvents.map((event) => (
                    <EventCard 
                      key={event.id} 
                      event={event} 
                      onClick={() => router.push(`/dashboard/administrator/general-admin/events/${event.id}`)} 
                    />
                  ))
                ) : (
                  <div className="col-span-full py-20 text-center">
                    <i className="bi bi-calendar-x text-4xl opacity-20 mb-4 block" />
                    <p className="text-muted-foreground font-medium italic">
                      No se encontraron eventos públicos.
                    </p>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          )}
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
          <span className="block text-xs font-black text-primary uppercase">
            {date.toLocaleString('es-ES', { month: 'short' })}
          </span>
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