'use client';

import { useState, useEffect, useRef, useCallback, memo, useMemo } from "react";
import PageHeader from "@/components/ui/pageHeader";
import { API_ROUTES } from "@/lib/utils";

// --- Tipos ---
interface Task {
  label: string;
  linkAction: string;
}

interface OnboardingStep {
  day: number;
  title: string;
  description: string;
  tasks: Task[];
  type: "ONBOARDING" | "SPECIALIZATION";
  jobRole?: string;
}

type StepUpdateFields = keyof Pick<OnboardingStep, 'title' | 'description' | 'jobRole' | 'type'>;

// Tipos para cursos y contenido
interface Course {
  id: string;
  title: string;
}

interface CourseContent {
  id: string;
  title: string;
}

const ROUTE_OPTIONS = [
  { label: "Manual (Sin acción)", value: "" },
  { label: "📚 Cursos", value: "COURSES" },       // valor especial, no es una ruta directa
  { label: "Documentos", value: "/dashboard/documents" },
  { label: "Perfil", value: "/dashboard/profile" },
  { label: "Servicios", value: "/dashboard/employee/services" },
];

const DEFAULT_ROLES = ["Técnico", "Ventas", "Administrativo", "Gerente", "Operaciones"];

// ─────────────────────────────────────────────────────────────────
// Componente de selección de link para una tarea
// ─────────────────────────────────────────────────────────────────
function TaskLinkSelector({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [contents, setContents] = useState<CourseContent[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [loadingContents, setLoadingContents] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");

  // Detectar si el valor actual ya es una ruta de curso
  const isCourseRoute = value.startsWith("/dashboard/employee/courses/") || value === "/dashboard/employee/courses";

  // Tipo de selector activo basado en el valor actual
  const getActiveType = () => {
    if (value.startsWith("/dashboard/employee/courses")) return "COURSES";
    if (value === "") return "";
    return value; // otras rutas directas
  };

  const [selectorType, setSelectorType] = useState<string>(getActiveType);

  // Al montar, si hay una ruta de curso, parsear el courseId y contentId
  useEffect(() => {
    if (isCourseRoute) {
      const match = value.match(/\/courses\/([^/]+)/);
      if (match) setSelectedCourseId(match[1]);
    }
  }, []);

  // Cargar cursos cuando se selecciona el tipo COURSES
  useEffect(() => {
    if (selectorType !== "COURSES") return;
    const token = localStorage.getItem("token");
    setLoadingCourses(true);
    fetch(API_ROUTES.COURSES.GET_ALL, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => setCourses(Array.isArray(data) ? data : data.data ?? []))
      .catch(() => setCourses([]))
      .finally(() => setLoadingCourses(false));
  }, [selectorType]);

  // Cargar contenidos cuando se selecciona un curso
  useEffect(() => {
    if (!selectedCourseId) { setContents([]); return; }
    const token = localStorage.getItem("token");
    setLoadingContents(true);
    fetch(API_ROUTES.CONTENT.GET_ALL(selectedCourseId), { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => setContents(Array.isArray(data) ? data : data.data ?? []))
      .catch(() => setContents([]))
      .finally(() => setLoadingContents(false));
  }, [selectedCourseId]);

  const handleTypeChange = (newType: string) => {
    setSelectorType(newType);
    setSelectedCourseId("");
    setContents([]);
    if (newType !== "COURSES") {
      onChange(newType); // ruta directa o vacío
    } else {
      onChange("/dashboard/employee/courses"); // cursos base mientras no se elige uno
    }
  };

  const handleCourseChange = (courseId: string) => {
    setSelectedCourseId(courseId);
    setContents([]);
    if (courseId) {
      onChange(`/dashboard/employee/courses/${courseId}`);
    } else {
      onChange("/dashboard/employee/courses");
    }
  };

  const handleContentChange = (contentId: string) => {
    if (contentId) {
      onChange(`/dashboard/employee/courses/${selectedCourseId}/content/${contentId}`);
    } else {
      onChange(`/dashboard/employee/courses/${selectedCourseId}`);
    }
  };

  // Extraer contentId del valor actual
  const currentContentId = (() => {
    const match = value.match(/\/content\/([^/]+)/);
    return match ? match[1] : "";
  })();

  return (
    <div className="flex flex-col gap-2 bg-background p-1.5 rounded-xl border border-border/60 shrink-0 shadow-sm min-w-200px">
      {/* Selector de tipo de acción */}
      <select
        value={selectorType}
        onChange={(e) => handleTypeChange(e.target.value)}
        className="bg-transparent border-none text-[10px] font-black uppercase outline-none px-2 cursor-pointer text-muted-foreground focus:text-foreground"
      >
        {ROUTE_OPTIONS.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>

      {/* Selector de curso (aparece cuando type === COURSES) */}
      {selectorType === "COURSES" && (
        <div className="border-t border-border/40 pt-1.5 px-1 space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
          <span className="text-[9px] font-black uppercase text-purple-500 tracking-widest flex items-center gap-1">
            <i className="bi bi-journal-bookmark-fill"></i> Curso
          </span>
          {loadingCourses ? (
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground px-2 py-1">
              <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              Cargando...
            </div>
          ) : (
            <select
              value={selectedCourseId}
              onChange={(e) => handleCourseChange(e.target.value)}
              className="w-full bg-muted/30 border border-border/50 rounded-lg px-2 py-1.5 text-[10px] font-bold outline-none focus:border-purple-400 transition-all text-foreground"
            >
              <option value="">— Selecciona un curso —</option>
              {courses.map(c => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          )}

          {/* Selector de contenido (aparece cuando hay un curso elegido) */}
          {selectedCourseId && (
            <div className="space-y-1 animate-in fade-in slide-in-from-top-1 duration-200">
              <span className="text-[9px] font-black uppercase text-blue-500 tracking-widest flex items-center gap-1">
                <i className="bi bi-file-earmark-play-fill"></i> Contenido <span className="text-muted-foreground font-normal normal-case">(opcional)</span>
              </span>
              {loadingContents ? (
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground px-2 py-1">
                  <div className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                  Cargando...
                </div>
              ) : (
                <select
                  value={currentContentId}
                  onChange={(e) => handleContentChange(e.target.value)}
                  className="w-full bg-muted/30 border border-border/50 rounded-lg px-2 py-1.5 text-[10px] font-bold outline-none focus:border-blue-400 transition-all text-foreground"
                >
                  <option value="">— Todo el curso —</option>
                  {contents.map(c => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
              )}

              {/* Preview de la ruta generada */}
              <div className="flex items-center gap-1 px-1 pt-0.5">
                <i className="bi bi-link-45deg text-[10px] text-muted-foreground/60"></i>
                <span className="text-[9px] text-muted-foreground/60 truncate font-mono">{value}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Resto del componente (sin cambios salvo donde se usa TaskLinkSelector)
// ─────────────────────────────────────────────────────────────────

export default function OnboardingConfig() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [availableRoles, setAvailableRoles] = useState<string[]>(DEFAULT_ROLES);
  const [steps, setSteps] = useState<OnboardingStep[]>([]);

  const [activeTab, setActiveTab] = useState<"ONBOARDING" | "SPECIALIZATION">("ONBOARDING");
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>("");

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const pendingScrollRef = useRef(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const [onboardingRes, rolesRes] = await Promise.all([
        fetch(API_ROUTES.ONBOARDING.ME, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_ROUTES.USERS.GET_ALL}/roles`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      if (rolesRes.ok) {
        const rolesData = await rolesRes.json();
        if (Array.isArray(rolesData)) {
          setAvailableRoles(rolesData);
          if (rolesData.length > 0) setSelectedRoleFilter(rolesData[0]);
        }
      }

      if (onboardingRes.ok) {
        const data = await onboardingRes.json();
        if (data?.length > 0) {
          const formatted = data.map((s: any) => ({
            day: s.day,
            title: s.title || "",
            description: s.description || "",
            tasks: s.onboardingTasks?.map((t: any) => ({
              label: t.label || "",
              linkAction: t.linkAction || "",
            })) || [{ label: "", linkAction: "" }],
            type: (s.type === 'SPECIALIZATION' ? 'SPECIALIZATION' : 'ONBOARDING') as "ONBOARDING" | "SPECIALIZATION",
            jobRole: s.jobRole || s.job_role || "",
          }));
          setSteps(formatted);
        } else {
          setSteps([{ day: 1, title: "", description: "", tasks: [{ label: "", linkAction: "" }], type: "ONBOARDING" as const }]);
        }
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (!pendingScrollRef.current) return;
    pendingScrollRef.current = false;
    scrollContainerRef.current?.scrollTo({ top: scrollContainerRef.current.scrollHeight, behavior: 'smooth' });
  }, [steps]);

  const addStep = () => {
    const isSpec = activeTab === "SPECIALIZATION";
    const currentGroup = steps.filter(s => s.type === activeTab && (!isSpec || s.jobRole === selectedRoleFilter));
    const newStep: OnboardingStep = {
      day: currentGroup.length + 1,
      title: "",
      description: "",
      tasks: [{ label: "", linkAction: "" }],
      type: activeTab,
      jobRole: isSpec ? selectedRoleFilter : "",
    };
    pendingScrollRef.current = true;
    setSteps(prev => [...prev, newStep]);
  };

  const updateStep = (globalIndex: number, field: StepUpdateFields, value: any) => {
    setSteps(prev => {
      const newSteps = [...prev];
      newSteps[globalIndex] = { ...newSteps[globalIndex], [field]: value };
      return newSteps;
    });
  };

  const removeStep = (globalIndex: number) => {
    setSteps(prev => prev.filter((_, i) => i !== globalIndex));
  };

  const filteredSteps = useMemo(() => {
    if (activeTab === "ONBOARDING") return steps.filter(s => s.type === "ONBOARDING");
    return steps.filter(s => s.type === "SPECIALIZATION" && s.jobRole === selectedRoleFilter);
  }, [steps, activeTab, selectedRoleFilter]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      await fetch(API_ROUTES.ONBOARDING.SETUP, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ steps }),
      });
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (e) {
      alert("Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-background font-sans">
      <main className="flex-1 flex flex-col min-w-0">
        <PageHeader
          title="Configuración de Onboarding"
          description="Gestiona el contenido de bienvenida y especializaciones técnicas."
          icon={<i className="bi bi-rocket-takeoff-fill"></i>}
          action={
            <div className="flex items-center gap-2 sm:gap-4">
              {showSuccess && (
                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest animate-pulse hidden xs:inline">
                  ¡Guardado!
                </span>
              )}
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-secondary text-secondary-foreground rounded-xl text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-sm w-9 h-9 sm:w-auto sm:h-auto sm:px-5 sm:py-2"
              >
                {saving
                  ? <i className="bi bi-arrow-repeat animate-spin text-lg sm:text-base"></i>
                  : <i className="bi bi-cloud-arrow-up-fill text-lg sm:text-base"></i>
                }
                <span className="hidden sm:inline whitespace-nowrap">
                  {saving ? "Guardando..." : "Publicar Cambios"}
                </span>
              </button>
            </div>
          }
        />

        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto">
          <div className="max-w-5xl mx-auto w-full p-4 md:p-8 space-y-8">

            {/* FILTROS */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-muted/30 p-2 rounded-2xl border border-border/50 sticky top-4 z-10 backdrop-blur-md">
              <div className="flex p-1 gap-1 bg-background/50 rounded-xl border border-border shadow-sm">
                <button
                  onClick={() => setActiveTab("ONBOARDING")}
                  className={`flex items-center gap-2 px-6 py-2 rounded-lg text-xs font-black uppercase tracking-tighter transition-all ${activeTab === "ONBOARDING" ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:bg-muted'}`}
                >
                  <i className="bi bi-people-fill"></i> Onboarding General
                </button>
                <button
                  onClick={() => setActiveTab("SPECIALIZATION")}
                  className={`flex items-center gap-2 px-6 py-2 rounded-lg text-xs font-black uppercase tracking-tighter transition-all ${activeTab === "SPECIALIZATION" ? 'bg-purple-600 text-white shadow-md' : 'text-muted-foreground hover:bg-muted'}`}
                >
                  <i className="bi bi-mortarboard-fill"></i> Especializaciones
                </button>
              </div>

              {activeTab === "SPECIALIZATION" && (
                <div className="flex items-center gap-3 px-2">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Puesto:</span>
                  <select
                    value={selectedRoleFilter}
                    onChange={(e) => setSelectedRoleFilter(e.target.value)}
                    className="bg-background border border-purple-500/30 rounded-xl px-4 py-2 text-xs font-bold text-purple-600 outline-none transition-all"
                  >
                    {availableRoles.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              )}
            </div>

            {/* LISTA */}
            <div className="space-y-6">
              {filteredSteps.map((step, fIdx) => {
                const globalIndex = steps.indexOf(step);
                return (
                  <StepCard
                    key={`${step.type}-${step.jobRole}-${fIdx}`}
                    step={step}
                    idx={globalIndex}
                    onUpdate={updateStep}
                    onRemove={removeStep}
                    setSteps={setSteps}
                  />
                );
              })}
            </div>

            {/* BOTÓN AÑADIR */}
            <button
              onClick={addStep}
              className={`w-full py-8 border-2 border-dashed rounded-3xl transition-all flex flex-col items-center gap-1 group ${activeTab === "ONBOARDING" ? 'border-primary/20 text-primary hover:bg-primary/5' : 'border-purple-500/20 text-purple-600 hover:bg-purple-500/5'}`}
            >
              <i className="bi bi-plus-circle-dotted text-2xl group-hover:scale-110 transition-transform"></i>
              <span className="text-xs font-black uppercase tracking-widest">
                Añadir Día {activeTab === "SPECIALIZATION" ? `para ${selectedRoleFilter}` : ""}
              </span>
            </button>

          </div>
        </div>
      </main>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// StepCard — sin cambios salvo sustituir el select inline por TaskLinkSelector
// ─────────────────────────────────────────────────────────────────
const StepCard = memo(({ step, idx, onUpdate, onRemove, setSteps }: any) => {
  const isSpec = step.type === "SPECIALIZATION";

  const updateTask = (tIdx: number, field: string, value: string) => {
    setSteps((prev: OnboardingStep[]) => {
      const newSteps = [...prev];
      const stepToUpdate = { ...newSteps[idx] };
      const newTasks = [...stepToUpdate.tasks];
      newTasks[tIdx] = { ...newTasks[tIdx], [field]: value };
      stepToUpdate.tasks = newTasks;
      newSteps[idx] = stepToUpdate;
      return newSteps;
    });
  };

  const addTask = () => {
    setSteps((prev: OnboardingStep[]) => {
      if (!prev[idx]) return prev;
      const newSteps = [...prev];
      const stepToUpdate = { ...newSteps[idx] };
      stepToUpdate.tasks = [...stepToUpdate.tasks, { label: "", linkAction: "" }];
      newSteps[idx] = stepToUpdate;
      return newSteps;
    });
  };

  const removeTask = (tIdx: number) => {
    setSteps((prev: OnboardingStep[]) => {
      if (!prev[idx] || prev[idx].tasks.length <= 1) return prev;
      const newSteps = [...prev];
      const stepToUpdate = { ...newSteps[idx] };
      stepToUpdate.tasks = stepToUpdate.tasks.filter((_: any, i: number) => i !== tIdx);
      newSteps[idx] = stepToUpdate;
      return newSteps;
    });
  };

  return (
    <div className={`rounded-3xl border bg-card shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 ${isSpec ? 'border-purple-500/20 shadow-purple-500/5' : 'border-border'}`}>

      {/* Cabecera */}
      <div className={`p-4 border-b flex items-center justify-between gap-4 ${isSpec ? 'bg-purple-500/5' : 'bg-muted/20'}`}>
        <div className="flex items-center gap-3 flex-1">
          <div className={`w-12 h-10 rounded-xl flex flex-col items-center justify-center font-black text-white shadow-sm shrink-0 ${isSpec ? 'bg-purple-600' : 'bg-primary'}`}>
            {!isSpec ? <span className="text-[11px]">Día {step.day}</span> : <span className="text-[11px]">Esp</span>}
          </div>
          <input
            value={step.title}
            onChange={(e) => onUpdate(idx, "title", e.target.value)}
            className="w-full bg-background/50 hover:bg-background focus:bg-background border border-border/60 focus:border-primary rounded-xl px-4 py-2 text-sm font-bold shadow-inner outline-none transition-all placeholder:text-muted-foreground/50"
            placeholder="Escribe el título de este paso..."
          />
        </div>
        <button onClick={() => onRemove(idx)} className="p-2 text-muted-foreground hover:text-destructive shrink-0 transition-colors">
          <i className="bi bi-trash3-fill"></i>
        </button>
      </div>

      <div className="p-6 md:p-8 space-y-6">
        {/* Descripción */}
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest flex items-center gap-2">
            <i className="bi bi-text-paragraph"></i> Descripción
          </label>
          <textarea
            value={step.description}
            onChange={(e) => onUpdate(idx, "description", e.target.value)}
            className="w-full bg-muted/30 border border-border/50 rounded-2xl px-5 py-3 text-sm outline-none focus:border-primary transition-all resize-none min-h-20"
            placeholder="¿Qué se hará en este paso?"
          />
        </div>

        {/* Tareas */}
        <div className="space-y-4">
          <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest flex items-center gap-2">
            <i className="bi bi-list-check"></i> Tareas obligatorias
          </label>
          <div className="grid gap-4">
            {step.tasks.map((task: any, tIdx: number) => (
              <div
                key={tIdx}
                className="flex flex-col gap-2 bg-muted/20 p-3 rounded-2xl border border-border/40 group transition-all focus-within:border-primary/40 focus-within:bg-muted/40"
              >
                {/* Fila superior: input + botón borrar */}
                <div className="flex items-center gap-3">
                  <input
                    value={task.label}
                    onChange={(e) => updateTask(tIdx, "label", e.target.value)}
                    className="flex-1 bg-background border border-border/60 focus:border-primary rounded-xl px-4 py-2.5 text-sm font-medium outline-none transition-all placeholder:text-muted-foreground/50"
                    placeholder="¿Qué tarea debe completar el usuario?..."
                  />
                  <button
                    onClick={() => removeTask(tIdx)}
                    className="text-muted-foreground/40 hover:text-destructive p-1 transition-colors shrink-0"
                  >
                    <i className="bi bi-x-circle-fill text-sm"></i>
                  </button>
                </div>

                {/* Selector de link en cascada */}
                <TaskLinkSelector
                  value={task.linkAction}
                  onChange={(v) => updateTask(tIdx, "linkAction", v)}
                />
              </div>
            ))}
          </div>
          <button
            onClick={addTask}
            className="text-[10px] font-black uppercase text-primary flex items-center gap-2 hover:translate-x-1 transition-transform pt-1"
          >
            <i className="bi bi-plus-circle-fill text-xs"></i> Añadir tarea obligatoria
          </button>
        </div>
      </div>
    </div>
  );
});

StepCard.displayName = "StepCard";