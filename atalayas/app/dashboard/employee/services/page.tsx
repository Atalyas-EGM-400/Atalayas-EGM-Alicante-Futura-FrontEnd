"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import Sidebar from "@/components/ui/Sidebar";
import SearchInput from "@/components/ui/Searchbar"; // TU COMPONENTE ORIGINAL
import PageHeader from "@/components/ui/pageHeader"; 
import { API_ROUTES } from "@/lib/utils";
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from "framer-motion";

function EmployeeServicesContent() {
    const [services, setServices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<"ALL" | "PUBLIC" | "COMPANY">("ALL");
    const [searchQuery, setSearchQuery] = useState("");
    const [currentUser, setCurrentUser] = useState<any>(null);
    const searchParams = useSearchParams();
    const fromTaskId = searchParams.get('fromTask');

    useEffect(() => {
        const fetchServices = async () => {
            try {
                const storedUser = localStorage.getItem("user");
                const token = localStorage.getItem("token");
                if (!storedUser || !token) return;
                const user = JSON.parse(storedUser);
                setCurrentUser(user);

                const res = await fetch(API_ROUTES.SERVICES.GET_ALL, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const data = await res.json();
                setServices(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error("Error fetching services:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchServices();
    }, []);

    useEffect(() => {
        const autoConfirmTask = async () => {
            if (fromTaskId) {
                try {
                    const token = localStorage.getItem("token");
                    await fetch(API_ROUTES.ONBOARDING.TOGGLE, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify({ taskId: fromTaskId, done: true }),
                    });
                } catch (err) {
                    console.error("Error al autocompletar:", err);
                }
            }
        };
        autoConfirmTask();
    }, [fromTaskId]);

    const filtered = services.filter((s) => {
        const matchesSearch = s.title.toLowerCase().includes(searchQuery.toLowerCase());
        if (filter === "PUBLIC") return matchesSearch && s.isPublic;
        if (filter === "COMPANY") return matchesSearch && !s.isPublic;
        return matchesSearch;
    });

    const sortedServices = [...filtered].sort((a, b) => {
        if (a.isPublic && !b.isPublic) return -1;
        if (!a.isPublic && b.isPublic) return 1;
        return a.title.localeCompare(b.title);
    });

    if (!currentUser && !loading) return null;

    return (
        <div className="flex min-h-screen bg-background font-sans text-foreground overflow-hidden">
            <main className="flex-1 h-screen overflow-y-auto flex flex-col relative no-scrollbar">
                <PageHeader 
                    title="Servicios"
                    description="Accede a los recursos y herramientas corporativas disponibles en Atalayas."
                    icon={<i className="bi bi-briefcase-fill"></i>}
                />

                <div className="p-6 lg:p-10 flex-1 space-y-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex gap-1 bg-card border border-border p-1 rounded-2xl shadow-sm w-fit">
                            {["ALL", "PUBLIC", "COMPANY"].map((type) => (
                                <button
                                    key={type}
                                    onClick={() => setFilter(type as any)}
                                    className={`relative px-6 py-2.5 text-xs font-black uppercase tracking-widest rounded-xl transition-all duration-300 ${
                                        filter === type ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    <span className="relative z-10">
                                        {type === "ALL" ? "Todos" : type === "PUBLIC" ? "Públicos" : "Mi Empresa"}
                                    </span>
                                    {filter === type && (
                                        <motion.div 
                                            layoutId="activeFilterPill"
                                            className="absolute inset-0 bg-primary/5 border border-primary/10 rounded-xl"
                                        />
                                    )}
                                </button>
                            ))}
                        </div>

                        <div className="w-full md:w-80">
                            {/* RECUPERADO TU COMPONENTE ORIGINAL */}
                            <SearchInput
                                value={searchQuery}
                                onChange={setSearchQuery}
                                placeholder="Buscar servicios..."
                            />
                        </div>
                    </div>

                    <AnimatePresence mode="wait">
                        <motion.div 
                            key={filter + searchQuery}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 pb-12"
                        >
                            {loading ? (
                                Array.from({ length: 4 }).map((_, i) => (
                                    <div key={i} className="h-64 bg-card rounded-[2rem] border border-border animate-pulse shadow-sm" />
                                ))
                            ) : sortedServices.length === 0 ? (
                                <div className="col-span-full py-24 text-center bg-card border-2 border-dashed border-border rounded-[2rem]">
                                    <p className="text-muted-foreground font-bold text-lg">No se encontraron servicios</p>
                                </div>
                            ) : (
                                sortedServices.map((service) => (
                                    <Link key={service.id} href={`/dashboard/employee/services/${service.id}`} className="group">
                                        <div className="bg-card rounded-[2rem] border border-border shadow-sm hover:shadow-xl hover:border-secondary/40 transition-all duration-500 flex flex-col h-full overflow-hidden relative active:scale-[0.98]">
                                            <div className="relative w-full aspect-video overflow-hidden bg-muted border-b border-border flex items-center justify-center">
                                                {service.mediaUrl ? (
                                                    <img src={service.mediaUrl} alt={service.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                                ) : (
                                                    <i className="bi bi-box-seam text-4xl text-muted-foreground/30"></i>
                                                )}
                                                <div className="absolute top-4 left-4">
                                                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm backdrop-blur-md ${service.isPublic ? "bg-primary/90 text-white" : "bg-secondary/90 text-secondary-foreground"}`}>
                                                        {service.isPublic ? "EGM" : "Privado"}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="p-6 flex flex-col flex-1">
                                                <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-tight mb-6">
                                                    {service.title}
                                                </h3>
                                                <div className="mt-auto pt-5 border-t border-border flex items-center justify-between">
                                                    <span className="text-[10px] font-black uppercase tracking-tighter text-muted-foreground group-hover:text-primary">Detalles</span>
                                                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center group-hover:bg-secondary group-hover:text-secondary-foreground transition-all">
                                                        <i className="bi bi-arrow-right-short text-xl"></i>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                ))
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </main>
        </div>
    );
}

export default function EmployeeServices() {
    return (
        <Suspense fallback={<div className="flex h-screen w-full items-center justify-center bg-background"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>}>
            <EmployeeServicesContent />
        </Suspense>
    );
}