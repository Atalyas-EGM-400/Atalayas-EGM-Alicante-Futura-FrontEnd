'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/ui/Sidebar";
import PageHeader from "@/components/ui/pageHeader";
import { API_ROUTES } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export default function NewAnnouncementPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Estado para validaciones
  const [errors, setErrors] = useState<{ title?: string; content?: string }>({});

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    imageFile: null as File | null,
    sendEmail: false,
  });

  const user =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("user") || "{}")
      : {};

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

    if (!formData.title.trim()) {
      newErrors.title = "El título es obligatorio";
    }

    if (!formData.content.trim()) {
      newErrors.content = "El contenido es obligatorio";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setLoading(true);
    setLoadingStep("Publicando comunicado...");

    try {
      const token = localStorage.getItem("token");

      const data = new FormData();

      data.append("title", formData.title);
      data.append("content", formData.content);
      data.append("companyId", user.companyId);

      if (formData.imageFile) {
        data.append("image", formData.imageFile);
      }
       data.append("sendEmail", formData.sendEmail ? '1' : '0');

      data.append("sendEmail", String(formData.sendEmail));

      const res = await fetch(API_ROUTES.ANNOUNCEMENTS.CREATE, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: data,
      });

      if (!res.ok) {
        throw new Error("Error al crear el comunicado");
      }

      router.push("/dashboard/administrator/admin/announcements");
    } catch (err) {
      console.error(err);
      alert("Error en el proceso de creación del servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-background font-sans text-foreground">
      <main className="flex-1 overflow-auto flex flex-col relative">
        <PageHeader
          title="Nuevo Comunicado"
          description="Crea un anuncio importante para los empleados."
          icon={<i className="bi bi-megaphone-fill"></i>}
          backUrl={`/dashboard/administrator/admin/announcements`}
        />

        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="relative flex-1 flex items-center justify-center"
            >
              {/* Fondo animado */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10"
                animate={{
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />

              {/* Loader principal */}
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.96 }}
                transition={{
                  type: "spring",
                  stiffness: 220,
                  damping: 20,
                }}
                className="relative z-10 bg-card border border-border/50 shadow-2xl rounded-[2.5rem] px-12 py-14 flex flex-col items-center gap-8"
              >
                {/* Spinner */}
                <div className="relative w-24 h-24 flex items-center justify-center">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1.2,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    className="absolute inset-0 rounded-full border-[3px] border-primary/20 border-t-primary"
                  />

                  <motion.div
                    animate={{
                      scale: [1, 1.12, 1],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center"
                  >
                    <i className="bi bi-megaphone-fill text-2xl text-primary"></i>
                  </motion.div>
                </div>

                {/* Texto */}
                <div className="text-center space-y-3">
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-[11px] font-black uppercase tracking-[0.3em] text-primary"
                  >
                    Procesando
                  </motion.p>

                  <motion.h2
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-3xl font-black tracking-tight"
                  >
                    Publicando comunicado
                  </motion.h2>

                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="text-sm text-muted-foreground max-w-sm"
                  >
                    Estamos enviando la información y preparando el anuncio para todos los empleados.
                  </motion.p>
                </div>

                {/* Barra de carga animada */}
                <div className="w-72 h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    initial={{ x: "-100%" }}
                    animate={{ x: "100%" }}
                    transition={{
                      duration: 1.2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    className="h-full w-1/2 bg-primary rounded-full"
                  />
                </div>

                {/* Step */}
                <motion.div
                  animate={{
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 1.4,
                    repeat: Infinity,
                  }}
                  className="text-xs text-muted-foreground font-medium"
                >
                  {loadingStep}
                </motion.div>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              key="content"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="p-6 lg:p-10 max-w-5xl mx-auto w-full"
            >
              <motion.form
                onSubmit={handleSubmit}
                initial={{ opacity: 0, scale: 0.985 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  duration: 0.35,
                  ease: "easeOut",
                }}
                className="bg-card p-8 lg:p-12 rounded-[2.5rem] border border-border shadow-sm space-y-8"
              >
                {/* Header superior */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0 }}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-6"
                >
                  <div className="flex items-center gap-4">
                    <div className="relative w-14 h-14 shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-20"></span>

                      <span className="relative w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                        <i className="bi bi-megaphone-fill text-primary text-xl"></i>
                      </span>
                    </div>

                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.25em] text-primary mb-1">
                        Comunicación interna
                      </p>

                      <h2 className="text-3xl font-black tracking-tight">
                        Crear nuevo comunicado
                      </h2>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 text-[11px] sm:border-l sm:border-border/50 sm:pl-6">
                    <div>
                      <p className="text-muted-foreground uppercase tracking-widest font-medium mb-0.5">
                        Estado
                      </p>

                      <span className="text-emerald-500 font-semibold">
                        Preparado
                      </span>
                    </div>

                    <div>
                      <p className="text-muted-foreground uppercase tracking-widest font-medium mb-0.5">
                        Email
                      </p>

                      <span className="tabular-nums">
                        {formData.sendEmail ? "Activado" : "Desactivado"}
                      </span>
                    </div>
                  </div>
                </motion.div>

                {/* Título */}
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 }}
                  className="space-y-2"
                >
                  <div className="flex justify-between items-center ml-1">
                    <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">
                      Título
                    </label>

                    {errors.title && (
                      <span className="text-[10px] font-bold text-destructive uppercase tracking-tight">
                        {errors.title}
                      </span>
                    )}
                  </div>

                  <motion.input
                    whileFocus={{ scale: 1.01 }}
                    type="text"
                    value={formData.title}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        title: e.target.value,
                      });

                      if (errors.title) {
                        setErrors({
                          ...errors,
                          title: undefined,
                        });
                      }
                    }}
                    className={`w-full px-6 py-4 rounded-2xl bg-background border ${
                      errors.title ? "border-destructive" : "border-input"
                    } focus:border-primary focus:ring-1 focus:ring-primary outline-none font-bold transition-all`}
                    placeholder="Ej: Mantenimiento programado"
                  />
                </motion.div>

                {/* Contenido */}
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="space-y-2"
                >
                  <div className="flex justify-between items-center ml-1">
                    <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">
                      Mensaje
                    </label>

                    {errors.content && (
                      <span className="text-[10px] font-bold text-destructive uppercase tracking-tight">
                        {errors.content}
                      </span>
                    )}
                  </div>

                  <motion.textarea
                    whileFocus={{ scale: 1.01 }}
                    rows={6}
                    value={formData.content}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        content: e.target.value,
                      });

                      if (errors.content) {
                        setErrors({
                          ...errors,
                          content: undefined,
                        });
                      }
                    }}
                    className={`w-full px-6 py-4 rounded-2xl bg-background border ${
                      errors.content ? "border-destructive" : "border-input"
                    } focus:border-primary focus:ring-1 focus:ring-primary outline-none font-medium transition-all resize-none`}
                    placeholder="Escribe el mensaje aquí..."
                  />
                </motion.div>

                {/* Imagen */}
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="space-y-4"
                >
                  <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                    Imagen de portada (Opcional)
                  </label>

                  <motion.label
                    whileHover={{ scale: 1.005 }}
                    className="relative h-64 w-full border-2 border-dashed border-border rounded-[2rem] flex items-center justify-center bg-muted/30 hover:border-primary transition-all cursor-pointer group overflow-hidden"
                  >
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />

                    <AnimatePresence mode="wait">
                      {previewUrl ? (
                        <motion.div
                          key="preview"
                          initial={{ opacity: 0, scale: 1.04 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.25 }}
                          className="relative w-full h-full"
                        >
                          <img
                            src={previewUrl}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />

                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <p className="text-white font-bold text-sm">
                              Cambiar imagen
                            </p>
                          </div>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="empty"
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.25 }}
                          className="text-center group-hover:scale-105 transition-transform"
                        >
                          <motion.i
                            animate={{
                              y: [0, -4, 0],
                            }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              ease: "easeInOut",
                            }}
                            className="bi bi-image text-4xl text-muted-foreground mb-3 block"
                          ></motion.i>

                          <p className="font-bold text-foreground">
                            Seleccionar imagen
                          </p>

                          <p className="text-xs text-muted-foreground mt-1 text-center">
                            Click para subir archivo
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.label>
                </motion.div>

                {/* Checkbox email */}
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  whileHover={{ scale: 1.01 }}
                  className="md:col-span-2 p-6 rounded-3xl bg-primary/5 border border-primary/20 flex items-center gap-4 group transition-all hover:bg-primary/10"
                >
                  <div className="relative flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      id="sendEmail"
                      checked={formData.sendEmail}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          sendEmail: e.target.checked,
                        })
                      }
                      className="peer h-6 w-6 cursor-pointer appearance-none rounded-md border border-primary/50 transition-all checked:border-primary checked:bg-primary"
                    />

                    <i className="bi bi-check text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 peer-checked:opacity-100 pointer-events-none"></i>
                  </div>

                  <label
                    htmlFor="sendEmail"
                    className="cursor-pointer select-none"
                  >
                    <p className="text-sm font-black text-primary uppercase tracking-tighter">
                      Notificar por email
                    </p>

                    <p className="text-[10px] text-primary/60 font-medium">
                      Se enviará un correo de aviso sobre el anuncio a todos los empleados.
                    </p>
                  </label>
                </motion.div>

                {/* Botón */}
                <motion.button
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  whileHover={{
                    scale: 1.015,
                  }}
                  whileTap={{
                    scale: 0.985,
                  }}
                  type="submit"
                  disabled={loading}
                  className="w-full py-5 bg-primary text-primary-foreground rounded-2xl font-black text-lg hover:opacity-90 disabled:opacity-50 shadow-xl shadow-primary/20 transition-all uppercase tracking-tight"
                >
                  Publicar Comunicado
                </motion.button>
              </motion.form>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}