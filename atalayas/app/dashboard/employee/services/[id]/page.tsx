'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Sidebar from '@/components/ui/Sidebar';
import PageHeader from "@/components/ui/pageHeader";
import { API_ROUTES } from '@/lib/utils';
import ContactCard from '@/components/ui/ContactCard';

export default function ServiceDetail() {
  const params = useParams();
  const [service, setService] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const res = await fetch(API_ROUTES.SERVICES.GET_BY_ID(params.id as string), {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        const data = await res.json();
        setService(data);
      } catch (err) {
        console.error("Error cargando servicio:", err);
      } finally {
        setLoading(false);
      }
    };
    if (params.id) fetchDetail();
  }, [params.id]);

  if (loading) return (
    <div className="flex min-h-screen bg-background items-center justify-center font-sans">
      <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!service) return null;

  const hasSidebar = !!(service.mediaUrl || service.providerName || service.phone || service.email);

  return (
    // Bloqueamos el overflow horizontal en la raíz
    <div className="flex min-h-screen w-full bg-background font-sans text-foreground overflow-hidden">

      {/* Scroll natural vertical, sin barras y bloqueado en horizontal */}
      <main className="flex-1 flex flex-col relative w-full overflow-y-auto overflow-x-hidden no-scrollbar">
        
        <PageHeader 
          title={service.title}
          description={
            <span className="hidden sm:block">
              {service.isPublic ? "Servicio oficial Atalayas EGM" : "Servicio privado de empresa"}
            </span> as any
          }
          icon={<i className="bi bi-briefcase-fill"></i>}
          backUrl="/dashboard/employee/services"
        />

        <div className="p-4 sm:p-6 lg:p-10 flex-1">
          <div className="max-w-7xl mx-auto">
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">

              {/* COLUMNA IZQUIERDA: DESCRIPCIÓN */}
              <div className="lg:col-span-7 space-y-8">
                <section className="bg-card border border-border rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-8 lg:p-12 shadow-sm animate-in fade-in duration-500">
                  <div className="flex items-center gap-3 mb-6">
                    <span className={`text-[10px] font-semibold px-3 py-1 rounded-md uppercase tracking-wider border ${
                      service.isPublic 
                      ? 'bg-primary/5 text-primary border-primary/20' 
                      : 'bg-secondary/5 text-secondary border-secondary/20'
                    }`}>
                      {service.isPublic ? '🌐 Servicio EGM' : '🔒 Servicio Interno'}
                    </span>
                  </div>

                  <h2 className="text-2xl sm:text-3xl font-bold mb-6 tracking-tight leading-tight">Detalles del servicio</h2>
                  
                  <div className="prose prose-slate dark:prose-invert max-w-none">
                    <p className="text-muted-foreground text-sm sm:text-base leading-relaxed whitespace-pre-wrap font-medium">
                      {service.description || 'No hay una descripción detallada disponible actualmente.'}
                    </p>
                  </div>

                  {service.mediaUrl && (
                      <div className="bg-card border border-border rounded-[1.5rem] sm:rounded-[2.5rem] overflow-hidden shadow-sm group mt-8">
                        <div className="aspect-4/3 overflow-hidden bg-muted">
                          <img
                            src={service.mediaUrl}
                            alt={service.title}
                            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                          />
                        </div>
                        <div className="px-5 sm:px-6 py-3 sm:py-4 bg-muted/30 border-t border-border flex items-center gap-2">
                            <i className="bi bi-image text-muted-foreground text-sm"></i>
                            <span className="text-[10px] font-semibold uppercase text-muted-foreground tracking-widest">
                                Imagen del servicio
                            </span>
                        </div>
                      </div>
                    )}
                </section>
              </div>

              {/* COLUMNA DERECHA: MEDIA + CONTACTO */}
              {hasSidebar && (
                <aside className="lg:col-span-5 space-y-8">
                  <div className="sticky top-6 space-y-8">                    

                    <div className="animate-in fade-in slide-in-from-right-4 duration-700">
                      <ContactCard service={service} />
                    </div>

                  </div>
                </aside>
              )}

            </div>
          </div>
        </div>
      </main>
    </div>
  );
}