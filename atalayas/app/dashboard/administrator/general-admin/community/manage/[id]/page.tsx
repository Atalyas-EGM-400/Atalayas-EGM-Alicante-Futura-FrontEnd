'use client';

import { useState, useEffect, use } from 'react';
import Sidebar from '@/components/ui/Sidebar';
import PageHeader from '@/components/ui/pageHeader';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ManageEcosystemPage(props: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const params = use(props.params);
  const resolvedId = params.id;

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [showCancelModal, setShowCancelModal] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    type: 'UNIVERSIDADES Y CENTROS DE INVESTIGACIÓN',
    website: '',
    logoUrl: '',
    description: ''
  });

  useEffect(() => {
    const fetchEntityData = async () => {
      const mockDatabase = [
        { id: 'eco-1', name: 'UNIVERSIDAD DE ALICANTE', type: 'UNIVERSIDADES Y CENTROS DE INVESTIGACIÓN', logoUrl: 'https://logo.clearbit.com/ua.es', website: 'https://www.ua.es', description: 'Universidad pública con una fuerte vocación de I+D+i.' },
        { id: 'eco-2', name: 'UNIVERSIDAD MIGUEL HERNÁNDEZ', type: 'UNIVERSIDADES Y CENTROS DE INVESTIGACIÓN', logoUrl: 'https://logo.clearbit.com/umh.es', website: 'https://www.umh.es', description: 'Universidad pública con múltiples programas de innovación.' }
      ];

      const foundEntity = mockDatabase.find(e => e.id === resolvedId); 
      if (foundEntity) {
        setFormData({
          name: foundEntity.name,
          type: foundEntity.type,
          website: foundEntity.website,
          logoUrl: foundEntity.logoUrl || '',
          description: foundEntity.description || ''
        });
      }
      setFetching(false);
    };
    fetchEntityData();
  }, [resolvedId]); 

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const tempUrl = URL.createObjectURL(file);
      setFormData(prev => ({ ...prev, logoUrl: tempUrl }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      router.push('/dashboard/administrator/general-admin/community');
    }, 1000);
  };

  if (fetching) return <div className="h-screen flex items-center justify-center bg-background text-foreground animate-pulse font-bold tracking-widest uppercase">Sincronizando...</div>;

  return (
    <div className="flex h-screen overflow-hidden bg-background font-sans text-foreground">
      <Sidebar role="GENERAL_ADMIN" />

      <main className="flex-1 overflow-y-auto flex flex-col relative no-scrollbar">
        
        <PageHeader 
          title="Editar Entidad"
          description={`Gestionando los detalles de: ${formData.name}`}
          icon={<i className="bi bi-pencil-square"></i>}
          backUrl="/dashboard/administrator/general-admin/community"
        />

        <div className="p-6 lg:p-10 flex-1 max-w-200 mx-auto w-full">
          <div className="bg-card border border-border rounded-[2.5rem] p-8 md:p-12 shadow-sm">
            
            <form onSubmit={handleSubmit} className="space-y-8">
              
              <div className="flex flex-col items-center justify-center">
                <div className="w-36 h-36 bg-background rounded-[2rem] border-2 border-dashed border-border shadow-sm flex items-center justify-center overflow-hidden relative group cursor-pointer hover:border-orange-500 transition-colors">
                  <input type="file" accept="image/*" onChange={handleImageChange} className="absolute inset-0 opacity-0 cursor-pointer z-20" />
                  
                  {formData.logoUrl ? (
                    <img src={formData.logoUrl} alt="Logo" className="max-w-full max-h-full object-contain transition-transform group-hover:blur-sm" />
                  ) : (
                    <div className="text-4xl font-black text-muted-foreground uppercase">{formData.name.charAt(0)}</div>
                  )}

                  <div className="absolute inset-0 bg-black/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center text-center p-2 z-10 pointer-events-none">
                    <i className="bi bi-cloud-arrow-up-fill text-white text-3xl mb-1"></i>
                    <span className="text-[9px] font-black uppercase tracking-widest text-white leading-tight">Pincha aquí para<br/>subir nuevo logo</span>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-widest text-muted-foreground mb-2 ml-2">Nombre de la entidad</label>
                  <input type="text" name="name" value={formData.name} onChange={handleChange} required className="w-full bg-muted/30 border border-border rounded-2xl px-6 py-4 text-sm font-bold focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none" />
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase tracking-widest text-muted-foreground mb-2 ml-2">Categoría</label>
                  <select name="type" value={formData.type} onChange={handleChange} className="w-full bg-muted/30 border border-border rounded-2xl px-6 py-4 text-sm font-bold focus:border-orange-500 outline-none appearance-none cursor-pointer">
                    <option value="UNIVERSIDADES Y CENTROS DE INVESTIGACIÓN">Universidades y Centros</option>
                    <option value="PARQUES CIENTÍFICOS">Parques Científicos</option>
                    <option value="INSTITUTOS Y CENTROS TECNOLÓGICOS">Institutos Tecnológicos</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase tracking-widest text-muted-foreground mb-2 ml-2">Página Web</label>
                  <input type="url" name="website" value={formData.website} onChange={handleChange} required className="w-full bg-muted/30 border border-border rounded-2xl px-6 py-4 text-sm font-bold focus:border-orange-500 outline-none" />
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase tracking-widest text-muted-foreground mb-2 ml-2">Descripción</label>
                  <textarea name="description" value={formData.description} onChange={handleChange} rows={3} className="w-full bg-muted/30 border border-border rounded-2xl px-6 py-4 text-sm font-bold focus:border-orange-500 outline-none resize-none" />
                </div>
              </div>

              <div className="pt-8 border-t border-border flex flex-col md:flex-row gap-4 justify-end">
                <button type="button" onClick={() => setShowCancelModal(true)} className="px-8 py-4 rounded-2xl bg-transparent border border-border text-foreground font-bold text-xs uppercase hover:bg-muted transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={loading} className="px-8 py-4 rounded-2xl bg-orange-500 text-white font-bold text-xs uppercase hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/30 min-w-50">
                  {loading ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>

            </form>
          </div>
        </div>
      </main>

      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-card border border-border w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl flex flex-col items-center text-center animate-in zoom-in-95">
            <div className="w-20 h-20 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mb-6 text-4xl">
              <i className="bi bi-exclamation-circle-fill"></i>
            </div>
            <h3 className="text-2xl font-black text-foreground mb-2 tracking-tight">¿Descartar cambios?</h3>
            <p className="text-muted-foreground text-sm font-medium mb-8">Si sales ahora, perderás todo el progreso. ¿Estás seguro?</p>
            <div className="flex w-full gap-4">
              <button onClick={() => setShowCancelModal(false)} className="flex-1 py-4 rounded-2xl bg-muted text-foreground font-bold text-xs uppercase tracking-widest hover:bg-muted/80">Seguir editando</button>
              <button onClick={() => router.push('/dashboard/administrator/general-admin/community')} className="flex-1 py-4 rounded-2xl bg-rose-500 text-white font-bold text-xs uppercase tracking-widest hover:bg-rose-600 shadow-lg shadow-rose-500/30">Sí, descartar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}