'use client';

import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PageHeader from '@/components/ui/pageHeader';
import Link from 'next/link';
import { API_ROUTES } from '@/lib/utils';

interface Colaborador {
  id: string;
  name: string;
  logoUrl: string;
  website: string;
  type: string;
  description?: string;
}

const EASE_OUT = [0.25, 0.46, 0.45, 0.94] as const;

const cardVariants = {
  hidden:  { opacity: 0, scale: 0.92, y: 12 },
  visible: { opacity: 1, scale: 1,    y: 0,  transition: { duration: 0.28, ease: EASE_OUT } },
  exit:    { opacity: 0, scale: 0.9,  y: -8, transition: { duration: 0.18, ease: 'easeIn' as const } },
};

const containerVariants = {
  visible: { transition: { staggerChildren: 0.04, delayChildren: 0.05 } },
};

export default function CommunityPage() {
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('TODOS');
  const [categories, setCategories] = useState<string[]>([]);

  // Filtrado reactivo derivado con la importación corregida
  const filteredList = useMemo(
    () =>
      filter === 'TODOS'
        ? colaboradores
        : colaboradores.filter((c) => c.type === filter),
    [filter, colaboradores]
  );

  const fetchData = async (isUpdate = false) => {
    if (!isUpdate) setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [resColab, resTypes] = await Promise.all([
        fetch(`${API_ROUTES.COMMUNITY.GET_ALL}`, { headers }),
        fetch(`${API_ROUTES.COMMUNITY.GET_TYPES}`, { headers }),
      ]);

      if (resColab.ok && resTypes.ok) {
        const [dataColab, dataTypes] = await Promise.all([
          resColab.json(),
          resTypes.json(),
        ]);

        setColaboradores(dataColab);
        setCategories(['TODOS', ...dataTypes]);
        if (!isUpdate) setFilter('TODOS');
      }
    } catch (err) {
      console.error('Error cargando ecosistema:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-background font-sans text-foreground">
      <main className="flex-1 overflow-y-auto flex flex-col relative no-scrollbar">
        <PageHeader
          title="Ecosistema"
          description="Explora las entidades y colaboradores clave del ecosistema de Atalayas EGM."
          icon={<i className="bi bi-diagram-3-fill" />}
        />

        <div className="p-6 lg:p-10 flex-1 max-w-400 mx-auto w-full relative z-0">
          
          {/* Se unifica el control de presencia de la página para evitar saltos estructurales abruptos */}
          <AnimatePresence mode="wait">
            {loading ? (
              /* SPINNER SOLICITADO */
              <motion.div
                key="spinner-loader"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex justify-center py-20"
              >
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div>
              </motion.div>
            ) : (
              /* EL CONTENIDO COMPLETO ENTRA SUAVEMENTE SIN RIGIDRÉZ NI FLICKERING */
              <motion.div
                key="page-content"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                {/* Categorías estables dentro del flujo cargado */}
                {categories.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-10 bg-card border border-border p-2 rounded-2xl shadow-sm w-fit min-h-14.5 items-center">
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setFilter(cat)}
                        className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
                          filter === cat
                            ? 'bg-primary/10 text-primary shadow-sm'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                        }`}
                      >
                        {cat === 'TODOS' ? 'Todos' : cat}
                      </button>
                    ))}
                  </div>
                )}

                {/* Grid con animaciones de filtrado internas */}
                <motion.div
                  initial="hidden"
                  animate="visible"
                  variants={containerVariants}
                  className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8 pb-12"
                >
                  <AnimatePresence mode="popLayout">
                    {filteredList.length === 0 ? (
                      <motion.div
                        key="empty"
                        variants={cardVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="col-span-full text-center py-24 bg-card rounded-[2.5rem] border-2 border-dashed border-border shadow-sm"
                      >
                        <i className="bi bi-search text-5xl text-muted-foreground/30 mb-4 block" />
                        <p className="text-muted-foreground font-bold text-lg">
                          No hay entidades en esta categoría.
                        </p>
                      </motion.div>
                    ) : (
                      filteredList.map((entidad) => (
                        <motion.div
                          key={entidad.id}
                          layout
                          variants={cardVariants}
                          initial="hidden"
                          animate="visible"
                          exit="exit"
                          className="group relative flex flex-col"
                        >
                          <div className="aspect-square bg-white dark:bg-card rounded-[2.5rem] border border-border shadow-sm group-hover:shadow-2xl group-hover:border-primary/40 transition-all duration-500 flex flex-col items-center justify-center p-8 overflow-hidden relative">
                            <div className="w-full h-full flex items-center justify-center transition-transform duration-700 group-hover:scale-90 group-hover:blur-sm">
                              <img
                                src={entidad.logoUrl}
                                alt={entidad.name}
                                className="max-w-full max-h-full object-contain"
                              />
                            </div>

                            <div className="absolute inset-0 bg-background/60 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center gap-4 p-6 z-10">
                              <a
                                href={entidad.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-2 text-secondary text-[10px] font-black uppercase tracking-widest hover:text-foreground transition-colors flex items-center gap-2 bg-secondary/10 px-4 py-2 rounded-full border border-secondary/20"
                              >
                                Visitar Web <i className="bi bi-box-arrow-up-right" />
                              </a>
                            </div>
                          </div>

                          <div className="mt-5 text-center px-2">
                            <p className="text-xs font-black uppercase tracking-widest text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                              {entidad.name}
                            </p>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </AnimatePresence>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}