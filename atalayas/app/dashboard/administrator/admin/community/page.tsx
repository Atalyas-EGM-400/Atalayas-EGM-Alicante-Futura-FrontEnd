'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '@/components/ui/Sidebar';
import PageHeader from '@/components/ui/pageHeader';
import Link from 'next/link';

interface Colaborador {
  id: string;
  name: string;
  logoUrl: string;
  website: string;
  type: string;
  description?: string;
}

const CATEGORIES = [
  'TODOS', 
  'UNIVERSIDADES Y CENTROS DE INVESTIGACIÓN', 
  'PARQUES CIENTÍFICOS', 
  'INSTITUTOS Y CENTROS TECNOLÓGICOS'
];

export default function EcosystemPage() {
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('TODOS');

  useEffect(() => {
    const fetchEcosystem = async () => {
      try {
        const mockData: Colaborador[] = [
          {
            id: 'eco-1',
            name: 'UNIVERSIDAD DE ALICANTE',
            type: 'UNIVERSIDADES Y CENTROS DE INVESTIGACIÓN',
            description: 'Universidad pública con una fuerte vocación de I+D+i y proyectos de transferencia tecnológica.',
            logoUrl: 'https://atalayas.com/wp-content/uploads/2026/02/logo-ua.png',
            website: 'https://www.ua.es'
          },
          {
            id: 'eco-2',
            name: 'UNIVERSIDAD MIGUEL HERNÁNDEZ DE ELCHE',
            type: 'UNIVERSIDADES Y CENTROS DE INVESTIGACIÓN',
            description: 'Programas de innovación y colaboración directa con empresas e instituciones.',
            logoUrl: 'https://atalayas.com/wp-content/uploads/2026/02/logo-umh.png',
            website: 'https://www.umh.es'
          },
          {
            id: 'eco-3',
            name: 'PARQUE CIENTÍFICO DE ALICANTE',
            type: 'PARQUES CIENTÍFICOS',
            description: 'Ecosistema impulsado por la UA que conecta investigación, empresas y talento.',
            logoUrl: 'https://atalayas.com/wp-content/uploads/2026/02/logo-pca.png',
            website: 'https://parquecientificoalicante.es'
          },
          {
            id: 'eco-4',
            name: 'PARQUE CIENTÍFICO DE LA UMH',
            type: 'PARQUES CIENTÍFICOS',
            description: 'Plataforma enfocada en la creación y consolidación de empresas innovadoras.',
            logoUrl: 'https://atalayas.com/wp-content/uploads/2026/02/logo-umhparc.png',
            website: 'https://parquecientificoumh.es'
          },
          {
            id: 'eco-5',
            name: 'AIJU INSTITUTO TECNOLÓGICO',
            type: 'INSTITUTOS Y CENTROS TECNOLÓGICOS',
            description: 'Centro tecnológico especializado en productos infantiles y ocio industrial.',
            logoUrl: 'https://atalayas.com/wp-content/uploads/2026/02/logo-aiju.png',
            website: 'https://www.aiju.es'
          },
          {
            id: 'eco-6',
            name: 'INESCOP INSTITUTO TECNOLÓGICO',
            type: 'INSTITUTOS Y CENTROS TECNOLÓGICOS',
            description: 'Centro de innovación y tecnología experto en el sector del calzado.',
            logoUrl: 'https://atalayas.com/wp-content/uploads/2026/02/logo-inescop.png',
            website: 'https://www.inescop.es'
          },
          {
            id: 'eco-7',
            name: 'AITEX CENTRO DE INVESTIGACIÓN',
            type: 'INSTITUTOS Y CENTROS TECNOLÓGICOS',
            description: 'Instituto tecnológico de referencia en investigación aplicada al sector textil.',
            logoUrl: 'https://atalayas.com/wp-content/uploads/2026/02/logo-aitex.png',
            website: 'https://www.aitex.es'
          }
        ];

        setTimeout(() => {
          setColaboradores(mockData);
          setLoading(false);
        }, 700);

      } catch (err) {
        console.error("Error cargando ecosistema:", err);
        setLoading(false);
      }
    };

    fetchEcosystem();
  }, []);

  const filteredList = filter === 'TODOS' 
    ? colaboradores 
    : colaboradores.filter(c => c.type === filter);

  return (
    <div className="flex min-h-screen bg-background font-sans text-foreground overflow-hidden">

      <main className="flex-1 flex flex-col overflow-hidden bg-white/40 dark:bg-transparent backdrop-blur-3xl transition-all duration-300">
        <PageHeader 
          title="Ecosistema"
          description="Alianzas estratégicas y centros tecnológicos de proximidad"
          icon={<i className="bi bi-globe-americas"></i>}
        />

        <div className="flex-1 p-6 md:p-10 overflow-y-auto no-scrollbar">
          
          {/* FILTROS */}
          <motion.div 
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex flex-wrap gap-2 mb-10 max-w-6xl"
          >
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-5 py-2.5 rounded-xl text-[9px] font-black tracking-[0.15em] uppercase transition-all border ${
                  filter === cat 
                  ? 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20' 
                  : 'bg-card text-muted-foreground border-border hover:border-primary/40 hover:text-primary'
                }`}
              >
                {cat}
              </button>
            ))}
          </motion.div>

          {/* GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 max-w-400">
            
            {loading ? (
              <div className="col-span-full flex justify-center py-24">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div>
              </div>
            ) : filteredList.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="col-span-full py-20 text-center border-2 border-dashed border-border rounded-[40px] opacity-40"
              >
                <p className="text-sm italic font-bold text-muted-foreground">
                  No se han encontrado entidades en esta categoría.
                </p>
              </motion.div>
            ) : (
              <AnimatePresence mode="wait">
                <motion.div
                  key={filter}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.35 }}
                  className="contents"
                >
                  {filteredList.map((entidad, index) => (
                    <motion.div
                      key={entidad.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.04 }}
                    >
                      <Link 
                        href={entidad.website} 
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex flex-col bg-card border border-border rounded-[35px] p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                      >
                        {/* LOGO */}
                        <div className="aspect-square w-full bg-muted/30 rounded-[25px] flex items-center justify-center p-6 mb-5 overflow-hidden group-hover:bg-card transition-colors border border-transparent group-hover:border-primary/20">
                          {entidad.logoUrl ? (
                            <img 
                              src={entidad.logoUrl} 
                              alt={entidad.name} 
                              className="max-w-full max-h-full object-contain transition-transform duration-500 group-hover:scale-110 dark:brightness-110 dark:contrast-125"
                            />
                          ) : (
                            <div className="text-4xl font-black text-muted/20 uppercase">
                              {entidad.name.charAt(0)}
                            </div>
                          )}
                        </div>
                        
                        {/* TEXTOS */}
                        <div className="flex-1 flex flex-col">
                          <span className="text-[8px] font-black text-primary uppercase tracking-[0.2em] mb-2">
                            {entidad.type.split(' ')[0]}
                          </span>

                          <h3 className="text-[13px] font-black text-foreground leading-tight mb-2 group-hover:text-primary transition-colors">
                            {entidad.name}
                          </h3>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </motion.div>
              </AnimatePresence>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}