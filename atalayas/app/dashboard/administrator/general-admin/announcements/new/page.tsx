'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/ui/Sidebar";
import PageHeader from "@/components/ui/pageHeader";
import { API_ROUTES } from "@/lib/utils";

export default function NewGlobalAnnouncementPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  
  // Estado para validaciones
  const [errors, setErrors] = useState<{ title?: string; content?: string }>({});

  const [formData, setFormData] = useState({ 
    title: "", 
    content: "", 
    imageFile: null as File | null ,
    sendEmail: false,

  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      setFormData({ ...formData, imageFile: file });
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validaciones locales
    const newErrors: { title?: string; content?: string } = {};
    if (!formData.title.trim()) newErrors.title = "El título es obligatorio";
    if (!formData.content.trim()) newErrors.content = "El contenido es obligatorio";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setLoading(true);
    setLoadingStep("Publicando comunicado global...");

    try {
      const token = localStorage.getItem("token");
      const data = new FormData();
      data.append("title", formData.title);
      data.append("content", formData.content);
      
      data.append("isPublic", "true");
      
      if (formData.imageFile) {
        data.append("image", formData.imageFile);
      }
      data.append("sendEmail", formData.sendEmail ? "1" : "0");


      const res = await fetch(API_ROUTES.ANNOUNCEMENTS.CREATE, {
        method: "POST",
        headers: { 
          Authorization: `Bearer ${token}` 
        },
        body: data,
      });

      if (!res.ok) throw new Error("Error al crear el comunicado global");

      // Redirección a la ruta de general-admin
      router.push("/dashboard/administrator/general-admin/announcements");
    } catch (err) {
      console.error(err);
      alert("Error en el proceso de creación del servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-background font-sans">
      
      <main className="flex-1 overflow-auto flex flex-col">
        <PageHeader 
          title="Nuevo Comunicado Público"
          description="Crea un anuncio de alto impacto visible para todas las organizaciones."
          icon={<i className="bi bi-megaphone-fill"></i>}
          backUrl={`/dashboard/administrator/general-admin/announcements`}
        />

        <div className="p-6 lg:p-10 max-w-5xl mx-auto w-full">
          <form 
            onSubmit={handleSubmit} 
            className="bg-card p-8 lg:p-12 rounded-[2.5rem] border border-border shadow-sm space-y-8"
          >
            
            {/* Título */}
            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">
                  Título del Anuncio
                </label>
                {errors.title && (
                  <span className="text-[10px] font-bold text-destructive uppercase tracking-tight">
                    {errors.title}
                  </span>
                )}
              </div>
              <input 
                type="text" 
                value={formData.title} 
                onChange={(e) => {
                  setFormData({...formData, title: e.target.value});
                  if (errors.title) setErrors({...errors, title: undefined});
                }} 
                className={`w-full px-6 py-4 rounded-2xl bg-background border ${errors.title ? 'border-destructive' : 'border-input'} focus:border-primary focus:ring-1 focus:ring-primary outline-none font-bold transition-all`} 
                placeholder="Ej: Mantenimiento global de servidores" 
              />
            </div>

            {/* Contenido */}
            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">
                  Cuerpo del Mensaje
                </label>
                {errors.content && (
                  <span className="text-[10px] font-bold text-destructive uppercase tracking-tight">
                    {errors.content}
                  </span>
                )}
              </div>
              <textarea 
                rows={6}
                value={formData.content} 
                onChange={(e) => {
                  setFormData({...formData, content: e.target.value});
                  if (errors.content) setErrors({...errors, content: undefined});
                }} 
                className={`w-full px-6 py-4 rounded-2xl bg-background border ${errors.content ? 'border-destructive' : 'border-input'} focus:border-primary focus:ring-1 focus:ring-primary outline-none font-medium transition-all resize-none`} 
                placeholder="Describe los detalles del anuncio aquí..." 
              />
            </div>

            {/* Subida de Imagen con Preview */}
            <div className="space-y-4">
              <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                Imagen de portada (Opcional)
              </label>
              <label className="relative h-64 w-full border-2 border-dashed border-border rounded-[2rem] flex items-center justify-center bg-muted/30 hover:border-primary transition-all cursor-pointer group overflow-hidden">
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleImageChange} 
                  className="hidden" 
                />
                
                {previewUrl ? (
                  <div className="relative w-full h-full">
                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-white font-bold text-sm">Cambiar imagen</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center group-hover:scale-105 transition-transform">
                      <i className="bi bi-cloud-arrow-up text-4xl text-muted-foreground mb-3"></i>
                      <p className="font-bold text-foreground">Seleccionar imagen</p>
                      <p className="text-xs text-muted-foreground mt-1 text-center">Formatos sugeridos: JPG, PNG o WebP</p>
                  </div>
                )}
              </label>

              <div className="md:col-span-2 p-6 rounded-3xl bg-primary/5 border border-primary/20 flex items-center gap-4 group transition-all hover:bg-primary/10">
  <div className="relative flex items-center cursor-pointer">
    <input 
      type="checkbox" 
      id="sendEmail"
      checked={formData.sendEmail}
      onChange={(e) => setFormData({...formData, sendEmail: e.target.checked})}
      className="peer h-6 w-6 cursor-pointer appearance-none rounded-md border border-primary/50 transition-all checked:border-primary checked:bg-primary"
    />
    <i className="bi bi-check text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 peer-checked:opacity-100 pointer-events-none"></i>
  </div>
  
  <label htmlFor="sendEmail" className="cursor-pointer select-none">
    <p className="text-sm font-black text-primary uppercase tracking-tighter">Notificar por email</p>
    <p className="text-[10px] text-primary/60 font-medium">Se enviará un correo de aviso sobre el anuncio a todos los usuarios.</p>
  </label>
</div>
            </div>

            <button 
              type="submit" 
              disabled={loading} 
              className="w-full py-5 bg-primary text-primary-foreground rounded-2xl font-black text-lg hover:opacity-90 disabled:opacity-50 shadow-xl shadow-primary/20 transition-all uppercase tracking-tight"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-3">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {loadingStep}
                </span>
              ) : "Publicar comunicado"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}