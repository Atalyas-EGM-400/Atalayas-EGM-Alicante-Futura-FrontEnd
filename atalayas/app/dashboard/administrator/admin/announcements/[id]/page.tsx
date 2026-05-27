'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import PageHeader from "@/components/ui/pageHeader";
import { API_ROUTES, fetchWithApiFallback } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export default function AnnouncementDetailPage() {
  const params = useParams();
  const router = useRouter();

  const [announcement, setAnnouncement] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [editForm, setEditForm] = useState<any>({});
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { fetchDetail(); }, [params.id]);

  useEffect(() => {
    if (selectedFile) {
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewUrl(null);
    }
  }, [selectedFile]);

  const fetchDetail = async () => {
    setLoading(true);
    try {
      if (typeof params.id !== 'string') return;
      const token = localStorage.getItem('token');
      const url = API_ROUTES.ANNOUNCEMENTS.GET_BY_ID(params.id);
      const data = await fetchWithApiFallback(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!data || data.error) throw new Error('No encontrado');
      setAnnouncement(data);
      setEditForm({ 
        title: data.title, 
        content: data.content, 
        isPublic: data.isPublic,
        sendEmail: false
      });
    } catch (err) {
      console.error('Error cargando anuncio:', err);
    } finally {
      setLoading(false);
    }
  };

  const enterEditMode = () => {
    setEditForm({
      title: announcement.title,
      content: announcement.content,
      isPublic: announcement.isPublic,
      sendEmail: false
    });
    setSelectedFile(null);
    setPreviewUrl(null);
    setIsEditMode(true);
  };

  const cancelEdit = () => {
    setIsEditMode(false);
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  const handleUpdate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('title', editForm.title);
      formData.append('content', editForm.content);
      formData.append('isPublic', String(editForm.isPublic));
      formData.append('sendEmail', String(editForm.sendEmail));
      if (selectedFile) formData.append('file', selectedFile);

      const res = await fetch(API_ROUTES.ANNOUNCEMENTS.UPDATE(params.id as string), {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (res.ok) {
        setSaveSuccess(true);
        await fetchDetail();
        setTimeout(() => {
          setIsEditMode(false);
          setSaveSuccess(false);
          setSelectedFile(null);
          setPreviewUrl(null);
        }, 900);
      } else {
        const errorData = await res.json();
        alert(errorData.message || 'Error al actualizar');
      }
    } catch {
      alert('Error de conexión');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(API_ROUTES.ANNOUNCEMENTS.DELETE(params.id as string), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) router.push('/dashboard/administrator/admin/announcements');
    } catch {
      alert('Error al eliminar');
    }
  };

  const displayImage = previewUrl || announcement?.imageUrl;

  return (
    <div className="flex min-h-screen bg-[#f5f5f7] dark:bg-[#0d0d0f] font-sans text-foreground">
      <main className="flex-1 flex flex-col overflow-auto no-scrollbar">

        {/* ── HEADER — siempre fijo, nunca cambia ─────────────────── */}
        <PageHeader
          title={announcement ? announcement.title : 'Cargando...'}
          description={
            announcement
              ? `Publicado el ${new Date(announcement.createdAt).toLocaleDateString('es-ES', {
                  day: '2-digit', month: 'long', year: 'numeric',
                })}`
              : ''
          }
          icon={<i className="bi bi-megaphone-fill" />}
          backUrl="/dashboard/administrator/admin/announcements"
          action={announcement && (
              <div className="flex items-center gap-2">
                {isEditMode ? (
                  <>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-zinc-200 hover:bg-zinc-300 dark:bg-white/10 dark:hover:bg-white/15 text-zinc-700 dark:text-zinc-300 text-[10px] font-black uppercase tracking-widest transition-all hover:scale-105 cursor-pointer"
                    >
                      <i className="bi bi-x-lg" /> Salir de edición
                    </button>
                    <button
                      type="button"
                      onClick={handleUpdate}
                      disabled={isSaving}
                      className="flex items-center gap-1.5 px-5 py-2.5 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white text-[10px] font-black uppercase tracking-widest shadow-md shadow-orange-500/20 hover:scale-[1.02] transition-all disabled:opacity-60 cursor-pointer"
                    >
                      {isSaving ? (
                        <><span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Guardando</>
                      ) : saveSuccess ? (
                        <><i className="bi bi-check2-circle" /> Guardado</>
                      ) : (
                        <><i className="bi bi-floppy2-fill" /> Guardar cambios</>
                      )}
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={enterEditMode}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white text-[10px] font-black uppercase tracking-widest transition-all hover:scale-105 shadow-lg shadow-orange-500/25 cursor-pointer"
                  >
                    <i className="bi bi-pencil-fill" /> Editar
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsDeleteModalOpen(true)}
                  className="w-10 h-10 flex items-center justify-center rounded-2xl bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-all hover:scale-105 cursor-pointer"
                >
                  <i className="bi bi-trash3-fill" />
                </button>
              </div>
            )}
        />

        {/* ── BARRA MODO EDICIÓN — se expande bajo el header sin mover nada ── */}
        <AnimatePresence initial={false}>
          {isEditMode && (
            <motion.div
              key="edit-bar"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              style={{ overflow: 'hidden' }}
            >
              <div className="bg-orange-500/[0.07] border-b border-orange-500/20 px-6 lg:px-10">
                <div className="max-w-7xl mx-auto py-2.5 flex items-center justify-between gap-4">
                  <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.15em] text-orange-500">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                    Modo edición — guarda los cambios para aplicarlos
                  </span>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="px-4 py-2 rounded-xl bg-white dark:bg-white/5 border border-black/10 dark:border-white/10 text-[10px] font-black uppercase tracking-widest hover:bg-zinc-50 dark:hover:bg-white/10 transition-all"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleUpdate}
                      disabled={isSaving}
                      className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-[10px] font-black uppercase tracking-widest shadow-md shadow-orange-500/20 hover:scale-[1.02] transition-all disabled:opacity-60"
                    >
                      {isSaving ? (
                        <><span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Guardando</>
                      ) : saveSuccess ? (
                        <><i className="bi bi-check2-circle" /> Guardado</>
                      ) : (
                        <><i className="bi bi-floppy2-fill" /> Guardar cambios</>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── CONTENIDO ────────────────────────────────────────────── */}
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loader"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex-1 flex items-center justify-center py-32"
            >
              <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            </motion.div>

          ) : announcement ? (
            <motion.div
              key="content"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="flex-1 p-6 lg:p-10"
            >
              <div className="max-w-7xl mx-auto">
                <form id="edit-form" onSubmit={handleUpdate}>
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                    {/* ── CUERPO PRINCIPAL ────────────────────────── */}
                    <div className="lg:col-span-8">
                      <div className="bg-white dark:bg-[#1c1c1e] border border-black/5 dark:border-white/5 rounded-[3rem] overflow-hidden shadow-sm">

                        {/* Zona imagen */}
                        {displayImage ? (
                          <div className="relative group overflow-hidden">
                            <img
                              src={displayImage}
                              alt={editForm.title || announcement.title}
                              className="w-full object-cover max-h-[420px] transition-transform duration-700 group-hover:scale-[1.01]"
                            />
                            {isEditMode && (
                              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                <button
                                  type="button"
                                  onClick={() => fileInputRef.current?.click()}
                                  className="px-5 py-2.5 bg-white text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl"
                                >
                                  <i className="bi bi-image mr-2" />Cambiar
                                </button>
                                <button
                                  type="button"
                                  onClick={() => { setSelectedFile(null); setPreviewUrl(null); }}
                                  className="px-5 py-2.5 bg-red-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl"
                                >
                                  <i className="bi bi-trash3 mr-2" />Eliminar
                                </button>
                              </div>
                            )}
                          </div>
                        ) : isEditMode ? (
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full h-40 flex flex-col items-center justify-center gap-3 border-b border-dashed border-black/10 dark:border-white/10 hover:border-orange-400/50 bg-zinc-50/50 dark:bg-zinc-900/30 text-zinc-400 hover:text-orange-500 transition-all"
                          >
                            <i className="bi bi-cloud-arrow-up text-3xl" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Añadir imagen de cabecera</span>
                          </button>
                        ) : null}

                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                        />

                        {/* Zona texto */}
                        <div className="p-8 lg:p-12 space-y-6">

                          {/* Badge visibilidad — solo en vista */}
                          {!isEditMode && (
                            <span className={`inline-flex text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-[0.2em] border ${
                              announcement.isPublic
                                ? 'bg-blue-500/10 text-blue-600 border-blue-500/20'
                                : 'bg-purple-500/10 text-purple-600 border-purple-500/20'
                            }`}>
                              {announcement.isPublic
                                ? '🌐 Comunicado Global'
                                : `🏢 ${announcement.Company?.name || 'Privado'}`}
                            </span>
                          )}

                          {/* Título */}
                          {isEditMode ? (
                            <input
                              type="text"
                              value={editForm.title}
                              onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                              required
                              placeholder="Título del anuncio"
                              className="w-full text-2xl lg:text-3xl font-black tracking-tight bg-transparent border-b-2 border-orange-400/40 focus:border-orange-500 outline-none pb-2 transition-colors placeholder:text-zinc-300 dark:placeholder:text-zinc-600"
                            />
                          ) : (
                            <h1 className="text-2xl lg:text-3xl font-black tracking-tight leading-snug">
                              {announcement.title}
                            </h1>
                          )}

                          {/* Contenido */}
                          {isEditMode ? (
                            <textarea
                              rows={14}
                              value={editForm.content}
                              onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                              required
                              placeholder="Redacta el contenido del anuncio…"
                              className="w-full p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-black/5 dark:border-white/5 outline-none text-base leading-relaxed font-medium resize-none focus:ring-2 ring-orange-400/30 transition-all placeholder:text-zinc-300 dark:placeholder:text-zinc-600"
                            />
                          ) : (
                            <p className="text-zinc-600 dark:text-zinc-400 text-base lg:text-lg leading-relaxed font-medium whitespace-pre-wrap">
                              {announcement.content || 'Este comunicado no dispone de contenido adicional.'}
                            </p>
                          )}
                          
                          {/* Botón Guardar Inferior (Opcional, pero útil si el texto es muy largo) */}
                          {isEditMode && (
                            <div className="pt-6 border-t border-black/5 dark:border-white/5 flex justify-end">
                              <button
                                type="button"
                                onClick={handleUpdate}
                                disabled={isSaving}
                                className="px-6 py-3 bg-primary text-white rounded-2xl font-black uppercase tracking-widest shadow-xl hover:scale-[1.02] transition-all disabled:opacity-50 text-[10px]"
                              >
                                {isSaving ? "Guardando..." : "Guardar Cambios"}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* ── SIDEBAR ─────────────────────────────────── */}
                    <aside className="lg:col-span-4">
                      <div className="sticky top-6 space-y-5">
                        <AnimatePresence mode="wait">

                          {/* MODO EDICIÓN: Opciones del panel lateral */}
                          {isEditMode ? (
                            <motion.div
                              key="edit-options"
                              initial={{ opacity: 0, y: 6 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 6 }}
                              transition={{ duration: 0.18 }}
                              className="bg-white dark:bg-[#1c1c1e] border border-black/5 dark:border-white/5 rounded-[2.5rem] p-7 shadow-sm space-y-7"
                            >
                              <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">
                                Configuración del Anuncio
                              </h3>

                              {/* Notificaciones Email */}
                              <div className="space-y-2.5">
                                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Notificaciones</p>
                                <label className="flex items-center gap-3 p-4 bg-orange-500/5 rounded-2xl border border-orange-500/20 cursor-pointer hover:bg-orange-500/10 transition-colors">
                                  <input
                                    type="checkbox"
                                    checked={editForm.sendEmail}
                                    onChange={(e) => setEditForm({ ...editForm, sendEmail: e.target.checked })}
                                    className="w-5 h-5 accent-orange-500 cursor-pointer"
                                  />
                                  <div>
                                    <span className="block text-[10px] font-black uppercase text-orange-600 dark:text-orange-400">Avisar por Email</span>
                                    <span className="block text-[9px] text-orange-600/60 dark:text-orange-400/60 mt-0.5 font-medium leading-tight">Re-enviar notificación a los empleados</span>
                                  </div>
                                </label>
                              </div>

                              {/* Imagen de cabecera (Opciones) */}
                              <div className="space-y-2.5">
                                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Imagen de cabecera</p>
                                {displayImage ? (
                                  <div className="relative rounded-2xl overflow-hidden group">
                                    <img src={displayImage} alt="" className="w-full h-32 object-cover" />
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                      <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="px-3 py-1.5 bg-white text-black rounded-lg text-[10px] font-black uppercase tracking-wider"
                                      >
                                        Cambiar
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => { setSelectedFile(null); setPreviewUrl(null); }}
                                        className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-[10px] font-black uppercase tracking-wider"
                                      >
                                        Quitar
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-full h-24 flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-black/10 dark:border-white/10 hover:border-orange-400/50 text-zinc-400 hover:text-orange-500 transition-all bg-zinc-50 dark:bg-zinc-900/40"
                                  >
                                    <i className="bi bi-image text-xl" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Subir imagen</span>
                                  </button>
                                )}
                              </div>

                            </motion.div>

                          ) : (
                            /* MODO VISTA: Metadata */
                            <motion.div
                              key="view-meta"
                              initial={{ opacity: 0, y: 6 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 6 }}
                              transition={{ duration: 0.18 }}
                              className="bg-white dark:bg-[#1c1c1e] border border-black/5 dark:border-white/5 rounded-[2.5rem] p-7 shadow-sm space-y-5"
                            >
                              <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">
                                Información
                              </h3>

                              <div className="space-y-4">
                                {/* Publicado */}
                                <div className="flex items-start gap-3">
                                  <span className="w-8 h-8 rounded-xl bg-zinc-100 dark:bg-white/5 flex items-center justify-center text-zinc-400 flex-shrink-0 text-xs">
                                    <i className="bi bi-calendar3" />
                                  </span>
                                  <div>
                                    <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400 mb-0.5">Publicado</p>
                                    <p className="text-sm font-bold">
                                      {new Date(announcement.createdAt).toLocaleDateString('es-ES', {
                                        day: '2-digit', month: 'long', year: 'numeric',
                                      })}
                                    </p>
                                  </div>
                                </div>

                                {/* Última edición */}
                                {announcement.updatedAt && announcement.updatedAt !== announcement.createdAt && (
                                  <div className="flex items-start gap-3">
                                    <span className="w-8 h-8 rounded-xl bg-zinc-100 dark:bg-white/5 flex items-center justify-center text-zinc-400 flex-shrink-0 text-xs">
                                      <i className="bi bi-pencil" />
                                    </span>
                                    <div>
                                      <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400 mb-0.5">Última edición</p>
                                      <p className="text-sm font-bold">
                                        {new Date(announcement.updatedAt).toLocaleDateString('es-ES', {
                                          day: '2-digit', month: 'long', year: 'numeric',
                                        })}
                                      </p>
                                    </div>
                                  </div>
                                )}

                                {/* Empresa */}
                                {announcement.Company && (
                                  <div className="flex items-start gap-3">
                                    <span className="w-8 h-8 rounded-xl bg-zinc-100 dark:bg-white/5 flex items-center justify-center text-zinc-400 flex-shrink-0 text-xs">
                                      <i className="bi bi-buildings" />
                                    </span>
                                    <div>
                                      <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400 mb-0.5">Empresa</p>
                                      <p className="text-sm font-bold">{announcement.Company.name}</p>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </aside>

                  </div>
                </form>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

      </main>

      {/* ── MODAL ELIMINAR ────────────────────────────────────────── */}
      <AnimatePresence>
        {isDeleteModalOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ y: 40, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 40, opacity: 0, scale: 0.98 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="bg-white dark:bg-[#1c1c1e] w-full max-w-md rounded-[3rem] p-10 shadow-2xl border border-white/10"
            >
              <div className="flex items-center justify-center mb-8">
                <div className="relative">
                  <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center">
                    <i className="bi bi-trash3-fill text-3xl text-red-500" />
                  </div>
                  <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                    <i className="bi bi-exclamation text-white text-sm font-black" />
                  </span>
                </div>
              </div>

              <div className="text-center mb-8">
                <h3 className="text-2xl font-black uppercase tracking-tight italic mb-3">¿Eliminar anuncio?</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Esta acción es <strong>permanente e irreversible</strong>. El anuncio desaparecerá del feed de todos los usuarios de inmediato.
                </p>
              </div>

              <div className="bg-zinc-50 dark:bg-zinc-900/60 rounded-2xl px-5 py-4 mb-8 flex items-center gap-3 border border-black/5 dark:border-white/5">
                <i className="bi bi-megaphone text-zinc-400" />
                <p className="text-sm font-bold truncate">{announcement?.title}</p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleDelete}
                  className="w-full py-4 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-black uppercase tracking-widest transition-colors shadow-lg shadow-red-500/20"
                >
                  Sí, eliminar permanentemente
                </button>
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="w-full py-4 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}