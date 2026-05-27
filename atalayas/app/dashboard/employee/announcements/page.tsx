'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/ui/pageHeader';
import SearchInput from '@/components/ui/Searchbar';
import { API_ROUTES, fetchWithApiFallback } from '@/lib/utils';

interface Announcement {
  id: string;
  title: string;
  content: string;
  isPublic: boolean;
  createdAt: string;
  imageUrl?: string | null;
  Company?: { id: string; name: string } | null;
}

// --- Componente: Carrusel Premium (Solo Lectura) ---
function AnnouncementCarousel({ items }: { items: Announcement[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const router = useRouter();

  useEffect(() => {
    if (items.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, 8000);
    return () => clearInterval(timer);
  }, [items.length]);

  if (items.length === 0) return null;

  const actualAnuncio = items[currentIndex];
  const nextSlide = () => setCurrentIndex((prev) => (prev + 1) % items.length);
  const prevSlide = () => setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);

  return (
    <section className="space-y-4 mb-12">
      <div className="px-4">
        <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/70">
          Últimas noticias
        </h2>
      </div>

      <div className="relative p-[1.5px] rounded-[3.5rem] transition-all duration-500 bg-transparent hover:bg-linear-to-r from-primary/20 via-primary/50 to-primary/20 shadow-2xl group">
        <div 
          onClick={() => router.push(`/dashboard/employee/announcements/${actualAnuncio.id}`)}
          className="relative block w-full aspect-video md:aspect-21/9 lg:aspect-25/8 rounded-[calc(3.5rem-1.5px)] overflow-hidden bg-zinc-900 cursor-pointer"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              className="absolute inset-0"
            >
              <div 
                className="absolute inset-0 bg-cover bg-center transition-transform duration-[5s] ease-out group-hover:scale-110"
                style={{ backgroundImage: `url(${actualAnuncio.imageUrl || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop'})` }}
              />
              <div className="absolute inset-0 bg-linear-to-r from-black/90 via-black/40 to-transparent z-10" />
              
              <div className="absolute inset-0 z-20 flex flex-col justify-center p-10 md:p-20">
                <div className="max-w-3xl space-y-4">
                  <div className="flex gap-2">
                    <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-[0.2em] backdrop-blur-md text-white border border-white/20 ${actualAnuncio.isPublic ? 'bg-blue-500/40' : 'bg-purple-500/40'}`}>
                      {actualAnuncio.isPublic ? 'Global' : actualAnuncio.Company?.name || 'Empresa'}
                    </span>
                  </div>
                  <h3 className="text-4xl md:text-6xl font-black tracking-tighter leading-[0.95] text-white">
                    {actualAnuncio.title}
                  </h3>
                  <p className="text-white/70 text-base md:text-lg font-medium max-w-xl leading-relaxed line-clamp-2">
                    {actualAnuncio.content}
                  </p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          <button onClick={(e) => { e.stopPropagation(); prevSlide(); }} className="absolute left-4 inset-y-0 z-30 flex items-center bg-transparent border-none text-white/20 hover:text-white transition-all duration-300">
            <i className="bi bi-chevron-left text-5xl font-thin"></i>
          </button>
          <button onClick={(e) => { e.stopPropagation(); nextSlide(); }} className="absolute right-4 inset-y-0 z-30 flex items-center bg-transparent border-none text-white/20 hover:text-white transition-all duration-300">
            <i className="bi bi-chevron-right text-5xl font-thin"></i>
          </button>
        </div>
      </div>
    </section>
  );
}

export default function EmployeeAnnouncementsPage() {
  const router = useRouter();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  useEffect(() => { fetchAnnouncements(); }, []);

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const data = await fetchWithApiFallback(API_ROUTES.ANNOUNCEMENTS.GET_ALL, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAnnouncements(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    return announcements.filter(ann => 
      ann.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [announcements, searchQuery]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const currentItems = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="flex h-screen bg-[#f5f5f7] dark:bg-[#0d0d0f] overflow-hidden">
      
      <main className="flex-1 flex flex-col min-w-0 bg-white/40 dark:bg-transparent backdrop-blur-3xl">
        <PageHeader 
          title="Anuncios"
          description="Explora las últimas noticias y actualizaciones de la plataforma."
          icon={<i className="bi bi-megaphone-fill" />}
          action={
            <SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="Buscar anuncios..." />
          }
        />

        <div className="flex-1 overflow-y-auto p-6 lg:p-10 no-scrollbar">
          <div className="max-w-7xl mx-auto space-y-12">
            
            {/* Carrusel Premium */}
            {!searchQuery && currentPage === 1 && !loading && announcements.length > 0 && (
              <AnnouncementCarousel items={announcements.slice(0, 5)} />
            )}

            {/* Grid de Noticias */}
            <div className="space-y-6">
              <div className="flex justify-between items-end px-4">
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 italic">Historial de Anuncios</h3>
                <p className="text-[10px] font-bold text-muted-foreground/40">Visualizando {filtered.length} noticias</p>
              </div>

              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[1,2,3].map(i => <div key={i} className="h-72 bg-gray-100 dark:bg-white/5 animate-pulse rounded-[3rem]" />)}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {currentItems.map((ann) => (
                    <motion.div 
                      layout
                      key={ann.id}
                      onClick={() => router.push(`/dashboard/employee/announcements/${ann.id}`)}
                      className="group bg-white dark:bg-[#1c1c1e] rounded-[3rem] border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-2xl transition-all cursor-pointer overflow-hidden flex flex-col"
                    >
                      <div className="h-44 relative overflow-hidden">
                        <img 
                          src={ann.imageUrl || 'https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2069&auto=format&fit=crop'} 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                        />
                        <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent" />
                        <div className="absolute bottom-4 left-6">
                          <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest backdrop-blur-md text-white border border-white/20 ${ann.isPublic ? 'bg-blue-500/40' : 'bg-purple-500/40'}`}>
                            {ann.isPublic ? 'Global' : 'Empresa'}
                          </span>
                        </div>
                      </div>
                      <div className="p-8 flex flex-col flex-1">
                        <h4 className="font-bold text-lg mb-3 group-hover:text-primary transition-colors line-clamp-2">{ann.title}</h4>
                        <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed mb-6 flex-1">{ann.content}</p>
                        <div className="pt-6 border-t border-gray-50 dark:border-white/5 flex justify-between items-center text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest">
                          <span>{new Date(ann.createdAt).toLocaleDateString()}</span>
                          <span className="text-primary opacity-0 group-hover:opacity-100 transition-all flex items-center gap-2">
                            Leer más <i className="bi bi-arrow-right" />
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Paginación */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 pt-12">
                  <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1} className="w-12 h-12 rounded-2xl bg-white dark:bg-zinc-900 border border-gray-100 flex items-center justify-center disabled:opacity-20 transition-all hover:border-primary">
                    <i className="bi bi-chevron-left" />
                  </button>
                  <div className="flex gap-1">
                    {[...Array(totalPages)].map((_, i) => (
                      <button key={i} onClick={() => setCurrentPage(i + 1)} className={`w-12 h-12 rounded-2xl text-[10px] font-black transition-all ${currentPage === i + 1 ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'bg-white dark:bg-zinc-900 text-muted-foreground'}`}>{i + 1}</button>
                    ))}
                  </div>
                  <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages} className="w-12 h-12 rounded-2xl bg-white dark:bg-zinc-900 border border-gray-100 flex items-center justify-center disabled:opacity-20 transition-all hover:border-primary">
                    <i className="bi bi-chevron-right" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}