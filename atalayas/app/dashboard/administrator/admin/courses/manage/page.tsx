"use client";

import { useEffect, useState } from "react";
import PageHeader from "@/components/ui/pageHeader";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { API_ROUTES } from "@/lib/utils";

export default function ManageCourses() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [filter, setFilter] = useState<"Todos" | "Onboarding" | "Especialización">("Todos");
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [availableRoles, setAvailableRoles] = useState<string[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [showRoleFilter, setShowRoleFilter] = useState(false);

  const [courseToDelete, setCourseToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [courseToEdit, setCourseToEdit] = useState<any | null>(null);
  const [updating, setUpdating] = useState(false);

  const [availableRolesForEdit, setAvailableRolesForEdit] = useState<string[]>([]);
  const [loadingRolesForEdit, setLoadingRolesForEdit] = useState(false);

  useEffect(() => {
    fetchCourses();
    fetchAvailableRoles();
  }, []);

  const fetchCourses = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(API_ROUTES.COURSES.GET_ALL, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setCourses(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableRoles = async () => {
    setLoadingRoles(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await fetch(`${API_ROUTES.USERS.GET_ALL}/roles`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setAvailableRoles(Array.isArray(data) ? data : []);
        setAvailableRolesForEdit(Array.isArray(data) ? data : []);
      } else {
        // Cambiamos console.error por console.warn para evitar el Error Overlay de Next.js
        console.warn("Aviso cargando roles:", res.status);
        setAvailableRoles(["Técnico", "Ventas", "Administrativo", "Gerente", "Operaciones"]);
        setAvailableRolesForEdit(["Técnico", "Ventas", "Administrativo", "Gerente", "Operaciones"]);
      }
    } catch (err) {
      // Cambiamos console.error por console.warn
      console.warn("Aviso cargando roles:", err);
      setAvailableRoles(["Técnico", "Ventas", "Administrativo", "Gerente", "Operaciones"]);
      setAvailableRolesForEdit(["Técnico", "Ventas", "Administrativo", "Gerente", "Operaciones"]);
    } finally {
      setLoadingRoles(false);
    }
  };

  const confirmDelete = async () => {
    if (!courseToDelete) return;
    setDeleting(true);
    try {
      const token = localStorage.getItem("token");
      await fetch(`${API_ROUTES.COURSES.GET_ALL}/${courseToDelete}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setCourses(courses.filter((c) => c.id !== courseToDelete));
      setCourseToDelete(null);
    } finally {
      setDeleting(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (courseToEdit.category === "ESPECIALIZADO" && !courseToEdit.requiredRole) {
      alert("Para cursos de especialización, debes seleccionar un rol requerido");
      return;
    }

    setUpdating(true);

    try {
      const token = localStorage.getItem("token");
      const payload: any = {
        title: courseToEdit.title,
        category: courseToEdit.category,
      };

      if (courseToEdit.category === "ESPECIALIZADO") {
        payload.jobRole = courseToEdit.requiredRole;
      } else {
        payload.jobRole = null;
      }

      if (courseToEdit.newImageFile) {
        const formData = new FormData();
        formData.append("title", courseToEdit.title);
        formData.append("category", courseToEdit.category);
        if (courseToEdit.category === "ESPECIALIZADO") {
          formData.append("jobRole", courseToEdit.requiredRole);
        }
        formData.append("file", courseToEdit.newImageFile);

        const res = await fetch(API_ROUTES.COURSES.UPDATE(courseToEdit.id), {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`
          },
          body: formData,
        });

        if (res.ok) {
          const result = await res.json();
          setCourses(courses.map(c => c.id === courseToEdit.id ? (result.data || result) : c));
          setCourseToEdit(null);
        } else {
          const errorData = await res.json();
          alert(`Error: ${errorData.message || "No se pudo actualizar"}`);
        }
      } else {
        const res = await fetch(API_ROUTES.COURSES.UPDATE(courseToEdit.id), {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          const result = await res.json();
          setCourses(courses.map(c => c.id === courseToEdit.id ? (result.data || result) : c));
          setCourseToEdit(null);
        } else {
          const errorData = await res.json();
          alert(`Error: ${errorData.message || "No se pudo actualizar"}`);
        }
      }
    } catch (err) {
      console.error("Error en el Patch:", err);
      alert("Error al actualizar el curso");
    } finally {
      setUpdating(false);
    }
  };

  const handleFilterChange = (newFilter: "Todos" | "Onboarding" | "Especialización") => {
    setFilter(newFilter);
    setSelectedRole("");
    setShowRoleFilter(newFilter === "Especialización");
  };

  // --- MODIFICACIÓN DE FILTRADO Y ORDENAMIENTO COMPUESTO ---
  const filteredAndSorted = courses
    .filter((c) => {
      const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase());
      let matchesTab = true;
      if (filter === "Onboarding") matchesTab = c.category?.toUpperCase() !== "ESPECIALIZADO";
      if (filter === "Especialización") {
        matchesTab = c.category?.toUpperCase() === "ESPECIALIZADO";
        if (matchesTab && selectedRole) {
          matchesTab = c.jobRole === selectedRole;
        }
      }
      return matchesSearch && matchesTab;
    })
    .sort((a, b) => {
      // 1. Primer Criterio: Privados primero (false -> 0) antes que Públicos (true -> 1)
      const aPublic = a.isPublic ? 1 : 0;
      const bPublic = b.isPublic ? 1 : 0;
      
      if (aPublic !== bPublic) {
        return aPublic - bPublic;
      }

      // 2. Segundo Criterio (Si tienen la misma privacidad): Básicos (BASICO -> 0) antes que Especializados (ESPECIALIZADO -> 1)
      const aCategory = a.category?.toUpperCase() === "ESPECIALIZADO" ? 1 : 0;
      const bCategory = b.category?.toUpperCase() === "ESPECIALIZADO" ? 1 : 0;
      
      return aCategory - bCategory;
    });

  return (
    <div className="flex min-h-screen bg-background font-sans relative">
      <main className="flex-1 overflow-auto flex flex-col relative">
        <PageHeader
          title="Gestión de Contenido"
          description="Administra los cursos de formación de tu empresa y el contenido global."
          icon={<i className="bi bi-gear-fill"></i>}
          action={
            <div className="grid grid-cols-2 gap-2">
              <Link
                href="/dashboard/administrator/admin/courses"
                className="bg-secondary text-secondary-foreground rounded-xl text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-sm w-9 h-9 sm:w-auto sm:h-auto sm:px-5 sm:py-2"
              >
                <i className="bi bi-eye-fill shrink-0"></i>
                <span className="hidden sm:inline whitespace-nowrap">Vista Empleado</span>
              </Link>

              <Link
                href="/dashboard/administrator/admin/courses/manage/new"
                className="bg-secondary text-secondary-foreground rounded-xl text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-sm w-9 h-9 sm:w-auto sm:h-auto sm:px-5 sm:py-2"
              >
                <i className="bi bi-plus-lg shrink-0"></i>
                <span className="hidden sm:inline whitespace-nowrap">Nuevo Curso</span>
              </Link>
            </div>
          }
        />

        <div className="p-6 lg:p-10 flex-1 max-w-7xl mx-auto w-full">
          <div className="bg-card rounded-3xl border border-border overflow-hidden shadow-sm flex flex-col min-h-[400px]">

            <div className="p-5 border-b border-border flex flex-col lg:flex-row lg:items-center gap-4 bg-muted/10">
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex flex-wrap gap-1 bg-card border border-border p-1 rounded-xl shadow-sm">
                  {(["Todos", "Onboarding", "Especialización"] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => handleFilterChange(tab)}
                      className={`flex-1 lg:flex-none relative px-3 sm:px-5 py-2 text-[11px] font-medium rounded-lg transition-all ${filter === tab ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
                    >
                      <span className="relative z-10">{tab}</span>
                      {filter === tab && (
                        <motion.div layoutId="manageFilterPill" className="absolute inset-0 bg-primary/10 rounded-lg" />
                      )}
                    </button>
                  ))}
                </div>

                <AnimatePresence mode="wait">
                  {showRoleFilter && (
                    <motion.div
                      initial={{ opacity: 0, width: 0, x: -20 }}
                      animate={{ opacity: 1, width: "280px", x: 0 }}
                      exit={{ opacity: 0, width: 0, x: -20 }}
                      transition={{ duration: 0.2 }}
                      className="relative overflow-hidden"
                    >
                      <div className="relative min-w-70">
                        <i className="bi bi-briefcase absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm"></i>
                        <select
                          value={selectedRole}
                          onChange={(e) => setSelectedRole(e.target.value)}
                          className="w-full bg-background border border-input rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:border-primary transition-all font-medium shadow-sm appearance-none cursor-pointer"
                        >
                          <option value="">Todos los roles</option>
                          {availableRoles.map((role) => (
                            <option key={role} value={role}>
                              {role}
                            </option>
                          ))}
                        </select>
                        {selectedRole && (
                          <button
                            onClick={() => setSelectedRole("")}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-destructive transition-colors"
                          >
                            <i className="bi bi-x-circle-fill text-xs"></i>
                          </button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="relative w-full lg:max-w-xs ml-auto">
                <i className="bi bi-search absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm"></i>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar curso por título..."
                  className="w-full bg-background border border-input rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:border-primary transition-all font-medium shadow-sm"
                />
              </div>
            </div>

            {/* Tabla */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-150">
                <thead>
                  <tr className="bg-muted/40 border-b border-border">
                    <th className="px-6 lg:px-8 py-4 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Nombre del Curso</th>
                    <th className="px-6 lg:px-8 py-4 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest text-center">Categoría</th>
                    <th className="px-6 lg:px-8 py-4 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest text-center">Rol Requerido</th>
                    <th className="px-6 lg:px-8 py-4 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {!loading && filteredAndSorted.map((course) => (
                    <tr key={course.id} className="group hover:bg-muted/30 transition-colors">
                      <td className="px-6 lg:px-8 py-4">
                        <Link href={`/dashboard/administrator/admin/courses/${course.id}/manage`} className="flex items-center gap-4 cursor-pointer group/link">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all ${course.isPublic ? "bg-green-500/10 text-green-600 border-green-500/20 group-hover/link:bg-green-600 group-hover/link:text-white" : "bg-primary/5 text-primary border border-primary/10 group-hover/link:bg-primary group-hover/link:text-white"}`}>
                            <i className={`bi ${course.isPublic ? "bi-globe" : "bi-journal-text"} text-lg`}></i>
                          </div>
                          <div className="flex flex-col">
                            <span className="font-semibold text-sm text-foreground group-hover/link:text-primary transition-colors">{course.title}</span>
                            <span className="text-[10px] font-medium text-muted-foreground flex items-center gap-1 mt-0.5">
                              {course.isPublic ? <span className="text-green-600 font-semibold">Público</span> : <span className="text-primary font-semibold">Privado</span>}
                              <span className="mx-1">•</span> Click para ver contenido
                            </span>
                          </div>
                        </Link>
                      </td>
                      <td className="px-6 lg:px-8 py-4 text-center">
                        <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-md ${course.category?.toUpperCase() === "ESPECIALIZADO" ? "bg-secondary/10 text-secondary border border-secondary/20" : "bg-primary/10 text-primary border border-primary/20"}`}>
                          {course.category?.toUpperCase() === "ESPECIALIZADO" ? "Especialización" : "Onboarding"}
                        </span>
                      </td>
                      <td className="px-6 lg:px-8 py-4 text-center">
                        {course.category?.toUpperCase() === "ESPECIALIZADO" && course.jobRole ? (
                          <span className="text-[10px] font-semibold px-2.5 py-1 rounded-md bg-purple-500/10 text-purple-600 border border-purple-500/20">
                            <i className="bi bi-person-badge mr-1"></i>
                            {course.jobRole}
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold px-2.5 py-1 rounded-md bg-muted/50 text-muted-foreground border border-border/50">
                            <i className="bi bi-people mr-1"></i>
                            Todos los roles
                          </span>
                        )}
                      </td>
                      <td className="px-6 lg:px-8 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {!course.isPublic && (
                            <>
                              <button
                                onClick={() => setCourseToEdit({
                                  ...course,
                                  requiredRole: course.jobRole || "",
                                  imageUrl: course.fileUrl || null
                                })}
                                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-all border border-transparent hover:border-primary/20 cursor-pointer"
                                title="Editar curso"
                              >
                                <i className="bi bi-pencil-square text-[15px]"></i>
                              </button>
                              <button
                                onClick={() => setCourseToDelete(course.id)}
                                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all border border-transparent hover:border-destructive/20 cursor-pointer"
                                title="Eliminar curso"
                              >
                                <i className="bi bi-trash3 text-[15px]"></i>
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!loading && filteredAndSorted.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-12 text-center text-muted-foreground">
                        <i className="bi bi-inbox text-3xl mb-3 block opacity-50"></i>
                        <p className="text-sm font-medium">No se encontraron cursos</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* Modal de Edición Rápida */}
      {courseToEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-card w-full max-w-md rounded-[2rem] p-8 shadow-2xl border border-border max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-foreground mb-6">Editar Curso</h3>

            <form onSubmit={handleUpdate} className="space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-semibold uppercase text-muted-foreground tracking-widest mb-2 block">Imagen de portada</label>
                <label className="relative h-32 w-full border-2 border-dashed border-border rounded-2xl flex items-center justify-center bg-muted/30 hover:border-primary transition-all cursor-pointer group overflow-hidden">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setCourseToEdit({
                          ...courseToEdit,
                          newImageFile: file,
                          imageUrl: URL.createObjectURL(file)
                        });
                      }
                    }}
                  />
                  {courseToEdit.imageUrl ? (
                    <img src={courseToEdit.imageUrl} className="w-full h-full object-cover" alt="Preview" />
                  ) : (
                    <div className="text-center">
                      <i className="bi bi-camera text-xl text-muted-foreground"></i>
                      <p className="text-[10px] font-semibold mt-1">Cambiar imagen</p>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <i className="bi bi-pencil text-white text-xl"></i>
                  </div>
                </label>
              </div>

              <div>
                <label className="text-[10px] font-semibold uppercase text-muted-foreground tracking-widest mb-2 block">Título del curso</label>
                <input
                  type="text"
                  value={courseToEdit.title}
                  onChange={(e) => setCourseToEdit({ ...courseToEdit, title: e.target.value })}
                  className="w-full bg-background border border-input rounded-xl px-4 py-3 text-sm outline-none focus:border-primary transition-all"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold uppercase text-muted-foreground tracking-widest mb-2 block">Categoría</label>
                <select
                  value={courseToEdit.category}
                  onChange={(e) => {
                    const newCategory = e.target.value;
                    setCourseToEdit({
                      ...courseToEdit,
                      category: newCategory,
                      requiredRole: newCategory === "BASICO" ? "" : courseToEdit.requiredRole
                    });
                  }}
                  className="w-full bg-background border border-input rounded-xl px-4 py-3 text-sm outline-none focus:border-primary transition-all appearance-none"
                >
                  <option value="BASICO">Onboarding</option>
                  <option value="ESPECIALIZADO">Especialización</option>
                </select>
              </div>

              {courseToEdit.category === "ESPECIALIZADO" && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                  <label className="text-[10px] font-semibold uppercase text-muted-foreground tracking-widest mb-2 block">
                    Rol Requerido
                  </label>
                  <select
                    value={courseToEdit.requiredRole || ""}
                    onChange={(e) => setCourseToEdit({ ...courseToEdit, requiredRole: e.target.value })}
                    className="w-full bg-background border border-input rounded-xl px-4 py-3 text-sm outline-none focus:border-primary transition-all appearance-none cursor-pointer"
                    disabled={loadingRolesForEdit}
                    required
                  >
                    <option value="">Seleccionar rol...</option>
                    {availableRolesForEdit.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-muted-foreground">
                    Solo los empleados con este rol podrán ver y acceder al curso
                  </p>
                </div>
              )}

              <div className="flex flex-col gap-2 pt-4">
                <button
                  type="submit"
                  disabled={updating}
                  className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:opacity-90 transition-all text-sm"
                >
                  {updating ? "Guardando..." : "Guardar cambios"}
                </button>
                <button
                  type="button"
                  onClick={() => setCourseToEdit(null)}
                  className="w-full py-3 bg-card border border-border text-foreground rounded-xl font-semibold hover:bg-muted transition-all text-sm"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Eliminación */}
      {courseToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-card w-full max-w-sm rounded-[2rem] p-8 shadow-2xl text-center border border-border">
            <div className="w-16 h-16 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">
              <i className="bi bi-exclamation-triangle"></i>
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">¿Eliminar curso?</h3>
            <p className="text-muted-foreground text-sm mb-8">Esta acción borrará permanentemente el curso y no se puede deshacer.</p>
            <div className="flex flex-col gap-2">
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="w-full py-3 bg-destructive text-white rounded-xl font-semibold hover:opacity-90 transition-all"
              >
                {deleting ? "Borrando..." : "Sí, eliminar curso"}
              </button>
              <button
                onClick={() => setCourseToDelete(null)}
                className="w-full py-3 bg-card border border-border text-foreground rounded-xl font-semibold hover:bg-muted transition-all"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}