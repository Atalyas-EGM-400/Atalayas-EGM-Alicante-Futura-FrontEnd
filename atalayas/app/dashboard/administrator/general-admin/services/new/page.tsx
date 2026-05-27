'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/ui/Sidebar';
import PageHeader from '@/components/ui/pageHeader';
import { API_ROUTES } from '@/lib/utils';

export default function NewGeneralService() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ title?: string }>({});

  const [formData, setFormData] = useState({
    title: '', description: '', mediaUrl: '', isPublic: true, companyId: '',
    providerName: '', email: '', phone: '', address: '', schedule: '', externalUrl: '', price: '',
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formData.title.trim()) return setErrors({ title: 'El título es obligatorio' });

    setLoading(true);
    try {
      const res = await fetch(API_ROUTES.SERVICES.CREATE, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          Authorization: `Bearer ${localStorage.getItem('token')}` 
        },
        body: JSON.stringify(formData),
      });
      if (res.ok) router.push('/dashboard/administrator/general-admin/services');
    } finally { 
      setLoading(false); 
    }
  };

  const inputClass = "w-full px-5 py-3 bg-background border border-input focus:border-primary focus:ring-4 focus:ring-primary/5 rounded-xl outline-none transition-all text-sm font-medium placeholder:text-muted-foreground/40 shadow-sm";

  return (
    <div className="flex min-h-screen bg-background font-sans text-foreground">

      <main className="flex-1 overflow-auto flex flex-col relative">
        <PageHeader 
          title="Nuevo Servicio Global"
          description="Añade un servicio al catálogo general o a una empresa específica."
          icon={<i className="bi bi-briefcase-fill"></i>}
          backUrl="/dashboard/administrator/general-admin/services"
        />

        <div className="p-6 lg:p-10 max-w-4xl mx-auto w-full">
          <form onSubmit={handleSubmit} className="space-y-8">

            {/* SECCIÓN 1: PRINCIPAL */}
            <section className="bg-card p-6 lg:p-10 rounded-3xl border border-border shadow-sm space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-border/60">
                <div className="w-8 h-8 bg-primary/10 text-primary rounded-lg flex items-center justify-center text-sm"><i className="bi bi-info-circle"></i></div>
                <h3 className="font-bold text-sm uppercase tracking-widest">Información Básica</h3>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Título del Servicio *</label>
                <input
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  className={`${inputClass} text-base font-bold ${errors.title ? 'border-destructive' : ''}`}
                  placeholder="Ej: Ludoteca Infantil"
                />
                {errors.title && <p className="text-[10px] text-destructive font-bold ml-1 uppercase">{errors.title}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Descripción</label>
                <textarea
                  rows={4}
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  className={`${inputClass} resize-none`}
                  placeholder="Detalla en qué consiste el servicio..."
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">URL Imagen de Portada</label>
                <input value={formData.mediaUrl} onChange={e => setFormData({...formData, mediaUrl: e.target.value})} className={inputClass} placeholder="https://..." />
              </div>
            </section>

            {/* SECCIÓN 2: CONTACTO Y ENLACES */}
            <section className="bg-card p-6 lg:p-10 rounded-3xl border border-border shadow-sm space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-border/60">
                <div className="w-8 h-8 bg-secondary/10 text-secondary rounded-lg flex items-center justify-center text-sm"><i className="bi bi-telephone"></i></div>
                <h3 className="font-bold text-sm uppercase tracking-widest">Datos de Contacto y Enlaces</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Proveedor</label>
                  <input value={formData.providerName} onChange={e => setFormData({...formData, providerName: e.target.value})} className={inputClass} placeholder="Nombre de la empresa" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Teléfono</label>
                  <input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className={inputClass} placeholder="600 000 000" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Email</label>
                  <input value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className={inputClass} placeholder="contacto@ejemplo.com" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Horario</label>
                  <input value={formData.schedule} onChange={e => setFormData({...formData, schedule: e.target.value})} className={inputClass} placeholder="Lun-Vie 9:00 a 18:00" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Enlace Externo (Web/Reserva)</label>
                  <input value={formData.externalUrl} onChange={e => setFormData({...formData, externalUrl: e.target.value})} className={inputClass} placeholder="https://reserva-tu-cita.com" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Precio o Tarifa</label>
                  <input value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className={inputClass} placeholder="Ej: 20€ / sesión o Gratis" />
                </div>
              </div>
            </section>

            <div className="pt-4 flex justify-end items-center gap-4">
              <button type="button" onClick={() => router.back()} className="px-5 py-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-all uppercase tracking-widest">Cancelar</button>
              <button type="submit" disabled={loading} className="px-8 py-3 bg-secondary text-secondary-foreground rounded-xl font-bold text-xs uppercase tracking-widest hover:opacity-90 shadow-lg shadow-secondary/10 transition-all disabled:opacity-50">
                {loading ? 'Publicando...' : 'Publicar Servicio'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}