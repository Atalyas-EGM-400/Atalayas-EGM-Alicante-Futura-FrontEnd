'use client';

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Sidebar from "@/components/ui/Sidebar";
import PageHeader from "@/components/ui/pageHeader";
import { API_ROUTES } from "@/lib/utils";

export default function EditEmployeePage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id;

    // Estados de datos
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        jobRole: "",
        role: "EMPLOYEE",
        companyId: ""
    });

    // Estados de UI
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [error, setError] = useState('');
    const [currentUser, setCurrentUser] = useState<any>(null);

    // Estados para autocompletado de puestos
    const [availableJobRoles, setAvailableJobRoles] = useState<string[]>([]);
    const [filteredJobRoles, setFilteredJobRoles] = useState<string[]>([]);
    const [showJobRoleSuggestions, setShowJobRoleSuggestions] = useState(false);
    const [loadingRoles, setLoadingRoles] = useState(false);
    const jobRoleInputRef = useRef<HTMLInputElement>(null);
    const suggestionsRef = useRef<HTMLDivElement>(null);

    // Cargar roles existentes
    useEffect(() => {
        const fetchJobRoles = async () => {
            setLoadingRoles(true);
            try {
                const token = localStorage.getItem("token");
                if (!token) return;

                const res = await fetch(`${API_ROUTES.USERS.GET_ALL}/roles`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (res.ok) {
                    const data = await res.json();
                    setAvailableJobRoles(Array.isArray(data) ? data : []);
                }
            } catch (err) {
                console.error("Error cargando puestos:", err);
            } finally {
                setLoadingRoles(false);
            }
        };

        fetchJobRoles();
    }, []);

    // Filtrar sugerencias basadas en el texto ingresado
    useEffect(() => {
        if (formData.jobRole.trim() === "") {
            setFilteredJobRoles([]);
            return;
        }

        const filtered = availableJobRoles.filter(role =>
            role.toLowerCase().includes(formData.jobRole.toLowerCase())
        );
        setFilteredJobRoles(filtered);
    }, [formData.jobRole, availableJobRoles]);

    // Cerrar sugerencias al hacer clic fuera
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                suggestionsRef.current &&
                !suggestionsRef.current.contains(event.target as Node) &&
                jobRoleInputRef.current &&
                !jobRoleInputRef.current.contains(event.target as Node)
            ) {
                setShowJobRoleSuggestions(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Carga inicial: Usuario actual y datos del empleado a editar
    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setCurrentUser(JSON.parse(storedUser));
        }

        const fetchEmployee = async () => {
            try {
                const token = localStorage.getItem("token");
                const baseUrl = API_ROUTES.USERS.GET_ALL.replace(/\/$/, "");
                const res = await fetch(`${baseUrl}/${id}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (res.ok) {
                    const data = await res.json();
                    setFormData({
                        name: data.name || "",
                        email: data.email || "",
                        jobRole: data.jobRole || "",
                        role: data.role || "EMPLOYEE",
                        companyId: data.companyId || ""
                    });
                } else {
                    router.push("/dashboard/administrator/employees");
                }
            } catch (err) {
                console.error("Error al cargar:", err);
                setError("No se pudo cargar la información del empleado.");
            } finally {
                setFetching(false);
            }
        };

        if (id) fetchEmployee();
    }, [id, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const token = localStorage.getItem("token");
            const baseUrl = API_ROUTES.USERS.GET_ALL.replace(/\/$/, "");

            const payload: any = {
                name: formData.name.trim(),
                email: formData.email.trim(),
                jobRole: formData.jobRole.trim(),
                role: formData.role,
                companyId: formData.companyId
            };

            const res = await fetch(`${baseUrl}/${id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Error al actualizar");

            router.push("/dashboard/administrator/general-admin/employees");
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!currentUser || fetching) {
        return (
            <div className="flex min-h-screen bg-background items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                    <p className="text-muted-foreground font-bold text-xs uppercase tracking-widest">Cargando perfil...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-background font-sans">

            <main className="flex-1 overflow-auto flex flex-col relative">
                <PageHeader
                    title="Editar Perfil"
                    description={`Modificando la cuenta de ${formData.name || 'empleado'}`}
                    icon={<i className="bi bi-person-gear"></i>}
                    backUrl="/dashboard/administrator/general-admin/employees"
                />

                <div className="p-6 lg:p-10 max-w-3xl mx-auto w-full">
                    <div className="bg-card rounded-[2rem] shadow-sm border border-border p-8 lg:p-10 transition-all">

                        {/* Mensajes de Error */}
                        {error && (
                            <div className="p-4 mb-8 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive font-bold text-xs flex items-center gap-2 animate-in fade-in">
                                <i className="bi bi-exclamation-octagon-fill text-sm"></i> {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-10">

                            {/* Encabezado de Sección */}
                            <div className="flex items-center gap-4 pb-2 border-b border-border/50">
                                <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center text-lg shrink-0 border border-primary/20">
                                    <i className="bi bi-pencil-square"></i>
                                </div>
                                <h3 className="font-bold text-foreground text-base tracking-tight">
                                    Información del colaborador
                                </h3>
                            </div>

                            {/* Formulario en Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">

                                {/* Nombre */}
                                <div className="md:col-span-2 space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80 ml-1">
                                        Nombre Completo
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full bg-background border border-input rounded-xl px-5 py-3 text-sm font-semibold focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all shadow-sm"
                                        placeholder="Ej: Ana Martínez"
                                    />
                                </div>

                                {/* Email - ahora ocupa las 2 columnas (donde estaba la contraseña) */}
                                <div className="md:col-span-2 space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80 ml-1">
                                        Email Corporativo
                                    </label>
                                    <input
                                        type="email"
                                        required
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full bg-background border border-input rounded-xl px-5 py-3 text-sm font-semibold focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all shadow-sm"
                                    />
                                </div>

                                {/* Puesto/JobRole con autocompletado */}
                                <div className="relative space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80 ml-1">
                                        Puesto / Cargo
                                    </label>
                                    <input
                                        ref={jobRoleInputRef}
                                        type="text"
                                        value={formData.jobRole}
                                        onChange={e => {
                                            setFormData({ ...formData, jobRole: e.target.value });
                                            setShowJobRoleSuggestions(true);
                                        }}
                                        onFocus={() => setShowJobRoleSuggestions(true)}
                                        className="w-full bg-background border border-input rounded-xl px-5 py-3 text-sm font-semibold focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all shadow-sm"
                                        placeholder="Ej: Gerente de Ventas"
                                    />

                                    {/* Sugerencias de puestos */}
                                    {showJobRoleSuggestions && filteredJobRoles.length > 0 && (
                                        <div
                                            ref={suggestionsRef}
                                            className="absolute z-10 left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-lg max-h-48 overflow-y-auto"
                                        >
                                            {filteredJobRoles.map((role, index) => (
                                                <button
                                                    key={index}
                                                    type="button"
                                                    onClick={() => {
                                                        setFormData({ ...formData, jobRole: role });
                                                        setShowJobRoleSuggestions(false);
                                                    }}
                                                    className="w-full text-left px-4 py-2 text-sm hover:bg-muted transition-colors first:rounded-t-xl last:rounded-b-xl font-medium"
                                                >
                                                    {role}
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    <p className="text-[9px] text-muted-foreground ml-1">
                                        Puedes seleccionar un puesto existente o escribir uno nuevo
                                    </p>
                                </div>

                                {/* Rol de Sistema */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80 ml-1">
                                        Rol de Acceso
                                    </label>
                                    <select
                                        value={formData.role}
                                        onChange={e => setFormData({ ...formData, role: e.target.value })}
                                        className="w-full bg-background border border-input rounded-xl px-5 py-3 text-sm font-bold focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none cursor-pointer transition-all shadow-sm"
                                    >
                                        <option value="EMPLOYEE">Empleado Estándar</option>
                                        <option value="ADMIN">Administrador de Empresa</option>
                                    </select>
                                </div>
                            </div>

                            {/* ACCIONES DEL FORMULARIO */}
                            <div className="pt-6 border-t border-border flex justify-end items-center gap-4">
                                <button
                                    type="button"
                                    onClick={() => router.back()}
                                    className="px-6 py-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-8 py-3 bg-secondary text-secondary-foreground rounded-xl font-bold text-sm hover:opacity-90 shadow-md shadow-secondary/20 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <><i className="bi bi-arrow-repeat animate-spin"></i> Guardando...</>
                                    ) : (
                                        'Guardar Cambios'
                                    )}
                                </button>
                            </div>

                        </form>
                    </div>
                </div>
            </main>
        </div>
    );
}