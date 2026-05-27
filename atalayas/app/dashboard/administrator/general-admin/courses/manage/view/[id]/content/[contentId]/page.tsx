'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Sidebar from '@/components/ui/Sidebar';
import PageHeader from '@/components/ui/pageHeader';
import { API_ROUTES } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import zoom from 'medium-zoom';

interface LabProps { data: any; }

const InteractiveLab = dynamic<LabProps>(
  () => import('@/components/interactiveLab').then((mod) => mod.default),
  { ssr: false, loading: () => <div className="text-white font-black animate-pulse">CARGANDO MOTOR GRÁFICO...</div> }
);

const inputClass = 'w-full px-4 py-2.5 bg-background border border-border focus:border-primary focus:ring-4 focus:ring-primary/5 rounded-xl outline-none transition-all text-foreground text-sm font-medium shadow-sm placeholder:text-muted-foreground/40';
const labelClass = 'text-[10px] font-black uppercase text-primary tracking-[0.2em] mb-2 block';
const tabBtnClass = 'pb-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative whitespace-nowrap';

type TabType = 'presentacion' | 'multimedia' | 'lectura' | 'evaluacion';

export default function GeneralAdminContentDetail() {
  const params = useParams();
  const router = useRouter();
  const audioRef = useRef<HTMLAudioElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const [content, setContent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('lectura');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [showLabModal, setShowLabModal] = useState(false);
  const [isLabStarted, setIsLabStarted] = useState(false);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [isCorrected, setIsCorrected] = useState(false);
  const [formData, setFormData] = useState<any>({ title: '', summary: '', imageUrl: '', url: '', quiz: { questions: [] }, practiceLab: null });

  const sanitizeData = (data: any) => {
    const raw = data?.data || data?.content || data || {};
    let cleanQuestions = [];
    if (raw.quiz) {
      const source = Array.isArray(raw.quiz) ? raw.quiz : raw.quiz.questions || [];
      cleanQuestions = source.map((q: any) => ({
        question: q.question || '',
        options: Array.isArray(q.options) ? [...q.options] : ['', '', '', ''],
        correctAnswer: q.correctAnswer || '',
      }));
    }
    return { ...raw, title: raw.title || 'Sin título', summary: raw.summary || '', url: raw.url || '', imageUrl: raw.imageUrl || '', videoUrl: raw.videoUrl || '', quiz: { questions: cleanQuestions }, practiceLab: raw.practiceLab || null };
  };

  const updateQuestionText = (qIdx: number, val: string) => { const q = [...formData.quiz.questions]; q[qIdx].question = val; setFormData({ ...formData, quiz: { questions: q } }); };
  const updateOptionText = (qIdx: number, oIdx: number, val: string) => { const q = [...formData.quiz.questions]; q[qIdx].options[oIdx] = val; setFormData({ ...formData, quiz: { questions: q } }); };
  const updateCorrectAnswer = (qIdx: number, val: string) => { const q = [...formData.quiz.questions]; q[qIdx].correctAnswer = val; setFormData({ ...formData, quiz: { questions: q } }); };
  const addQuestion = () => setFormData({ ...formData, quiz: { questions: [...formData.quiz.questions, { question: '', options: ['', '', '', ''], correctAnswer: '' }] } });
  const removeQuestion = (qIdx: number) => setFormData({ ...formData, quiz: { questions: formData.quiz.questions.filter((_: any, i: number) => i !== qIdx) } });

  useEffect(() => {
    const fetchContent = async () => {
      if (!params.id || !params.contentId) return;
      try {
        const res = await fetch(API_ROUTES.CONTENT.GET_BY_ID(params.id as string, params.contentId as string), {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        const data = await res.json();
        const clean = sanitizeData(data);
        setContent(clean);
        setFormData(JSON.parse(JSON.stringify(clean)));
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchContent();
  }, [params.contentId, params.id]);

  useEffect(() => {
    if (activeTab === 'lectura' && imageRef.current) {
      const zoomInstance = zoom(imageRef.current, { background: 'rgba(0,0,0,0.9)', margin: 40 });
      return () => { zoomInstance.detach(); };
    }
  }, [content?.imageUrl, activeTab]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_ROUTES.CONTENT.UPDATE(params.id as string, params.contentId as string), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify(formData),
      });
      if (res.ok) { const result = await res.json(); setContent(sanitizeData(result)); setIsEditing(false); }
    } catch { alert('Error al guardar'); } finally { setLoading(false); }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(API_ROUTES.CONTENT.DELETE(params.id as string, params.contentId as string), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      if (res.ok) router.push(`/dashboard/administrator/general-admin/courses/manage/view/${params.id}`);
    } catch (error) { console.error(error); } finally { setIsDeleting(false); setShowDeleteModal(false); }
  };

  return (
    <div className="flex h-screen bg-background font-sans text-foreground overflow-hidden">

      <main className="flex-1 flex flex-col min-w-0 relative overflow-hidden">
        <PageHeader
          title={isEditing ? 'Modo Editor' : content?.title || 'Cargando...'}
          description="Gestión de unidad de aprendizaje"
          icon={<i className="bi bi-file-earmark-text"></i>}
          backUrl={`/dashboard/administrator/general-admin/courses/manage/view/${params.id}`}
          action={
            <div className="flex gap-2 md:gap-3">
              {isEditing && (
                <button onClick={() => setIsEditing(false)} className="bg-muted text-foreground px-3 md:px-6 py-2 md:py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
                  Descartar
                </button>
              )}
              <button
                onClick={isEditing ? handleSave : () => setIsEditing(true)}
                disabled={loading}
                className={`${isEditing ? 'bg-emerald-500' : "bg-secondary text-secondary-foreground px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-all flex items-center gap-2 shadow-sm"} text-white px-4 md:px-6 py-2 md:py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg transition-all active:scale-95`}
              >
                {isEditing ? 'Guardar' : 'Editar'}
              </button>
            </div>
          }
        />

        {/*
          Desktop: flex-row (main content | right aside panel)
          Mobile:  flex-col (content stacked, aside below)
        */}
        <div className="flex-1 flex flex-col md:flex-row overflow-y-auto md:overflow-hidden">

          {/* ── Main scrollable area ── */}
          <div className="flex-1 md:overflow-y-auto bg-muted/30 p-4 md:p-8 no-scrollbar">
            <div className="max-w-4xl mx-auto bg-card shadow-xl border border-border/50 rounded-[1.5rem] md:rounded-[2.5rem] overflow-hidden mb-6 md:mb-10">

              {/* Tabs */}
              {!isEditing && (
                <div className="flex px-6 md:px-12 pt-6 md:pt-8 border-b border-border gap-6 md:gap-8 overflow-x-auto no-scrollbar">
                  {(['lectura', 'multimedia', 'evaluacion'] as TabType[]).map((tab) => {
                    if (tab === 'multimedia' && !content?.videoUrl) return null;
                    if (tab === 'evaluacion' && (!content?.quiz?.questions || content.quiz.questions.length === 0)) return null;
                    return (
                      <button key={tab} onClick={() => setActiveTab(tab)} className={`${tabBtnClass} ${activeTab === tab ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
                        {tab}
                        {activeTab === tab && <span className="absolute bottom-0 left-0 w-full h-1 bg-primary rounded-t-full" />}
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="p-5 md:p-8 lg:p-16">
                {isEditing ? (
                  <div className="space-y-10">
                    <section className="space-y-6">
                      <h3 className="text-lg font-black border-l-4 border-primary pl-4 uppercase tracking-tighter">Configuración</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                          <label className={labelClass}>Título</label>
                          <input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className={inputClass} />
                        </div>
                        <div className="space-y-2">
                          <label className={labelClass}>URL Imagen</label>
                          <input value={formData.imageUrl} onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })} className={inputClass} placeholder="https://..." />
                        </div>
                        <div className="space-y-2">
                          <label className={labelClass}>URL Video</label>
                          <input value={formData.videoUrl} onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })} className={inputClass} placeholder="https://..." />
                        </div>
                      </div>
                      <label className={labelClass}>Cuerpo de la Unidad (Markdown)</label>
                      <textarea rows={12} value={formData.summary} onChange={(e) => setFormData({ ...formData, summary: e.target.value })} className={`${inputClass} font-mono text-xs`} />
                    </section>

                    <section className="space-y-8 pt-10 border-t border-border">
                      <div className="flex justify-between items-end">
                        <h3 className="text-lg font-black border-l-4 border-orange-500 pl-4 uppercase tracking-tighter text-orange-600">Editor de Evaluación</h3>
                        <button onClick={addQuestion} className="text-[9px] font-black uppercase bg-orange-500/10 text-orange-600 px-4 py-2 rounded-lg hover:bg-orange-500 hover:text-white transition-all">+ Añadir Pregunta</button>
                      </div>
                      <div className="space-y-8 md:space-y-10">
                        {formData.quiz.questions.map((q: any, qIdx: number) => (
                          <div key={qIdx} className="relative p-5 md:p-8 bg-muted/20 border border-border/50 rounded-[1.5rem] md:rounded-[2rem] space-y-5 md:space-y-6">
                            <button onClick={() => removeQuestion(qIdx)} className="absolute top-5 right-5 text-muted-foreground hover:text-destructive transition-colors">
                              <i className="bi bi-trash3 text-lg"></i>
                            </button>
                            <div className="space-y-2">
                              <label className={labelClass}>Pregunta {qIdx + 1}</label>
                              <input value={q.question} onChange={(e) => updateQuestionText(qIdx, e.target.value)} className={inputClass} placeholder="Escribe el enunciado..." />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                              {q.options.map((opt: string, oIdx: number) => (
                                <div key={oIdx} className="space-y-1">
                                  <label className="text-[9px] font-bold text-muted-foreground uppercase px-2">Opción {oIdx + 1}</label>
                                  <input value={opt} onChange={(e) => updateOptionText(qIdx, oIdx, e.target.value)} className={`${inputClass} text-xs`} placeholder={`Respuesta ${oIdx + 1}...`} />
                                </div>
                              ))}
                            </div>
                            <div className="pt-2">
                              <label className={labelClass}>Respuesta Correcta</label>
                              <select value={q.correctAnswer} onChange={(e) => updateCorrectAnswer(qIdx, e.target.value)} className={`${inputClass} border-emerald-500/30 focus:border-emerald-500`}>
                                <option value="">Selecciona la opción correcta</option>
                                {q.options.map((opt: string, oIdx: number) => (
                                  <option key={oIdx} value={opt}>{opt || `(Opción ${oIdx + 1} vacía)`}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  </div>
                ) : (
                  <div className="animate-in fade-in duration-500">
                    {activeTab === 'multimedia' && (
                      <div className="space-y-6">
                        {content?.videoUrl ? (
                          <div className="aspect-video rounded-[1.5rem] md:rounded-[2rem] overflow-hidden bg-black shadow-2xl">
                            <video key={content.videoUrl} controls className="w-full h-full object-cover">
                              <source src={content.videoUrl} type="video/mp4" />
                            </video>
                          </div>
                        ) : (
                          <div className="p-12 md:p-20 border-2 border-dashed border-border rounded-[2rem] text-center text-muted-foreground italic text-sm">No hay video disponible.</div>
                        )}
                      </div>
                    )}
                    {activeTab === 'lectura' && (
                      <div className="space-y-8 md:space-y-10">
                        {content?.imageUrl && (
                          <div className="relative group cursor-zoom-in">
                            <img ref={imageRef} src={content.imageUrl} className="w-full aspect-video object-cover rounded-[1.5rem] md:rounded-[2rem] shadow-lg border border-border/50 transition-transform duration-500 hover:scale-[1.01]" alt="Cover" />
                            <div className="absolute top-4 right-4 bg-black/20 backdrop-blur-md p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                              <i className="bi bi-zoom-in text-white"></i>
                            </div>
                          </div>
                        )}
                        <div className="prose dark:prose-invert max-w-none">
                          <ReactMarkdown components={{
                            h2: ({ ...props }) => <h2 className="text-xl md:text-2xl font-black text-foreground mt-8 md:mt-10 mb-4 md:mb-6" {...props} />,
                            p: ({ ...props }) => <p className="text-[15px] md:text-[17px] leading-[1.8] text-muted-foreground mb-6" {...props} />,
                            li: ({ ...props }) => <li className="flex items-start gap-3 text-[14px] md:text-[16px] text-muted-foreground mb-3 md:mb-4"><span className="mt-2.5 w-2 h-2 rounded-full bg-primary/40 shrink-0" /><span {...props} /></li>,
                            blockquote: ({ ...props }) => <blockquote className="border-l-4 border-primary bg-muted/40 p-4 md:p-6 rounded-r-2xl my-6 md:my-8 italic shadow-inner" {...props} />,
                          }}>
                            {content?.summary}
                          </ReactMarkdown>
                        </div>
                      </div>
                    )}
                    {activeTab === 'evaluacion' && (
                      <div className="bg-orange-500/5 border border-orange-500/10 rounded-[2rem] p-8 md:p-12 text-center space-y-6">
                        <div className="w-16 h-16 md:w-20 md:h-20 bg-orange-500 text-white rounded-2xl md:rounded-3xl flex items-center justify-center mx-auto shadow-xl shadow-orange-500/20">
                          <i className="bi bi-patch-question text-3xl md:text-4xl"></i>
                        </div>
                        <h4 className="text-xl md:text-2xl font-black italic">Pon a prueba tu conocimiento</h4>
                        <button onClick={() => setShowQuizModal(true)} className="bg-orange-500 text-white px-8 md:px-10 py-3 md:py-4 rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-xl hover:scale-105 transition-all">
                          Iniciar Autoevaluación
                        </button>
                      </div>
                    )}
                    
                  </div>
                )}
              </div>
            </div>
          </div>

          {/*
            Aside / Materiales
            Desktop: fixed right panel (w-80)
            Mobile:  full-width section stacked below (border-t)
          */}
          <aside className="
            w-full md:w-80
            border-t md:border-t-0 md:border-l border-border
            bg-card
            p-4 md:p-6
            flex flex-col gap-4 md:gap-6
            md:overflow-y-auto md:shrink-0
            no-scrollbar
          ">
            {content?.podcast?.url && (
              <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-[1.5rem] md:rounded-[2rem] p-4 md:p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-500 text-white rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                    <i className="bi bi-mic-fill"></i>
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase text-emerald-600 tracking-widest">Audio Guía</p>
                    <p className="text-[11px] font-bold opacity-70">Escuchar unidad</p>
                  </div>
                </div>
                <audio ref={audioRef} src={content.podcast.url} controls className="w-full h-8 accent-emerald-500" />
              </div>
            )}

            <h4 className={labelClass}>Materiales</h4>

            {content?.url?.toLowerCase().includes('.pdf') && (
              <a href={content.url} target="_blank" rel="noopener noreferrer" className="group w-full p-4 bg-muted/50 border border-border rounded-2xl flex items-center gap-4 hover:border-primary transition-all">
                <div className="w-10 h-10 bg-red-500/10 text-red-500 rounded-xl flex items-center justify-center shrink-0">
                  <i className="bi bi-file-earmark-pdf text-xl"></i>
                </div>
                <div className="text-left overflow-hidden">
                  <p className="text-[8px] font-black uppercase text-muted-foreground">Recurso PDF</p>
                  <p className="text-xs font-bold text-foreground truncate">Descargar Guía</p>
                </div>
              </a>
            )}

             {content?.presentationUrl && (
              <a
                href={content.presentationUrl}
                target="_blank"
                className="group w-full p-4 bg-orange-500/5 border border-orange-500/10 rounded-xl flex items-center gap-4 hover:border-orange-500 transition-all"
              >
                <div className="w-10 h-10 bg-orange-500 text-white rounded-xl flex items-center justify-center shrink-0 shadow-lg">
                  <i className="bi bi-easel text-xl"></i>
                </div>
                <div>
                  <p className="text-[8px] font-black uppercase text-orange-500">
                    PowerPoint IA
                  </p>
                  <p className="text-xs font-bold">Descargar Presentación</p>
                </div>
              </a>
            )}
            
            {content?.practiceLab && (
              <button onClick={() => setShowLabModal(true)} className="group w-full p-4 bg-blue-500/5 border border-blue-500/10 rounded-2xl flex items-center gap-4 hover:border-blue-500 transition-all text-left">
                <div className="w-10 h-10 bg-blue-500 text-white rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/20">
                  <i className="bi bi-controller text-xl"></i>
                </div>
                <div className="overflow-hidden">
                  <p className="text-[8px] font-black uppercase text-blue-600">Simulador IA</p>
                  <p className="text-xs font-bold text-foreground truncate">Práctica Interactiva</p>
                </div>
              </button>
            )}

            <div className="md:mt-auto pt-4 md:pt-6 border-t border-border">
              <button onClick={() => setShowDeleteModal(true)} className="w-full py-3 text-[9px] font-black uppercase text-destructive hover:bg-destructive/5 rounded-xl tracking-widest transition-all">
                Eliminar Unidad
              </button>
            </div>
          </aside>
        </div>
      </main>

      {/* Modal Lab */}
      {showLabModal && (
        <div className="fixed inset-0 z-120 flex items-center justify-center bg-black/95 backdrop-blur-xl md:p-4">
          <div className="bg-card border border-border md:rounded-[40px] w-full max-w-6xl h-full md:h-[90vh] relative overflow-hidden shadow-2xl flex flex-col">
            <div className="absolute top-4 right-4 z-130">
              <button onClick={() => { setShowLabModal(false); setIsLabStarted(false); }} className="w-10 h-10 bg-white/10 hover:bg-destructive hover:text-white backdrop-blur-md rounded-full flex items-center justify-center text-white transition-all shadow-lg">
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
            <div className="flex-1 flex flex-col bg-slate-950 overflow-hidden">
              {!isLabStarted ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6 animate-in fade-in zoom-in duration-300 p-6">
                  <div className="w-16 h-16 md:w-20 md:h-20 bg-blue-500/20 text-blue-500 rounded-3xl flex items-center justify-center mx-auto shadow-2xl">
                    <i className="bi bi-controller text-3xl md:text-4xl"></i>
                  </div>
                  <div>
                    <h3 className="text-xl md:text-2xl font-black text-white mb-2">{content?.practiceLab?.scenarioTitle || 'Simulador'}</h3>
                    <p className="text-slate-400 max-w-md mx-auto text-sm px-4 md:px-6">Ordena los elementos en sus categorías correspondientes para completar la práctica.</p>
                  </div>
                  <button onClick={() => setIsLabStarted(true)} className="bg-blue-600 hover:bg-blue-500 text-white px-8 md:px-10 py-3 md:py-4 rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-lg transition-all active:scale-95">
                    Empezar Práctica
                  </button>
                </div>
              ) : (
                <div className="w-full h-full min-h-0 overflow-hidden">
                  <InteractiveLab data={content.practiceLab} />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Quiz */}
      {showQuizModal && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 backdrop-blur-md p-3 md:p-4">
          <div className="bg-card border border-border rounded-[1.5rem] md:rounded-[2rem] p-5 md:p-8 max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="flex justify-between items-center mb-6 md:mb-8 shrink-0">
              <h3 className="text-xl md:text-2xl font-black italic">Simulación Estudiante</h3>
              <button onClick={() => setShowQuizModal(false)} className="text-muted-foreground hover:text-foreground"><i className="bi bi-x-circle text-2xl"></i></button>
            </div>
            <div className="flex-1 overflow-y-auto pr-2 space-y-8 md:space-y-10 no-scrollbar">
              {content?.quiz?.questions.map((q: any, qIdx: number) => (
                <div key={qIdx} className="space-y-4">
                  <p className="font-bold text-base md:text-lg"><span className="text-primary/30 mr-2">Q.0{qIdx + 1}</span> {q.question}</p>
                  <div className="grid gap-2">
                    {q.options.map((opt: string, oIdx: number) => (
                      <button key={oIdx} onClick={() => !isCorrected && setUserAnswers({ ...userAnswers, [qIdx]: opt })} className={`w-full p-3 md:p-4 rounded-xl border text-left text-sm transition-all ${userAnswers[qIdx] === opt ? 'border-primary bg-primary/5' : 'border-border'}`}>
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="pt-4 md:pt-6 mt-4 md:mt-6 border-t border-border">
              <button onClick={() => setIsCorrected(true)} className="w-full bg-primary text-white py-3 md:py-4 rounded-xl font-black uppercase text-xs tracking-widest">Corregir Respuestas</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Delete */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-110 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-[1.5rem] md:rounded-[2rem] p-8 md:p-10 max-w-sm w-full text-center shadow-2xl">
            <i className="bi bi-exclamation-triangle text-4xl text-destructive mb-4 block"></i>
            <h3 className="text-xl font-black mb-2">¿Seguro que deseas borrar?</h3>
            <div className="flex gap-3 mt-8">
              <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-3 rounded-xl bg-muted font-black uppercase text-[10px]">Cancelar</button>
              <button onClick={handleDelete} className="flex-1 py-3 rounded-xl bg-destructive text-white font-black uppercase text-[10px]">{isDeleting ? 'Eliminando...' : 'Eliminar'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}