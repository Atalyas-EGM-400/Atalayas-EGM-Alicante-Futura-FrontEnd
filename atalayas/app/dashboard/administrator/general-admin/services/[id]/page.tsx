'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Sidebar from '@/components/ui/Sidebar';
import PageHeader from '@/components/ui/pageHeader';
import ContactCard from '@/components/ui/ContactCard';
import { API_ROUTES } from '@/lib/utils';
import mediumZoom from 'medium-zoom';

const inputClass = "w-full px-5 py-3 bg-background border border-input focus:border-primary focus:ring-4 focus:ring-primary/5 rounded-xl outline-none transition-all text-sm font-medium placeholder:text-muted-foreground/50 shadow-sm";

export default function GeneralAdminServiceDetail() {
  const params = useParams();
  const router = useRouter();
  const zoomRef = useRef<HTMLImageElement>(null);

  const [service, setService] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errors, setErrors] = useState<{ title?: string }>({});

  const [formData, setFormData] = useState({
    title: '', description: '', mediaUrl: '',
    providerName: '', phone: '', email: '',
    address: '', schedule: '', externalUrl: '', price: '',
  });

  useEffect(() => {
    const fetchService = async () => {
      if (typeof params.id !== 'string') return;
      try {
        const res = await fetch(API_ROUTES.SERVICES.GET_BY_ID(params.id), {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        const data = await res.json();
        setService(data);
        hydrateForm(data);
      } finally {
        setLoading(false);
      }
    };
    if (params.id) fetchService();
  }, [params.id]);

  const hydrateForm = (svc: any) => {
    setFormData({
      title: svc.title || '', description: svc.description || '', mediaUrl: svc.mediaUrl || '',
      providerName: svc.providerName || '', phone: svc.phone || '', email: svc.email || '',
      address: svc.address || '', schedule: svc.schedule || '',
      externalUrl: svc.externalUrl || '', price: svc.price || '',
    });
  };

  useEffect(() => {
    if (zoomRef.current && service?.mediaUrl && !isEditing) {
      const zoom = mediumZoom(zoomRef.current, { background: 'rgba(0,0,0,0.8)', margin: 24 });
      return () => { zoom.detach(); };
    }
  }, [service?.mediaUrl, isEditing]);

  const handleSave = async () => {
    setErrors({});
    if (!formData.title.trim()) { setErrors({ title: 'El título es obligatorio' }); return; }

    setSaving(true);
    try {
      const res = await fetch(API_ROUTES.SERVICES.GET_BY_ID(params.id as string), {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json', 
          Authorization: `Bearer ${localStorage.getItem('token')}` 
        },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        const updated = await res.json();
        setService(updated);
        setIsEditing(false);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(API_ROUTES.SERVICES.GET_BY_ID(params.id as string), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      if (res.ok) router.push('/dashboard/administrator/general-admin/services');
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  if (loading) return (
    <div className="flex min-h-screen bg-background items-center justify-center font-sans">
      <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!service) return null;

  const canModify = true; 
  const hasContactInfo = !!(service.providerName || service.phone || service.email || service.address || service.externalUrl || service.price);

  return (
    <div className="flex min-h-screen bg-background font-sans text-foreground">

      <main className="flex-1 overflow-auto flex flex-col relative">
        <PageHeader 
          title={isEditing ? "Editando Servicio" : service.title}
          description={isEditing ? "Modifica los detalles del servicio global." : (service.isPublic ? "Servicio oficial Atalayas EGM" : "Servicio privado")}
          icon={<i className={`bi ${isEditing ? 'bi-pencil-square' : 'bi-briefcase-fill'}`}></i>}
          backUrl="/dashboard/administrator/general-admin/services"
          action={
            canModify && (
              <div className="flex items-center gap-3">
                {saveSuccess && <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest animate-pulse">Guardado</span>}
                {!isEditing ? (
                  <>
                    <button onClick={() => setIsEditing(true)}               className="bg-secondary text-secondary-foreground px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-all flex items-center gap-2 shadow-sm">
                      <i className="bi bi-pencil"></i> Editar
                    </button>
                    <button onClick={() => setShowDeleteModal(true)} className="bg-white/10 text-white hover:bg-destructive hover:text-white w-9 h-9 rounded-xl transition-all flex items-center justify-center border border-white/10">
                      <i className="bi bi-trash3"></i>
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={handleSave} disabled={saving} className="bg-secondary text-secondary-foreground px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-all flex items-center gap-2 shadow-sm">
                      {saving ? <i className="bi bi-arrow-repeat animate-spin"></i> : <i className="bi bi-check-lg"></i>} Guardar
                    </button>
                    <button onClick={() => { hydrateForm(service); setIsEditing(false); }} className="text-white/60 hover:text-white text-xs font-bold px-3 transition-colors">Descartar</button>
                  </>
                )}
              </div>
            )
          }
        />

        <div className="p-6 lg:p-10 flex-1">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              
              {/* COLUMNA IZQUIERDA */}
              <div className="lg:col-span-7 space-y-8">
                {isEditing ? (
                  <section className="bg-card border border-border rounded-[2.5rem] p-8 lg:p-12 shadow-sm space-y-8 animate-in fade-in duration-300">
                    <h3 className="text-xl font-bold tracking-tight">Información Principal</h3>
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Título del servicio</label>
                        <input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className={`${inputClass} text-base font-bold ${errors.title ? 'border-destructive' : ''}`} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Descripción</label>
                        <textarea rows={10} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className={`${inputClass} leading-relaxed resize-none`} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">URL Imagen</label>
                        <input value={formData.mediaUrl} onChange={e => setFormData({...formData, mediaUrl: e.target.value})} className={inputClass} placeholder="https://..." />
                      </div>
                    </div>
                  </section>
                ) : (
                  <section className="bg-card border border-border rounded-[2.5rem] p-8 lg:p-12 shadow-sm animate-in fade-in duration-500">
                    <span className="text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-[0.15em] bg-primary/5 text-primary border border-primary/20">
                      {service.isPublic ? '🌐 Público' : '🔒 Privado'}
                    </span>
                    <h2 className="text-3xl font-bold mt-6 mb-8 tracking-tight">{service.title}</h2>
                    <div className="prose prose-slate dark:prose-invert max-w-none">
                      <p className="text-muted-foreground text-lg leading-relaxed whitespace-pre-wrap font-medium opacity-90">
                        {service.description || 'Sin descripción disponible.'}
                      </p>
                    </div>
                    {service.mediaUrl && (
                      <div className="overflow-hidden rounded-[2.5rem] border border-border shadow-sm mt-10">
                        <img ref={zoomRef} src={service.mediaUrl} alt={service.title} className="w-full h-auto cursor-zoom-in" />
                      </div>
                    )}
                  </section>
                )}
              </div>

              {/* COLUMNA DERECHA */}
              <aside className="lg:col-span-5">
                <div className="sticky top-8 space-y-8">
                  {isEditing ? (
                    <section className="bg-card border border-border rounded-[2.5rem] p-8 lg:p-10 shadow-sm space-y-6 animate-in slide-in-from-right-4 duration-300">
                      <h3 className="text-lg font-bold tracking-tight">Contacto y Enlaces</h3>
                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Proveedor</label>
                          <input value={formData.providerName} onChange={e => setFormData({...formData, providerName: e.target.value})} className={inputClass} placeholder="Ej: Nombre Empresa" />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Teléfono</label>
                          <input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className={inputClass} placeholder="600 000 000" />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Email</label>
                          <input value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className={inputClass} placeholder="email@ejemplo.com" />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Horario</label>
                          <input value={formData.schedule} onChange={e => setFormData({...formData, schedule: e.target.value})} className={inputClass} placeholder="Lunes a Viernes..." />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">URL Enlace Externo</label>
                          <input value={formData.externalUrl} onChange={e => setFormData({...formData, externalUrl: e.target.value})} className={inputClass} placeholder="https://..." />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Precio / Tarifa</label>
                          <input value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className={inputClass} placeholder="Ej: 50€" />
                        </div>
                      </div>
                    </section>
                  ) : (
                    hasContactInfo && <ContactCard service={service} />
                  )}
                </div>
              </aside>
            </div>
          </div>
        </div>
      </main>

      {/* MODAL DE ELIMINACIÓN */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setShowDeleteModal(false)}>
          <div className="bg-card rounded-[2rem] p-10 max-w-sm w-full shadow-2xl border border-border text-center animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
            <div className="w-16 h-16 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mx-auto mb-6 text-2xl">
              <i className="bi bi-trash3"></i>
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">¿Eliminar servicio?</h3>
            <p className="text-sm text-muted-foreground mb-8">Esta acción es irreversible y el servicio dejará de estar disponible para todos los usuarios.</p>
            <div className="flex flex-col gap-3">
              <button onClick={handleDelete} disabled={deleting} className="w-full py-3.5 rounded-xl font-bold bg-destructive text-white hover:opacity-90 shadow-lg text-sm transition-all">
                {deleting ? 'Borrando...' : 'Confirmar Eliminación'}
              </button>
              <button onClick={() => setShowDeleteModal(false)} className="w-full py-3.5 rounded-xl font-bold text-muted-foreground hover:bg-muted transition-colors text-sm">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}