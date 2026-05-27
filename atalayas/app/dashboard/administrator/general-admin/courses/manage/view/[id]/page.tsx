'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Sidebar from '@/components/ui/Sidebar';
import PageHeader from '@/components/ui/pageHeader';
import { API_ROUTES } from '@/lib/utils';

const cleanMarkdown = (text: string): string => {
  if (!text) return '';
  return text
    .replace(/\*\*?([^*]+)\*\*?/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^- /gm, '')
    .replace(/#/g, '')
    .trim();
};

export default function GeneralAdminCourseManagePage() {
  const { id } = useParams();
  const router = useRouter();
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [contentToDelete, setContentToDelete] = useState<string | null>(null);

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(API_ROUTES.COURSES.GET_BY_ID(id as string), {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setCourse(data);
      } catch (error) {
        console.error('Error fetching course:', error);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchCourse();
  }, [id]);

  const executeDelete = async () => {
    if (!contentToDelete) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(API_ROUTES.CONTENT.GET_BY_ID(id as string, contentToDelete), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setCourse((prev: any) => ({
          ...prev,
          Content: (prev.Content || prev.content).filter((c: any) => c.id !== contentToDelete),
        }));
        setShowDeleteModal(false);
      }
    } catch (error) {
      console.error('Error deleting:', error);
    }
  };

  const contentList = course?.Content || course?.content || [];
  const filteredContents = contentList
    .filter((c: any) => c.title.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a: any, b: any) => a.order - b.order);

  return (
    <div className="flex h-screen bg-background font-sans text-foreground overflow-hidden">

      <main className="flex-1 overflow-auto flex flex-col relative">
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <PageHeader
              title={course?.title || 'Detalle del Curso'}
              description="Gestión de contenidos."
              icon={<i className="bi bi-journal-bookmark"></i>}
              backUrl="/dashboard/administrator/general-admin/courses/manage"
              action={
                <Link
                  href={`/dashboard/administrator/general-admin/courses/manage/view/${id}/content/new`}
                  className="bg-secondary text-secondary-foreground px-4 md:px-7 py-2 rounded-xl text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-all flex items-center gap-2 shadow-sm whitespace-nowrap"
                >
                  <i className="bi bi-plus-lg"></i>
                  <span className="hidden sm:inline">Añadir Unidad</span>
                  <span className="sm:hidden">Añadir</span>
                </Link>
              }
            />

            <div className="p-4 lg:p-8 flex-1 max-w-6xl mx-auto w-full">
              <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm flex flex-col">

                {/* ── Search bar + label ── */}
                <div className="p-4 border-b border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-muted/30">
                  <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1 shrink-0">
                    Unidades del programa
                  </h2>
                  <div className="relative w-full sm:max-w-xs">
                    <i className="bi bi-search absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-xs"></i>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Buscar unidad..."
                      className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-2 text-xs outline-none focus:border-primary transition-all font-medium"
                    />
                  </div>
                </div>

                {/* ── Desktop table (hidden on mobile) ── */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-left border-collapse table-fixed">
                    <thead>
                      <tr className="bg-muted/10 border-b border-border">
                        <th className="px-5 py-3 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Título y descripción</th>
                        <th className="px-9 py-3 text-[10px] font-black text-muted-foreground uppercase tracking-widest w-32">Tipo</th>
                        <th className="px-5 py-3 text-[10px] font-black text-muted-foreground uppercase tracking-widest text-right w-24">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredContents.length > 0 ? (
                        filteredContents.map((content: any) => (
                          <tr
                            key={content.id}
                            onClick={() => router.push(`/dashboard/administrator/general-admin/courses/manage/view/${id}/content/${content.id}`)}
                            className="hover:bg-muted/40 transition-all group cursor-pointer"
                          >
                            <td className="px-5 py-3 align-top">
                              <div className="font-bold text-sm text-foreground group-hover:text-primary transition-colors truncate">
                                {content.title}
                              </div>
                              {content.summary && (
                                <div className="text-[10.5px] text-muted-foreground line-clamp-1 mt-0.5 font-medium italic leading-relaxed">
                                  {cleanMarkdown(content.summary)}
                                </div>
                              )}
                            </td>
                            <td className="px-5 py-3 align-top">
                              <div className="flex gap-1.5 mt-2.5">
                                {content.quiz || content.practiceLab ? (
                                  <span className="bg-indigo-500/10 text-indigo-500 text-[9px] font-black px-1.5 py-0.5 rounded border border-indigo-500/20 uppercase tracking-tighter">Interactivo</span>
                                ) : (
                                  <span className="bg-emerald-500/10 text-emerald-500 text-[9px] font-black px-1.5 py-0.5 rounded border border-emerald-500/20 uppercase tracking-tighter">Lectura</span>
                                )}
                              </div>
                            </td>
                            <td className="px-5 py-3 text-right align-top" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-end gap-1 mt-0.5 mr-2.5">
                                <button
                                  onClick={() => { setContentToDelete(content.id); setShowDeleteModal(true); }}
                                  className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
                                >
                                  <i className="bi bi-trash3 text-xs"></i>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={3} className="px-5 py-12 text-center text-muted-foreground font-medium text-xs italic bg-muted/5">
                            No hay unidades disponibles.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* ── Mobile card list (hidden on sm+) ── */}
                <div className="sm:hidden divide-y divide-border">
                  {filteredContents.length > 0 ? (
                    filteredContents.map((content: any) => (
                      <div
                        key={content.id}
                        onClick={() => router.push(`/dashboard/administrator/general-admin/courses/manage/view/${id}/content/${content.id}`)}
                        className="flex items-start gap-4 p-4 hover:bg-muted/40 active:bg-muted/60 transition-all cursor-pointer group"
                      >
                        {/* Icon */}
                        <div className="w-10 h-10 shrink-0 rounded-xl bg-primary/10 text-primary flex items-center justify-center mt-0.5">
                          <i className={`bi ${content.url?.includes('.mp3') ? 'bi-mic-fill text-indigo-500' : 'bi-file-earmark-text'} text-base`}></i>
                        </div>

                        {/* Text */}
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm text-foreground group-hover:text-primary transition-colors truncate">
                            {content.title}
                          </p>
                          {content.summary && (
                            <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5 italic leading-relaxed">
                              {cleanMarkdown(content.summary)}
                            </p>
                          )}
                          {/* Badges */}
                          <div className="flex gap-1.5 mt-2">
                            {content.url?.includes('.mp3') ? (
                              <span className="bg-indigo-500/10 text-indigo-500 text-[9px] font-black px-1.5 py-0.5 rounded border border-indigo-500/20 uppercase tracking-tighter">Podcast</span>
                            ) : (
                              <span className="bg-emerald-500/10 text-emerald-500 text-[9px] font-black px-1.5 py-0.5 rounded border border-emerald-500/20 uppercase tracking-tighter">Lectura</span>
                            )}
                            {content.quiz && (
                              <span className="bg-muted text-muted-foreground text-[9px] font-black px-1.5 py-0.5 rounded border border-border uppercase tracking-tighter">Test</span>
                            )}
                          </div>
                        </div>

                        {/* Delete button */}
                        <button
                          onClick={(e) => { e.stopPropagation(); setContentToDelete(content.id); setShowDeleteModal(true); }}
                          className="w-8 h-8 shrink-0 flex items-center justify-center rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all mt-0.5"
                        >
                          <i className="bi bi-trash3 text-sm"></i>
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="px-5 py-14 text-center text-muted-foreground font-medium text-xs italic">
                      No hay unidades disponibles.
                    </div>
                  )}
                </div>

              </div>
            </div>
          </>
        )}
      </main>

      {/* Delete modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl border border-border text-center animate-in zoom-in-95">
            <div className="w-16 h-16 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mx-auto mb-6 text-2xl border border-destructive/20">
              <i className="bi bi-exclamation-triangle"></i>
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">¿Eliminar unidad?</h3>
            <p className="text-muted-foreground text-sm mb-8 leading-relaxed">Esta acción es irreversible. Se perderá todo el contenido de la lección.</p>
            <div className="flex flex-col gap-3">
              <button onClick={executeDelete} className="w-full py-3 bg-destructive text-white rounded-xl font-bold text-sm hover:opacity-90 transition-all shadow-lg shadow-destructive/20">Sí, eliminar</button>
              <button onClick={() => setShowDeleteModal(false)} className="w-full py-3 bg-muted text-muted-foreground rounded-xl font-bold text-sm hover:bg-muted/80 transition-all">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}