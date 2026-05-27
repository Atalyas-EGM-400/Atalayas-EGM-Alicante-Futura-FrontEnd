"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/ui/Sidebar";
import PageHeader from "@/components/ui/pageHeader";
import { API_ROUTES } from "@/lib/utils";

export default function NewEventPage() {
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
      const token = localStorage.getItem("token");
      const user = JSON.parse(localStorage.getItem("user") || "{}");

      const data = new FormData();
      data.append("title", formData.title);
      data.append("description", formData.description);
      data.append("event_date", formData.event_date);
      data.append("location", formData.location);
      data.append("companyId", user.companyId);

      data.append("sendEmail", formData.sendEmail ? "1" : "0");

      // ✅ CORRECCIÓN: Solo añadir si hay un valor, de lo contrario no enviar nada
      if (formData.max_capacity && formData.max_capacity !== "") {
        data.append("max_capacity", formData.max_capacity);
      }

      if (formData.imageFile) data.append("image", formData.imageFile);

      const res = await fetch(API_ROUTES.EVENTS.CREATE, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: data,
      });

      if (!res.ok) {
        const errorData = await res.json();
        console.error("Detalle del error:", errorData);
        throw new Error("Error al crear el evento");
      }

      router.push("/dashboard/administrator/admin/events");
    } catch (err) {
      alert(
        "Error al guardar el evento: " +
          (err instanceof Error ? err.message : "Desconocido"),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background font-sans">
  <main className="flex-1 overflow-y-auto flex flex-col scroll-smooth">
        <PageHeader
          title="Crear Evento"
          description="Configura la fecha, lugar y aforo de la actividad."
          icon={<i className="bi bi-calendar-plus-fill"></i>}
          backUrl={`/dashboard/administrator/admin/events`}
        />

        <div className="p-6 lg:p-10 max-w-5xl mx-auto w-full">
          <form
            onSubmit={handleSubmit}
            className="bg-card p-8 rounded-[2.5rem] border shadow-sm space-y-8"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Título */}
              <div className="md:col-span-2 space-y-2">
                <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                  Título del Evento
                </label>
                <input
                  required
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="w-full px-6 py-4 rounded-2xl bg-background border border-input focus:border-primary outline-none font-bold"
                  placeholder="Ej: Cena de Navidad 2024"
                />
              </div>

              {/* Fecha y Hora */}
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                  Fecha y Hora
                </label>
                <input
                  required
                  type="datetime-local"
                  value={formData.event_date}
                  onChange={(e) =>
                    setFormData({ ...formData, event_date: e.target.value })
                  }
                  className="w-full px-6 py-4 rounded-2xl bg-background border border-input focus:border-primary outline-none font-bold"
                />
              </div>

              {/* Ubicación */}
              <div className="md:col-span-2 space-y-2">
                <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                  Ubicación / Link
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  className="w-full px-6 py-4 rounded-2xl bg-background border border-input focus:border-primary outline-none font-bold"
                  placeholder="Ej: Restaurante El Puerto o Enlace de Zoom"
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
    <p className="text-[10px] text-primary/60 font-medium">Se enviará un correo de aviso sobre el evento a todos los empleados.</p>
  </label>
</div>
            </div>

            <button
              disabled={loading}
              className="w-full py-5 bg-primary text-white rounded-2xl font-black text-lg hover:opacity-90 shadow-xl shadow-primary/20 transition-all uppercase tracking-tight"
            >
              {loading ? "Creando..." : "Publicar Evento"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
