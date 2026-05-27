"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Sidebar from "@/components/ui/Sidebar";
import PageHeader from "@/components/ui/pageHeader";
import { API_ROUTES } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import zoom from "medium-zoom";

interface LabProps {
  data: any;
}

const InteractiveLab = dynamic<LabProps>(
  () => import("@/components/interactiveLab").then((mod) => mod.default),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full bg-slate-950 text-white font-black animate-pulse text-xs tracking-widest">
        CARGANDO MOTOR GRÁFICO...
      </div>
    ),
  },
);

const inputClass =
  "w-full px-4 py-2.5 bg-background border border-border focus:border-primary focus:ring-4 focus:ring-primary/5 rounded-xl outline-none transition-all text-foreground text-sm font-medium shadow-sm placeholder:text-muted-foreground/40";
const labelClass =
  "text-[10px] font-black uppercase text-primary tracking-[0.2em] mb-2 block";
const tabBtnClass =
  "pb-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative whitespace-nowrap";

type TabType = "multimedia" | "lectura" | "evaluacion";

export default function AdminContentDetail() {
  const params = useParams();
  const router = useRouter();
  const audioRef = useRef<HTMLAudioElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const [content, setContent] = useState<any>(null);
  const [course, setCourse] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("lectura");
  const [imageError, setImageError] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [showLabModal, setShowLabModal] = useState(false);
  const [isLabStarted, setIsLabStarted] = useState(false);

  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [isCorrected, setIsCorrected] = useState(false);

  const [formData, setFormData] = useState<any>({
    title: "",
    summary: "",
    imageUrl: "",
    videoUrl: "",
    quiz: { questions: [] },
    practiceLab: null,
  });

  // Obtener usuario actual
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }
  }, []);

  const sanitizeData = (data: any) => {
    const raw = data?.data || data?.content || data || {};
    let cleanQuestions = [];
    if (raw.quiz) {
      const source = Array.isArray(raw.quiz)
        ? raw.quiz
        : raw.quiz.questions || [];
      cleanQuestions = source.map((q: any) => ({
        question: q.question || "",
        options: Array.isArray(q.options) ? [...q.options] : ["", "", "", ""],
        correctAnswer: q.correctAnswer || "",
      }));
    }
    return {
      ...raw,
      title: raw.title || "Sin título",
      summary: raw.summary || "",
      url: raw.url || "",
      imageUrl: raw.imageUrl || "",
      videoUrl: raw.videoUrl || "",
      quiz: { questions: cleanQuestions },
      practiceLab: raw.practiceLab || null,
    };
  };

  // Verificar si el usuario puede modificar este contenido
  const canModify = () => {
    if (!course || !currentUser) return false;
    // GENERAL_ADMIN puede modificar todo
    if (currentUser.role === 'GENERAL_ADMIN') return true;
    // ADMIN solo puede modificar cursos privados de su empresa
    if (currentUser.role === 'ADMIN') {
      return !course.isPublic && course.companyId === currentUser.companyId;
    }
    return false;
  };

  const updateQuestionText = (qIdx: number, val: string) => {
    const newQuestions = [...formData.quiz.questions];
    newQuestions[qIdx].question = val;
    setFormData({ ...formData, quiz: { questions: newQuestions } });
  };

  const updateOptionText = (qIdx: number, oIdx: number, val: string) => {
    const newQuestions = [...formData.quiz.questions];
    newQuestions[qIdx].options[oIdx] = val;
    setFormData({ ...formData, quiz: { questions: newQuestions } });
  };

  const updateCorrectAnswer = (qIdx: number, val: string) => {
    const newQuestions = [...formData.quiz.questions];
    newQuestions[qIdx].correctAnswer = val;
    setFormData({ ...formData, quiz: { questions: newQuestions } });
  };

  const addQuestion = () => {
    setFormData({
      ...formData,
      quiz: {
        questions: [
          ...formData.quiz.questions,
          { question: "", options: ["", "", "", ""], correctAnswer: "" },
        ],
      },
    });
  };

  const removeQuestion = (qIdx: number) => {
    setFormData({
      ...formData,
      quiz: {
        questions: formData.quiz.questions.filter(
          (_: any, i: number) => i !== qIdx,
        ),
      },
    });
  };

  useEffect(() => {
    const fetchCourseAndContent = async () => {
      if (!params.id || !params.contentId) return;
      try {
        const token = localStorage.getItem("token");

        // Fetch course info
        const courseRes = await fetch(API_ROUTES.COURSES.GET_BY_ID(params.id as string), {
          headers: { Authorization: `Bearer ${token}` },
        });
        const courseData = await courseRes.json();
        setCourse(courseData);

        // Fetch content
        const contentRes = await fetch(
          API_ROUTES.CONTENT.GET_BY_ID(
            params.id as string,
            params.contentId as string,
          ),
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );
        const contentData = await contentRes.json();
        const cleanData = sanitizeData(contentData);
        setContent(cleanData);
        setFormData(JSON.parse(JSON.stringify(cleanData)));
        setImageError(false);
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCourseAndContent();
  }, [params.contentId, params.id]);

  useEffect(() => {
    if (activeTab === "lectura" && imageRef.current && !imageError) {
      const zoomInstance = zoom(imageRef.current, {
        background: "rgba(0,0,0,0.9)",
        margin: 20,
      });
      return () => {
        zoomInstance.detach();
      };
    }
  }, [content?.imageUrl, activeTab, imageError]);

  const handleSave = async () => {
    if (!canModify()) {
      alert("No tienes permisos para modificar este contenido");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        API_ROUTES.CONTENT.UPDATE(
          params.id as string,
          params.contentId as string,
        ),
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify(formData),
        },
      );
      if (res.ok) {
        const result = await res.json();
        setContent(sanitizeData(result));
        setIsEditing(false);
      } else {
        const error = await res.json();
        alert(error.message || "Error al guardar");
      }
    } catch (error) {
      alert("Error al guardar");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!canModify()) {
      alert("No tienes permisos para eliminar este contenido");
      setShowDeleteModal(false);
      return;
    }

    setIsDeleting(true);
    try {
      const res = await fetch(
        API_ROUTES.CONTENT.DELETE(
          params.id as string,
          params.contentId as string,
        ),
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        },
      );
      if (res.ok) {
        router.push(`/dashboard/administrator/admin/courses/${params.id}/manage`);
      } else {
        const error = await res.json();
        alert(error.message || "Error al eliminar");
      }
    } catch (error) {
      console.error(error);
      alert("Error al eliminar el contenido");
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const isModifiable = canModify();
  const isPublicCourse = course?.isPublic === true;
  const isAdminView = currentUser?.role === 'ADMIN';

  if (loading) {
    return (
      <div className="flex h-screen bg-background items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background font-sans text-foreground overflow-hidden">

      {/* ── Main area: on mobile fills full width ── */}
      <main className="flex-1 flex flex-col min-w-0 relative overflow-hidden">
        <PageHeader
          title={isEditing ? "Modo Editor" : content?.title || "Cargando..."}
          description="Gestión de unidad"
          icon={<i className="bi bi-file-earmark-text"></i>}
          backUrl={`/dashboard/administrator/admin/courses/${params.id}/manage`}
          action={
            <div className="flex gap-2">
              {isEditing && isModifiable && (
                <button
                  onClick={() => setIsEditing(false)}
                  className="bg-muted text-foreground px-3 md:px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest"
                >
                  Cancelar
                </button>
              )}
              {isModifiable && (
                <button
                  onClick={isEditing ? handleSave : () => setIsEditing(true)}
                  disabled={loading}
                  className={`${isEditing ? "bg-emerald-500" : "bg-primary"} text-white px-4 md:px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all`}
                >
                  {isEditing ? "Guardar" : "Editar"}
                </button>
              )}
              {!isModifiable && isPublicCourse && isAdminView && (
                <div className="bg-amber-500/10 text-amber-600 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-2">
                  <i className="bi bi-lock-fill"></i>
                  Solo lectura
                </div>
              )}
            </div>
          }
        />

        {/*
          ── Content + Aside layout ──
          Desktop: flex-row (content | aside fixed right panel)
          Mobile:  flex-col (content then aside below), full scroll
        */}
        <div className="flex-1 flex flex-col md:flex-row overflow-y-auto md:overflow-hidden">
          {/* ── Main scrollable content ── */}
          <div className="flex-1 md:overflow-y-auto bg-muted/30 p-4 md:p-8 no-scrollbar">
            <div className="max-w-4xl mx-auto bg-card shadow-xl border border-border/50 rounded-[1.5rem] md:rounded-[2.5rem] overflow-hidden mb-6 md:mb-10">
              {/* Tab bar */}
              {!isEditing && (
                <div className="flex px-6 md:px-12 pt-6 md:pt-8 border-b border-border gap-6 md:gap-8 overflow-x-auto no-scrollbar">
                  {(["lectura", "multimedia", "evaluacion"] as TabType[]).map(
                    (tab) => {
                      if (tab === "lectura" && !content?.summary) return null;
                      if (tab === "multimedia" && !content?.videoUrl)
                        return null;
                      if (
                        tab === "evaluacion" &&
                        (!content?.quiz?.questions ||
                          content.quiz.questions.length === 0)
                      )
                        return null;
                      return (
                        <button
                          key={tab}
                          onClick={() => setActiveTab(tab)}
                          className={`${tabBtnClass} ${activeTab === tab ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
                        >
                          {tab}
                          {activeTab === tab && (
                            <span className="absolute bottom-0 left-0 w-full h-1 bg-primary rounded-t-full" />
                          )}
                        </button>
                      );
                    },
                  )}
                </div>
              )}

              {/* Tab content */}
              <div className="p-5 md:p-8 lg:p-16">
                {isEditing && isModifiable ? (
                  <div className="space-y-10">
                    <section className="space-y-6">
                      <h3 className="text-lg font-black border-l-4 border-primary pl-4 uppercase tracking-tighter">
                        General
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                          <label className={labelClass}>Título</label>
                          <input
                            value={formData.title}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                title: e.target.value,
                              })
                            }
                            className={inputClass}
                          />
                        </div>
                        </div>
                      <div className="grid grid-cols-1 md:grid-cols-1 gap-1">

                        <label className={labelClass}>Imagen</label>

                        <input
                          placeholder="URL Imagen"
                          value={formData.imageUrl}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              imageUrl: e.target.value,
                            })
                          }
                          className={inputClass}
                        />
                        </div>
                      <div className="grid grid-cols-1 md:grid-cols-1 gap-1">

                        <label className={labelClass}>Vídeo</label>
                        <input
                          placeholder="URL Video"
                          value={formData.videoUrl}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              videoUrl: e.target.value,
                            })
                          }
                          className={inputClass}
                        />
                        </div>
                      <label className={labelClass}>Cuerpo (Markdown)</label>
                      <textarea
                        rows={10}
                        value={formData.summary}
                        onChange={(e) =>
                          setFormData({ ...formData, summary: e.target.value })
                        }
                        className={`${inputClass} font-mono text-xs`}
                      />
                    </section>

                    <section className="space-y-8 pt-10 border-t border-border">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-black uppercase tracking-tighter text-orange-600">
                          Evaluación
                        </h3>
                        <button
                          onClick={addQuestion}
                          className="text-[9px] font-black uppercase bg-orange-500/10 text-orange-600 px-4 py-2 rounded-lg"
                        >
                          + Añadir
                        </button>
                      </div>
                      <div className="space-y-6">
                        {formData.quiz.questions.map((q: any, qIdx: number) => (
                          <div
                            key={qIdx}
                            className="relative p-6 bg-muted/20 border border-border/50 rounded-2xl space-y-4"
                          >
                            <button
                              onClick={() => removeQuestion(qIdx)}
                              className="absolute top-3 right-2 text-muted-foreground hover:text-destructive"
                            >
                              <i className="bi bi-trash3"></i>
                            </button>
                            <input
                              value={q.question}
                              onChange={(e) =>
                                updateQuestionText(qIdx, e.target.value)
                              }
                              className={inputClass}
                              placeholder="Pregunta..."
                            />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {q.options.map((opt: string, oIdx: number) => (
                                <input
                                  key={oIdx}
                                  value={opt}
                                  onChange={(e) =>
                                    updateOptionText(qIdx, oIdx, e.target.value)
                                  }
                                  className={`${inputClass} text-xs`}
                                  placeholder={`Opción ${oIdx + 1}`}
                                />
                              ))}
                            </div>
                            <select
                              value={q.correctAnswer}
                              onChange={(e) =>
                                updateCorrectAnswer(qIdx, e.target.value)
                              }
                              className={`${inputClass} border-emerald-500/30`}
                            >
                              <option value="">Respuesta Correcta</option>
                              {q.options.map((opt: string, i: number) => (
                                <option key={i} value={opt}>
                                  {opt}
                                </option>
                              ))}
                            </select>
                          </div>
                        ))}
                      </div>
                    </section>
                  </div>
                ) : (
                  <div className="animate-in fade-in duration-500">
                    {activeTab === "multimedia" && (
                      <div className="aspect-video rounded-2xl overflow-hidden bg-black shadow-2xl">
                        <video
                          key={content?.videoUrl}
                          controls
                          className="w-full h-full object-cover"
                        >
                          <source src={content?.videoUrl} type="video/mp4" />
                        </video>
                      </div>
                    )}
                    {activeTab === "lectura" && (
                      <div className="space-y-8">
                        {/* Mostrar imagen con manejo de errores */}
                       {content?.imageUrl && (
                          <div className="relative group cursor-zoom-in">
                            <img ref={imageRef} src={content.imageUrl} className="w-full aspect-[4/3] md:aspect-[16/10] object-cover object-center rounded-[1.5rem] md:rounded-[2rem] shadow-lg border border-border/50 transition-transform duration-500 hover:scale-[1.01]" alt="Cover" onError={() => setImageError(true)} />
                            <div className="absolute top-4 right-4 bg-black/20 backdrop-blur-md p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                              <i className="bi bi-zoom-in text-white"></i>
                            </div>
                          </div>
                        )}

                        {/* Si hay error o no hay imagen, mostrar placeholder */}
                        {(!content?.imageUrl || content.imageUrl.trim() === "" || imageError) && (
                          <div className="w-full aspect-video rounded-2xl bg-muted/30 flex flex-col items-center justify-center border border-border/50">
                            <i className="bi bi-image text-4xl text-muted-foreground/40 mb-2"></i>
                            <p className="text-[10px] text-muted-foreground">
                              {imageError ? "Error al cargar la imagen" : "Sin imagen de portada"}
                            </p>
                          </div>
                        )}

                        <div className="prose dark:prose-invert max-w-none">
                          <ReactMarkdown
                            components={{
                              h2: ({ ...props }) => (
                                <h2
                                  className="text-xl md:text-2xl font-black text-foreground mt-8 mb-4"
                                  {...props}
                                />
                              ),
                              p: ({ ...props }) => (
                                <p
                                  className="text-[15px] md:text-[17px] leading-[1.8] text-muted-foreground mb-6"
                                  {...props}
                                />
                              ),
                              li: ({ ...props }) => (
                                <li className="flex items-start gap-3 text-[14px] md:text-[16px] text-muted-foreground mb-4">
                                  <span className="mt-2.5 w-2 h-2 rounded-full bg-primary/40 shrink-0" />
                                  <span {...props} />
                                </li>
                              ),
                              blockquote: ({ ...props }) => (
                                <blockquote
                                  className="border-l-4 border-primary bg-muted/40 p-4 md:p-6 rounded-r-2xl my-8 italic"
                                  {...props}
                                />
                              ),
                            }}
                          >
                            {content?.summary}
                          </ReactMarkdown>
                        </div>
                      </div>
                    )}
                    {activeTab === "evaluacion" && (
                      <div className="bg-orange-500/5 border border-orange-500/10 rounded-[2rem] p-8 md:p-12 text-center space-y-6">
                        <div className="w-14 h-14 md:w-16 md:h-16 bg-orange-500 text-white rounded-2xl flex items-center justify-center mx-auto shadow-xl">
                          <i className="bi bi-patch-question text-2xl md:text-3xl"></i>
                        </div>
                        <h4 className="text-xl md:text-2xl font-black italic">
                          ¿Deseas probar tus conocimientos?
                        </h4>
                        <button
                          onClick={() => setShowQuizModal(true)}
                          className="bg-orange-500 text-white px-8 md:px-10 py-3 md:py-4 rounded-xl text-xs font-black uppercase tracking-widest shadow-xl hover:scale-105 transition-all"
                        >
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
            ── Aside / Materiales ──
            Desktop: fixed right panel (w-80, border-l, overflow-y-auto)
            Mobile:  full-width section below main content (border-t)
          */}
          <aside
            className="
            w-full md:w-80
            border-t md:border-t-0 md:border-l border-border
            bg-card
            p-4 md:p-6
            flex flex-col gap-4 md:gap-6
            md:overflow-y-auto md:shrink-0
            no-scrollbar
          "
          >
            {content?.podcast?.url && (
              <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-4 md:p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-500 text-white rounded-xl flex items-center justify-center shadow-lg">
                    <i className="bi bi-mic-fill"></i>
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase text-emerald-600 tracking-widest">
                      Audio Guía
                    </p>
                    <p className="text-[11px] font-bold opacity-70">
                      Escuchar unidad
                    </p>
                  </div>
                </div>
                <audio
                  ref={audioRef}
                  src={content.podcast.url}
                  controls
                  className="w-full h-8 accent-emerald-500"
                />
              </div>
            )}

            <h4 className={labelClass}>Materiales</h4>

            {/* Mostrar cualquier documento en url */}
            {content?.url && content.url.trim() !== "" && (
              <a
                href={content.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group w-full p-4 bg-muted/50 border border-border rounded-xl flex items-center gap-4 hover:border-primary transition-all"
              >
                <div className="w-10 h-10 bg-red-500/10 text-red-500 rounded-xl flex items-center justify-center shrink-0">
                  <i className="bi bi-file-earmark-pdf text-xl"></i>
                </div>
                <div className="text-left overflow-hidden">
                  <p className="text-[8px] font-black uppercase text-muted-foreground">
                    {content.url?.toLowerCase().includes(".pdf") ? "PDF" : "DOCUMENTO"}
                  </p>
                  <p className="text-xs font-bold truncate">
                    {content.url?.toLowerCase().includes(".pdf") ? "Descargar Guía" : "Abrir Documento"}
                  </p>
                </div>
              </a>
            )}

            {/* Si no hay documento, mostrar mensaje */}
            {(!content?.url || content.url.trim() === "") && (
              <div className="text-center py-4">
                <i className="bi bi-file-earmark text-2xl text-muted-foreground/40"></i>
                <p className="text-[9px] text-muted-foreground mt-1">Sin materiales</p>
              </div>
            )}

            {content?.practiceLab && (
              <button
                onClick={() => setShowLabModal(true)}
                className="group w-full p-4 bg-blue-500/5 border border-blue-500/10 rounded-xl flex items-center gap-4 hover:border-blue-500 transition-all text-left"
              >
                <div className="w-10 h-10 bg-blue-500 text-white rounded-xl flex items-center justify-center shrink-0 shadow-lg">
                  <i className="bi bi-controller text-xl"></i>
                </div>
                <div className="overflow-hidden">
                  <p className="text-[8px] font-black uppercase text-blue-600">
                    Simulador IA
                  </p>
                  <p className="text-xs font-bold truncate">
                    Práctica Interactiva
                  </p>
                </div>
              </button>
            )}

            {content?.presentationUrl && (
              <a
                href={content.presentationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group w-full p-4 bg-orange-500/5 border border-orange-500/10 rounded-xl flex items-center gap-4 hover:border-orange-500 transition-all"
              >
                <div className="w-10 h-10 bg-orange-500 text-white rounded-xl flex items-center justify-center shrink-0 shadow-lg">
                  <i className="bi bi-easel text-xl"></i>
                </div>
                <div>
                  <p className="text-[8px] font-black uppercase text-orange-500">
                    Presentación
                  </p>
                  <p className="text-xs font-bold">Descargar Presentación</p>
                </div>
              </a>
            )}

            {/* Delete button - solo si se puede modificar */}
            {isModifiable && (
              <div className="md:mt-auto pt-4 md:pt-6 border-t border-border">
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="w-full py-3 text-[9px] font-black uppercase text-destructive hover:bg-destructive/5 rounded-xl tracking-widest transition-all"
                >
                  Eliminar Unidad
                </button>
              </div>
            )}
          </aside>
        </div>
      </main>

      {/* ── MODAL LABORATORIO ── */}
      {showLabModal && (
        <div className="fixed inset-0 z-120 flex items-center justify-center bg-black/95 backdrop-blur-xl md:p-4">
          <div className="bg-card border border-border md:rounded-[40px] w-full max-w-6xl h-full md:h-[90vh] relative overflow-hidden shadow-2xl flex flex-col">
            <button
              onClick={() => {
                setShowLabModal(false);
                setIsLabStarted(false);
              }}
              className="absolute top-4 right-4 z-130 w-10 h-10 bg-white/10 hover:bg-destructive rounded-full flex items-center justify-center text-white transition-all shadow-lg"
            >
              <i className="bi bi-x-lg"></i>
            </button>
            <div className="flex-1 flex flex-col bg-slate-950 overflow-hidden">
              {!isLabStarted ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-6">
                  <div className="w-16 h-16 md:w-20 md:h-20 bg-blue-500/20 text-blue-500 rounded-3xl flex items-center justify-center mx-auto shadow-2xl">
                    <i className="bi bi-controller text-3xl md:text-4xl"></i>
                  </div>
                  <div>
                    <h3 className="text-xl md:text-2xl font-black text-white mb-2">
                      {content?.practiceLab?.scenarioTitle || "Simulador"}
                    </h3>
                    <p className="text-slate-400 max-w-md mx-auto text-sm">
                      Resuelve el desafío interactivo para completar esta
                      unidad.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsLabStarted(true)}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-8 md:px-10 py-3 md:py-4 rounded-xl font-black uppercase text-xs tracking-widest shadow-lg transition-all active:scale-95"
                  >
                    Empezar Práctica
                  </button>
                </div>
              ) : (
                <div className="w-full h-full">
                  <InteractiveLab data={content.practiceLab} />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL QUIZ ── */}
      {showQuizModal && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 backdrop-blur-md p-3 md:p-4">
          <div className="bg-card border border-border rounded-[1.5rem] md:rounded-[2rem] p-5 md:p-8 max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="flex justify-between items-center mb-6 md:mb-8 shrink-0">
              <h3 className="text-xl md:text-2xl font-black italic">
                Vista Previa Evaluación
              </h3>
              <button
                onClick={() => {
                  setShowQuizModal(false);
                  setIsCorrected(false);
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                <i className="bi bi-x-circle text-2xl"></i>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto pr-2 space-y-8 md:space-y-10 no-scrollbar">
              {content?.quiz?.questions.map((q: any, qIdx: number) => (
                <div key={qIdx} className="space-y-4">
                  <p className="font-bold text-base md:text-lg">
                    <span className="text-primary/30 mr-2">Q.0{qIdx + 1}</span>{" "}
                    {q.question}
                  </p>
                  <div className="grid gap-2">
                    {q.options.map((opt: string, oIdx: number) => (
                      <button
                        key={oIdx}
                        disabled={isCorrected}
                        onClick={() =>
                          setUserAnswers({ ...userAnswers, [qIdx]: opt })
                        }
                        className={`w-full p-3 md:p-4 rounded-xl border text-left text-sm transition-all ${userAnswers[qIdx] === opt ? "border-primary bg-primary/5" : "border-border"}`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="pt-4 md:pt-6 mt-4 md:mt-6 border-t border-border">
              <button
                onClick={() => setIsCorrected(true)}
                className="w-full bg-primary text-white py-3 md:py-4 rounded-xl font-black uppercase text-xs tracking-widest shadow-lg"
              >
                Corregir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL ELIMINAR ── */}
      {showDeleteModal && isModifiable && (
        <div className="fixed inset-0 z-[110 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-[1.5rem] md:rounded-[2rem] p-8 md:p-10 max-w-sm w-full text-center shadow-2xl">
            <i className="bi bi-exclamation-triangle text-4xl text-destructive mb-4 block"></i>
            <h3 className="text-xl font-black mb-2">¿Borrar unidad?</h3>
            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-3 rounded-xl bg-muted font-black uppercase text-[10px]"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 py-3 rounded-xl bg-destructive text-white font-black uppercase text-[10px]"
              >
                {isDeleting ? "Borrando..." : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
