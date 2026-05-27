'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/ui/Sidebar';
import PageHeader from '@/components/ui/pageHeader';
import { API_ROUTES } from '@/lib/utils';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

export default function DocumentsExplorerPage() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'public' | 'private'>('all');
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const handleResize = () => {
      const desktop = window.innerWidth >= 1024;
      setIsDesktop(desktop);
      if (!desktop) setIsSidebarOpen(false);
      else setIsSidebarOpen(true);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    
    const fetchDocuments = async () => {
      try {
        const storedUser = localStorage.getItem('user');
        const token = localStorage.getItem('token');
        if (!storedUser || !token) return;
        const user = JSON.parse(storedUser);
        setCurrentUser(user);

        const res = await fetch(API_ROUTES.DOCUMENTS.GET_ALL, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Error');
        const data = await res.json();
        setDocuments(Array.isArray(data) ? data : (data.data || []));
      } catch (err) { console.error(err); } 
      finally { setLoading(false); }
    };
    fetchDocuments();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleDownload = async (url: string, fileName: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName || 'documento';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) { console.error(err); }
  };

  const filteredDocs = documents.filter(doc => {
    if (currentUser?.role === 'ADMIN') {
      const isMyCompany = String(doc.companyId) === String(currentUser.companyId);
      if (!doc.isPublic && !isMyCompany) return false;
    }
    if (filter === 'public' && !doc.isPublic) return false;
    if (filter === 'private' && doc.isPublic) return false;
    if (searchTerm.trim() !== '') {
      const normalizedTitle = doc.title.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
      const normalizedSearch = searchTerm.trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
      return normalizedTitle.includes(normalizedSearch);
    }
    return true; 
  });

  if (!currentUser) return null;

  return (
    <div className="flex h-screen bg-background overflow-hidden font-sans text-foreground">
      
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <PageHeader 
          title="Centro de Documentos"
          description="Gestiona y visualiza la documentación oficial."
          icon={<i className="bi bi-folder-fill"></i>}
        />

        <div className="flex-1 flex overflow-hidden relative">
          
          <AnimatePresence>
            {!isDesktop && isSidebarOpen && (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setIsSidebarOpen(false)}
                className="absolute inset-0 bg-black/60 backdrop-blur-[2px] z-30 lg:hidden"
              />
            )}
          </AnimatePresence>
          
          {/* PANEL LATERAL: CORREGIDO PARA MÓVIL Y ESCRITORIO */}
          <motion.div 
            initial={false}
            animate={{ 
              x: isSidebarOpen ? 0 : -320,
              // EN MÓVIL EL ANCHO DEBE SER SIEMPRE 320 PARA QUE SE VEA EL CONTENIDO
              width: isDesktop ? (isSidebarOpen ? 320 : 0) : 320
            }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="absolute lg:relative flex shrink-0 z-40 h-full"
          >
            {/* Contenido del Menú */}
            <div className="w-[320px] bg-card border-r border-border flex flex-col h-full shadow-2xl lg:shadow-none relative overflow-hidden">
              <div className="p-4 sm:p-6 border-b border-border/50 relative z-50">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input 
                      type="text" placeholder="Buscar archivos..." value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-background border border-border focus:border-primary rounded-xl text-sm outline-none transition-all"
                    />
                    <i className="bi bi-search absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"></i>
                  </div>
                  <button 
                    onClick={() => setIsFilterOpen(!isFilterOpen)}
                    className={`w-10 h-10 flex items-center justify-center rounded-xl border transition-all ${isFilterOpen ? 'bg-primary border-primary text-white' : 'bg-background border-border text-muted-foreground'}`}
                  >
                    <i className="bi bi-sliders2"></i>
                  </button>
                </div>

                <AnimatePresence>
                  {isFilterOpen && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                      className="absolute left-6 right-6 top-[calc(100%-8px)] bg-card border border-border rounded-2xl shadow-xl p-2 mt-2 z-50"
                    >
                      <div className="flex flex-col gap-1">
                        {[
                          { id: 'all', label: 'Todos', icon: 'bi-grid' },
                          { id: 'public', label: 'Públicos', icon: 'bi-unlock' },
                          { id: 'private', label: 'Privados', icon: 'bi-lock' }
                        ].map((option) => (
                          <button
                            key={option.id}
                            onClick={() => { setFilter(option.id as any); setIsFilterOpen(false); }}
                            className={`flex items-center gap-3 w-full px-4 py-2 rounded-xl text-xs font-bold transition-all ${filter === option.id ? 'bg-primary/10 text-primary' : 'hover:bg-muted text-muted-foreground'}`}
                          >
                            <i className={`bi ${option.icon}`}></i> {option.label}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar bg-card">
                {loading ? (
                  <div className="space-y-3 p-4">
                    {[1, 2, 3].map(i => <div key={i} className="h-16 bg-muted animate-pulse rounded-2xl" />)}
                  </div>
                ) : filteredDocs.map((doc) => (
                  <button
                    key={doc.id}
                    onClick={() => { setSelectedDoc(doc); if (!isDesktop) setIsSidebarOpen(false); }}
                    className={`w-full group flex items-start gap-3 p-4 rounded-2xl transition-all border ${selectedDoc?.id === doc.id ? 'bg-primary/5 border-primary shadow-sm' : 'bg-transparent border-transparent hover:bg-muted/50'}`}
                  >
                    <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-lg ${selectedDoc?.id === doc.id ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>
                      <i className={`bi ${doc.fileUrl.endsWith('.pdf') ? 'bi-file-pdf' : 'bi-file-earmark-text'}`}></i>
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className={`font-bold text-xs truncate ${selectedDoc?.id === doc.id ? 'text-primary' : 'text-foreground'}`}>{doc.title}</span>
                        <div className={`shrink-0 w-2 h-2 rounded-full ${doc.isPublic ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]'}`} />
                      </div>
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="font-black opacity-40 uppercase tracking-widest">{new Date(doc.createdAt).toLocaleDateString()}</span>
                        <span className={`font-bold uppercase tracking-tighter ${doc.isPublic ? 'text-emerald-500' : 'text-amber-500'}`}>{doc.isPublic ? 'Púb' : 'Priv'}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* BOTÓN DE DESPLIEGUE: Siempre anclado al borde del panel (320px) */}
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="absolute left-80 top-1/2 -translate-y-1/2 w-8 h-14 bg-card border-y border-r border-border flex items-center justify-center rounded-r-2xl shadow-xl hover:bg-muted transition-colors lg:w-6 lg:h-12 lg:rounded-r-lg z-50"
            >
              <i className={`bi ${isSidebarOpen ? 'bi-chevron-left' : 'bi-chevron-right'} text-muted-foreground`}></i>
            </button>
          </motion.div>

          {/* VISOR DERECHO */}
          <div className="flex-1 bg-background flex flex-col relative overflow-hidden">
            <AnimatePresence mode="wait">
              {selectedDoc ? (
                <motion.div key={selectedDoc.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col h-full">
                  <div className="px-4 sm:px-8 py-4 bg-card/50 border-b border-border flex flex-col sm:flex-row items-start sm:items-center justify-between backdrop-blur-sm z-10 gap-4">
                    <div className="min-w-0">
                      <p className="text-[9px] font-black uppercase text-primary tracking-[0.2em] mb-0.5">{selectedDoc.isPublic ? 'Global' : 'Privado'}</p>
                      <h2 className="text-sm font-bold truncate pr-4">{selectedDoc.title}</h2>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                      <button onClick={() => handleDownload(selectedDoc.fileUrl, selectedDoc.title)} className="px-4 py-2 bg-muted hover:bg-primary hover:text-white rounded-xl text-xs font-normal transition-all flex items-center justify-center gap-2">
                        <i className="bi bi-download"></i> Descargar
                      </button>
                      <a href={selectedDoc.fileUrl} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-muted hover:bg-primary hover:text-white rounded-xl text-xs font-normal transition-all flex items-center justify-center gap-2">
                        <i className="bi bi-box-arrow-up-right"></i> Ver en navegador
                      </a>
                    </div>
                  </div>
                  <div className="flex-1 bg-[#525659] relative">
                    <iframe src={`${selectedDoc.fileUrl}#toolbar=0`} className="w-full h-full border-none shadow-2xl" title={selectedDoc.title} />
                  </div>
                </motion.div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                  <div className="w-20 h-20 bg-card border border-border rounded-[2rem] flex items-center justify-center mb-6 shadow-inner opacity-40">
                    <i className="bi bi-file-earmark-lock2 text-3xl text-primary"></i>
                  </div>
                  <h2 className="text-lg font-bold mb-1 opacity-80">Explorador de Archivos</h2>
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Selecciona un documento para comenzar</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
}