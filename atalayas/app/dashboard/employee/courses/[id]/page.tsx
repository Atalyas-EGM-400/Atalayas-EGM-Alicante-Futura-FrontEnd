'use client';
import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Sidebar from '@/components/ui/Sidebar';
import PageHeader from '@/components/ui/pageHeader';
import { API_ROUTES } from '@/lib/utils';
import { motion } from "framer-motion";

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;

  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const cleanMarkdown = (text: string): string => {
    if (!text) return "";
    return text
      .replace(/\*\*?([^*]+)\*\*?/g, "$1")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/^- /gm, "")
      .replace(/#/g, "")
      .trim();
  };

  useEffect(() => {
    const fetchCourseData = async () => {
      if (!courseId) return;
      try {
        setLoading(true);
        const res = await fetch(API_ROUTES.COURSES.GET_BY_ID(courseId), {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        if (!res.ok) throw new Error("Error");
        const data = await res.json();
        setCourse(data.course || data.data || data);
      } catch (err) {
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchCourseData();
  }, [courseId]);

  const sortedContent = useMemo(() => {
    const contentList = course?.Content || course?.content || [];
    return [...contentList].sort((a, b) => a.order - b.order);
  }, [course]);

  // Pantalla de carga limpia y sin el recuadro blanco
  if (loading) return (
    <div className="flex min-h-screen bg-background items-center justify-center font-sans">
      <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin shadow-md" />
    </div>
  );

  return (
    <div className="flex h-screen bg-background font-sans text-foreground overflow-hidden">

      <main className="flex-1 flex flex-col min-w-0 relative">
        <PageHeader 
          title={course?.title || "Cargando curso..."}
          description="Plan de formación y contenidos"
          icon={<i className="bi bi-mortarboard-fill"></i>}
          backUrl="/dashboard/employee/courses"
        />

        <div className="flex-1 overflow-y-auto bg-muted/30 p-8 no-scrollbar">
          <div className="max-w-6xl mx-auto space-y-10">
            <section className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-black italic tracking-tight">Estructura del Programa</h2>
                <span className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em]">
                  {sortedContent.length} Unidades
                </span>
              </div>

              {sortedContent.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {sortedContent.map((content: any, index: number) => (
                    <div
                      key={content.id}
                      onClick={() => router.push(`/dashboard/employee/courses/${courseId}/content/${content.id}`)}
                      className="group cursor-pointer bg-card rounded-[2rem] border border-border/50 overflow-hidden shadow-sm hover:shadow-2xl hover:border-primary/30 hover:-translate-y-1 transition-all duration-300 flex flex-col h-full"
                    >
                      {/* Imagen con Overlay de Orden */}
                      <div className="relative aspect-16/10 overflow-hidden bg-muted">
                        {content.imageUrl ? (
                          <img 
                            src={content.imageUrl} 
                            alt={content.title} 
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-primary/5">
                            <i className="bi bi-journal-text text-4xl text-primary/20"></i>
                          </div>
                        )}
                        <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md text-white text-[10px] font-black px-3 py-1 rounded-full border border-white/10 uppercase">
                          Unidad {index + 1}
                        </div>
                        
                        {content.isCompleted && (
                          <div className="absolute top-4 right-4 bg-emerald-500 text-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg border-2 border-white">
                            <i className="bi bi-check-lg text-lg"></i>
                          </div>
                        )}
                      </div>

                      <div className="p-6 flex flex-col flex-1">
                        <h3 className="text-lg font-black leading-tight group-hover:text-primary transition-colors line-clamp-2 mb-3">
                          {content.title}
                        </h3>

                        {content.summary && (
                          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed mb-6 font-medium opacity-80">
                            {cleanMarkdown(content.summary)}
                          </p>
                        )}

                        <div className="mt-auto pt-5 border-t border-border/40 flex items-center justify-between">
                          <span className="text-[9px] font-black uppercase tracking-widest text-primary/60 group-hover:text-primary transition-colors">
                            Acceder al contenido
                          </span>
                          <div className="w-8 h-8 rounded-xl bg-muted group-hover:bg-primary group-hover:text-white transition-all flex items-center justify-center">
                            <i className="bi bi-arrow-right text-sm"></i>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-20 text-center bg-card rounded-[3rem] border border-dashed border-border/50">
                  <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4 text-muted-foreground/30">
                     <i className="bi bi-inbox text-3xl"></i>
                  </div>
                  <p className="text-muted-foreground font-bold italic">No se han publicado unidades todavía.</p>
                </div>
              )}
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}