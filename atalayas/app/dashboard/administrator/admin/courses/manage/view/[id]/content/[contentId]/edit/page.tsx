'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Sidebar from '@/components/ui/Sidebar';
import PageHeader from '@/components/ui/pageHeader';
import { API_ROUTES } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminContentEdit() {
    const params = useParams();
    const router = useRouter();
    const courseId = params?.id as string;
    const contentId = params?.contentId as string;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        title: '',
        summary: '',
        description: '',
        type: 'video',
        url: '',
        imageUrl: '',
        duration: '',
        order: 0,
        isPublished: true
    });

    useEffect(() => {
        const fetchContent = async () => {
            if (!courseId || !contentId) return;
            try {
                setLoading(true);
                const token = localStorage.getItem("token");

                const url = typeof API_ROUTES.CONTENT.GET_BY_ID === 'function'
                    ? API_ROUTES.CONTENT.GET_BY_ID(courseId, contentId)
                    : `/api/courses/${courseId}/content/${contentId}`;

                const res = await fetch(url, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const data = await res.json();
                const content = data.content || data.data || data;

                setFormData({
                    title: content.title || '',
                    summary: content.summary || '',
                    description: content.description || '',
                    type: content.type || 'video',
                    url: content.url || '',
                    imageUrl: content.imageUrl || '',
                    duration: content.duration || '',
                    order: content.order || 0,
                    isPublished: content.isPublished !== undefined ? content.isPublished : true
                });
            } catch (error) {
                console.error("Error fetching content:", error);
                setError("Error al cargar el contenido");
            } finally {
                setLoading(false);
            }
        };
        fetchContent();
    }, [courseId, contentId]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        setSuccess(null);

        try {
            const token = localStorage.getItem("token");

            const url = typeof API_ROUTES.CONTENT.GET_BY_ID === 'function'
                ? API_ROUTES.CONTENT.GET_BY_ID(courseId, contentId)
                : `/api/courses/${courseId}/content/${contentId}`;

            const res = await fetch(url, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (!res.ok) {
                throw new Error('Error al guardar los cambios');
            }

            setSuccess("Contenido actualizado correctamente");

            setTimeout(() => {
                router.push(`/dashboard/administrator/admin/courses/manage/view/${courseId}/content/${contentId}`);
            }, 2000);
        } catch (error) {
            console.error("Error updating content:", error);
            setError("Error al guardar los cambios");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="flex min-h-screen bg-[#f5f5f7] dark:bg-[#0d0d0f] items-center justify-center">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="flex min-h-screen bg-[#f5f5f7] dark:bg-[#0d0d0f] overflow-hidden font-sans text-foreground">
            <main className="flex-1 overflow-auto flex flex-col relative">
                <PageHeader
                    title="Editar Contenido"
                    description={`Editando: ${formData.title || 'Nuevo contenido'}`}
                    icon={<i className="bi bi-pencil-square"></i>}
                    backUrl={`/dashboard/administrator/admin/courses/manage/view/${courseId}`}
                />

                <div className="p-6 lg:p-10 flex-1 max-w-4xl mx-auto w-full">
                    <motion.div
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35, ease: "easeOut" }}
                        className="mb-6 flex items-center gap-2 text-xs text-muted-foreground bg-primary/10 rounded-full px-3 py-1.5 w-fit"
                    >
                        <i className="bi bi-shield-check"></i>
                        <span>Modo edición - Administrador (Gestión completa)</span>
                    </motion.div>

                    <AnimatePresence mode="wait">
                        {success && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="mb-6 bg-green-500/10 border border-green-500 text-green-700 rounded-2xl p-4 flex items-center gap-3"
                            >
                                <i className="bi bi-check-circle-fill text-green-600"></i>
                                <span className="text-sm font-medium">{success}</span>
                            </motion.div>
                        )}

                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="mb-6 bg-red-500/10 border border-red-500 text-red-700 rounded-2xl p-4 flex items-center gap-3"
                            >
                                <i className="bi bi-exclamation-triangle-fill text-red-600"></i>
                                <span className="text-sm font-medium">{error}</span>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <motion.form
                        onSubmit={handleSubmit}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35, ease: "easeOut", delay: 0.05 }}
                        className="space-y-6"
                    >
                        <div className="bg-white dark:bg-[#1c1c1e] border border-gray-100 dark:border-white/5 rounded-[2.25rem] p-6 shadow-sm space-y-4">
                            <label className="block">
                                <span className="text-xs font-black uppercase tracking-widest text-muted-foreground block mb-2">
                                    Título del contenido *
                                </span>
                                <input
                                    type="text"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleChange}
                                    required
                                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/5 transition-all"
                                    placeholder="Ej: Introducción al curso"
                                />
                            </label>

                            <label className="block">
                                <span className="text-xs font-black uppercase tracking-widest text-muted-foreground block mb-2">
                                    Resumen / Descripción corta
                                </span>
                                <textarea
                                    name="summary"
                                    value={formData.summary}
                                    onChange={handleChange}
                                    rows={3}
                                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/5 transition-all"
                                    placeholder="Breve descripción de la lección..."
                                />
                            </label>

                            <label className="block">
                                <span className="text-xs font-black uppercase tracking-widest text-muted-foreground block mb-2">
                                    Descripción completa
                                </span>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    rows={6}
                                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/5 transition-all"
                                    placeholder="Contenido detallado de la lección..."
                                />
                            </label>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <motion.div whileHover={{ y: -3 }} className="bg-white dark:bg-[#1c1c1e] border border-gray-100 dark:border-white/5 rounded-[2rem] p-6 shadow-sm">
                                <label className="block">
                                    <span className="text-xs font-black uppercase tracking-widest text-muted-foreground block mb-2">
                                        Tipo de contenido
                                    </span>
                                    <select
                                        name="type"
                                        value={formData.type}
                                        onChange={handleChange}
                                        className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/5 transition-all"
                                    >
                                        <option value="video">Video</option>
                                        <option value="audio">Audio</option>
                                        <option value="text">Texto</option>
                                        <option value="pdf">PDF</option>
                                        <option value="quiz">Quiz</option>
                                    </select>
                                </label>
                            </motion.div>

                            <motion.div whileHover={{ y: -3 }} className="bg-white dark:bg-[#1c1c1e] border border-gray-100 dark:border-white/5 rounded-[2rem] p-6 shadow-sm">
                                <label className="block">
                                    <span className="text-xs font-black uppercase tracking-widest text-muted-foreground block mb-2">
                                        Orden / Posición
                                    </span>
                                    <input
                                        type="number"
                                        name="order"
                                        value={formData.order}
                                        onChange={handleChange}
                                        className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/5 transition-all"
                                        placeholder="1, 2, 3..."
                                    />
                                </label>
                            </motion.div>

                            <motion.div whileHover={{ y: -3 }} className="bg-white dark:bg-[#1c1c1e] border border-gray-100 dark:border-white/5 rounded-[2rem] p-6 shadow-sm">
                                <label className="block">
                                    <span className="text-xs font-black uppercase tracking-widest text-muted-foreground block mb-2">
                                        Duración (minutos)
                                    </span>
                                    <input
                                        type="text"
                                        name="duration"
                                        value={formData.duration}
                                        onChange={handleChange}
                                        className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/5 transition-all"
                                        placeholder="Ej: 15"
                                    />
                                </label>
                            </motion.div>
                        </div>

                        <div className="bg-white dark:bg-[#1c1c1e] border border-gray-100 dark:border-white/5 rounded-[2rem] p-6 shadow-sm">
                            <label className="block">
                                <span className="text-xs font-black uppercase tracking-widest text-muted-foreground block mb-2">
                                    URL del recurso (video, audio, PDF)
                                </span>
                                <input
                                    type="url"
                                    name="url"
                                    value={formData.url}
                                    onChange={handleChange}
                                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/5 transition-all"
                                    placeholder="https://ejemplo.com/recurso.mp4"
                                />
                            </label>
                            {formData.url && (
                                <p className="text-[10px] text-muted-foreground mt-2">
                                    <i className="bi bi-info-circle"></i>
                                    {formData.url.includes('.mp3') ? ' Archivo de audio detectado' : ' Enlace externo'}
                                </p>
                            )}
                        </div>

                        <div className="bg-white dark:bg-[#1c1c1e] border border-gray-100 dark:border-white/5 rounded-[2rem] p-6 shadow-sm">
                            <label className="block">
                                <span className="text-xs font-black uppercase tracking-widest text-muted-foreground block mb-2">
                                    URL de la imagen / miniatura
                                </span>
                                <input
                                    type="url"
                                    name="imageUrl"
                                    value={formData.imageUrl}
                                    onChange={handleChange}
                                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/5 transition-all"
                                    placeholder="https://ejemplo.com/imagen.jpg"
                                />
                            </label>

                            <AnimatePresence>
                                {formData.imageUrl && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -8 }}
                                        className="mt-4"
                                    >
                                        <p className="text-[10px] text-muted-foreground mb-2">Vista previa:</p>
                                        <img
                                            src={formData.imageUrl}
                                            alt="Preview"
                                            className="w-40 h-32 object-cover rounded-xl border border-border shadow-sm"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).style.display = 'none';
                                            }}
                                        />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-white dark:bg-[#1c1c1e] border border-gray-100 dark:border-white/5 rounded-[2rem] p-6 shadow-sm">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        name="isPublished"
                                        checked={formData.isPublished}
                                        onChange={handleChange}
                                        className="w-5 h-5 rounded border-border text-primary focus:ring-primary/20"
                                    />
                                    <span className="text-sm font-medium text-foreground">Publicar este contenido</span>
                                </label>
                                <p className="text-[10px] text-muted-foreground mt-2 ml-8">
                                    <i className="bi bi-globe"></i> Visible para todos los usuarios
                                </p>
                            </div>

                            <div className="bg-white dark:bg-[#1c1c1e] border border-gray-100 dark:border-white/5 rounded-[2rem] p-6 shadow-sm">
                                <label className="block">
                                    <span className="text-xs font-black uppercase tracking-widest text-muted-foreground block mb-2">
                                        ID del contenido (solo lectura)
                                    </span>
                                    <input
                                        type="text"
                                        value={contentId || ''}
                                        disabled
                                        className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 text-muted-foreground font-mono text-xs"
                                    />
                                </label>
                            </div>
                        </div>

                        <div className="flex gap-4 pt-4">
                            <button
                                type="submit"
                                disabled={saving}
                                className="flex-1 bg-primary text-white py-3.5 rounded-xl font-black text-[11px] uppercase tracking-widest hover:opacity-90 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {saving ? (
                                    <>
                                        <i className="bi bi-arrow-repeat animate-spin"></i>
                                        Guardando...
                                    </>
                                ) : (
                                    <>
                                        <i className="bi bi-check-lg"></i>
                                        Guardar Cambios
                                    </>
                                )}
                            </button>

                            <button
                                type="button"
                                onClick={() => router.push(`/dashboard/administrator/admin/courses/manage/view/${courseId}/content/${contentId}`)}
                                className="flex-1 bg-muted text-foreground py-3.5 rounded-xl font-black text-[11px] uppercase tracking-widest hover:bg-border/60 transition-all flex items-center justify-center gap-2"
                            >
                                <i className="bi bi-x-lg"></i>
                                Cancelar
                            </button>
                        </div>

                        <div className="pt-2">
                            <button
                                type="button"
                                onClick={() => router.push(`/dashboard/administrator/admin/courses/manage/view/${courseId}`)}
                                className="w-full text-muted-foreground text-[10px] font-bold uppercase tracking-widest hover:text-primary transition-colors flex items-center justify-center gap-1"
                            >
                                <i className="bi bi-arrow-left"></i>
                                Volver al listado de contenidos
                            </button>
                        </div>
                    </motion.form>
                </div>
            </main>
        </div>
    );
}