'use client';

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Sidebar from "@/components/ui/Sidebar";
import PageHeader from "@/components/ui/pageHeader";
import { API_ROUTES } from "@/lib/utils";
import { motion } from "framer-motion";

export default function NewAIContentPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [sourceType, setSourceType] = useState<'file' | 'link'>('file');

  const [options, setOptions] = useState({
    generateSummary: true,
    generateQuiz: false,
    generatePodcast: false,
  });

  const [formData, setFormData] = useState({
    title: '',
    url: '',
    file: null as File | null,
  });

  const isReady =
    formData.title.trim().length > 0 &&
    (sourceType === 'file' ? formData.file !== null : formData.url.trim().length > 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return alert("El título es obligatorio");
    if (sourceType === 'file' && !formData.file) return alert("Debes subir un archivo PDF");
    if (sourceType === 'link' && !formData.url) return alert("Debes introducir una URL");

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
      const res = await fetch(API_ROUTES.CONTENT.CREATE(id), {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: data,
      });

      if (res.ok) {
        router.push(`/dashboard/administrator/admin/courses/manage/view/${id}`);
      } else {
        alert("No se pudo generar el contenido.");
      }
    } catch (error) {
      alert("Fallo de conexión.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#f5f5f7] dark:bg-[#0d0d0f] overflow-hidden font-sans text-foreground">
      <main className="flex-1 overflow-auto flex flex-col relative">
        <PageHeader
          title="Generar Contenido"
          description="Crea lecciones automáticamente con IA a partir de documentos o enlaces."
          icon={<i className="bi bi-robot"></i>}
          backUrl={`/dashboard/administrator/admin/courses/manage/view/${id}`}
        />

        <div className="p-6 lg:p-10 max-w-3xl mx-auto w-full">
          <motion.form
            onSubmit={handleSubmit}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="space-y-8"
          >
            <div className="bg-white dark:bg-[#1c1c1e] p-6 lg:p-8 rounded-3xl border border-gray-100 dark:border-white/5 shadow-sm">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3 ml-1">Nombre de la unidad</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full bg-background border border-input rounded-xl px-5 py-3 text-sm font-semibold focus:border-primary outline-none transition-all shadow-sm"
                placeholder="Ej: Introducción a la normativa"
              />
            </div>

            <div className="bg-white dark:bg-[#1c1c1e] p-6 lg:p-8 rounded-3xl border border-gray-100 dark:border-white/5 shadow-sm">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4 ml-1">Fuente de datos</label>
              <div className="flex gap-3 mb-6">
                <button
                  type="button"
                  onClick={() => setSourceType('file')}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all border ${sourceType === 'file' ? 'bg-primary text-white border-primary shadow-md' : 'bg-muted/50 text-muted-foreground border-transparent hover:bg-muted'}`}
                >
                  PDF
                </button>
                <button
                  type="button"
                  onClick={() => setSourceType('link')}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all border ${sourceType === 'link' ? 'bg-primary text-white border-primary shadow-md' : 'bg-muted/50 text-muted-foreground border-transparent hover:bg-muted'}`}
                >
                  URL
                </button>
              </div>

              {sourceType === 'file' ? (
                <label className="border-2 border-dashed border-border rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-primary/5 hover:border-primary transition-all group">
                  <input
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={(e) => setFormData({ ...formData, file: e.target.files?.[0] || null })}
                  />
                  <i className={`bi bi-cloud-arrow-up text-3xl mb-2 transition-colors ${formData.file ? 'text-primary' : 'text-muted-foreground/40 group-hover:text-primary/50'}`}></i>
                  <p className="text-sm font-bold text-foreground">{formData.file ? formData.file.name : "Subir PDF"}</p>
                </label>
              ) : (
                <div className="relative">
                  <i className="bi bi-link-45deg absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-lg"></i>
                  <input
                    type="url"
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    className="w-full pl-12 pr-5 py-3 bg-background rounded-xl border border-input focus:border-primary outline-none text-sm font-medium"
                    placeholder="https://ejemplo.com/articulo"
                  />
                </div>
              )}
            </div>

            <div className="bg-white dark:bg-[#1c1c1e] p-6 lg:p-8 rounded-3xl border border-gray-100 dark:border-white/5 shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-6 ml-1">Opciones de generación</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { id: 'generateSummary', label: 'Resumen', icon: 'bi-text-left', color: 'bg-emerald-500' },
                  { id: 'generateQuiz', label: 'Test IA', icon: 'bi-patch-question', color: 'bg-amber-500' },
                  { id: 'generatePodcast', label: 'Podcast', icon: 'bi-mic', color: 'bg-indigo-500' }
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setOptions({ ...options, [opt.id]: !options[opt.id as keyof typeof options] })}
                    className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${options[opt.id as keyof typeof options] ? 'border-primary bg-primary/5' : 'border-transparent bg-muted/40 opacity-60'}`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${options[opt.id as keyof typeof options] ? `${opt.color} text-white` : 'bg-muted text-muted-foreground'}`}>
                      <i className={`bi ${opt.icon}`}></i>
                    </div>
                    <span className="text-xs font-bold">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4 flex justify-end items-center gap-4">
              <button type="button" onClick={() => router.back()} className="px-5 py-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors">
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading || !isReady}
                className="px-8 py-2.5 bg-secondary text-secondary-foreground rounded-xl font-bold text-xs uppercase tracking-widest hover:opacity-90 shadow-md transition-all flex items-center gap-2 disabled:opacity-50 disabled:grayscale"
              >
                {loading ? <><i className="bi bi-arrow-repeat animate-spin"></i> Procesando...</> : <><i className="bi bi-magic"></i> Generar Contenido</>}
              </button>
            </div>
          </motion.form>
        </div>
      </main>
    </div>
  );
}