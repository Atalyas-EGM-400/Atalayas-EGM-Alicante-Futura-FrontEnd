'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/ui/Sidebar';
import PageHeader from '@/components/ui/pageHeader';
import { API_ROUTES } from '@/lib/utils';

export default function GeneralAdminNewCoursePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    isPublic: true, // General admin crea cursos públicos por defecto
    category: 'BASICO',
    imageFile: null as File | null,
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
    if (!formData.title.trim()) return alert('El título es obligatorio');
    if (!formData.imageFile) return alert('Por favor, selecciona una imagen de portada.');

    setLoading(true);
    setLoadingStep('Subiendo curso e imagen...');

    try {
      const token = localStorage.getItem('token');
      const data = new FormData();
      data.append('title', formData.title);
      data.append('category', formData.category);
      data.append('isPublic', String(formData.isPublic));
      data.append('file', formData.imageFile);

      const res = await fetch(API_ROUTES.COURSES.CREATE, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: data,
      });

      if (!res.ok) throw new Error('Error al crear el curso');
      router.push('/dashboard/administrator/general-admin/courses/manage');
    } catch (err) {
      alert('Error en el proceso de creación.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-background font-sans">
      <main className="flex-1 overflow-auto flex flex-col">
        <PageHeader
          title="Nuevo Curso"
          description="Crea contenido formativo global disponible para todas las empresas."
          icon={<i className="bi bi-plus-circle-fill"></i>}
          backUrl="/dashboard/administrator/general-admin/courses/manage"
        />

        <div className="p-6 lg:p-10 max-w-3xl mx-auto w-full">
          <form onSubmit={handleSubmit} className="bg-card p-8 lg:p-10 rounded-[2.5rem] border border-border shadow-sm space-y-8">

            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground ml-1">Nombre del curso</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-6 py-4 rounded-2xl bg-background border border-input focus:border-primary focus:ring-1 focus:ring-primary outline-none font-bold transition-all"
                placeholder="Ej: Prevención de Riesgos"
              />
            </div>

            {/* Categorías */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, category: 'BASICO' })}
                className={`p-4 rounded-2xl border-2 font-bold transition-all ${formData.category === 'BASICO' ? 'border-primary bg-primary/5 text-primary' : 'border-transparent bg-muted/50 text-muted-foreground'}`}
              >
                📖 Onboarding
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, category: 'ESPECIALIZADO' })}
                className={`p-4 rounded-2xl border-2 font-bold transition-all ${formData.category === 'ESPECIALIZADO' ? 'border-primary bg-primary/5 text-primary' : 'border-transparent bg-muted/50 text-muted-foreground'}`}
              >
                🎓 Especialización
              </button>
            </div>

            {/* Imagen */}
            <div className="space-y-4">
              <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground ml-1">Imagen de portada</label>
              <label className="relative h-48 w-full border-2 border-dashed border-border rounded-3xl flex items-center justify-center bg-muted/30 hover:border-primary transition-all cursor-pointer group overflow-hidden">
                <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                {previewUrl ? (
                  <div className="relative w-full h-full">
                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-white font-bold text-sm">Click para cambiar imagen</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center group-hover:scale-105 transition-transform">
                    <i className="bi bi-image text-3xl text-muted-foreground mb-2"></i>
                    <p className="font-bold text-foreground">Seleccionar imagen</p>
                    <p className="text-xs text-muted-foreground">Formatos: JPG, PNG o WebP</p>
                  </div>
                )}
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-primary text-primary-foreground rounded-2xl font-bold text-lg hover:opacity-90 disabled:opacity-50 shadow-lg shadow-primary/20 transition-all"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {loadingStep}
                </span>
              ) : 'Crear Curso'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}