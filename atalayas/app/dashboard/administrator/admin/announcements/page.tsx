'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/ui/pageHeader';
import SearchInput from '@/components/ui/Searchbar';
import { API_ROUTES, fetchWithApiFallback } from '@/lib/utils';

// --- Interfaces ---
interface Announcement {
  id: string;
  title: string;
  content: string;
  isPublic: boolean;
  createdAt: string;
  imageUrl?: string | null;
  Company?: { id: string; name: string } | null;
}

// --- Componente: Carrusel Premium ---
function AnnouncementCarousel({
  items,
  onEdit,
  onDelete
}: {
  items: Announcement[],
  onEdit: (e: React.MouseEvent, a: Announcement) => void,
  onDelete: (e: React.MouseEvent, id: string) => void
}) {
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

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % items.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
  };

  return (
    <section className="space-y-4 mb-12">
      <div className="px-4">
        <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/70">
          Últimas noticias
        </h2>
      </div>

      <div className="relative p-[1.5px] rounded-[3.5rem] transition-all duration-500 bg-linear-to-r from-orange-500 to-blue-500 shadow-2xl group">
        <div
          onClick={() => router.push(`/dashboard/administrator/admin/announcements/${actualAnuncio.id}`)}
          className="relative block w-full aspect-video md:aspect-21/9 lg:aspect-25/8 rounded-[calc(3.5rem-1.5px)] overflow-hidden bg-zinc-900 cursor-pointer"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: 'easeInOut' }}
              className="absolute inset-0"
            >
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-[5s] ease-out group-hover:scale-110"
                style={{
                  backgroundImage: `url(${actualAnuncio.imageUrl || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop'})`
                }}
              />

              <div className="absolute inset-0 bg-linear-to-r from-black/90 via-black/40 to-transparent z-10" />

              {!actualAnuncio.isPublic && (
                <div className="absolute top-8 right-8 z-40 flex gap-3">
                  <button
                    onClick={(e) => onEdit(e, actualAnuncio)}
                    className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-xl text-white flex items-center justify-center hover:bg-primary transition-all border border-white/20 shadow-xl"
                  >
                    <i className="bi bi-pencil-fill text-sm" />
                  </button>

                  <button
                    onClick={(e) => onDelete(e, actualAnuncio.id)}
                    className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-xl text-white flex items-center justify-center hover:bg-red-500 transition-all border border-white/20 shadow-xl"
                  >
                    <i className="bi bi-trash3 text-sm" />
                  </button>
                </div>
              )}

              <div className="absolute inset-0 z-20 flex flex-col justify-center p-10 md:p-20">
                <div className="max-w-3xl space-y-4">
                  <div className="flex gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-[0.2em] backdrop-blur-md text-white border border-white/20 ${
                        actualAnuncio.isPublic
                          ? 'bg-blue-500/40'
                          : 'bg-purple-500/40'
                      }`}
                    >
                      {actualAnuncio.isPublic
                        ? 'Global'
                        : actualAnuncio.Company?.name || 'Empresa'}
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

          <button
            onClick={(e) => {
              e.stopPropagation();
              prevSlide();
            }}
            className="absolute left-4 inset-y-0 z-30 flex items-center bg-transparent border-none text-white/20 hover:text-white transition-all duration-300"
          >
            <i className="bi bi-chevron-left text-5xl font-thin"></i>
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              nextSlide();
            }}
            className="absolute right-4 inset-y-0 z-30 flex items-center bg-transparent border-none text-white/20 hover:text-white transition-all duration-300"
          >
            <i className="bi bi-chevron-right text-5xl font-thin"></i>
          </button>
        </div>
      </div>
    </section>
  );
}

// --- Modal ---
function AnnouncementModal({
  isOpen,
  onClose,
  onSave,
  initialData
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  initialData?: Announcement | null;
}) {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    imageUrl: ''
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title,
        content: initialData.content,
        imageUrl: initialData.imageUrl || ''
      });
    } else {
      setFormData({
        title: '',
        content: '',
        imageUrl: ''
      });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="bg-white dark:bg-[#1c1c1e] w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/10">
        <div className="p-8 border-b border-gray-100 dark:border-white/5 flex justify-between items-center">
          <h2 className="text-xl font-black tracking-tight">
            {initialData ? 'Editar Anuncio' : 'Nuevo Anuncio'}
          </h2>

          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full hover:bg-gray-200 dark:hover:bg-white/10 flex items-center justify-center"
          >
            <i className="bi bi-x-lg" />
          </button>
        </div>

        <div className="p-8 space-y-6 max-h-[60vh] overflow-y-auto no-scrollbar">
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">
              URL de Imagen
            </label>

            <input
              className="w-full bg-gray-100 dark:bg-white/5 border-none rounded-2xl p-4 text-sm font-bold"
              value={formData.imageUrl}
              onChange={e =>
                setFormData({
                  ...formData,
                  imageUrl: e.target.value
                })
              }
              placeholder="https://images.unsplash.com/..."
            />
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">
              Título
            </label>

            <input
              className="w-full bg-gray-100 dark:bg-white/5 border-none rounded-2xl p-4 text-sm font-bold"
              value={formData.title}
              onChange={e =>
                setFormData({
                  ...formData,
                  title: e.target.value
                })
              }
            />
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">
              Contenido
            </label>

            <textarea
              className="w-full bg-gray-100 dark:bg-white/5 border-none rounded-2xl p-4 text-sm font-medium min-h-30"
              value={formData.content}
              onChange={e =>
                setFormData({
                  ...formData,
                  content: e.target.value
                })
              }
            />
          </div>
        </div>

        <div className="p-8 bg-gray-50 dark:bg-white/2 flex gap-4">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:bg-gray-200"
          >
            Cancelar
          </button>

          <button
            onClick={() => onSave(formData)}
            className="flex-2 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-primary text-white shadow-lg shadow-primary/20"
          >
            {initialData ? 'Actualizar' : 'Publicar'}
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Página Principal ---
export default function AnnouncementsPage() {
  const router = useRouter();

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 6;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAnn, setEditingAnn] = useState<Announcement | null>(null);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const fetchAnnouncements = async () => {
    setLoading(true);

    try {
      const token = localStorage.getItem('token');

      const data = await fetchWithApiFallback(
        API_ROUTES.ANNOUNCEMENTS.GET_ALL,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setAnnouncements(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (formData: any) => {
    try {
      const token = localStorage.getItem('token');

      const url = editingAnn
        ? `${API_ROUTES.ANNOUNCEMENTS.GET_ALL}/${editingAnn.id}`
        : API_ROUTES.ANNOUNCEMENTS.GET_ALL;

      const res = await fetch(url, {
        method: editingAnn ? 'PUT' : 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        fetchAnnouncements();
        setIsModalOpen(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (
    e: React.MouseEvent,
    id: string
  ) => {
    e.stopPropagation();

    if (!window.confirm('¿Eliminar anuncio?')) return;

    try {
      const token = localStorage.getItem('token');

      await fetch(
        `${API_ROUTES.ANNOUNCEMENTS.GET_ALL}/${id}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setAnnouncements(prev =>
        prev.filter(a => a.id !== id)
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleEdit = (
    e: React.MouseEvent,
    ann: Announcement
  ) => {
    e.stopPropagation();

    setEditingAnn(ann);
    setIsModalOpen(true);
  };

  const filtered = useMemo(() => {
    return announcements.filter(ann =>
      ann.title
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      ann.Company?.name
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase())
    );
  }, [announcements, searchQuery]);

  const totalPages = Math.ceil(
    filtered.length / itemsPerPage
  );

  const currentItems = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="flex h-screen bg-[#f5f5f7] dark:bg-[#0d0d0f] overflow-hidden">
      <main className="flex-1 flex flex-col min-w-0 bg-white/40 dark:bg-transparent backdrop-blur-3xl overflow-hidden transition-all duration-300">
        <PageHeader
          title="Anuncios y Noticias"
          description="Control de comunicados destacados e historial."
          icon={<i className="bi bi-megaphone-fill" />}
          action={
            <div className="flex items-center gap-3">
              <div className="flex justify-end min-w-12">
                <SearchInput
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder="Buscar noticias..."
                />
              </div>

              <button 
                onClick={() => router.push(`/dashboard/administrator/admin/announcements/new`)}
                className="bg-secondary text-secondary-foreground px-5 py-2 rounded-xl text-xs font-bold uppercase hover:opacity-90 transition-all flex items-center gap-2 shadow-sm"
                title="Crear Anuncio"
              >
                <i className="bi bi-plus-lg text-lg sm:text-base"></i>
                <span className="hidden sm:inline whitespace-nowrap">
                  Crear Anuncio
                </span>
              </button>
            </div>
          }
        />

        <div className="flex-1 overflow-y-auto p-6 lg:p-10 no-scrollbar">
          <div className="max-w-7xl mx-auto space-y-12">
            
            {/* SOLUCIÓN: Cambiado a mode="popLayout" */}
            <AnimatePresence mode="popLayout">
              {loading ? (
                <motion.div
                  key="loader"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex justify-center py-32 w-full"
                >
                  <div className="animate-spin rounded-full h-14 w-14 border-t-2 border-primary"></div>
                </motion.div>
              ) : (
                <motion.div
                  key="content"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                  className="w-full"
                >
                  {!searchQuery && currentPage === 1 && announcements.length > 0 && (
                    <AnnouncementCarousel
                      items={announcements.slice(0, 5)}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                    />
                  )}

                  <div className="space-y-6">
                    <div className="flex justify-between items-end px-4">
                      <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">
                        Historial de anuncios
                      </h3>

                      <p className="text-[10px] font-bold text-muted-foreground/40">
                        Pág {currentPage} de {totalPages || 1}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {currentItems.map((ann) => (
                        <div
                          key={ann.id}
                          onClick={() =>
                            router.push(
                              `/dashboard/administrator/admin/announcements/${ann.id}`
                            )
                          }
                          className="group bg-white dark:bg-[#1c1c1e] rounded-[2.5rem] border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-2xl transition-all cursor-pointer overflow-hidden flex flex-col"
                        >
                          <div className="h-48 relative bg-gray-200 dark:bg-neutral-800 overflow-hidden">
                            <img
                              src={
                                ann.imageUrl ||
                                'https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2069&auto=format&fit=crop'
                              }
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                              alt={ann.title}
                            />

                            {!ann.isPublic && (
                              <div className="absolute top-4 right-4 flex gap-2">
                                <button
                                  onClick={(e) => handleEdit(e, ann)}
                                  className="w-8 h-8 rounded-full bg-black/20 backdrop-blur-md text-white flex items-center justify-center hover:bg-primary transition-colors shadow-lg"
                                >
                                  <i className="bi bi-pencil-fill text-[10px]" />
                                </button>

                                <button
                                  onClick={(e) => handleDelete(e, ann.id)}
                                  className="w-8 h-8 rounded-full bg-black/20 backdrop-blur-md text-white flex items-center justify-center hover:bg-red-500 transition-colors shadow-lg"
                                >
                                  <i className="bi bi-trash3 text-[10px]" />
                                </button>
                              </div>
                            )}

                            <div className="absolute bottom-4 left-4">
                              <span
                                className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-tighter backdrop-blur-md text-white border border-white/20 ${
                                  ann.isPublic
                                    ? 'bg-blue-500/40'
                                    : 'bg-purple-500/40'
                                }`}
                              >
                                {ann.isPublic
                                  ? 'Global'
                                  : ann.Company?.name}
                              </span>
                            </div>
                          </div>

                          <div className="p-6">
                            <h4 className="font-bold text-base mb-2 group-hover:text-primary transition-colors line-clamp-1">
                              {ann.title}
                            </h4>

                            <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed mb-4">
                              {ann.content}
                            </p>

                            <div className="pt-4 border-t border-gray-50 dark:border-white/5 flex justify-between items-center text-[10px] font-bold text-muted-foreground/40">
                              <span>
                                {new Date(ann.createdAt).toLocaleDateString()}
                              </span>
                              <i className="bi bi-arrow-right text-primary opacity-0 group-hover:opacity-100 transition-all" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {totalPages > 1 && (
                      <div className="flex justify-center items-center gap-2 pt-6">
                        <button
                          onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                          disabled={currentPage === 1}
                          className="w-10 h-10 rounded-xl bg-white dark:bg-zinc-900 border border-gray-100 flex items-center justify-center disabled:opacity-20 transition-all hover:border-primary"
                        >
                          <i className="bi bi-chevron-left" />
                        </button>

                        <div className="flex gap-1">
                          {[...Array(totalPages)].map((_, i) => (
                            <button
                              key={i}
                              onClick={() => setCurrentPage(i + 1)}
                              className={`w-10 h-10 rounded-xl text-[10px] font-black transition-all ${
                                currentPage === i + 1
                                  ? 'bg-primary text-white'
                                  : 'bg-white dark:bg-zinc-900 text-muted-foreground'
                              }`}
                            >
                              {i + 1}
                            </button>
                          ))}
                        </div>

                        <button
                          onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                          disabled={currentPage === totalPages}
                          className="w-10 h-10 rounded-xl bg-white dark:bg-zinc-900 border border-gray-100 flex items-center justify-center disabled:opacity-20 transition-all hover:border-primary"
                        >
                          <i className="bi bi-chevron-right" />
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <AnnouncementModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSave}
          initialData={editingAnn}
        />
      </main>
    </div>
  );
}