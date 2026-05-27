'use client';

import { useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Sidebar from "@/components/ui/Sidebar";
import PageHeader from "@/components/ui/pageHeader";
import { API_ROUTES } from "@/lib/utils";

export default function GeneralAdminNewAIContentPage() {
  const { id } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [sourceType, setSourceType] = useState<'file' | 'link'>('file');
  const [documentSourceType, setDocumentSourceType] = useState<'file' | 'link'>('file');
  const [imageSourceType, setImageSourceType] = useState<'file' | 'url'>('url');
  const [videoSourceType, setVideoSourceType] = useState<'file' | 'url'>('url');
  const [presentationSourceType, setPresentationSourceType] = useState<'file' | 'url'>('url');
  const [creationMode, setCreationMode] = useState<'ai' | 'manual'>('ai');

  const [openSections, setOpenSections] = useState({
    image: false,
    video: false,
    presentation: false,
    quiz: false,
  });

  const [summaryInputType, setSummaryInputType] = useState<'write' | 'upload'>('write');
  const [summaryFile, setSummaryFile] = useState<File | null>(null);

  const [options, setOptions] = useState({
    generateSummary: true,
    generateQuiz: false,
    generatePodcast: false,
    generateImage: true,
    generateVideo: false,
    generateLab: false,
    generatePresentation: false,
  });

  const [formData, setFormData] = useState({
    title: '',
    url: '',
    file: null as File | null,
  });

  const [summaryText, setSummaryText] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [presentationUrl, setPresentationUrl] = useState('');
  const [presentationFile, setPresentationFile] = useState<File | null>(null);
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [documentUrl, setDocumentUrl] = useState('');

  const scrollPositionRef = useRef(0);
  const isTogglingRef = useRef(false);

  const toggleSection = useCallback((section: keyof typeof openSections) => {
    if (isTogglingRef.current) return;
    isTogglingRef.current = true;

    scrollPositionRef.current = window.scrollY;

    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));

    requestAnimationFrame(() => {
      window.scrollTo(0, scrollPositionRef.current);
      setTimeout(() => {
        isTogglingRef.current = false;
      }, 10);
    });
  }, []);

  const hasContent = (section: string) => {
    switch (section) {
      case 'image':
        return imageSourceType === 'file' ? imageFile !== null : imageUrl.trim().length > 0;
      case 'video':
        return videoSourceType === 'file' ? videoFile !== null : videoUrl.trim().length > 0;
      case 'presentation':
        return presentationSourceType === 'file' ? presentationFile !== null : presentationUrl.trim().length > 0;
      default:
        return false;
    }
  };

  const isReady = formData.title.trim().length > 0 &&
    (creationMode === 'ai' ? (sourceType === 'file' ? formData.file !== null : formData.url.trim().length > 0) :
      (summaryInputType === 'write' ? summaryText.trim().length > 0 : summaryFile !== null));

  const handleSubmitAI = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return alert("El título es obligatorio");

    setLoading(true);
    const data = new FormData();
    data.append("title", formData.title);
    data.append("options", JSON.stringify(options));

    if (sourceType === 'file' && formData.file) {
      data.append('file', formData.file);
    } else if (sourceType === 'link' && formData.url) {
      data.append('externalUrl', formData.url);
    }

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(API_ROUTES.CONTENT.CREATE(id as string), {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: data,
      });

      if (res.ok) {
        router.push(`/dashboard/administrator/general-admin/courses/manage/view/${id}`);
      } else {
        const errorText = await res.text();
        alert(errorText || "No se pudo generar el contenido.");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Fallo de conexión.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return alert("El título es obligatorio");

    if (summaryInputType === 'write' && !summaryText.trim()) {
      alert("El resumen es obligatorio");
      return;
    }
    if (summaryInputType === 'upload' && !summaryFile) {
      alert("Debes subir un archivo de resumen");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert("No hay sesión iniciada");
        setLoading(false);
        return;
      }

      let finalSummary = summaryText;

      if (summaryInputType === 'upload' && summaryFile) {
        finalSummary = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.onerror = reject;
          reader.readAsText(summaryFile);
        });
      }

      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title.trim());
      formDataToSend.append('summary', finalSummary);

      if (imageSourceType === 'file' && imageFile) {
        formDataToSend.append('imageFile', imageFile);
      } else if (imageUrl) {
        formDataToSend.append('imageUrl', imageUrl);
      }

      if (videoSourceType === 'file' && videoFile) {
        formDataToSend.append('videoFile', videoFile);
      } else if (videoUrl) {
        formDataToSend.append('videoUrl', videoUrl);
      }

      if (presentationSourceType === 'file' && presentationFile) {
        formDataToSend.append('presentationFile', presentationFile);
      } else if (presentationUrl) {
        formDataToSend.append('presentationUrl', presentationUrl);
      }

      if (documentSourceType === 'file' && documentFile) {
        formDataToSend.append('file', documentFile);
      } else if (documentSourceType === 'link' && documentUrl) {
        formDataToSend.append('externalUrl', documentUrl); 
      }

      const apiUrl = `${API_ROUTES.CONTENT.CREATE(id as string)}/manual`;

      const res = await fetch(apiUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formDataToSend,
      });

      const responseData = await res.json();

      if (res.ok) {
        router.push(`/dashboard/administrator/general-admin/courses/manage/view/${id}`);
      } else {
        console.error("Error response:", responseData);
        alert(responseData.message || responseData.error || "No se pudo crear el contenido manual.");
      }
    } catch (error) {
      console.error("Error en submit manual:", error);
      alert("Error de conexión: " + (error instanceof Error ? error.message : "Error desconocido"));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = creationMode === 'ai' ? handleSubmitAI : handleSubmitManual;

  const Section = ({
    section,
    title,
    icon,
    colorClass,
    children
  }: {
    section: keyof typeof openSections;
    title: string;
    icon: string;
    colorClass: string;
    children: React.ReactNode;
  }) => (
    <div className="bg-card rounded-3xl border border-border shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => toggleSection(section)}
        className="w-full p-6 lg:p-8 flex items-center justify-between group hover:bg-muted/20 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${colorClass}`}>
            <i className={`bi ${icon} text-sm`}></i>
          </div>
          <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            {title}
          </h3>
          {hasContent(section) && (
            <div className="flex items-center gap-1 ml-2">
              <i className="bi bi-check-circle-fill text-emerald-500 text-xs"></i>
              <span className="text-[8px] font-black text-emerald-500 uppercase tracking-wider">Completado</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {hasContent(section) && (
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          )}
          <i className={`bi bi-chevron-${openSections[section] ? 'up' : 'down'} text-muted-foreground transition-transform text-sm`}></i>
        </div>
      </button>

      {openSections[section] && (
        <div className="px-6 pb-6 lg:px-8 lg:pb-8 border-t border-border/50">
          {children}
        </div>
      )}
    </div>
  );

  return (
    <div className="flex min-h-screen bg-background font-sans text-foreground">
      <main className="flex-1 overflow-auto flex flex-col relative">
        <PageHeader
          title="Nuevo Contenido"
          description={creationMode === 'ai'
            ? "Genera contenidos automáticamente con inteligencia artificial"
            : "Añade contenidos manualmente con tu propio material"}
          icon={<i className={`bi ${creationMode === 'ai' ? 'bi-robot' : 'bi-pencil-square'}`}></i>}
          backUrl={`/dashboard/administrator/general-admin/courses/manage/view/${id}`}
        />

        <div className="p-6 lg:p-10 max-w-4xl mx-auto w-full">
          <div className="mb-8 bg-card p-2 rounded-2xl border border-border shadow-sm inline-flex w-full max-w-md mx-auto">
            <button
              type="button"
              onClick={() => setCreationMode('ai')}
              className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${creationMode === 'ai'
                ? 'bg-primary text-white shadow-md'
                : 'bg-transparent text-muted-foreground hover:bg-muted/50'
                }`}
            >
              <i className="bi bi-robot text-sm"></i>
              Generar con IA
            </button>
            <button
              type="button"
              onClick={() => setCreationMode('manual')}
              className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${creationMode === 'manual'
                ? 'bg-primary text-white shadow-md'
                : 'bg-transparent text-muted-foreground hover:bg-muted/50'
                }`}
            >
              <i className="bi bi-pencil-square text-sm"></i>
              Añadir manualmente
            </button>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-12 space-y-8">
              <div className="bg-card p-6 lg:p-8 rounded-3xl border border-border shadow-sm">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3 ml-1">Nombre de la unidad *</label>
                <input
                  type="text" required value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-background border border-input rounded-xl px-5 py-3 text-sm font-semibold focus:border-primary outline-none transition-all shadow-sm"
                  placeholder="Ej: Normas de seguridad en planta"
                />
              </div>

              {creationMode === 'ai' && (
                <>
                  <div className="bg-card p-6 lg:p-8 rounded-3xl border border-border shadow-sm">
                    <div className="flex gap-3 mb-6">
                      <button type="button" onClick={() => setSourceType('file')} className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all border ${sourceType === 'file' ? 'bg-primary text-white border-primary shadow-md' : 'bg-muted/50 text-muted-foreground border-transparent hover:bg-muted'}`}>PDF</button>
                      <button type="button" onClick={() => setSourceType('link')} className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all border ${sourceType === 'link' ? 'bg-primary text-white border-primary shadow-md' : 'bg-muted/50 text-muted-foreground border-transparent hover:bg-muted'}`}>URL</button>
                    </div>

                    {sourceType === 'file' ? (
                      <label className="border-2 border-dashed border-border rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-primary/5 hover:border-primary transition-all group">
                        <input type="file" accept=".pdf" className="hidden" onChange={(e) => setFormData({ ...formData, file: e.target.files?.[0] || null })} />
                        <i className={`bi bi-cloud-arrow-up text-3xl mb-2 transition-colors ${formData.file ? 'text-primary' : 'text-muted-foreground/40 group-hover:text-primary/50'}`}></i>
                        <p className="text-sm font-bold text-foreground text-center">{formData.file ? formData.file.name : "Subir documento PDF"}</p>
                      </label>
                    ) : (
                      <div className="relative">
                        <i className="bi bi-link-45deg absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-lg"></i>
                        <input type="url" value={formData.url} onChange={(e) => setFormData({ ...formData, url: e.target.value })} className="w-full pl-12 pr-5 py-3 bg-background rounded-xl border border-input focus:border-primary outline-none text-sm font-medium" placeholder="https://ejemplo.com/articulo" />
                      </div>
                    )}
                  </div>

                  <div className="bg-card p-6 lg:p-8 rounded-3xl border border-border shadow-sm">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-6 ml-1">¿Qué quieres generar?</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                      {[
                        { id: 'generateSummary', label: 'Resumen', icon: 'bi-text-left', color: 'bg-emerald-500' },
                        { id: 'generateImage', label: 'Imagen', icon: 'bi-image', color: 'bg-pink-500' },
                        { id: 'generateVideo', label: 'Vídeo', icon: 'bi-play-btn', color: 'bg-purple-600' },
                        { id: 'generateQuiz', label: 'Test', icon: 'bi-patch-question', color: 'bg-amber-500' },
                        { id: 'generatePodcast', label: 'Audio', icon: 'bi-mic', color: 'bg-indigo-500' },
                        { id: 'generatePresentation', label: 'Presentación', icon: 'bi-easel', color: 'bg-orange-500' },
                        { id: 'generateLab', label: 'Práctica', icon: 'bi-controller', color: 'bg-blue-500' },
                      ].map((opt) => (
                        <button
                          key={opt.id} type="button"
                          onClick={() => setOptions({ ...options, [opt.id]: !options[opt.id as keyof typeof options] })}
                          className={`p-3 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${options[opt.id as keyof typeof options] ? `border-primary bg-primary/5` : 'border-transparent bg-muted/40 opacity-60'}`}
                        >
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-base ${options[opt.id as keyof typeof options] ? `${opt.color} text-white shadow-lg` : 'bg-muted text-muted-foreground'}`}>
                            <i className={`bi ${opt.icon}`}></i>
                          </div>
                          <span className="text-[9px] font-black uppercase tracking-tight">{opt.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {creationMode === 'manual' && (
                <div className="space-y-4">
                  {/* DOCUMENTO PDF/URL */}
                  <div className="bg-card p-6 lg:p-8 rounded-3xl border border-border shadow-sm">
                    <div className="flex gap-3 mb-6">
                      <button
                        type="button"
                        onClick={() => setDocumentSourceType('file')}
                        className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all border ${documentSourceType === 'file' ? 'bg-primary text-white border-primary shadow-md' : 'bg-muted/50 text-muted-foreground border-transparent hover:bg-muted'}`}
                      >
                        PDF
                      </button>
                      <button
                        type="button"
                        onClick={() => setDocumentSourceType('link')}
                        className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all border ${documentSourceType === 'link' ? 'bg-primary text-white border-primary shadow-md' : 'bg-muted/50 text-muted-foreground border-transparent hover:bg-muted'}`}
                      >
                        URL
                      </button>
                    </div>

                    {documentSourceType === 'file' ? (
                      <label className="border-2 border-dashed border-border rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-primary/5 hover:border-primary transition-all group">
                        <input type="file" accept=".pdf" className="hidden" onChange={(e) => setDocumentFile(e.target.files?.[0] || null)} />
                        <i className={`bi bi-cloud-arrow-up text-3xl mb-2 transition-colors ${documentFile ? 'text-primary' : 'text-muted-foreground/40 group-hover:text-primary/50'}`}></i>
                        <p className="text-sm font-bold text-foreground text-center">{documentFile ? documentFile.name : "Subir documento PDF"}</p>
                        {documentFile && (
                          <div className="mt-3 flex items-center gap-2 text-emerald-500 text-xs">
                            <i className="bi bi-check-circle-fill"></i>
                            <span className="font-bold">Archivo listo</span>
                          </div>
                        )}
                      </label>
                    ) : (
                      <div className="relative">
                        <i className="bi bi-link-45deg absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-lg"></i>
                        <input
                          type="url"
                          value={documentUrl}
                          onChange={(e) => setDocumentUrl(e.target.value)}
                          className="w-full pl-12 pr-5 py-3 bg-background rounded-xl border border-input focus:border-primary outline-none text-sm font-medium"
                          placeholder="https://ejemplo.com/documento.pdf"
                        />
                      </div>
                    )}
                  </div>

                  {/* Resumen */}
                  <div className="bg-card rounded-3xl border-2 border-emerald-500/30 shadow-sm overflow-hidden">
                    <div className="w-full p-6 lg:p-8 flex items-center justify-between bg-emerald-500/5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-emerald-500/20 text-emerald-600 border border-emerald-500/30">
                          <i className="bi bi-text-left text-sm"></i>
                        </div>
                        <h3 className="text-xs font-bold uppercase tracking-widest text-emerald-600">
                          RESUMEN DEL CONTENIDO *
                        </h3>
                        <div className="flex items-center gap-1 ml-2">
                          <i className="bi bi-check-circle-fill text-emerald-500 text-xs"></i>
                          <span className="text-[8px] font-black text-emerald-500 uppercase tracking-wider">Obligatorio</span>
                        </div>
                      </div>
                    </div>

                    <div className="px-6 pb-6 lg:px-8 lg:pb-8 pt-6">
                      <div className="space-y-4">
                        <div className="flex gap-2 p-1 bg-muted/30 rounded-xl">
                          <button
                            type="button"
                            onClick={() => setSummaryInputType('write')}
                            className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase transition-all ${summaryInputType === 'write' ? 'bg-emerald-500 text-white shadow-sm' : 'text-muted-foreground hover:bg-muted/50'}`}
                          >
                            <i className="bi bi-pencil me-1"></i> Escribir
                          </button>
                          <button
                            type="button"
                            onClick={() => setSummaryInputType('upload')}
                            className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase transition-all ${summaryInputType === 'upload' ? 'bg-emerald-500 text-white shadow-sm' : 'text-muted-foreground hover:bg-muted/50'}`}
                          >
                            <i className="bi bi-file-earmark-arrow-up me-1"></i> Subir archivo
                          </button>
                        </div>

                        {summaryInputType === 'write' ? (
                          <>
                            <textarea
                              rows={8}
                              value={summaryText}
                              onChange={(e) => setSummaryText(e.target.value)}
                              className="w-full bg-background border-2 border-emerald-500/20 focus:border-emerald-500 rounded-xl px-5 py-3 text-sm font-medium focus:outline-none transition-all shadow-sm"
                              placeholder="Escribe aquí el resumen o descripción del contenido (soporta Markdown)..."
                              required
                            />
                            <p className="text-[10px] text-muted-foreground ml-1">
                              Puedes usar formato Markdown para dar estilo al texto
                            </p>
                          </>
                        ) : (
                          <label className="border-2 border-dashed border-emerald-500/30 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-emerald-500/5 hover:border-emerald-500 transition-all group">
                            <input
                              type="file"
                              accept=".txt,.md"
                              className="hidden"
                              onChange={(e) => setSummaryFile(e.target.files?.[0] || null)}
                              required
                            />
                            <i className={`bi bi-cloud-arrow-up text-3xl mb-2 transition-colors ${summaryFile ? 'text-emerald-500' : 'text-muted-foreground/40 group-hover:text-emerald-500/50'}`}></i>
                            <p className="text-sm font-bold text-foreground text-center">
                              {summaryFile ? summaryFile.name : "Subir archivo de texto (TXT, MD)"}
                            </p>
                            {summaryFile && (
                              <div className="mt-3 flex items-center gap-2 text-emerald-500 text-xs">
                                <i className="bi bi-check-circle-fill"></i>
                                <span className="font-bold">Archivo listo</span>
                              </div>
                            )}
                          </label>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Imagen */}
                  <Section section="image" title="IMAGEN" icon="bi-image" colorClass="bg-pink-500/10 text-pink-600 border border-pink-500/20">
                    <div className="space-y-4">
                      <div className="flex gap-2 p-1 bg-muted/30 rounded-xl">
                        <button
                          type="button"
                          onClick={() => setImageSourceType('url')}
                          className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase transition-all ${imageSourceType === 'url' ? 'bg-pink-500 text-white shadow-sm' : 'text-muted-foreground hover:bg-muted/50'}`}
                        >
                          <i className="bi bi-link-45deg me-1"></i> URL
                        </button>
                        <button
                          type="button"
                          onClick={() => setImageSourceType('file')}
                          className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase transition-all ${imageSourceType === 'file' ? 'bg-pink-500 text-white shadow-sm' : 'text-muted-foreground hover:bg-muted/50'}`}
                        >
                          <i className="bi bi-cloud-arrow-up me-1"></i> Subir imagen
                        </button>
                      </div>

                      {imageSourceType === 'url' ? (
                        <div>
                          <label className="block text-[9px] font-bold uppercase text-muted-foreground mb-2 ml-1">URL de la imagen</label>
                          <div className="relative">
                            <i className="bi bi-link-45deg absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-base"></i>
                            <input
                              type="url"
                              value={imageUrl}
                              onChange={(e) => setImageUrl(e.target.value)}
                              className="w-full pl-11 pr-5 py-3 bg-background border border-input rounded-xl text-sm font-medium focus:border-primary outline-none transition-all shadow-sm"
                              placeholder="https://ejemplo.com/imagen.jpg"
                            />
                          </div>
                        </div>
                      ) : (
                        <div>
                          <label className="border-2 border-dashed border-pink-500/30 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-pink-500/5 hover:border-pink-500 transition-all group">
                            <input type="file" accept="image/*" className="hidden" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
                            <i className={`bi bi-cloud-arrow-up text-3xl mb-2 transition-colors ${imageFile ? 'text-pink-500' : 'text-muted-foreground/40 group-hover:text-pink-500/50'}`}></i>
                            <p className="text-sm font-bold text-foreground text-center">{imageFile ? imageFile.name : "Subir imagen (JPG, PNG, WebP)"}</p>
                          </label>
                        </div>
                      )}
                    </div>
                  </Section>

                  {/* Video */}
                  <Section section="video" title="VIDEO" icon="bi-play-btn" colorClass="bg-purple-500/10 text-purple-600 border border-purple-500/20">
                    <div className="space-y-4">
                      <div className="flex gap-2 p-1 bg-muted/30 rounded-xl">
                        <button
                          type="button"
                          onClick={() => setVideoSourceType('url')}
                          className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase transition-all ${videoSourceType === 'url' ? 'bg-purple-500 text-white shadow-sm' : 'text-muted-foreground hover:bg-muted/50'}`}
                        >
                          <i className="bi bi-link-45deg me-1"></i> URL
                        </button>
                        <button
                          type="button"
                          onClick={() => setVideoSourceType('file')}
                          className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase transition-all ${videoSourceType === 'file' ? 'bg-purple-500 text-white shadow-sm' : 'text-muted-foreground hover:bg-muted/50'}`}
                        >
                          <i className="bi bi-cloud-arrow-up me-1"></i> Subir video
                        </button>
                      </div>

                      {videoSourceType === 'url' ? (
                        <div>
                          <label className="block text-[9px] font-bold uppercase text-muted-foreground mb-2 ml-1">URL del video</label>
                          <div className="relative">
                            <i className="bi bi-link-45deg absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-base"></i>
                            <input
                              type="url"
                              value={videoUrl}
                              onChange={(e) => setVideoUrl(e.target.value)}
                              className="w-full pl-11 pr-5 py-3 bg-background border border-input rounded-xl text-sm font-medium focus:border-primary outline-none transition-all shadow-sm"
                              placeholder="https://ejemplo.com/video.mp4"
                            />
                          </div>
                        </div>
                      ) : (
                        <div>
                          <label className="border-2 border-dashed border-purple-500/30 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-purple-500/5 hover:border-purple-500 transition-all group">
                            <input type="file" accept="video/*" className="hidden" onChange={(e) => setVideoFile(e.target.files?.[0] || null)} />
                            <i className={`bi bi-cloud-arrow-up text-3xl mb-2 transition-colors ${videoFile ? 'text-purple-500' : 'text-muted-foreground/40 group-hover:text-purple-500/50'}`}></i>
                            <p className="text-sm font-bold text-foreground text-center">{videoFile ? videoFile.name : "Subir video (MP4, WebM)"}</p>
                          </label>
                        </div>
                      )}
                    </div>
                  </Section>

                  {/* Presentación (Agregada y Reparada) */}
                  <Section section="presentation" title="PRESENTACIÓN" icon="bi-easel" colorClass="bg-orange-500/10 text-orange-600 border border-orange-500/20">
                    <div className="space-y-4">
                      <div className="flex gap-2 p-1 bg-muted/30 rounded-xl">
                        <button
                          type="button"
                          onClick={() => setPresentationSourceType('url')}
                          className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase transition-all ${presentationSourceType === 'url' ? 'bg-orange-500 text-white shadow-sm' : 'text-muted-foreground hover:bg-muted/50'}`}
                        >
                          <i className="bi bi-link-45deg me-1"></i> URL
                        </button>
                        <button
                          type="button"
                          onClick={() => setPresentationSourceType('file')}
                          className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase transition-all ${presentationSourceType === 'file' ? 'bg-orange-500 text-white shadow-sm' : 'text-muted-foreground hover:bg-muted/50'}`}
                        >
                          <i className="bi bi-cloud-arrow-up me-1"></i> Subir presentación
                        </button>
                      </div>

                      {presentationSourceType === 'url' ? (
                        <div>
                          <label className="block text-[9px] font-bold uppercase text-muted-foreground mb-2 ml-1">
                            URL de la presentación
                          </label>
                          <div className="relative">
                            <i className="bi bi-link-45deg absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-base"></i>
                            <input
                              type="url"
                              value={presentationUrl}
                              onChange={(e) => setPresentationUrl(e.target.value)}
                              className="w-full pl-11 pr-5 py-3 bg-background border border-input rounded-xl text-sm font-medium focus:border-primary outline-none transition-all shadow-sm"
                              placeholder="https://docs.google.com/presentation/... o URL directa .pdf/.pptx"
                            />
                          </div>
                          {presentationUrl && (
                            <div className="mt-3 flex items-center gap-2 text-orange-500 text-xs">
                              <i className="bi bi-check-circle-fill"></i>
                              <span className="font-bold">URL configurada</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div>
                          <label className="border-2 border-dashed border-orange-500/30 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-orange-500/5 hover:border-orange-500 transition-all group">
                            <input
                              type="file"
                              accept=".pdf,.pptx,.ppt"
                              className="hidden"
                              onChange={(e) => setPresentationFile(e.target.files?.[0] || null)}
                            />
                            <i className={`bi bi-cloud-arrow-up text-3xl mb-2 transition-colors ${presentationFile ? 'text-orange-500' : 'text-muted-foreground/40 group-hover:text-orange-500/50'}`}></i>
                            <p className="text-sm font-bold text-foreground text-center">
                              {presentationFile ? presentationFile.name : "Subir presentación (PDF, PPTX, PPT)"}
                            </p>
                            {presentationFile && (
                              <div className="mt-3 flex items-center gap-2 text-orange-500 text-xs">
                                <i className="bi bi-check-circle-fill"></i>
                                <span className="font-bold">Presentación lista para subir</span>
                              </div>
                            )}
                          </label>
                          {presentationFile && (
                            <button
                              type="button"
                              onClick={() => setPresentationFile(null)}
                              className="mt-2 text-[10px] text-muted-foreground hover:text-orange-500 transition-colors"
                            >
                              <i className="bi bi-trash3 me-1"></i> Eliminar presentación
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </Section>

                  {/* Botón de envío global */}
                  <div className="pt-4">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-4 bg-primary text-white font-bold rounded-xl shadow-md hover:bg-primary/90 transition-all disabled:opacity-50"
                    >
                      {loading ? "Guardando..." : "Crear Contenido Manual"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}