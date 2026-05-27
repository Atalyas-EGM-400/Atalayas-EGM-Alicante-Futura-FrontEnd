'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/ui/Sidebar';
import PageHeader from '@/components/ui/pageHeader';
import { API_ROUTES } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const pageVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut', staggerChildren: 0.08, delayChildren: 0.05 } }
};

const sectionVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.22, ease: 'easeOut' } }
};

const fieldVariants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.18, ease: 'easeOut' } }
};

export default function NewCompanyService() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ title?: string }>({});
  const [formData, setFormData] = useState({
    title: "", description: "", mediaUrl: "", isPublic: false,
    providerName: "", phone: "", email: "", address: "",
    schedule: "", externalUrl: "", price: "",
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formData.title.trim()) return setErrors({ title: "El título es obligatorio" });

    setLoading(true);
    try {
      const res = await fetch(API_ROUTES.SERVICES.CREATE, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ ...formData, isPublic: false }),
      });

      if (res.ok) {
        router.push("/dashboard/administrator/admin/services");
      }
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full px-5 py-3 bg-background border border-input focus:border-primary focus:ring-4 focus:ring-primary/5 rounded-xl outline-none transition-all text-sm font-medium placeholder:text-muted-foreground/40";

  return (
    <motion.div
      className="flex min-h-screen bg-background font-sans text-foreground"
      initial="hidden"
      animate="show"
      variants={pageVariants}
    >
      <main className="flex-1 overflow-auto flex flex-col relative">
        <motion.div variants={sectionVariants}>
          <PageHeader
            title="Nuevo Servicio"
            description="Crea un servicio exclusivo para los empleados de tu empresa."
            icon={<i className="bi bi-plus-circle"></i>}
            backUrl="/dashboard/administrator/admin/services"
          />
        </motion.div>

        <motion.div
          className="p-6 lg:p-10 max-w-4xl mx-auto w-full"
          variants={sectionVariants}
        >
          <motion.form onSubmit={handleSubmit} className="space-y-8">
            <motion.section
              variants={sectionVariants}
              className="bg-card p-6 lg:p-10 rounded-3xl border border-border shadow-sm space-y-6"
            >
              <motion.div
                variants={fieldVariants}
                className="flex items-center gap-3 pb-4 border-b border-border/60"
              >
                <div className="w-8 h-8 bg-primary/10 text-primary rounded-lg flex items-center justify-center text-sm">
                  <i className="bi bi-info-circle"></i>
                </div>
                <h3 className="font-bold text-sm uppercase tracking-widest">Información Básica</h3>
              </motion.div>

              <motion.div variants={fieldVariants} className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Título del Servicio *</label>
                <input
                  value={formData.title}
                  onChange={e => {
                    setFormData({ ...formData, title: e.target.value });
                    if (errors.title) setErrors({});
                  }}
                  className={`${inputClass} text-base font-bold ${errors.title ? 'border-destructive' : ''}`}
                  placeholder="Ej: Servicio de Fisioterapia"
                />
                <AnimatePresence>
                  {errors.title && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className="text-[10px] text-destructive font-bold ml-1 uppercase"
                    >
                      {errors.title}
                    </motion.p>
                  )}
                </AnimatePresence>
              </motion.div>

              <motion.div variants={fieldVariants} className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Descripción</label>
                <textarea
                  rows={4}
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className={`${inputClass} resize-none`}
                  placeholder="Detalla en qué consiste el servicio..."
                />
              </motion.div>

              <motion.div variants={fieldVariants} className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">URL Imagen de Portada</label>
                <input
                  value={formData.mediaUrl}
                  onChange={e => setFormData({ ...formData, mediaUrl: e.target.value })}
                  className={inputClass}
                  placeholder="https://..."
                />
              </motion.div>
            </motion.section>

            <motion.section
              variants={sectionVariants}
              className="bg-card p-6 lg:p-10 rounded-3xl border border-border shadow-sm space-y-6"
            >
              <motion.div
                variants={fieldVariants}
                className="flex items-center gap-3 pb-4 border-b border-border/60"
              >
                <div className="w-8 h-8 bg-secondary/10 text-secondary rounded-lg flex items-center justify-center text-sm">
                  <i className="bi bi-telephone"></i>
                </div>
                <h3 className="font-bold text-sm uppercase tracking-widest">Datos de Contacto y Enlaces</h3>
              </motion.div>

              <motion.div
                variants={sectionVariants}
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
              >
                <motion.div variants={fieldVariants} className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Proveedor</label>
                  <input
                    value={formData.providerName}
                    onChange={e => setFormData({ ...formData, providerName: e.target.value })}
                    className={inputClass}
                    placeholder="Nombre de la empresa"
                  />
                </motion.div>

                <motion.div variants={fieldVariants} className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Teléfono</label>
                  <input
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className={inputClass}
                    placeholder="600 000 000"
                  />
                </motion.div>

                <motion.div variants={fieldVariants} className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Email</label>
                  <input
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className={inputClass}
                    placeholder="contacto@ejemplo.com"
                  />
                </motion.div>

                <motion.div variants={fieldVariants} className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Horario</label>
                  <input
                    value={formData.schedule}
                    onChange={e => setFormData({ ...formData, schedule: e.target.value })}
                    className={inputClass}
                    placeholder="Lun-Vie 9:00 a 18:00"
                  />
                </motion.div>

                <motion.div variants={fieldVariants} className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Enlace Externo (Web/Reserva)</label>
                  <input
                    value={formData.externalUrl}
                    onChange={e => setFormData({ ...formData, externalUrl: e.target.value })}
                    className={inputClass}
                    placeholder="https://reserva-tu-cita.com"
                  />
                </motion.div>

                <motion.div variants={fieldVariants} className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Precio o Tarifa</label>
                  <input
                    value={formData.price}
                    onChange={e => setFormData({ ...formData, price: e.target.value })}
                    className={inputClass}
                    placeholder="Ej: 20€ / sesión o Gratis"
                  />
                </motion.div>
              </motion.div>
            </motion.section>

            <motion.div
              variants={sectionVariants}
              className="pt-4 flex justify-end items-center gap-4"
            >
              <motion.button
                type="button"
                onClick={() => router.back()}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="px-5 py-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors uppercase"
              >
                Cancelar
              </motion.button>

              <motion.button
                type="submit"
                disabled={loading}
                whileHover={!loading ? { y: -2 } : undefined}
                whileTap={!loading ? { scale: 0.98 } : undefined}
                className="px-8 py-3 bg-secondary text-secondary-foreground rounded-xl font-bold text-xs uppercase tracking-widest hover:opacity-90 shadow-lg shadow-secondary/10 transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <motion.span
                      className="inline-flex items-center justify-center"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <i className="bi bi-arrow-repeat"></i>
                    </motion.span>
                    Publicando...
                  </>
                ) : (
                  <>
                    <i className="bi bi-check2-circle"></i>
                    Publicar Servicio
                  </>
                )}
              </motion.button>
            </motion.div>
          </motion.form>
        </motion.div>
      </main>
    </motion.div>
  );
}