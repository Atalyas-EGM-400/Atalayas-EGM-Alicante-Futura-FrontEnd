"use client";

import { Suspense, useEffect, useState } from 'react';
import PageHeader from '@/components/ui/pageHeader';
import { API_ROUTES } from '@/lib/utils';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'next/navigation';

function AdminCoursePageContent() {
    const [courses, setCourses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<any>(null);

    const [visibilityTab, setVisibilityTab] = useState<"Todos" | "Público" | "Privado">("Todos");
    const [categoryTab, setCategoryTab] = useState<"Todos" | "Onboarding" | "Especialización">("Todos");

    const searchParams = useSearchParams();
    const fromTaskId = searchParams.get('fromTask');

    const downloadCertificate = async (courseId: string) => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(
                `${API_ROUTES.ENROLLMENTS.BASE}/certificate/${courseId}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (!res.ok) return;
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'certificado.pdf';
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error:', error);
        }
    };

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setCurrentUser(JSON.parse(storedUser));
        }
    }, []);

    useEffect(() => {
        const fetchCourses = async () => {
            setLoading(true);
            try {
                const token = localStorage.getItem('token');
                const user = JSON.parse(localStorage.getItem('user') || '{}');

                let url = API_ROUTES.ENROLLMENTS.BASE;
                let isAdmin = user.role === 'ADMIN' || user.role === 'GENERAL_ADMIN';

                if (isAdmin) {
                    url = API_ROUTES.COURSES.GET_ALL;
                }

                const res = await fetch(url, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const data = await res.json();

                let rawCourses = [];
                if (isAdmin) {
                    rawCourses = Array.isArray(data) ? data : [];
                } else {
                    rawCourses = Array.isArray(data) ? data : (data.courses || []);
                }

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

    const filtered = courses.filter((c) => {
        if (visibilityTab === "Público" && !c.isPublic) return false;
        if (visibilityTab === "Privado" && c.isPublic) return false;
        if (categoryTab === "Onboarding") return c.category?.toUpperCase() !== "ESPECIALIZADO";
        if (categoryTab === "Especialización") return c.category?.toUpperCase() === "ESPECIALIZADO";
        return true;
    });

    return (
        <div className="flex h-screen bg-background overflow-hidden font-sans text-foreground">
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-background">
                <PageHeader
                    title="Formación"
                    description="Gestión y visualización de todos los cursos disponibles en la plataforma."
                    icon={<i className="bi bi-journal-bookmark-fill"></i>}
                    action={
                        <Link
                            href="/dashboard/administrator/admin/courses/manage"
                            className="bg-secondary text-secondary-foreground px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-all flex items-center gap-2 shadow-sm w-full"
                        >
                            <i className="bi bi-eye-fill text-sm"></i>
                            <span className="hidden sm:inline">Vista de Administrador</span>
                            <span className="sm:hidden">Gestionar</span>
                        </Link>
                    }
                />

                <div className="flex-1 overflow-y-auto p-6 lg:p-10 space-y-6 no-scrollbar">
                    <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                        <div className="flex flex-wrap gap-1 bg-white dark:bg-[#1c1c1e] border border-black/5 dark:border-white/5 p-1.5 rounded-2xl shadow-sm w-full lg:w-auto">
                            {(["Todos", "Privado", "Público"] as const).map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => {
                                        setVisibilityTab(tab);
                                        if (tab !== "Privado") setCategoryTab("Todos");
                                    }}
                                    className={`flex-1 lg:flex-none relative px-4 sm:px-5 py-2.5 text-[11px] font-bold rounded-xl transition-all ${
                                        visibilityTab === tab 
                                            ? "text-foreground" 
                                            : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                                    }`}
                                >
                                    <span className="relative z-10">{tab}</span>
                                    {visibilityTab === tab && (
                                        <motion.div
                                            layoutId="visPillCourses"
                                            className="absolute inset-0 bg-zinc-100 dark:bg-white/10 rounded-xl shadow-sm"
                                        />
                                    )}
                                </button>
                            ))}
                        </div>

                        <AnimatePresence>
                            {visibilityTab === "Privado" && (
                                <motion.div
                                    initial={{ opacity: 0, width: 0 }}
                                    animate={{ opacity: 1, width: "auto" }}
                                    exit={{ opacity: 0, width: 0 }}
                                    className="overflow-hidden"
                                >
                                    {/* FIX: Se ha cambiado flex-wrap por flex-nowrap y se ha añadido w-max para que los botones nunca se apilen en vertical durante la animación */}
                                    <div className="flex flex-nowrap w-max gap-1 bg-white dark:bg-[#1c1c1e] border border-black/5 dark:border-white/5 p-1.5 rounded-2xl shadow-sm">
                                        {(["Todos", "Onboarding", "Especialización"] as const).map((tab) => (
                                            <button
                                                key={tab}
                                                onClick={() => setCategoryTab(tab)}
                                                className={`flex-1 lg:flex-none relative px-3 sm:px-4 py-2 text-[11px] font-bold rounded-xl transition-all ${
                                                    categoryTab === tab 
                                                        ? "text-foreground" 
                                                        : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                                                }`}
                                            >
                                                <span className="relative z-10">{tab}</span>
                                                {categoryTab === tab && (
                                                    <motion.div
                                                        layoutId="catPillCourses"
                                                        className="absolute inset-0 bg-zinc-100 dark:bg-white/10 rounded-xl shadow-sm"
                                                    />
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <hr className="border-border/50" />

                    {loading ? (
                        <div className="flex justify-center py-20">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary" />
                        </div>
                    ) : (
                        // FIX: Quitado el mode="wait" para que la cuadrícula no colapse al cambiar de filtros
                        <AnimatePresence>
                            <motion.div
                                key={`${visibilityTab}-${categoryTab}`}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.25, ease: "easeOut" }}
                                className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8"
                            >
                                {filtered.length === 0 ? (
                                    <div className="col-span-full py-20 text-center bg-card border-2 border-dashed border-border rounded-[2.5rem]">
                                        <i className="bi bi-search text-3xl text-muted-foreground mb-4 block"></i>
                                        <p className="text-muted-foreground font-bold">No se encontraron cursos con estos filtros</p>
                                    </div>
                                ) : (
                                    filtered.map((course, index) => {
                                        const isBasico = course.category?.toUpperCase() !== "ESPECIALIZADO";

                                        return (
                                            <motion.div
                                                key={course.id}
                                                initial={{ opacity: 0, y: 16, scale: 0.98 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                transition={{ duration: 0.35, delay: index * 0.05, ease: "easeOut" }}
                                                whileHover={{ y: -6 }}
                                                className="group bg-white dark:bg-[#1c1c1e] rounded-[2.5rem] border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-2xl transition-all cursor-pointer overflow-hidden relative"
                                            >
                                                <div className="relative h-48 bg-gray-200 dark:bg-neutral-800 flex items-center justify-center overflow-hidden">
                                                    {course.fileUrl ? (
                                                        <img
                                                            src={course.fileUrl}
                                                            alt={course.title}
                                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                                        />
                                                    ) : (
                                                        <div className={`w-full h-full flex items-center justify-center text-4xl ${isBasico ? "bg-primary/10 text-primary" : "bg-secondary/10 text-secondary"}`}>
                                                            <i className={`bi ${isBasico ? "bi-compass" : "bi-rocket-takeoff"}`}></i>
                                                        </div>
                                                    )}

                                                    <div className="absolute top-4 left-4 flex gap-2 flex-wrap pr-4">
                                                        <span className={`text-[9px] font-semibold px-2 py-1 rounded-md border backdrop-blur-md ${
                                                            course.isPublic
                                                                ? "bg-green-500/20 text-green-600 border-green-500/20"
                                                                : "bg-blue-500/20 text-blue-600 border-blue-500/20"
                                                        }`}>
                                                            {course.isPublic ? "Público" : "Privado"}
                                                        </span>

                                                        {!isBasico && course.jobRole && (
                                                            <span className="text-[9px] font-semibold px-2 py-1 rounded-md border bg-purple-500/20 text-purple-600 border-purple-500/20 backdrop-blur-md">
                                                                <i className="bi bi-person-badge mr-1"></i>
                                                                {course.jobRole}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="p-6 space-y-4">
                                                    <div>
                                                        <h4 className="font-black text-xl group-hover:text-primary transition-colors line-clamp-2">
                                                            {course.title}
                                                        </h4>
                                                    </div>

                                                    <div>
                                                        <div className="flex justify-between text-[10px] font-semibold text-muted-foreground mb-1">
                                                            <span>Progreso</span>
                                                            <span>{course.progress || 0}%</span>
                                                        </div>
                                                        <div className="h-1.5 bg-gray-50 dark:bg-white/5 rounded-full overflow-hidden">
                                                            <motion.div
                                                                initial={{ width: 0 }}
                                                                animate={{ width: `${course.progress || 0}%` }}
                                                                transition={{ duration: 0.8, ease: "easeOut" }}
                                                                className={`h-full ${course.progress === 100 ? "bg-green-500" : "bg-primary"}`}
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center justify-between pt-4 border-t border-gray-50 dark:border-white/5">
                                                        <div className="flex flex-col">
                                                            <span className="text-[10px] font-black uppercase text-muted-foreground/50 tracking-widest">
                                                                Estado
                                                            </span>
                                                            <span className="text-sm font-bold text-primary">
                                                                {course.progress === 100 ? "Completado" : "En progreso"}
                                                            </span>
                                                        </div>

                                                        <div className="w-10 h-10 rounded-full bg-gray-50 dark:bg-white/5 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                                                            <i className="bi bi-arrow-right" />
                                                        </div>
                                                    </div>

                                                    <div className="pt-2 space-y-2">
                                                        <Link
                                                            href={`/dashboard/administrator/admin/courses/${course.id}`}
                                                            className="flex items-center justify-center gap-2 w-full py-3 bg-foreground text-background dark:bg-muted dark:text-foreground text-[11px] font-semibold rounded-xl transition-all hover:opacity-90 active:scale-[0.98]"
                                                        >
                                                            Entrar <i className="bi bi-arrow-right"></i>
                                                        </Link>

                                                        {course.progress === 100 && (
                                                            <button
                                                                onClick={() => downloadCertificate(course.id)}
                                                                className="w-full py-3 bg-orange-500 text-white text-[11px] font-semibold rounded-xl transition-all hover:bg-orange-600"
                                                            >
                                                                Descargar Diploma
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        );
                                    })
                                )}
                            </motion.div>
                        </AnimatePresence>
                    )}
                </div>
            </main>
        </div>
    );
}

export default function AdminCoursePage() {
    return (
        <Suspense
            fallback={
                <div className="flex justify-center py-20 h-screen items-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary" />
                </div>
            }
        >
            <AdminCoursePageContent />
        </Suspense>
    );
}