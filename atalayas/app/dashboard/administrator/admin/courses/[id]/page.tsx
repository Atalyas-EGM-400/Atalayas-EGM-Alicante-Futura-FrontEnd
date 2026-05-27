'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Sidebar from '@/components/ui/Sidebar';
import PageHeader from '@/components/ui/pageHeader';
import { API_ROUTES } from '@/lib/utils';
import { motion, AnimatePresence } from "framer-motion";

const labelClass = "text-[10px] font-black uppercase text-primary tracking-[0.2em] mb-2 block";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.05
    }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 18, scale: 0.98 },
  show: { opacity: 1, y: 0, scale: 1 }
};

export default function AdminCourseDetailPage() {
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

  const contentList = course?.Content || course?.content || [];
  const sortedContent = [...contentList].sort((a, b) => a.order - b.order);

  if (loading) return (
    <div className="flex h-screen bg-background items-center justify-center">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <motion.div
      className="flex h-screen bg-background font-sans text-foreground overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      <main className="flex-1 flex flex-col min-w-0 relative">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
        >
          <PageHeader
            title={course?.title || "Cargando curso..."}
            description="Gestión de unidades y lecciones"
            icon={<i className="bi bi-shield-lock-fill"></i>}
            backUrl="/dashboard/administrator/admin/courses"
            action={
              <motion.button
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => router.push(`/dashboard/administrator/admin/courses/${courseId}/manage`)}
                className="bg-secondary text-secondary-foreground px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-all flex items-center gap-2 shadow-sm cursor-pointer whitespace-nowrap"
              >
                <i className="bi bi-eye-fill"></i>
                Vista de Administrador
              </motion.button>
            }
          />
        </motion.div>

        <motion.div
          className="flex-1 overflow-y-auto bg-muted/30 p-8 no-scrollbar"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: "easeOut", delay: 0.05 }}
        >
          <div className="max-w-6xl mx-auto">
            <section className="space-y-6">
              <motion.div
                className="flex items-center justify-between mb-8"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: 0.08 }}
              >
                <div>
                  <h2 className="text-xl font-black italic tracking-tight uppercase">Estructura del Programa</h2>
                  <p className="text-xs text-muted-foreground mt-1 font-medium">Lista de unidades publicadas para los empleados</p>
                </div>
                <motion.div
                  whileHover={{ y: -2 }}
                  className="bg-card border border-border/50 px-4 py-2 rounded-2xl flex items-center gap-3 shadow-sm"
                >
                  <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Total:</span>
                  <span className="text-sm font-black text-primary">{sortedContent.length}</span>
                </motion.div>
              </motion.div>

              {sortedContent.length > 0 ? (
                <motion.div
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                  variants={containerVariants}
                  initial="hidden"
                  animate="show"
                >
                  {sortedContent.map((content: any) => (
                    <motion.div
                      key={content.id}
                      variants={cardVariants}
                      whileHover={{ y: -6 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => router.push(`/dashboard/administrator/admin/courses/${courseId}/content/${content.id}`)}
                      className="group cursor-pointer bg-card rounded-[2rem] border border-border/50 overflow-hidden shadow-sm hover:shadow-2xl hover:border-primary/30 transition-all duration-500 flex flex-col h-full"
                    >
                      <div className="relative aspect-16/10 overflow-hidden bg-muted">
                        {content.imageUrl ? (
                          <img
                            src={content.imageUrl}
                            alt={content.title}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-primary/5">
                            <i className="bi bi-folder-fill text-4xl text-primary/20"></i>
                          </div>
                        )}
                      </div>

                      <div className="p-6 flex flex-col flex-1">
                        <h3 className="text-lg font-black leading-tight group-hover:text-primary transition-colors line-clamp-2 mb-3">
                          {content.title}
                        </h3>

                        {content.summary && (
                          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed mb-6 font-medium">
                            {cleanMarkdown(content.summary)}
                          </p>
                        )}

                        <div className="mt-auto pt-5 border-t border-border/40 flex items-center justify-between">
                          <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground group-hover:text-primary transition-colors">
                            Acceder al contenido
                          </span>
                          <motion.div
                            whileHover={{ x: 2 }}
                            className="w-8 h-8 rounded-xl bg-muted group-hover:bg-primary group-hover:text-white transition-all flex items-center justify-center"
                          >
                            <i className="bi bi-eye-fill text-xs"></i>
                          </motion.div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.25 }}
                  className="py-20 text-center bg-card rounded-[3rem] border border-dashed border-border/50"
                >
                  <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4 text-muted-foreground/30">
                    <i className="bi bi-plus-circle text-3xl"></i>
                  </div>
                  <p className="text-muted-foreground font-bold italic">No hay unidades en este programa.</p>
                </motion.div>
              )}
            </section>
          </div>
        </motion.div>
      </main>
    </motion.div>
  );
}