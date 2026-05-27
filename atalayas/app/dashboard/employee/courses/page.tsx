"use client";

import { useEffect, useState, Suspense } from "react";
import Sidebar from "@/components/ui/Sidebar";
import PageHeader from "@/components/ui/pageHeader";
import { API_ROUTES } from "@/lib/utils";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams } from "next/navigation";

// 1. A ESTA FUNCIÓN LE CAMBIAMOS EL NOMBRE A "EmployeeCoursesContent"
function EmployeeCoursesContent() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados de filtrado
  const [visibilityTab, setVisibilityTab] = useState<"TODOS" | "PÚBLICO" | "PRIVADO">("TODOS");
  const [categoryTab, setCategoryTab] = useState<"TODOS" | "BASICO" | "ESPECIALIZADO">("TODOS");

  const searchParams = useSearchParams();
  const fromTaskId = searchParams.get("fromTask");

  // Función downloadCertificate
  const downloadCertificate = async (courseId: string) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_ROUTES.ENROLLMENTS.BASE}/certificate/${courseId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "certificado.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await fetch(API_ROUTES.ENROLLMENTS.BASE, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        const data = await res.json();
        const rawCourses = Array.isArray(data) ? data : data.courses || [];
        const sortedDataCourses = [...rawCourses].sort((a: any, b: any) =>
          (a.title || "").trim().localeCompare((b.title || "").trim(), undefined, { numeric: true })
        );
        setCourses(sortedDataCourses);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  // Lógica de filtrado combinada
  const filtered = courses.filter((c) => {
    // 1. Filtro de Visibilidad
    if (visibilityTab === "PÚBLICO" && !c.isPublic) return false;
    if (visibilityTab === "PRIVADO" && c.isPublic) return false;

    // 2. Filtro de Categoría (solo aplica si estamos en Privados o Todos)
    if (visibilityTab !== "PÚBLICO") {
      if (categoryTab === "BASICO") return c.category?.toUpperCase() !== "ESPECIALIZADO";
      if (categoryTab === "ESPECIALIZADO") return c.category?.toUpperCase() === "ESPECIALIZADO";
    }

    return true;
  });

  return (
    <div className="flex min-h-screen bg-background font-sans text-foreground">

      <main className="flex-1 overflow-auto flex flex-col relative">
        <PageHeader
          title="Mi Formación"
          description="Explora los programas de capacitación y material especializado para tu crecimiento."
          icon={<i className="bi bi-journal-bookmark-fill"></i>}
        />

        <div className="p-6 lg:p-10 flex-1 space-y-6">

          {/* --- SELECTORES DE FILTRADO --- */}
          <div className="space-y-4">
            {/* Nivel 1: Visibilidad */}
            <div className="flex items-center gap-4">
              <div className="flex gap-1 bg-card border border-border p-1 rounded-xl shadow-sm">
                {["TODOS", "PRIVADO", "PÚBLICO"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => {
                      setVisibilityTab(tab as any);
                      if (tab !== "PRIVADO") setCategoryTab("TODOS");
                    }}
                    className={`relative px-5 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${visibilityTab === tab ? "text-primary" : "text-muted-foreground hover:text-foreground"
                      }`}
                  >
                    <span className="relative z-10">{tab}</span>
                    {visibilityTab === tab && (
                      <motion.div layoutId="visPill" className="absolute inset-0 bg-primary/10 rounded-lg" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Nivel 2: Categorías (Solo si PRIVADO está activo) */}
            <AnimatePresence>
              {visibilityTab === "PRIVADO" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-4 overflow-hidden"
                >
                  <div className="flex gap-1 bg-card/50 border border-border/50 p-1 rounded-xl">
                    {["TODOS", "BASICO", "ESPECIALIZADO"].map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setCategoryTab(tab as any)}
                        className={`relative px-4 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ${categoryTab === tab ? "text-secondary" : "text-muted-foreground hover:text-foreground"
                          }`}
                      >
                        <span className="relative z-10">
                          {tab === "TODOS" ? "Todos" : tab === "BASICO" ? "Onboarding" : "Especialización"}
                        </span>
                        {categoryTab === tab && (
                          <motion.div layoutId="catPill" className="absolute inset-0 bg-secondary/10 rounded-lg" />
                        )}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <hr className="border-border/50" />

          {/* Grid de Cursos */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`${visibilityTab}-${categoryTab}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8"
            >
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-100 bg-card rounded-[2.5rem] border border-border animate-pulse shadow-sm" />
                ))
              ) : filtered.length === 0 ? (
                <div className="col-span-full py-20 text-center bg-card border-2 border-dashed border-border rounded-[2.5rem]">
                  <i className="bi bi-search text-3xl text-muted-foreground mb-4 block"></i>
                  <p className="text-muted-foreground font-bold">No se encontraron cursos con estos filtros</p>
                </div>
              ) : (
                filtered.map((course) => {
                  const isBasico = course.category?.toUpperCase() !== "ESPECIALIZADO";

                  return (
                    <div
                      key={course.id}
                      className="group bg-card rounded-[2.5rem] border border-border shadow-sm hover:shadow-xl hover:border-primary/20 transition-all duration-500 flex flex-col overflow-hidden relative"
                    >
                      {/* Portada */}
                      <div className="relative aspect-16/10 overflow-hidden bg-muted">
                        {course.fileUrl ? (
                          <img
                            src={course.fileUrl}
                            alt={course.title}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                          />
                        ) : (
                          <div className={`w-full h-full flex items-center justify-center text-4xl ${isBasico ? "bg-primary/10 text-primary" : "bg-secondary/10 text-secondary"}`}>
                            <i className={`bi ${isBasico ? "bi-compass" : "bi-rocket-takeoff"}`}></i>
                          </div>
                        )}

                        {/* Tags de estado */}
                        <div className="absolute top-4 left-4 flex gap-2 flex-wrap">
                          <span className={`text-[8px] font-black uppercase px-2 py-1 rounded-md border backdrop-blur-md ${course.isPublic ? "bg-green-500/20 text-green-600 border-green-500/20" : "bg-blue-500/20 text-blue-600 border-blue-500/20"
                            }`}>
                            {course.isPublic ? "Público" : "Privado"}
                          </span>
                          {/* Mostrar el rol requerido si es especialización */}
                          {!isBasico && course.jobRole && (
                            <span className="text-[8px] font-black uppercase px-2 py-1 rounded-md border bg-purple-500/20 text-purple-600 border-purple-500/20 backdrop-blur-md">
                              <i className="bi bi-person-badge mr-1"></i>
                              {course.jobRole}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="p-7 flex-1 flex flex-col">
                        <h3 className="text-base font-black text-foreground leading-tight mb-2 line-clamp-2">
                          {course.title}
                        </h3>

                        {/* Barra de progreso */}
                        <div className="mb-6">
                          <div className="flex justify-between text-[9px] font-black uppercase mb-1">
                            <span className="text-muted-foreground">Progreso</span>
                            <span>{course.progress || 0}%</span>
                          </div>
                          <div className="h-1 bg-muted rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${course.progress || 0}%` }}
                              className={`h-full ${course.progress === 100 ? "bg-green-500" : "bg-primary"}`}
                            />
                          </div>
                        </div>

                        <div className="mt-auto space-y-2">
                          <Link
                            href={`/dashboard/employee/courses/${course.id}`}
                            className="flex items-center justify-center gap-2 w-full py-3 bg-foreground text-background dark:bg-muted dark:text-foreground text-[10px] font-black uppercase tracking-widest rounded-xl transition-all hover:opacity-90 active:scale-[0.98]"
                          >
                            Entrar
                            <i className="bi bi-arrow-right"></i>
                          </Link>
                          {course.progress === 100 && (
                            <button
                              onClick={() => downloadCertificate(course.id)}
                              className="w-full py-3 bg-orange-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all hover:bg-orange-600"
                            >
                              Descargar Diploma
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

// 2. Y AQUÍ ABAJO EXPORTAMOS EL COMPONENTE PRINCIPAL CON EL SUSPENSE
export default function EmployeeCoursesPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <EmployeeCoursesContent />
    </Suspense>
  );
}