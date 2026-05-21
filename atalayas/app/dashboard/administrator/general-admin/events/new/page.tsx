"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/ui/Sidebar';
import PageHeader from '@/components/ui/pageHeader';
import { API_ROUTES } from '@/lib/utils';

export default function GAdminNewPublicEvent() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    event_date: "",
    location: "",
    max_capacity: "",
    imageFile: null as File | null,
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
    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');

      // 1. Usamos FormData para poder enviar el archivo
      const data = new FormData();
      
      // 2. Agregamos los campos de texto
      data.append("title", formData.title);
      data.append("description", formData.description);
      data.append("event_date", formData.event_date);
      data.append("location", formData.location);
      
      // 3. Manejo de tipos específicos
      if (formData.max_capacity) {
        data.append("max_capacity", formData.max_capacity.toString());
      }
      
      // 4. El Booleano (enviado como string para seguridad en multipart)
      data.append("sendEmail", formData.sendEmail ? "true" : "false");
      
      // 5. La Imagen
      if (formData.imageFile) {
        data.append("file", formData.imageFile); // Asegúrate que el backend espere "image"
      }

      // 6. En el caso de General Admin, companyId es null
      // Algunos backends prefieren no recibir la clave si es null, 
      // o recibir la cadena "null"
      data.append("companyId", ""); 

      const res = await fetch(API_ROUTES.EVENTS.CREATE, {
        method: 'POST',
        headers: { 
          // IMPORTANTE: No pongas 'Content-Type', el navegador lo pondrá como 'multipart/form-data'
          Authorization: `Bearer ${token}` 
        },
        body: data
      });

      if (res.ok) {
        router.push('/dashboard/administrator/general-admin/events');
      } else {
        const errorData = await res.json();
        alert(`Error al crear: ${errorData.message || "Error desconocido"}`);
      }
    } catch (err) { 
      console.error("Error en la petición:", err); 
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <div className="flex h-screen bg-[#f5f5f7] dark:bg-[#0d0d0f]">
      
      <main className="flex-1 overflow-y-auto no-scrollbar">
        <PageHeader 
          title="Publicar Evento Público" 
          icon={<i className="bi bi-calendar-event" />}
          description="Creación de eventos abiertos para todo el ecosistema (sin vinculación a empresa)." 
          backUrl="/dashboard/administrator/general-admin/events" 
        />
        
        <div className="p-10 max-w-3xl mx-auto">
          <form 
            onSubmit={handleSubmit} 
            className="bg-white dark:bg-[#1c1c1e] p-10 rounded-[3rem] shadow-xl space-y-8 border border-black/5"
          >            
            <div className="grid grid-cols-2 gap-6">
              {/* Título */}
              <div className="col-span-2">
                <label className="text-[10px] font-black uppercase opacity-40 ml-1 italic">Título del Evento</label>
                <input 
                  type="text" 
                  required 
                  placeholder="Ej. Networking Abierto Alicante Futura"
                  className="w-full p-4 mt-1 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border-none font-bold outline-none focus:ring-2 ring-primary/20 transition-all" 
                  value={formData.title} 
                  onChange={(e) => setFormData({...formData, title: e.target.value})} 
                />
              </div>

              {/* Descripción */}
              <div className="col-span-2">
                <label className="text-[10px] font-black uppercase opacity-40 ml-1 italic">Descripción Detallada</label>
                <textarea 
                  rows={4}
                  placeholder="Describe los objetivos y el público del evento..."
                  className="w-full p-4 mt-1 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border-none font-bold outline-none focus:ring-2 ring-primary/20 transition-all" 
                  value={formData.description} 
                  onChange={(e) => setFormData({...formData, description: e.target.value})} 
                />
              </div>

              {/* Fecha */}
              <div>
                <label className="text-[10px] font-black uppercase opacity-40 ml-1 italic">Fecha y Hora</label>
                <input 
                  type="datetime-local" 
                  required 
                  className="w-full p-4 mt-1 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border-none font-bold outline-none focus:ring-2 ring-primary/20 transition-all" 
                  value={formData.event_date} 
                  onChange={(e) => setFormData({...formData, event_date: e.target.value})} 
                />
              </div>

              {/* Ubicación */}
              <div className="col-span-2">
                <label className="text-[10px] font-black uppercase opacity-40 ml-1 italic">Ubicación / Link</label>
                <input 
                  type="text" 
                  required 
                  placeholder="Lugar físico o URL de la reunión"
                  className="w-full p-4 mt-1 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border-none font-bold outline-none focus:ring-2 ring-primary/20 transition-all" 
                  value={formData.location} 
                  onChange={(e) => setFormData({...formData, location: e.target.value})} 
                />
              </div>

              <div className="md:col-span-2 space-y-4">
                <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                  Imagen del Evento
                </label>

                <div className="flex flex-col items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-input rounded-[2rem] cursor-pointer bg-background hover:bg-zinc-50 dark:hover:bg-white/5 transition-all overflow-hidden relative">
                    {previewUrl ? (
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <i className="bi bi-cloud-arrow-up-fill text-4xl text-muted-foreground mb-2"></i>
                        <p className="text-sm text-muted-foreground font-bold">
                          Haz clic para subir una imagen
                        </p>
                        <p className="text-[10px] text-muted-foreground/60 uppercase tracking-tighter">
                          PNG, JPG o WEBP (MAX. 5MB)
                        </p>
                      </div>
                    )}

                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageChange}
                    />
                  </label>

                  {previewUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        setPreviewUrl(null);
                        setFormData({ ...formData, imageFile: null });
                      }}
                      className="mt-2 text-[10px] font-black uppercase text-red-500 hover:underline"
                    >
                      Eliminar imagen
                    </button>
                  )}
                </div>
              </div>

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
    <p className="text-[10px] text-primary/60 font-medium">Se enviará un correo de aviso sobre el evento a todos los usuarios.</p>
  </label>
</div>
            </div>

            {/* Botón de acción */}
            <div className="pt-6">
              <button 
                type="submit" 
                disabled={loading} 
                className="w-full py-5 bg-primary text-white rounded-[1.5rem] font-black uppercase tracking-[0.2em] shadow-2xl shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:scale-100"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Procesando...
                  </span>
                ) : 'Publicar Ahora'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}