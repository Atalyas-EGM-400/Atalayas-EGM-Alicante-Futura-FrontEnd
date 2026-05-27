'use client';

import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PageHeader from '@/components/ui/pageHeader';
import Link from 'next/link';
import { API_ROUTES } from '@/lib/utils';
import { useRef } from 'react';

interface Colaborador {
  id: string;
  name: string;
  logoUrl: string;
  website: string;
  type: string;
  description?: string;
}

// Variantes de animación reutilizables
// "ease" debe ser un string nombrado o una tupla "as const" en framer-motion 12
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
  const [entityToDelete, setEntityToDelete] = useState<Colaborador | null>(null);

  // Estados para el Modal de Edición Inline
  const [entityToEdit, setEntityToEdit] = useState<Colaborador | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    website: '',
    tipoName: '',
    description: '',
    logoUrl: '',
  });
  const [editLogoSource, setEditLogoSource] = useState<'upload' | 'url'>('url');
  const [editLogoFile, setEditLogoFile] = useState<File | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState('');

  // Estados para el Autocompletado dentro del Modal de Edición
  const [showEditSuggestions, setShowEditSuggestions] = useState(false);
  const editInputRef = useRef<HTMLInputElement>(null);
  const editSuggestionsRef = useRef<HTMLDivElement>(null);

  // Lista filtrada derivada directamente — sin estado auxiliar, sin refs de control.
  // framer-motion se encarga de animar los cambios de forma declarativa.
  const filteredList = useMemo(
    () =>
      filter === 'TODOS'
        ? colaboradores
        : colaboradores.filter((c) => c.type === filter),
    [filter, colaboradores]
  );

  // Sugerencias del modal de edición
  const filteredEditTypes = useMemo(() => {
    if (!editFormData.tipoName.trim()) return [];
    return categories
      .filter((cat) => cat !== 'TODOS')
      .filter((tipo) =>
        tipo.toLowerCase().includes(editFormData.tipoName.toLowerCase())
      );
  }, [editFormData.tipoName, categories]);

  // 1. Cargar colaboradores y categorías
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

  // 2. Cerrar sugerencias al hacer clic fuera del modal
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        editSuggestionsRef.current &&
        !editSuggestionsRef.current.contains(event.target as Node) &&
        editInputRef.current &&
        !editInputRef.current.contains(event.target as Node)
      ) {
        setShowEditSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 3. Eliminar entidad
  const handleDelete = async () => {
    if (!entityToDelete) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_ROUTES.COMMUNITY.DELETE(entityToDelete.id)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setColaboradores((prev) => prev.filter((c) => c.id !== entityToDelete.id));
        setEntityToDelete(null);
      } else {
        alert('No se pudo eliminar la entidad. Verifica tus permisos.');
      }
    } catch (err) {
      console.error('Error al eliminar:', err);
    }
  };

  // 4. Abrir modal de edición
  const openEditModal = (entidad: Colaborador) => {
    setEntityToEdit(entidad);
    setEditFormData({
      name: entidad.name,
      website: entidad.website,
      tipoName: entidad.type,
      description: entidad.description || '',
      logoUrl: entidad.logoUrl,
    });
    setEditLogoSource('url');
    setEditLogoFile(null);
    setEditError('');
  };

  // 5. Guardar cambios de edición
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingEdit(true);
    setEditError('');

    if (editLogoSource === 'upload' && !editLogoFile) {
      setEditError('Por favor, selecciona un archivo de imagen si cambias a modo de subida.');
      setSavingEdit(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      let response;

      if (editLogoSource === 'upload' && editLogoFile) {
        const data = new FormData();
        data.append('name', editFormData.name);
        data.append('website', editFormData.website);
        data.append('tipoName', editFormData.tipoName);
        data.append('description', editFormData.description);
        data.append('file', editLogoFile);

        response = await fetch(`${API_ROUTES.COMMUNITY.UPDATE(entityToEdit!.id)}/upload`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${token}` },
          body: data,
        });
      } else {
        response = await fetch(`${API_ROUTES.COMMUNITY.UPDATE(entityToEdit!.id)}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: editFormData.name,
            website: editFormData.website,
            tipoName: editFormData.tipoName,
            description: editFormData.description,
            logoUrl: editFormData.logoUrl,
          }),
        });
      }

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Error al actualizar la entidad.');
      }

      setEntityToEdit(null);
      await fetchData(true);
    } catch (err: any) {
      setEditError(err.message);
    } finally {
      setSavingEdit(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background font-sans text-foreground">
      <main className="flex-1 overflow-y-auto flex flex-col relative no-scrollbar">
        <PageHeader
          title="Ecosistema"
          description="Gestiona las entidades y colaboradores clave del ecosistema de Atalayas EGM."
          icon={<i className="bi bi-diagram-3-fill" />}
          action={
            <div className="flex items-center justify-end">
              <Link
                href="/dashboard/administrator/general-admin/community/new"
                className="bg-secondary text-secondary-foreground px-5 py-2 rounded-xl text-xs font-bold uppercase hover:opacity-90 transition-all flex items-center gap-2 shadow-sm"
                title="Añadir Entidad"
              >
                <i className="bi bi-plus-lg text-lg sm:text-base" />
                <span className="hidden sm:inline whitespace-nowrap">Añadir Entidad</span>
              </Link>
            </div>
          }
        />

        <div className="p-6 lg:p-10 flex-1 max-w-400 mx-auto w-full relative z-0">

          {/* Barra de categorías — aparece suavemente cuando hay datos */}
          <AnimatePresence>
            {categories.length > 0 && (
              <motion.div
                key="categories"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className="flex flex-wrap gap-2 mb-10 bg-card border border-border p-2 rounded-2xl shadow-sm w-fit min-h-14.5 items-center"
              >
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
              </motion.div>
            )}
          </AnimatePresence>

          {/* Spinner de carga */}
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="spinner"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col items-center justify-center py-48 w-full gap-4"
              >
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              </motion.div>
            ) : (
              <motion.div
                key="grid"
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
                            <div className="flex gap-3">
                              <button
                                onClick={() => openEditModal(entidad)}
                                className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-lg"
                                title="Editar"
                              >
                                <i className="bi bi-pencil-fill text-lg" />
                              </button>
                              <button
                                onClick={() => setEntityToDelete(entidad)}
                                className="w-12 h-12 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-lg"
                                title="Eliminar"
                              >
                                <i className="bi bi-trash3-fill text-lg" />
                              </button>
                            </div>
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
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Modal de Confirmación de Eliminación */}
      <AnimatePresence>
        {entityToDelete && (
          <motion.div
            key="delete-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 16 }}
              animate={{ opacity: 1, scale: 1,    y: 0  }}
              exit={{   opacity: 0, scale: 0.92, y: 16  }}
              transition={{ duration: 0.22, ease: EASE_OUT }}
              className="bg-card border border-border w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl flex flex-col items-center text-center"
            >
              <div className="w-20 h-20 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mb-6">
                <i className="bi bi-exclamation-triangle-fill text-4xl" />
              </div>
              <h3 className="text-2xl font-black tracking-tight text-foreground mb-2">
                ¿Eliminar entidad?
              </h3>
              <p className="text-muted-foreground text-sm font-medium mb-8 leading-relaxed">
                Estás a punto de eliminar <strong>{entityToDelete.name}</strong>. Esta acción
                cambiará la base de datos de manera irreversible.
              </p>
              <div className="flex w-full gap-4">
                <button
                  onClick={() => setEntityToDelete(null)}
                  className="flex-1 py-4 rounded-2xl bg-muted text-muted-foreground font-bold text-xs uppercase tracking-widest hover:bg-muted/80 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 py-4 rounded-2xl bg-destructive text-destructive-foreground font-bold text-xs uppercase tracking-widest hover:opacity-90 transition-opacity"
                >
                  Eliminar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de Edición Inline */}
      <AnimatePresence>
        {entityToEdit && (
          <motion.div
            key="edit-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 16 }}
              animate={{ opacity: 1, scale: 1,    y: 0  }}
              exit={{   opacity: 0, scale: 0.92, y: 16  }}
              transition={{ duration: 0.22, ease: EASE_OUT }}
              className="bg-card border border-border w-full max-w-xl rounded-[2.5rem] p-8 shadow-2xl my-auto"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black uppercase tracking-wider text-foreground">
                  Editar Colaborador
                </h3>
                <button
                  onClick={() => setEntityToEdit(null)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  disabled={savingEdit}
                >
                  <i className="bi bi-x-lg text-lg" />
                </button>
              </div>

              <AnimatePresence>
                {editError && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{   opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="p-4 mb-5 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive font-bold text-xs flex items-center gap-2 overflow-hidden"
                  >
                    <i className="bi bi-exclamation-octagon-fill" /> {editError}
                  </motion.div>
                )}
              </AnimatePresence>

              <form onSubmit={handleEditSubmit} className="space-y-5">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2 ml-1">
                    Nombre de la Entidad
                  </label>
                  <div className="relative">
                    <i className="bi bi-bank absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      required
                      className="w-full pl-12 pr-4 py-3 bg-background border border-input rounded-xl text-sm font-semibold focus:border-primary outline-none transition-all shadow-sm"
                      value={editFormData.name}
                      onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                      disabled={savingEdit}
                    />
                  </div>
                </div>

                <div className="relative">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2 ml-1">
                    Categoría
                  </label>
                  <div className="relative">
                    <i className="bi bi-diagram-3 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground z-10" />
                    <input
                      ref={editInputRef}
                      type="text"
                      required
                      className="w-full pl-12 pr-4 py-3 bg-background border border-input rounded-xl text-sm font-semibold focus:border-primary outline-none transition-all shadow-sm"
                      value={editFormData.tipoName}
                      onChange={(e) => {
                        setEditFormData({ ...editFormData, tipoName: e.target.value });
                        setShowEditSuggestions(true);
                      }}
                      onFocus={() => setShowEditSuggestions(true)}
                      disabled={savingEdit}
                    />
                  </div>
                  <AnimatePresence>
                    {showEditSuggestions && filteredEditTypes.length > 0 && !savingEdit && (
                      <motion.div
                        ref={editSuggestionsRef}
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{   opacity: 0, y: -4 }}
                        transition={{ duration: 0.15 }}
                        className="absolute z-40 left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-lg max-h-36 overflow-y-auto"
                      >
                        {filteredEditTypes.map((tipo, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setEditFormData({ ...editFormData, tipoName: tipo });
                              setShowEditSuggestions(false);
                            }}
                            className="w-full text-left px-4 py-2 text-[10px] font-bold uppercase tracking-wider hover:bg-muted text-foreground transition-colors"
                          >
                            {tipo}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2 ml-1">
                    Descripción (Opcional)
                  </label>
                  <textarea
                    className="w-full px-4 py-3 bg-background border border-input rounded-xl text-sm font-semibold focus:border-primary outline-none transition-all shadow-sm h-20 resize-none no-scrollbar"
                    value={editFormData.description}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, description: e.target.value })
                    }
                    disabled={savingEdit}
                  />
                </div>

                <div className="p-4 bg-background/50 border border-border rounded-2xl">
                  <div className="flex gap-1 mb-3 p-1 bg-muted rounded-xl w-fit">
                    <button
                      type="button"
                      onClick={() => setEditLogoSource('upload')}
                      disabled={savingEdit}
                      className={`px-4 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ${
                        editLogoSource === 'upload'
                          ? 'bg-card text-primary shadow-sm'
                          : 'text-muted-foreground'
                      }`}
                    >
                      Subir Imagen
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditLogoSource('url')}
                      disabled={savingEdit}
                      className={`px-4 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ${
                        editLogoSource === 'url'
                          ? 'bg-card text-primary shadow-sm'
                          : 'text-muted-foreground'
                      }`}
                    >
                      Pegar URL
                    </button>
                  </div>

                  <AnimatePresence mode="wait">
                    {editLogoSource === 'upload' ? (
                      <motion.label
                        key="upload"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{   opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className={`border border-dashed border-border rounded-xl p-4 flex flex-col items-center justify-center bg-background ${
                          savingEdit
                            ? 'opacity-50 cursor-not-allowed'
                            : 'cursor-pointer hover:bg-muted/50 transition-all'
                        }`}
                      >
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => setEditLogoFile(e.target.files?.[0] || null)}
                          disabled={savingEdit}
                        />
                        <i className="bi bi-cloud-arrow-up text-xl text-muted-foreground mb-1" />
                        <p className="text-[11px] font-bold text-muted-foreground">
                          {editLogoFile ? editLogoFile.name : 'Selecciona una nueva imagen'}
                        </p>
                      </motion.label>
                    ) : (
                      <motion.div
                        key="url"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{   opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="relative"
                      >
                        <i className="bi bi-link-45deg absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input
                          type="url"
                          className="w-full pl-12 pr-4 py-3 bg-background border border-input rounded-xl text-sm font-semibold focus:border-primary outline-none"
                          value={editFormData.logoUrl}
                          onChange={(e) =>
                            setEditFormData({ ...editFormData, logoUrl: e.target.value })
                          }
                          disabled={savingEdit}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2 ml-1">
                    Enlace Directo (Web)
                  </label>
                  <div className="relative">
                    <i className="bi bi-globe absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="url"
                      required
                      className="w-full pl-12 pr-4 py-3 bg-background border border-input rounded-xl text-sm font-semibold focus:border-primary outline-none transition-all shadow-sm"
                      value={editFormData.website}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, website: e.target.value })
                      }
                      disabled={savingEdit}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setEntityToEdit(null)}
                    disabled={savingEdit}
                    className="px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={savingEdit}
                    className="px-6 py-3 bg-secondary text-secondary-foreground rounded-xl font-bold text-xs uppercase tracking-widest hover:opacity-90 disabled:opacity-70 transition-all flex items-center justify-center gap-2"
                  >
                    {savingEdit ? (
                      <>
                        <i className="bi bi-arrow-repeat animate-spin text-sm" />
                        Guardando...
                      </>
                    ) : (
                      'Guardar Cambios'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}