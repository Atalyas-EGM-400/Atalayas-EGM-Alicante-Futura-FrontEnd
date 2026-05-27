'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import PageHeader from '@/components/ui/pageHeader';
import { API_ROUTES } from '@/lib/utils';

interface CompanyData {
  id: string;
  name: string;
  cif: string;
  activity: string;
  address: string;
  description: string;
  contactEmail: string;
  contactPhone: string;
  logoUrl: string;
  website: string;
}

export default function EditCompanyPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<CompanyData>({
    id: '',
    name: '',
    cif: '',
    activity: '',
    address: '',
    description: '',
    contactEmail: '',
    contactPhone: '',
    logoUrl: '',
    website: '',
  });

  const [currentLogoUrl, setCurrentLogoUrl] = useState<string | null>(null);
  const [newFile, setNewFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  useEffect(() => {
    const fetchMyCompany = async () => {
      try {
        const token = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (!storedUser) return;

        const user = JSON.parse(storedUser);
        const companyId = user.companyId ?? user.Company?.id ?? user.company?.id;

        if (!companyId) return;

        const res = await fetch(API_ROUTES.COMPANIES.GET_BY_ID(companyId), {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();

        setFormData({ ...data, id: data.id ?? '' });
        setCurrentLogoUrl(data.logoUrl || null);
      } catch (err) {
        console.error('Error:', err);
      } finally {
        // Un pequeño retraso para asegurar que los estados internos se asienten simultáneamente
        setLoading(false);
      }
    };

    fetchMyCompany();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (file) {
      setNewFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const token = localStorage.getItem('token');
      const dataToSend = new FormData();
      
      dataToSend.append('activity', formData.activity || '');
      dataToSend.append('description', formData.description || '');
      dataToSend.append('contactEmail', formData.contactEmail || '');
      dataToSend.append('contactPhone', formData.contactPhone || '');
      dataToSend.append('address', formData.address || '');
      
      if (newFile) {
        dataToSend.append('logo', newFile);
      }

      const res = await fetch(API_ROUTES.COMPANIES.GET_BY_ID(formData.id), {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: dataToSend,
      });

      if (!res.ok) throw new Error('Error al actualizar la empresa');

      const updated = await res.json();

      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        if (user.company) user.company.logoUrl = updated.logoUrl;
        else if (user.Company) user.Company.logoUrl = updated.logoUrl;
        else user.logoUrl = updated.logoUrl;
        
        localStorage.setItem('user', JSON.stringify(user));
      }

      window.dispatchEvent(new Event('company_logo_updated'));

      if (updated.logoUrl) setCurrentLogoUrl(updated.logoUrl);
      setNewFile(null);
      setLogoPreview(null);
      router.refresh();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-background font-sans text-foreground overflow-hidden">
      <main className="flex-1 overflow-auto flex flex-col relative bg-white/40 dark:bg-transparent backdrop-blur-3xl">
        <PageHeader
          title="Perfil de Empresa"
          description="Actualiza la información pública y de contacto de tu entidad corporativa."
          icon={<i className="bi bi-building"></i>}
        />

        <div className="flex-1 overflow-y-auto no-scrollbar p-6 lg:p-10">
          <AnimatePresence mode="wait">
            {loading ? (
              /* SPINNER SOLICITADO CON ANIMACIÓN SUAVE PARA EVITAR FLICKERING */
              <motion.div
                key="spinner-loader"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex justify-center py-20"
              >
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div>
              </motion.div>
            ) : (
              /* EL CONTENIDO APARECE SUAVEMENTE SOLO CUANDO LOADING ES FALSE */
              <motion.div
                key="form-content"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                className="max-w-4xl mx-auto w-full"
              >
                <form onSubmit={handleSubmit} className="space-y-8">
                  {/* ───────────────── LOGO ───────────────── */}
                  <div className="bg-card border border-border rounded-[2rem] p-8 lg:p-10 shadow-sm hover:shadow-xl transition-all duration-300">
                    <h2 className="text-xl font-bold text-foreground mb-8 tracking-tight">
                      Logo Corporativo
                    </h2>

                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8">
                      {/* PREVIEW */}
                      <div className="relative group shrink-0" title="Haz clic para subir un nuevo logo">
                        <div className="w-40 h-40 rounded-[2rem] overflow-hidden border-4 border-background shadow-xl bg-muted/20">
                          <img
                            src={
                              logoPreview ||
                              (currentLogoUrl
                                ? encodeURI(currentLogoUrl)
                                : 'https://placehold.co/400x400/f5f5f7/86868b?text=LOGO')
                            }
                            alt="Logo empresa"
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                          />

                          <div
                            onClick={() => fileInputRef.current?.click()}
                            className="absolute inset-0 bg-primary/80 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 cursor-pointer backdrop-blur-sm rounded-[2rem]"
                          >
                            <i className="bi bi-cloud-arrow-up-fill text-white text-3xl mb-1"></i>
                            <span className="text-white text-[10px] font-black uppercase tracking-widest">
                              Cambiar
                            </span>
                          </div>
                        </div>

                        <div className="absolute -bottom-2 -right-2 w-9 h-9 bg-secondary rounded-2xl flex items-center justify-center text-white shadow-lg border-4 border-card pointer-events-none">
                          <i className="bi bi-pencil-fill text-xs"></i>
                        </div>
                      </div>

                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/*"
                        className="hidden"
                      />

                      {/* INFO */}
                      <div className="flex flex-col justify-center gap-3 text-center sm:text-left">
                        <p className="text-sm font-bold text-foreground">Branding Corporativo</p>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Sube la imagen que representará a tu empresa en la plataforma.
                          <br />
                          Formato recomendado: <strong>PNG o SVG</strong>, mínimo <strong>512×512 px</strong>.
                        </p>

                        <AnimatePresence>
                          {newFile && (
                            <motion.div
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -8 }}
                              className="flex items-center gap-2 text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2 w-fit"
                            >
                              <i className="bi bi-check-circle-fill"></i>
                              {newFile.name}
                              <button
                                type="button"
                                onClick={() => {
                                  setNewFile(null);
                                  setLogoPreview(null);
                                }}
                                className="ml-1 text-emerald-400 hover:text-red-500 transition-colors"
                              >
                                <i className="bi bi-x-lg"></i>
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="mt-1 w-fit px-5 py-2.5 border border-border rounded-xl text-xs font-bold hover:border-primary hover:text-primary transition-all"
                        >
                          <i className="bi bi-upload mr-2"></i>
                          Seleccionar imagen
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* ───────────────── DATOS IDENTIFICATIVOS ───────────────── */}
                  <div className="bg-card border border-border rounded-[2rem] p-8 lg:p-10 shadow-sm relative overflow-hidden hover:shadow-xl transition-all duration-300">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-[100px] -z-10"></div>
                    <h2 className="text-xl font-bold text-foreground mb-8 tracking-tight">
                      Datos Identificativos
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3 ml-1">
                          Nombre Legal
                        </label>
                        <input
                          type="text"
                          value={formData.name}
                          disabled
                          className="w-full bg-muted/50 border border-transparent rounded-xl px-5 py-3 text-sm font-semibold text-muted-foreground cursor-not-allowed opacity-80"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3 ml-1">
                          CIF
                        </label>
                        <input
                          type="text"
                          value={formData.cif}
                          disabled
                          className="w-full bg-muted/50 border border-transparent rounded-xl px-5 py-3 text-sm font-semibold text-muted-foreground cursor-not-allowed opacity-80"
                        />
                      </div>
                    </div>

                    <div className="mt-8 flex items-start gap-3 bg-primary/5 border border-primary/10 p-4 rounded-2xl">
                      <i className="bi bi-info-circle-fill text-primary mt-0.5"></i>
                      <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                        Para modificar el nombre legal o el CIF contacta con la administración general de EGM Atalayas.
                      </p>
                    </div>
                  </div>

                  {/* ───────────────── ACTIVIDAD ───────────────── */}
                  <div className="bg-card border border-border rounded-[2rem] p-8 lg:p-10 shadow-sm hover:shadow-xl transition-all duration-300">
                    <h2 className="text-xl font-bold text-foreground mb-8 tracking-tight">
                      Detalles de la Actividad
                    </h2>

                    <div className="space-y-6">
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3 ml-1">
                          Sector / Actividad Principal
                        </label>
                        <input
                          type="text"
                          placeholder="Ej: Logística, Construcción, Tecnologías de la Información..."
                          value={formData.activity || ''}
                          onChange={(e) => setFormData({ ...formData, activity: e.target.value })}
                          className="w-full bg-background border border-input rounded-xl px-5 py-3 text-sm font-semibold focus:border-primary outline-none transition-all shadow-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3 ml-1">
                          Descripción de la Empresa
                        </label>
                        <textarea
                          rows={4}
                          value={formData.description || ''}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          placeholder="Breve descripción de los servicios, misión o visión de la empresa..."
                          className="w-full bg-background border border-input rounded-xl px-5 py-4 text-sm font-semibold focus:border-primary outline-none transition-all shadow-sm resize-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* ───────────────── CONTACTO ───────────────── */}
                  <div className="bg-card border border-border rounded-[2rem] p-8 lg:p-10 shadow-sm hover:shadow-xl transition-all duration-300">
                    <h2 className="text-xl font-bold text-foreground mb-8 tracking-tight">
                      Información de Contacto
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3 ml-1">
                          Email Corporativo
                        </label>
                        <div className="relative">
                          <i className="bi bi-envelope absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"></i>
                          <input
                            type="email"
                            value={formData.contactEmail || ''}
                            onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                            className="w-full pl-11 pr-5 py-3 bg-background border border-input rounded-xl text-sm font-semibold focus:border-primary outline-none transition-all shadow-sm"
                            placeholder="contacto@empresa.com"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3 ml-1">
                          Teléfono Principal
                        </label>
                        <div className="relative">
                          <i className="bi bi-telephone absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"></i>
                          <input
                            type="tel"
                            value={formData.contactPhone || ''}
                            onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                            className="w-full pl-11 pr-5 py-3 bg-background border border-input rounded-xl text-sm font-semibold focus:border-primary outline-none transition-all shadow-sm"
                            placeholder="+34 900 000 000"
                          />
                        </div>
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3 ml-1">
                          Dirección Física
                        </label>
                        <div className="relative">
                          <i className="bi bi-geo-alt absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"></i>
                          <input
                            type="text"
                            value={formData.address || ''}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            className="w-full pl-11 pr-5 py-3 bg-background border border-input rounded-xl text-sm font-semibold focus:border-primary outline-none transition-all shadow-sm"
                            placeholder="Calle, Número, Polígono, Ciudad..."
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ───────────────── BOTONES ───────────────── */}
                  <div className="pt-4 flex justify-end items-center gap-4">
                    <button
                      type="button"
                      onClick={() => router.back()}
                      className="px-5 py-2.5 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Cancelar
                    </button>

                    <button
                      type="submit"
                      disabled={saving}
                      className="px-8 py-3 bg-secondary text-secondary-foreground rounded-xl font-bold text-xs uppercase hover:opacity-90 shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                      {saving ? (
                        <>
                          <i className="bi bi-arrow-repeat animate-spin"></i>
                          Guardando...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-floppy"></i>
                          Guardar Cambios
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}