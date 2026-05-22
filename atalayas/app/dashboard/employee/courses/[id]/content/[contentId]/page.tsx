"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import dynamic from "next/dynamic";
import Sidebar from "@/components/ui/Sidebar";
import PageHeader from "@/components/ui/pageHeader";
import { API_ROUTES } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import zoom from "medium-zoom";

interface LabProps {
  data: any;
  onCompleted?: () => void;
}

const InteractiveLab = dynamic<LabProps>(
  () => import("@/components/interactiveLab").then((mod) => mod.default),
  {
    ssr: false,
    loading: () => (
      <div className="text-white font-black animate-pulse">
        CARGANDO MOTOR GRÁFICO...
      </div>
    ),
  },
);

const labelClass =
  "text-[10px] font-black uppercase text-primary tracking-[0.2em] mb-2 block";
const tabBtnClass =
  "pb-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative whitespace-nowrap";

type TabType = "presentacion" | "multimedia" | "lectura" | "evaluacion";

export default function EmployeeContentDetail() {
  const params = useParams();
  const audioRef = useRef<HTMLAudioElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const [content, setContent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("lectura");
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [showLabModal, setShowLabModal] = useState(false);
  const [isLabStarted, setIsLabStarted] = useState(false);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [isCorrected, setIsCorrected] = useState(false);
  
  const [showScoreResult, setShowScoreResult] = useState(false);
  const [isPassed, setIsPassed] = useState(false); 
  const [finalScore, setFinalScore] = useState({ score: 0, total: 0 });

  const normalizedQuiz = Array.isArray(content?.quiz)
    ? content.quiz
    : content?.quiz?.questions || [];

  const refreshContent = async () => {
    try {
      const res = await fetch(
        API_ROUTES.CONTENT.GET_BY_ID(
          params.id as string,
          params.contentId as string,
        ),
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );
      const data = await res.json();
      const raw = data?.data || data?.content || data || {};
      setContent(raw);
    } catch (err) {
      console.error("Error fetching content", err);
    }
  };

  useEffect(() => {
    if (params.id && params.contentId) {
      refreshContent().finally(() => setLoading(false));
    }
  }, [params.id, params.contentId]);

  useEffect(() => {
    if (activeTab === "lectura" && imageRef.current) {
      const zoomInstance = zoom(imageRef.current, {
        background: "rgba(0,0,0,0.9)",
        margin: 40,
      });
      return () => {
        zoomInstance.detach();
      };
    }
  }, [content?.imageUrl, activeTab]);

  useEffect(() => {
    if (!params.id || !params.contentId) return;

    const timer = setTimeout(async () => {
      try {
        await fetch(
          API_ROUTES.CONTENT.VIEW(
            params.id as string,
            params.contentId as string,
          ),
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          },
        );
        await refreshContent();
      } catch (err) {
        console.error("Error marking content as viewed", err);
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [params.id, params.contentId]);

  // ── FUNCIÓN EXTRAÍDA Y LIMPIA PARA CORREGIR EL TEST ──
  const handleCorrectQuiz = async () => {
    let score = 0;

    normalizedQuiz.forEach((q: any, idx: number) => {
      if (userAnswers[idx] === q.correctAnswer) {
        score++;
      }
    });

    const minApprovalRate = 1; 
    const passed = score / normalizedQuiz.length >= minApprovalRate;

    // Seteamos los estados locales de la corrección primero
    setIsCorrected(true);
    setFinalScore({ score, total: normalizedQuiz.length });
    setIsPassed(passed);
    setShowScoreResult(true);

    if (passed) {
      try {
        await fetch(
          API_ROUTES.CONTENT.COMPLETE(
            params.id as string,
            params.contentId as string,
          ),
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            body: JSON.stringify({
              score,
              totalQuestions: normalizedQuiz.length,
            }),
          },
        );
        await refreshContent();
      } catch (err) {
        console.error("Error completing quiz in server", err);
      }
    }
  };

  const hasVideo = !!content?.videoUrl;
  const quizData = content?.quiz;
  const labData = content?.practiceLab;

  const hasQuiz =
    quizData &&
    quizData !== "null" &&
    ((Array.isArray(quizData) && quizData.length > 0) ||
      (typeof quizData === "object" &&
        Array.isArray(quizData.questions) &&
        quizData.questions.length > 0));

  const hasLab = labData && labData !== "null";

  const handleCloseQuiz = () => {
    setShowQuizModal(false);
    setIsCorrected(false);
    setShowScoreResult(false);
    setIsPassed(false);
    setUserAnswers({});
  };

  const handleRetryQuiz = () => {
    setIsCorrected(false);
    setShowScoreResult(false);
    setIsPassed(false);
    setUserAnswers({});
  };

   if (loading) return (
    <div className="flex min-h-screen bg-background items-center justify-center font-sans">
      <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin shadow-md" />
    </div>
  );

  return (
    <div className="flex h-screen bg-background font-sans text-foreground overflow-hidden">
      <main className="flex-1 flex flex-col min-w-0 relative overflow-hidden">
        <PageHeader
          title={content?.title}
          description="Unidad de aprendizaje"
          icon={<i className="bi bi-book"></i>}
          backUrl={`/dashboard/employee/courses/${params.id}`}
        />

        <div className="flex-1 flex flex-col md:flex-row overflow-y-auto md:overflow-hidden">
          <div className="flex-1 md:overflow-y-auto bg-muted/30 p-4 md:p-8 no-scrollbar">
            <div className="max-w-4xl mx-auto bg-card shadow-xl border border-border/50 rounded-[1.5rem] md:rounded-[2.5rem] overflow-hidden mb-6 md:mb-10">
              
              {/* Tab navigation */}
              <div className="flex px-6 md:px-12 pt-6 md:pt-8 border-b border-border gap-6 md:gap-8 overflow-x-auto no-scrollbar">
                <button
                  onClick={() => setActiveTab("lectura")}
                  className={`cursor-pointer ${tabBtnClass} ${activeTab === "lectura" ? "text-primary" : "text-muted-foreground"}`}
                >
                  Lectura
                  {activeTab === "lectura" && (
                    <span className="absolute bottom-0 left-0 w-full h-1 bg-primary rounded-t-full" />
                  )}
                </button>

                {hasVideo && (
                  <button
                    onClick={() => setActiveTab("multimedia")}
                    className={`cursor-pointer ${tabBtnClass} ${activeTab === "multimedia" ? "text-primary" : "text-muted-foreground"}`}
                  >
                    Multimedia
                    {activeTab === "multimedia" && (
                      <span className="absolute bottom-0 left-0 w-full h-1 bg-primary rounded-t-full" />
                    )}
                  </button>
                )}

                {hasQuiz && (
                  <button
                    onClick={() => setActiveTab("evaluacion")}
                    className={`cursor-pointer ${tabBtnClass} ${activeTab === "evaluacion" ? "text-primary" : "text-muted-foreground"}`}
                  >
                    Evaluación
                    {activeTab === "evaluacion" && (
                      <span className="absolute bottom-0 left-0 w-full h-1 bg-primary rounded-t-full" />
                    )}
                  </button>
                )}
              </div>

              <div className="p-5 md:p-8 lg:p-16">
                {activeTab === "lectura" && (
                  <div className="animate-in fade-in duration-500 space-y-8 md:space-y-10">
                    {content?.imageUrl && (
                      <img
                        ref={imageRef}
                        src={content.imageUrl}
                        className="w-full aspect-video object-cover rounded-[1.5rem] md:rounded-[2rem] shadow-lg border border-border/50"
                        alt="Cover"
                      />
                    )}
                    <div className="prose dark:prose-invert max-w-none">
                      <ReactMarkdown
                        components={{
                          h2: ({ ...props }) => (
                            <h2 className="text-xl md:text-2xl font-black text-foreground mt-8 mb-4" {...props} />
                          ),
                          p: ({ ...props }) => (
                            <p className="text-[15px] md:text-[17px] leading-[1.8] text-muted-foreground mb-6" {...props} />
                          ),
                          li: ({ ...props }) => (
                            <li className="flex items-start gap-3 text-[14px] md:text-[16px] text-muted-foreground mb-4">
                              <span className="mt-2.5 w-2 h-2 rounded-full bg-primary/40 shrink-0" />
                              <span {...props} />
                            </li>
                          ),
                          blockquote: ({ ...props }) => (
                            <blockquote className="border-l-4 border-primary bg-muted/40 p-4 md:p-6 rounded-r-2xl my-8 italic" {...props} />
                          ),
                        }}
                      >
                        {content?.summary}
                      </ReactMarkdown>
                    </div>
                  </div>
                )}

                {activeTab === "multimedia" && hasVideo && (
                  <div className="aspect-video rounded-[1.5rem] md:rounded-[2rem] overflow-hidden bg-black shadow-2xl">
                    <video key={content.videoUrl} controls className="w-full h-full object-cover">
                      <source src={content.videoUrl} type="video/mp4" />
                    </video>
                  </div>
                )}

                {activeTab === "evaluacion" && hasQuiz && (
                  <div className="bg-orange-500/5 border border-orange-500/10 rounded-[2rem] p-8 md:p-12 text-center space-y-6">
                    <div className="w-16 h-16 md:w-20 md:h-20 bg-orange-500 text-white rounded-2xl md:rounded-3xl flex items-center justify-center mx-auto shadow-xl shadow-orange-500/20">
                      <i className="bi bi-patch-question text-3xl md:text-4xl"></i>
                    </div>
                    <h4 className="text-xl md:text-2xl font-black italic">¿Listo para el test?</h4>
                    <button
                      onClick={() => setShowQuizModal(true)}
                      className="bg-orange-500 text-white px-8 md:px-10 py-3 md:py-4 rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-xl hover:scale-105 transition-all cursor-pointer"
                    >
                      Iniciar Autoevaluación
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Aside / Materiales */}
          <aside className="w-full md:w-80 border-t md:border-t-0 md:border-l border-border bg-card p-4 md:p-6 flex flex-col gap-4 md:gap-6 md:overflow-y-auto md:shrink-0 no-scrollbar">
            {content?.podcast?.url && (
              <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-[1.5rem] md:rounded-[2rem] p-4 md:p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-500 text-white rounded-xl flex items-center justify-center shadow-lg">
                    <i className="bi bi-mic-fill"></i>
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase text-emerald-600">Audio Guía</p>
                    <p className="text-[11px] font-bold opacity-70">Escuchar unidad</p>
                  </div>
                </div>
                <audio ref={audioRef} src={content.podcast.url} controls className="w-full h-8 accent-emerald-500" />
              </div>
            )}

            <h4 className={labelClass}>Materiales</h4>

            {content?.url?.toLowerCase().includes(".pdf") && (
              <a
                href={content.url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full p-4 bg-muted/50 border border-border rounded-2xl flex items-center gap-4 hover:border-primary transition-all cursor-pointer"
              >
                <div className="w-10 h-10 bg-red-500/10 text-red-500 rounded-xl flex items-center justify-center shrink-0">
                  <i className="bi bi-file-earmark-pdf text-xl"></i>
                </div>
                <div className="text-left overflow-hidden">
                  <p className="text-[8px] font-black uppercase text-muted-foreground">Recurso PDF</p>
                  <p className="text-xs font-bold text-foreground truncate">Descargar Guía</p>
                </div>
              </a>
            )}

            {content?.practiceLab && (
              <button
                onClick={() => setShowLabModal(true)}
                className="w-full p-4 bg-blue-500/5 border border-blue-500/10 rounded-2xl flex items-center gap-4 hover:border-blue-500 transition-all text-left cursor-pointer"
              >
                <div className="w-10 h-10 bg-blue-500 text-white rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/20">
                  <i className="bi bi-controller text-xl"></i>
                </div>
                <div className="overflow-hidden">
                  <p className="text-[8px] font-black uppercase text-blue-600">Simulador IA</p>
                  <p className="text-xs font-bold text-foreground truncate">Práctica Interactiva</p>
                </div>
              </button>
            )}
          </aside>
        </div>
      </main>

      {/* Modal Lab */}
      {showLabModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl md:p-4">
          <div className="bg-card border border-border md:rounded-[40px] w-full max-w-6xl h-full md:h-[90vh] relative overflow-hidden flex flex-col">
            <button
              onClick={() => {
                setShowLabModal(false);
                setIsLabStarted(false);
              }}
              className="absolute top-4 right-4 z-50 w-10 h-10 bg-white/10 hover:bg-destructive rounded-full flex items-center justify-center text-white transition-all"
            >
              <i className="bi bi-x-lg"></i>
            </button>
            <div className="flex-1 bg-slate-950 overflow-hidden">
              {!isLabStarted ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-6 p-6">
                  <div className="w-16 h-16 md:w-20 md:h-20 bg-blue-500/20 text-blue-500 rounded-3xl flex items-center justify-center">
                    <i className="bi bi-controller text-3xl md:text-4xl"></i>
                  </div>
                  <h3 className="text-xl md:text-2xl font-black text-white">{content?.practiceLab?.scenarioTitle}</h3>
                  <button
                    onClick={() => setIsLabStarted(true)}
                    className="bg-blue-600 text-white px-8 md:px-10 py-3 md:py-4 rounded-2xl font-black uppercase text-xs"
                  >
                    Empezar Práctica
                  </button>
                </div>
              ) : (
                <div className="w-full h-full">
                  <InteractiveLab
                    data={content.practiceLab}
                    onCompleted={async () => {
                      try {
                        await fetch(
                          API_ROUTES.CONTENT.COMPLETE_LAB(params.id as string, params.contentId as string),
                          {
                            method: "POST",
                            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
                          },
                        );
                        await refreshContent();
                      } catch (err) {
                        console.error("Error completing lab", err);
                      }
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Quiz */}
      {showQuizModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-3 md:p-4">
          <div className="bg-card border border-border rounded-[1.5rem] md:rounded-[2rem] p-5 md:p-8 max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6 md:mb-8">
              <h3 className="text-xl md:text-2xl font-black italic">Evaluación de Unidad</h3>
              <button onClick={handleCloseQuiz} className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                <i className="bi bi-x-circle text-2xl"></i>
              </button>
            </div>

            {showScoreResult ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6 py-8 animate-in fade-in zoom-in-90 duration-500">
                {isPassed ? (
                  <>
                    <div className="w-20 h-20 bg-emerald-500 text-white rounded-[2rem] flex items-center justify-center shadow-xl shadow-emerald-500/20 animate-bounce">
                      <i className="bi bi-check-all text-4xl"></i>
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-2xl md:text-3xl font-black tracking-tight text-foreground">¡Unidad Completada!</h4>
                      <p className="text-muted-foreground text-sm max-w-sm mx-auto">Has finalizado la evaluación obligatoria con éxito.</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-20 h-20 bg-red-500 text-white rounded-[2rem] flex items-center justify-center shadow-xl shadow-red-500/20">
                      <i className="bi bi-exclamation-triangle text-3xl"></i>
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-2xl md:text-3xl font-black tracking-tight text-foreground">No se ha alcanzado la nota mínima</h4>
                      <p className="text-muted-foreground text-sm max-w-sm mx-auto">Necesitas acertar todas las preguntas. ¡Vuelve a intentarlo!</p>
                    </div>
                  </>
                )}
                
                <div className={`border rounded-2xl px-6 py-3 inline-flex items-center gap-3 ${isPassed ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                  <span className={`text-xs uppercase tracking-wider font-black ${isPassed ? 'text-emerald-600' : 'text-red-600'}`}>Puntuación:</span>
                  <span className={`text-lg font-black ${isPassed ? 'text-emerald-500' : 'text-red-500'}`}>{finalScore.score} / {finalScore.total}</span>
                </div>

                {isPassed ? (
                  <button onClick={handleCloseQuiz} className="bg-foreground text-background hover:opacity-90 px-8 py-3.5 rounded-xl font-black uppercase text-xs tracking-widest transition-all mt-4 w-full sm:w-auto cursor-pointer">
                    ¡Entendido!
                  </button>
                ) : (
                  <div className="flex flex-col sm:flex-row gap-3 w-full justify-center mt-4">
                    <button onClick={() => setShowScoreResult(false)} className="bg-muted text-muted-foreground hover:text-foreground px-6 py-3.5 rounded-xl font-black uppercase text-xs tracking-widest transition-all cursor-pointer">
                      Ver errores
                    </button>
                    <button onClick={handleRetryQuiz} className="bg-red-500 text-white hover:bg-red-600 px-6 py-3.5 rounded-xl font-black uppercase text-xs tracking-widest transition-all cursor-pointer">
                      Reintentar Test
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto space-y-8 md:space-y-10 no-scrollbar">
                  {normalizedQuiz.map((q: any, qIdx: number) => (
                    <div key={qIdx} className="space-y-4">
                      <p className="font-bold text-base md:text-lg">{q.question}</p>
                      <div className="grid gap-2">
                        {q.options.map((opt: string, oIdx: number) => {
                          const isSelected = userAnswers[qIdx] === opt;
                          const isCorrectChoice = isCorrected && isSelected && opt === q.correctAnswer;
                          const isWrong = isCorrected && isSelected && opt !== q.correctAnswer;
                          return (
                            <button
                              key={oIdx}
                              disabled={isCorrected}
                              onClick={() => setUserAnswers({ ...userAnswers, [qIdx]: opt })}
                              className={`w-full p-3 md:p-4 rounded-xl border text-left text-sm transition-all cursor-pointer
                                ${isSelected ? "border-primary bg-primary/5 font-medium" : "border-border text-muted-foreground hover:text-foreground"}
                                ${isCorrectChoice ? "border-emerald-500 bg-emerald-500/10 text-emerald-600" : ""}
                                ${isWrong ? "border-red-500 bg-red-500/10 text-red-600" : ""}
                              `}
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-4 md:pt-6 mt-4 md:mt-6 border-t border-border">
                  {!isCorrected ? (
                    <button
                      onClick={handleCorrectQuiz}
                      className="w-full bg-primary text-white py-3 md:py-4 rounded-xl font-black uppercase text-xs tracking-widest shadow-lg shadow-primary/20 hover:opacity-90 transition-opacity cursor-pointer"
                    >
                      Corregir Test
                    </button>
                  ) : (
                    !isPassed && (
                      <button onClick={handleRetryQuiz} className="w-full bg-red-500 text-white py-3 md:py-4 rounded-xl font-black uppercase text-xs tracking-widest shadow-lg hover:bg-red-600 transition-colors cursor-pointer">
                        Reintentar Test
                      </button>
                    )
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}