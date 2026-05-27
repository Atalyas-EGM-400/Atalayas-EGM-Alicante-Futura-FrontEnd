'use client';

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import PageHeader from "@/components/ui/pageHeader";
import { API_ROUTES } from "@/lib/utils";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

// Subcomponente reutilizable para animar el cambio numérico de los porcentajes
function AnimatedCounter({ value }: { value: number }) {
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, {
    stiffness: 60,
    damping: 15,
    restDelta: 0.001
  });
  const displayText = useTransform(springValue, (latest) => Math.round(latest));

  useEffect(() => {
    motionValue.set(value);
  }, [value, motionValue]);

  return <motion.span>{displayText}</motion.span>;
}

export default function EmployeeDashboard() {
  const [onboardingData, setOnboardingData] = useState<any[]>([]);
  const [specializationsData, setSpecializationsData] = useState<any[]>([]);
  const [user, setUser] = useState<any>({});
  const [currentDay, setCurrentDay] = useState(1);
  const [loading, setLoading] = useState(true);

  const hasFetchedRef = useRef(false);

  // 1. Cargar datos del usuario locales
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
      setUser(storedUser);

      const dateToCompare = storedUser.firstLoginAt || storedUser.createdAt;
      if (dateToCompare) {
        const referenceDate = new Date(dateToCompare);
        const today = new Date();
        const start = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate());
        const now = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const diffDays = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        setCurrentDay(diffDays > 0 ? diffDays : 1);
      }
    }
  }, []);

  // 2. Fetch de datos usando API_ROUTES con fix para StrictMode
  useEffect(() => {
    const fetchData = async () => {
      if (hasFetchedRef.current) return;
      hasFetchedRef.current = true;

      try {
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };

        const [resOnboarding] = await Promise.all([
          fetch(API_ROUTES.ONBOARDING.EMPLOYEE, { headers, cache: 'no-store' }),
        ]);

        if (!resOnboarding.ok) {
          console.error("Error en onboarding:", resOnboarding.status);
          setLoading(false);
          return;
        }

        const onboardingResponse = await resOnboarding.json();
        
        setOnboardingData(onboardingResponse.general || []);
        setSpecializationsData(onboardingResponse.specializations || []);
      } catch (err) {
        console.error("Error en fetchData:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    return () => {
      hasFetchedRef.current = false;
    };
  }, []);

  // 3. Guardar progreso usando API_ROUTES.ONBOARDING.TOGGLE
  const handleToggleTask = async (taskId: string, currentStatus: boolean) => {
    const newStatus = !currentStatus;

    setOnboardingData(prev => prev.map(step => ({
      ...step,
      onboardingTasks: step.onboardingTasks?.map((task: any) =>
        task.id === taskId ? { ...task, userProgress: [{ done: newStatus }] } : task
      ),
    })));

    setSpecializationsData(prev => prev.map(step => ({
      ...step,
      onboardingTasks: step.onboardingTasks?.map((task: any) =>
        task.id === taskId ? { ...task, userProgress: [{ done: newStatus }] } : task
      ),
    })));

    try {
      const token = localStorage.getItem("token");
      
      const res = await fetch(API_ROUTES.ONBOARDING.TOGGLE, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ taskId, done: newStatus }),
      });

      if (!res.ok) {
        throw new Error("No se pudo guardar el progreso en el servidor");
      }
    } catch (err) {
      console.error("Error salvando tarea:", err);
    }
  };

  const firstName = user?.name?.split(' ')[0] || "Usuario";

  const maxAvailableDay = onboardingData.length > 0
    ? Math.max(...onboardingData.map(s => s.day))
    : 1;
  const displayDay = Math.min(currentDay, maxAvailableDay);

  const visibleSteps = onboardingData.filter((s) => s.day <= displayDay);

  const allOnboardingTasks = onboardingData.flatMap((s) => s.onboardingTasks || []);
  const completedAllOnboardingTasks = allOnboardingTasks.filter((t) => t.userProgress?.[0]?.done === true).length;
  const totalOnboardingTasks = allOnboardingTasks.length;
  const onboardingComplete = totalOnboardingTasks > 0 && completedAllOnboardingTasks === totalOnboardingTasks;

  const allSpecializationTasks = specializationsData.flatMap((s) => s.onboardingTasks || []);
  const completedSpecializationTasks = allSpecializationTasks.filter((t) => t.userProgress?.[0]?.done === true).length;
  const totalSpecializationTasks = allSpecializationTasks.length;
  const specializationProgress = totalSpecializationTasks > 0
    ? Math.round((completedSpecializationTasks / totalSpecializationTasks) * 100)
    : 0;

  const totalAllTasks = totalOnboardingTasks + (onboardingComplete ? totalSpecializationTasks : 0);
  const totalCompletedTasks = completedAllOnboardingTasks + (onboardingComplete ? completedSpecializationTasks : 0);
  const totalProgressPercent = totalAllTasks > 0 ? Math.round((totalCompletedTasks / totalAllTasks) * 100) : 0;

  const TaskItem = ({ task, accentColor = "secondary" }: { task: any; accentColor?: "secondary" | "purple" }) => {
    const done = task.userProgress?.[0]?.done === true;
    const hasLink = !!task.linkAction;
    const isPurple = accentColor === "purple";

    return (
      <div className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${done ? 'bg-muted/30 border-transparent opacity-60' : 'bg-background border-border shadow-sm'} ${!done && isPurple ? 'hover:border-purple-500' : !done ? 'hover:border-secondary' : ''}`}>
        <button
          onClick={() => handleToggleTask(task.id, done)}
          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all shrink-0 ${
            done
              ? isPurple ? 'bg-purple-500 border-purple-500 text-white' : 'bg-secondary border-secondary text-black'
              : isPurple ? 'border-border hover:border-purple-500' : 'border-border hover:border-secondary'
          }`}
        >
          {done && <i className="bi bi-check-lg text-xs font-bold"></i>}
        </button>

        {hasLink && !done ? (
          <Link
            href={task.linkAction}
            className={`flex-1 text-sm font-bold text-foreground hover:underline underline-offset-2 ${isPurple ? 'decoration-purple-500' : 'decoration-secondary'}`}
          >
            {task.label}
          </Link>
        ) : (
          <span className={`flex-1 text-sm font-bold ${done ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
            {task.label}
          </span>
        )}

        {hasLink && !done && (
          <Link
            href={task.linkAction}
            className={`shrink-0 flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg transition-all ${
              isPurple
                ? 'text-purple-600 bg-purple-500/10 hover:bg-purple-500/20'
                : 'text-secondary bg-secondary/10 hover:bg-secondary/20'
            }`}
          >
            Ir <i className="bi bi-arrow-right text-xs"></i>
          </Link>
        )}
      </div>
    );
  };

  return (
    <div className="flex min-h-screen bg-background font-sans">
      <main className="flex-1 overflow-auto flex flex-col relative">
        <PageHeader
          title={`¡Bienvenido, ${firstName}!`}
          description={`Estás en tu día ${displayDay} de incorporación profesional.`}
          icon={<i className="bi bi-rocket-takeoff-fill"></i>}
        />

        <div className="p-6 lg:p-10 flex-1 space-y-10">
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div>
            </div>
          ) : (
            <div className="grid lg:grid-cols-3 gap-10">
              {/* Columna izquierda */}
              <div className="lg:col-span-2 space-y-8">
                {/* Onboarding general */}
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-1 h-8 bg-primary rounded-full"></div>
                    <h2 className="text-sm font-black uppercase tracking-widest text-primary">Plan de Onboarding</h2>
                    <span className="text-[9px] text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">Para todos los empleados</span>
                  </div>

                  {visibleSteps.length > 0 ? (
                    visibleSteps.map((step) => {
                      const isDone = step.onboardingTasks?.every((t: any) => t.userProgress?.[0]?.done === true);
                      return (
                        <div key={step.id} className="bg-card border border-border rounded-[2rem] p-8 shadow-sm mb-6">
                          <div className="flex items-center gap-4 mb-6">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl ${isDone ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary'}`}>
                              <i className={`bi ${isDone ? 'bi-check-circle-fill' : 'bi-map-fill'}`}></i>
                            </div>
                            <div>
                              <div className="text-[10px] font-black text-primary uppercase tracking-widest">{step.badge || `Día ${step.day}`}</div>
                              <h3 className="text-xl font-bold text-foreground">{step.title}</h3>
                            </div>
                          </div>
                          <p className="text-muted-foreground text-sm mb-8 leading-relaxed">{step.description}</p>
                          <div className="grid gap-3">
                            {step.onboardingTasks?.map((task: any) => (
                              <TaskItem key={task.id} task={task} accentColor="secondary" />
                            ))}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-20 bg-muted/20 rounded-[2rem] border border-dashed border-border">
                      <p className="text-muted-foreground font-medium">No hay pasos de onboarding disponibles.</p>
                    </div>
                  )}
                </div>

                {/* Especializaciones: MODIFICADO para renderizarse SOLO cuando se complete el onboarding */}
                {specializationsData.length > 0 && onboardingComplete && (
                  <div className="mt-12 pt-6 border-t-2 border-border/50">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-1 h-8 bg-purple-500 rounded-full"></div>
                      <h2 className="text-sm font-black uppercase tracking-widest text-purple-500">Especializaciones por Rol</h2>
                      <span className="text-[9px] text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">Contenido específico para tu puesto</span>
                    </div>

                    {specializationsData.map((step, index) => {
                      const isDone = step.onboardingTasks?.every((t: any) => t.userProgress?.[0]?.done === true);
                      return (
                        <div key={step.id} className="bg-card border border-purple-500/30 rounded-[2rem] p-8 shadow-sm mb-6">
                          <div className="flex items-center gap-4 mb-6">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl ${isDone ? 'bg-muted text-muted-foreground' : 'bg-purple-500/10 text-purple-500'}`}>
                              <i className={`bi ${isDone ? 'bi-check-circle-fill' : 'bi-star-fill'}`}></i>
                            </div>
                            <div>
                              <div className="text-[10px] font-black text-purple-500 uppercase tracking-widest">Especialización {index + 1}</div>
                              <h3 className="text-xl font-bold text-foreground">{step.title}</h3>
                            </div>
                          </div>
                          <p className="text-muted-foreground text-sm mb-8 leading-relaxed">{step.description}</p>
                          <div className="grid gap-3">
                            {step.onboardingTasks?.map((task: any) => (
                              <TaskItem key={task.id} task={task} accentColor="purple" />
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Columna derecha */}
              <div className="space-y-10">
                <div className="bg-card border border-border rounded-[2rem] p-8 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-[11px] font-black text-muted-foreground uppercase tracking-widest">Progreso General</h4>
                    <i className="bi bi-trophy-fill text-yellow-400 text-xl"></i>
                  </div>

                  <div className="text-center mb-6">
                    <div className="text-6xl font-black text-foreground tracking-tighter mb-2">
                      <AnimatedCounter value={totalProgressPercent} />%
                    </div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Completado total</p>
                  </div>

                  <div className="border-t border-border my-6"></div>

                  <div className="mb-6">
                    <div className="flex justify-between text-[10px] font-bold mb-1">
                      <span>Onboarding</span>
                      <span>
                        <AnimatedCounter value={totalOnboardingTasks > 0 ? Math.round((completedAllOnboardingTasks / totalOnboardingTasks) * 100) : 0} />%
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-secondary transition-all duration-1000" style={{ width: `${totalOnboardingTasks > 0 ? Math.round((completedAllOnboardingTasks / totalOnboardingTasks) * 100) : 0}%` }} />
                    </div>
                    <p className="text-[9px] text-muted-foreground mt-1">{completedAllOnboardingTasks} de {totalOnboardingTasks} tareas</p>
                  </div>

                  {totalSpecializationTasks > 0 && (
                    <div>
                      <div className="flex justify-between text-[10px] font-bold mb-1">
                        <span className={onboardingComplete ? '' : 'text-muted-foreground/50'}>Especializaciones</span>
                        <span className={onboardingComplete ? '' : 'text-muted-foreground/50'}>
                          {onboardingComplete ? (
                            <>
                              <AnimatedCounter value={specializationProgress} />%
                            </>
                          ) : (
                            <i className="bi bi-lock-fill text-[9px]" />
                          )}
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-1000 ${onboardingComplete ? 'bg-purple-500' : 'bg-muted-foreground/20'}`}
                          style={{ width: onboardingComplete ? `${specializationProgress}%` : '0%' }}
                        />
                      </div>
                      <p className="text-[9px] text-muted-foreground mt-1">
                        {onboardingComplete
                          ? `${completedSpecializationTasks} de ${totalSpecializationTasks} tareas`
                          : 'Completa el onboarding para desbloquear'}
                      </p>
                    </div>
                  )}
                </div>

                {/* Soporte */}
                <div className="bg-card rounded-[2rem] p-8 border border-border shadow-sm">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Soporte</p>
                  <h5 className="font-bold text-sm mb-6 leading-snug text-foreground">¿Dudas con tu proceso de entrada?</h5>
                  <button className="w-full bg-primary text-white text-[10px] font-black uppercase tracking-widest py-3.5 rounded-xl hover:opacity-90 transition-all shadow-md shadow-primary/10">
                    Contactar
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}