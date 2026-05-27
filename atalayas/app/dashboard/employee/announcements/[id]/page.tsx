'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Sidebar from '@/components/ui/Sidebar';
import PageHeader from "@/components/ui/pageHeader";
import { API_ROUTES, fetchWithApiFallback } from '@/lib/utils';
import { motion } from 'framer-motion';

export default function AnnouncementDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [announcement, setAnnouncement] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true);
      try {
        if (typeof params.id !== 'string') return;
        const token = localStorage.getItem('token');
        const url = API_ROUTES.ANNOUNCEMENTS.GET_BY_ID(params.id);

        const data = await fetchWithApiFallback(url, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!data || data.error) throw new Error("No encontrado");
        setAnnouncement(data);
      } catch (err) {
        console.error("Error cargando anuncio:", err);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) fetchDetail();
  }, [params.id]);

  if (loading) return (
    <div className="flex min-h-screen bg-[#f5f5f7] dark:bg-[#0d0d0f] items-center justify-center">
      <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
    </div>
  );

  if (!announcement) return null;

  return (
    <div className="flex min-h-screen bg-[#f5f5f7] dark:bg-[#0d0d0f] font-sans text-foreground overflow-hidden">
      {/* Sidebar actualizado a GENERAL_ADMIN */}

      <main className="flex-1 overflow-auto flex flex-col no-scrollbar">
        
        <PageHeader 
          title={announcement.title}
          description={`Publicado el ${new Date(announcement.createdAt).toLocaleDateString('es-ES', { 
            day: '2-digit', month: 'long', year: 'numeric' 
          })}`}
          icon={<i className="bi bi-megaphone-fill text-primary"></i>}
          backUrl="/dashboard/employee/announcements"
        />

        <div className="p-6 lg:p-10 flex-1">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

              {/* COLUMNA IZQUIERDA: CUERPO DEL ANUNCIO */}
              <div className="lg:col-span-8 space-y-6">
                <motion.section 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white dark:bg-[#1c1c1e] border border-gray-100 dark:border-white/5 rounded-[3rem] p-8 lg:p-12 shadow-sm"
                >
                  <div className="flex items-center gap-3 mb-8">
                    <span className={`text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-[0.2em] border shadow-sm ${
                      announcement.isPublic 
                      ? 'bg-blue-500/10 text-blue-600 border-blue-500/20' 
                      : 'bg-purple-500/10 text-purple-600 border-purple-500/20'
                    }`}>
                      {announcement.isPublic ? '🌐 Comunicado Global' : `${announcement.Company?.name}`}
                    </span>
                  </div>

                  {/* IMAGEN*/}
                  {announcement.imageUrl && (
                    <div className="mb-10 rounded-[2rem] overflow-hidden border border-gray-100 dark:border-white/5 shadow-inner">
                      <img
                        src={announcement.imageUrl}
                        alt={announcement.title}
                        className="w-full h-auto object-cover max-h-125 hover:scale-[1.02] transition-transform duration-700"
                      />
                    </div>
                  )}
                  
                  <div className="prose prose-zinc dark:prose-invert max-w-none">
                    <div className="text-zinc-600 dark:text-zinc-400 text-lg leading-relaxed whitespace-pre-wrap font-medium">
                      {announcement.content || 'Este comunicado no dispone de contenido adicional.'}
                    </div>
                  </div>

                  {/* Footer del contenido */}
                  <div className="mt-12 pt-8 border-t border-gray-50 dark:border-white/5 flex items-center justify-between">
                      <div className="flex gap-2">
                          <button className="p-3 rounded-2xl bg-gray-50 dark:bg-white/5 hover:bg-primary hover:text-white transition-all text-xs font-bold flex items-center">
                              <i className="bi bi-share mr-2" /> Compartir
                          </button>
                          <button onClick={() => window.print()} className="p-3 rounded-2xl bg-gray-50 dark:bg-white/5 hover:bg-gray-100 transition-all text-xs font-bold flex items-center">
                              <i className="bi bi-printer mr-2" /> Imprimir
                          </button>
                      </div>
                  </div>
                </motion.section>
              </div>

              {/* COLUMNA DERECHA: SIDEBAR DE INFO */}
              <aside className="lg:col-span-4 space-y-6">
                <div className="sticky top-6 space-y-6">
                  
                  <div className="bg-white dark:bg-[#1c1c1e] border border-gray-100 dark:border-white/5 rounded-[2.5rem] p-8 shadow-sm">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-8">Información de Emisión</h3>
                    
                    <div className="space-y-8">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                          <i className="bi bi-building-fill text-xl"></i>
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase text-muted-foreground tracking-tighter mb-1">Empresa Emisora</p>
                          <p className="text-sm font-bold leading-tight">{announcement.Company?.name || 'Gestión Administrativa'}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-white/5 flex items-center justify-center text-zinc-500">
                          <i className="bi bi-calendar-check-fill text-xl"></i>
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase text-muted-foreground tracking-tighter mb-1">Fecha de Publicación</p>
                          <p className="text-sm font-bold">
                            {new Date(announcement.createdAt).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </aside>

            </div>
          </div>
        </div>
      </main>
    </div>
  );
}