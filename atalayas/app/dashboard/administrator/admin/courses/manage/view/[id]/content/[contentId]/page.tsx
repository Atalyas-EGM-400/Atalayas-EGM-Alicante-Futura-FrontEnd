'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Sidebar from '@/components/ui/Sidebar';
import PageHeader from '@/components/ui/pageHeader';
import { API_ROUTES } from '@/lib/utils';
import mediumZoom from 'medium-zoom';

export default function AdminContentDetail() {
    const params = useParams();
    const router = useRouter();
    const courseId = params?.id as string;
    const contentId = params?.contentId as string;

    const zoomRef = useRef<HTMLImageElement>(null);
    const audioRef = useRef<HTMLAudioElement>(null);

    const [content, setContent] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [courseName, setCourseName] = useState<string>('');

    useEffect(() => {
        const fetchContent = async () => {
            if (!courseId || !contentId) return;
            try {
                const token = localStorage.getItem("token");

                const url = typeof API_ROUTES.CONTENT.GET_BY_ID === 'function'
                    ? API_ROUTES.CONTENT.GET_BY_ID(courseId, contentId)
                    : `/api/courses/${courseId}/content/${contentId}`;

                const res = await fetch(url, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const data = await res.json();
                const finalData = data.content || data.data || data;
                setContent(finalData);

                // Obtener nombre del curso
                try {
                    const courseUrl = typeof API_ROUTES.COURSES.GET_BY_ID === 'function'
                        ? API_ROUTES.COURSES.GET_BY_ID(courseId)
                        : `/api/courses/${courseId}`;

                    const courseRes = await fetch(courseUrl, {
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    if (courseRes.ok) {
                        const courseData = await courseRes.json();
                        const course = courseData.course || courseData.data || courseData;
                        setCourseName(course?.title || 'Curso');
                    }
                } catch (error) {
                    console.warn("No se pudo obtener el nombre del curso:", error);
                    setCourseName('Curso');
                }

            } catch (error) {
                console.error("Error fetching content:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchContent();
    }, [courseId, contentId]);

    useEffect(() => {
        if (zoomRef.current && content?.imageUrl) {
            const zoom = mediumZoom(zoomRef.current, {
                background: 'rgba(0,0,0,0.9)',
                margin: 16,
                scrollOffset: 0,
            });
            return () => { zoom.detach(); };
        }
    }, [content?.imageUrl]);

    if (loading) return (
        <div className="flex min-h-screen bg-background items-center justify-center">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
    );

    if (!content) return (
        <div className="flex min-h-screen bg-background items-center justify-center">
            <div className="text-center">
                <i className="bi bi-exclamation-triangle text-5xl text-muted-foreground mb-4"></i>
                <p className="text-muted-foreground">No se encontró el contenido</p>
            </div>
        </div>
    );

    return (
        <div className="flex min-h-screen bg-background font-sans text-foreground">

            <main className="flex-1 overflow-auto flex flex-col relative">
                <PageHeader
                    title={content.title || "Detalle de Unidad"}
                    description={`Curso: ${courseName}`}
                    icon={<i className="bi bi-journal-text"></i>}
                    backUrl={`/dashboard/administrator/admin/courses/manage/view/${courseId}`}
                />

                <div className="p-6 lg:p-10 flex-1 max-w-6xl mx-auto w-full">
                    {/* Badge para Admin */}
                    <div className="mb-6 flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-full px-3 py-1.5 w-fit">
                        <i className="bi bi-shield-check"></i>
                        <span>Vista de administrador - Gestión completa</span>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">

                        {/* CONTENIDO PRINCIPAL */}
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                            <div className="prose prose-slate max-w-none">
                                <h2 className="text-3xl font-bold text-foreground tracking-tight mb-6">
                                    {content.title}
                                </h2>

                                {/* Metadatos */}
                                <div className="flex flex-wrap gap-3 mb-6 pb-4 border-b border-border">
                                    {content.type && (
                                        <span className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full flex items-center gap-1">
                                            <i className="bi bi-tag-fill text-[10px]"></i>
                                            {content.type}
                                        </span>
                                    )}
                                    {content.duration && (
                                        <span className="text-xs bg-muted text-muted-foreground px-2.5 py-1 rounded-full flex items-center gap-1">
                                            <i className="bi bi-clock"></i>
                                            {content.duration} min
                                        </span>
                                    )}
                                    {content.order && (
                                        <span className="text-xs bg-muted text-muted-foreground px-2.5 py-1 rounded-full flex items-center gap-1">
                                            <i className="bi bi-sort-numeric-down"></i>
                                            Unidad {content.order}
                                        </span>
                                    )}
                                    {content.isPublished !== undefined && (
                                        <span className={`text-xs px-2.5 py-1 rounded-full flex items-center gap-1 ${content.isPublished ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'}`}>
                                            <i className={`bi ${content.isPublished ? 'bi-check-circle' : 'bi-x-circle'}`}></i>
                                            {content.isPublished ? 'Publicado' : 'Borrador'}
                                        </span>
                                    )}
                                </div>

                                <div className="text-base text-muted-foreground leading-relaxed whitespace-pre-wrap">
                                    {content.summary || content.description || "Sin descripción disponible"}
                                </div>
                            </div>

                            {content.imageUrl && (
                                <div className="overflow-hidden rounded-3xl border border-border shadow-md bg-muted/30 flex justify-center">
                                    <img
                                        ref={zoomRef}
                                        src={content.imageUrl}
                                        alt={content.title}
                                        className="block w-full aspect-[4/3] md:aspect-[16/10] object-cover object-center cursor-zoom-in hover:opacity-95 transition-opacity"
                                        loading="lazy"
                                    />
                                </div>
                            )}
                        </div>

                        {/* BARRA LATERAL DE RECURSOS */}
                        <aside className="space-y-6">
                            <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">
                                Recursos de la unidad
                            </h4>

                            {content.url?.includes('.mp3') && (
                                <div className="bg-primary rounded-3xl p-6 shadow-lg text-white">
                                    <div className="flex items-center gap-3 mb-4">
                                        <i className="bi bi-mic-fill text-xl"></i>
                                        <h5 className="font-bold text-sm">Audio Lección</h5>
                                    </div>
                                    <audio ref={audioRef} controls className="w-full h-10 accent-secondary" src={content.url} />
                                </div>
                            )}

                            {content.url && !content.url.includes('.mp3') && (
                                <div className="bg-card border border-border rounded-3xl p-6 shadow-sm text-center group hover:border-primary/50 transition-colors">
                                    <div className="w-12 h-12 bg-emerald-500/10 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl group-hover:scale-110 transition-transform">
                                        <i className="bi bi-file-earmark-pdf"></i>
                                    </div>
                                    <p className="text-xs font-bold text-foreground mb-4">Documentación PDF</p>
                                    <a
                                        href={content.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex w-full py-2.5 bg-muted text-foreground rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-foreground hover:text-background transition-all justify-center items-center gap-2"
                                    >
                                        <i className="bi bi-box-arrow-up-right"></i> Abrir Recurso
                                    </a>
                                </div>
                            )}
                        </aside>
                    </div>
                </div>
            </main>
        </div>
    );
}
