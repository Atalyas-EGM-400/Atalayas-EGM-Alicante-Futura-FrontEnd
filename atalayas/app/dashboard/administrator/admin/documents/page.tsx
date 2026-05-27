"use client";

import { useState, useEffect } from 'react';
import PageHeader from '@/components/ui/pageHeader';
import { API_ROUTES } from '@/lib/utils';
import Link from 'next/link';
import { motion, AnimatePresence, Variants } from 'framer-motion';

// Interfaces estructuradas de TypeScript para eliminar los tipos 'any'
interface DocumentItem {
  id: string;
  title: string;
  fileUrl: string;
  isPublic: boolean;
  companyId?: string | null;
  userId?: string | null;
  createdAt: string;
}

interface CurrentUser {
  role: 'ADMIN' | 'GENERAL_ADMIN' | 'EMPLOYEE' | string;
  companyId?: string;
}

const pageVariants: Variants = {
  hidden: { opacity: 0, y: 16, filter: 'blur(6px)' },
  show: { 
    opacity: 1, 
    y: 0, 
    filter: 'blur(0px)',
    transition: { duration: 0.28, ease: 'easeOut', when: 'beforeChildren', staggerChildren: 0.06 }
  }
};

const panelVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.22, ease: 'easeOut' } }
};

const overlayVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.18, ease: 'easeOut' } },
  exit: { opacity: 0, transition: { duration: 0.18, ease: 'easeIn' } }
};

const SIDEBAR_W = 320;
const spring = { type: 'spring', stiffness: 280, damping: 28 } as const;

function LoadingSpinner() {
  return (
    <div className="flex justify-center py-20">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary" />
    </div>
  );
}

export default function DocumentsExplorerPage() {
  const [documents, setDocuments]   = useState<DocumentItem[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<DocumentItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter]         = useState<'all' | 'public' | 'private'>('all');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isFilterOpen, setIsFilterOpen]   = useState(false);
  const [isDesktop, setIsDesktop]   = useState(true);
  const [loading, setLoading]       = useState(true);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

  useEffect(() => {
    const handleResize = () => {
      const desktop = window.innerWidth >= 1024;
      setIsDesktop(desktop);
      setIsSidebarOpen(desktop);
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    (async () => {
      try {
        const storedUser = localStorage.getItem('user');
        const token      = localStorage.getItem('token');
        if (!storedUser || !token) return;
        const user: CurrentUser = JSON.parse(storedUser);
        setCurrentUser(user);
        
        const res  = await fetch(API_ROUTES.DOCUMENTS.GET_ALL, { headers: { Authorization: `Bearer ${token}` } });
        
        if (!res.ok) { 
          console.warn('Error fetching documents:', res.status); 
          setDocuments([]); 
          return; 
        }
        
        const data = await res.json();
        setDocuments(Array.isArray(data) ? data : (data.data || []));
      } catch (err) { 
        console.warn('Error fetching documents:', err); 
        setDocuments([]);
      }
      finally { setLoading(false); }
    })();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleDownload = async (url: string, fileName: string) => {
    try {
      const blob   = await fetch(url).then(r => r.blob());
      const blobUrl = window.URL.createObjectURL(blob);
      const a = Object.assign(document.createElement('a'), { href: blobUrl, download: fileName || 'documento' });
      document.body.appendChild(a); 
      a.click(); 
      a.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) { 
      console.error(err); 
    }
  };

  const filteredDocs = documents.filter(doc => {
    // 1. Filtro de seguridad por Rol
    if (currentUser?.role === 'ADMIN') {
      const isGlobal = doc.isPublic === true && !doc.companyId;
      const isMyCompany = String(doc.companyId) === String(currentUser.companyId);
      if (!isGlobal && !isMyCompany) return false;
    }

    // 2. Definición semántica de Filtros Visuales
    const isSharedOrPublic = doc.isPublic || (doc.companyId && !doc.userId);
    if (filter === 'public' && !isSharedOrPublic) return false;
    if (filter === 'private' && isSharedOrPublic) return false;

    // 3. Filtro del buscador por texto
    if (searchTerm.trim() !== '') {
      const normalizedTitle = doc.title.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
      const normalizedSearch = searchTerm.trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
      return normalizedTitle.includes(normalizedSearch);
    }

    return true; 
  });

  if (!currentUser) return null;

  return (
    <motion.div 
      className="flex h-screen bg-background overflow-hidden font-sans text-foreground"
      variants={pageVariants} 
      initial="hidden" 
      animate="show"
    >
      <main className="flex-1 flex flex-col overflow-hidden relative">

        <motion.div variants={panelVariants}>
          <PageHeader
            title="Centro de Documentos"
            description="Gestiona y visualiza la documentación oficial."
            icon={<i className="bi bi-folder-fill" />}
            action={
              <Link href="/dashboard/administrator/admin/documents/new">
                <button className="bg-secondary text-secondary-foreground px-5 py-2 rounded-xl text-xs font-bold uppercase hover:opacity-90 transition-all flex items-center gap-2 shadow-sm">
                  <i className="bi bi-plus-lg text-sm" />
                  <span className="hidden sm:inline">Subir archivo</span>
                  <span className="sm:hidden">Subir</span>
                </button>
              </Link>
            }
          />
        </motion.div>

        {/* Layout principal */}
        <div className="flex-1 flex overflow-hidden relative">

          {/* Overlay móvil */}
          <AnimatePresence>
            {!isDesktop && isSidebarOpen && (
              <motion.div 
                variants={overlayVariants} 
                initial="hidden" 
                animate="show" 
                exit="exit"
                onClick={() => setIsSidebarOpen(false)}
                className="absolute inset-0 bg-black/60 backdrop-blur-[2px] z-30 lg:hidden" 
              />
            )}
          </AnimatePresence>

          <motion.div
            className={`relative shrink-0 z-40 h-full ${!isDesktop ? 'absolute' : ''}`}
            initial={false}
            animate={{ width: isSidebarOpen ? SIDEBAR_W : 0 }}
            transition={spring}
            style={{ minWidth: 0 }}
          >
            <div className="absolute inset-0 overflow-hidden">
              <div className="w-[320px] h-full bg-card border-r border-border flex flex-col shadow-2xl lg:shadow-none">

                {/* Búsqueda + filtro */}
                <div className="p-4 sm:p-6 border-b border-border/50 relative z-50">
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <input 
                        type="text" 
                        placeholder="Buscar archivos..." 
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-background border border-border focus:border-primary rounded-xl text-sm outline-none transition-all" 
                      />
                      <i className="bi bi-search absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    </div>
                    <button 
                      onClick={() => setIsFilterOpen(!isFilterOpen)}
                      className={`w-10 h-10 flex items-center justify-center rounded-xl border transition-all active:scale-95
                        ${isFilterOpen ? 'bg-primary border-primary text-white' : 'bg-background border-border text-muted-foreground'}`}
                    >
                      <i className="bi bi-sliders2" />
                    </button>
                  </div>

                  <AnimatePresence>
                    {isFilterOpen && (
                      <motion.div 
                        variants={overlayVariants} 
                        initial="hidden" 
                        animate="show" 
                        exit="exit"
                        className="absolute left-6 right-6 top-[calc(100%-8px)] bg-card border border-border rounded-2xl shadow-xl p-2 mt-2 z-50"
                      >
                        <div className="flex flex-col gap-1">
                          {[
                            { id: 'all',    label: 'Todos',    icon: 'bi-grid'  },
                            { id: 'public',  label: 'Públicos', icon: 'bi-unlock' },
                            { id: 'private', label: 'Privados', icon: 'bi-lock'  },
                          ].map(opt => (
                            <button 
                              key={opt.id} 
                              onClick={() => { setFilter(opt.id as any); setIsFilterOpen(false); }}
                              className={`flex items-center gap-3 w-full px-4 py-2 rounded-xl text-xs font-bold transition-all hover:translate-x-1 active:scale-98
                                ${filter === opt.id ? 'bg-primary/10 text-primary' : 'hover:bg-muted text-muted-foreground'}`}
                            >
                              <i className={`bi ${opt.icon}`} /> {opt.label}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Lista de documentos */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar bg-card">
                  {loading ? (
                    <LoadingSpinner />
                  ) : (
                    filteredDocs.map(doc => (
                      <button 
                        key={doc.id}
                        onClick={() => { setSelectedDoc(doc); if (!isDesktop) setIsSidebarOpen(false); }}
                        className={`w-full group flex items-start gap-3 p-4 rounded-2xl transition-all border text-left active:scale-[0.99] hover:translate-x-1
                          ${selectedDoc?.id === doc.id ? 'bg-primary/5 border-primary shadow-sm' : 'bg-transparent border-transparent hover:bg-muted/50'}`}
                      >
                        <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-colors
                          ${selectedDoc?.id === doc.id ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>
                          <i className={`bi ${doc.fileUrl?.endsWith('.pdf') ? 'bi-file-pdf' : 'bi-file-earmark-text'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className={`font-bold text-xs truncate ${selectedDoc?.id === doc.id ? 'text-primary' : 'text-foreground'}`}>
                              {doc.title}
                            </span>
                            <div className={`shrink-0 w-2 h-2 rounded-full ${doc.isPublic ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]'}`} />
                          </div>
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="font-black text-muted-foreground/60 uppercase tracking-widest">
                              {new Date(doc.createdAt).toLocaleDateString()}
                            </span>
                            <span className={`font-bold uppercase tracking-tighter ${doc.isPublic ? 'text-emerald-500' : 'text-amber-500'}`}>
                              {doc.isPublic ? 'Púb' : 'Priv'}
                            </span>
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>

              </div>
            </div>

            <button
              onClick={() => setIsSidebarOpen(v => !v)}
              style={{ left: isSidebarOpen ? SIDEBAR_W : 0 }}
              className="absolute top-1/2 -translate-y-1/2 w-6 h-12 bg-card border-y border-r border-border flex items-center justify-center rounded-r-lg shadow-xl hover:bg-muted transition-all z-50"
            >
              <i className={`bi ${isSidebarOpen ? 'bi-chevron-left' : 'bi-chevron-right'} text-muted-foreground`} />
            </button>

          </motion.div>

          {/* Área de previsualización */}
          <div className="flex-1 flex flex-col overflow-hidden bg-background">
            <AnimatePresence mode="wait">
              {selectedDoc ? (
                <motion.div 
                  key={selectedDoc.id} 
                  className="flex flex-col h-full"
                  initial={{ opacity: 0, y: 14 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.22, ease: 'easeOut' }}
                >
                  <div className="px-4 sm:px-8 py-4 bg-card/50 border-b border-border flex flex-col sm:flex-row items-start sm:items-center justify-between backdrop-blur-sm z-10 gap-4 shrink-0">
                    <div className="min-w-0">
                      <p className="text-[9px] font-black uppercase text-primary tracking-[0.2em] mb-1">
                        {selectedDoc.isPublic ? 'Global' : 'Privado'}
                      </p>
                      <h2 className="text-sm font-bold truncate pr-4">{selectedDoc.title}</h2>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                      <button 
                        onClick={() => handleDownload(selectedDoc.fileUrl, selectedDoc.title)}
                        className="px-4 py-2 bg-muted hover:bg-primary hover:text-white rounded-xl text-xs font-normal transition-all flex items-center gap-2 active:scale-95"
                      >
                        <i className="bi bi-download" /> Descargar
                      </button>
                      <a 
                        href={selectedDoc.fileUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-muted hover:bg-primary hover:text-white rounded-xl text-xs font-normal transition-all flex items-center gap-2 active:scale-95"
                      >
                        <i className="bi bi-box-arrow-up-right" /> Ver en navegador
                      </a>
                    </div>
                  </div>

                  <div className="flex-1 overflow-hidden bg-[#525659]">
                    {/* El atributo key en el iframe destruye la instancia anterior y previene problemas de caché del navegador */}
                    <iframe 
                      key={selectedDoc.id}
                      src={`${selectedDoc.fileUrl}#toolbar=0`}
                      className="w-full h-full border-none"
                      title={selectedDoc.title} 
                    />
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  key="empty" 
                  className="flex-1 flex flex-col items-center justify-center p-12 text-center"
                  initial={{ opacity: 0, scale: 0.98 }} 
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                >
                  <div className="w-20 h-20 bg-card border border-border rounded-[2rem] flex items-center justify-center mb-6 shadow-inner text-muted-foreground/40">
                    <i className="bi bi-file-earmark-lock2 text-3xl text-primary" />
                  </div>
                  <h2 className="text-lg font-bold mb-1 opacity-80">Explorador de Archivos</h2>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                    Selecciona un documento para comenzar
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>
      </main>
    </motion.div>
  );
}