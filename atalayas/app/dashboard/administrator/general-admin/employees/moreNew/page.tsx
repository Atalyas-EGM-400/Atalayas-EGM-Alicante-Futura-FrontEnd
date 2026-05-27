"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/ui/Sidebar";
import PageHeader from "@/components/ui/pageHeader";
import { API_ROUTES } from "@/lib/utils";
import Papa from "papaparse";

export default function BulkCreatePage() {
    const router = useRouter();
    const [employees, setEmployees] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [currentUser, setCurrentUser] = useState<any>(null);

    // Estado para roles disponibles (autocompletado)
    const [availableJobRoles, setAvailableJobRoles] = useState<string[]>([]);
    const [activeSuggestionIndex, setActiveSuggestionIndex] = useState<number | null>(null);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const inputRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});
    const suggestionsRef = useRef<HTMLDivElement | null>(null);

    // Cargar roles existentes
    useEffect(() => {
        const fetchJobRoles = async () => {
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
            }
        };

        fetchJobRoles();
    }, []);

    // Función para generar contraseña aleatoria
    const generateRandomPassword = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let password = '';
        for (let i = 0; i < 10; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return password;
    };

    // Filtrar sugerencias basadas en el texto ingresado
    const filterSuggestions = (inputValue: string) => {
        if (!inputValue.trim()) return [];
        return availableJobRoles.filter(role =>
            role.toLowerCase().includes(inputValue.toLowerCase())
        ).slice(0, 5); // Limitar a 5 sugerencias
    };

    // Manejar cambios en el campo jobRole
    const handleJobRoleChange = (index: number, value: string) => {
        updateEmployee(index, 'jobRole', value);
        setActiveSuggestionIndex(index);
        setSuggestions(filterSuggestions(value));
    };

    // Seleccionar una sugerencia
    const selectSuggestion = (index: number, suggestion: string) => {
        updateEmployee(index, 'jobRole', suggestion);
        setSuggestions([]);
        setActiveSuggestionIndex(null);
    };

    // Cerrar sugerencias al hacer clic fuera
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
                setSuggestions([]);
                setActiveSuggestionIndex(null);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            setCurrentUser(JSON.parse(storedUser));
        }
    }, []);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                const parsedData = results.data.map((row: any) => {
                    const rawRole = (row.rol || row.role || "").trim().toUpperCase();
                    const finalRole = rawRole.includes("ADMIN") ? "ADMIN" : "EMPLOYEE";

                    return {
                        name: row.nombre || row.name || "",
                        email: row.email || row.correo || "",
                        role: finalRole,
                        jobRole: row.puesto || row.trabajo || row.jobRole || "",
                        password: generateRandomPassword(),
                        status: "pendiente",
                        errorMsg: "",
                    };
                });
                setEmployees(parsedData);
                setError("");
            },
            error: (err) => setError("Error al leer el archivo CSV: " + err.message),
        });
    };

    const updateEmployee = (index: number, field: string, value: string) => {
        const updated = [...employees];
        updated[index] = { ...updated[index], [field]: value };
        setEmployees(updated);
    };

    const removeEmployee = (index: number) => {
        setEmployees(employees.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        if (employees.length === 0) return;
        setLoading(true);
        setError("");

        const token = localStorage.getItem("token");
        const updatedEmployees = [...employees];
        let hasCriticalError = false;
        let errorCount = 0;

        for (let i = 0; i < updatedEmployees.length; i++) {
            const emp = updatedEmployees[i];
            if (emp.status === "completado") continue;

            try {
                const payload = {
                    name: emp.name,
                    email: emp.email,
                    password: emp.password,
                    role: emp.role,
                    jobRole: emp.jobRole,
                    companyId: currentUser.companyId,
                };

                const res = await fetch(API_ROUTES.USERS.CREATE, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(payload),
                });

                const data = await res.json().catch(() => ({}));

                if (res.ok) {
                    updatedEmployees[i].status = "completado";
                    updatedEmployees[i].errorMsg = "";
                } else {
                    hasCriticalError = true;
                    errorCount++;
                    updatedEmployees[i].status = "error";
                    updatedEmployees[i].errorMsg = res.status === 409
                        ? "Email duplicado"
                        : (data.message || "Error de validación");
                }
            } catch (err) {
                hasCriticalError = true;
                errorCount++;
                updatedEmployees[i].status = "error";
                updatedEmployees[i].errorMsg = "Error de conexión";
            }
            setEmployees([...updatedEmployees]);
        }

        if (!hasCriticalError) {
            setTimeout(() => router.push("/dashboard/administrator/general-admin/employees"), 1500);
        } else {
            setError(`Se detectaron errores en ${errorCount} registro(s).`);
            setLoading(false);
        }
    };

    if (!currentUser) return null;

    return (
        <div className="flex min-h-screen bg-background font-sans text-foreground">

            <main className="flex-1 overflow-auto flex flex-col relative">
                <PageHeader
                    title="Carga Masiva"
                    description="Sube archivos CSV para registrar múltiples empleados simultáneamente."
                    icon={<i className="bi bi-file-earmark-spreadsheet-fill"></i>}
                    backUrl="/dashboard/administrator/general-admin/employees"
                />

                <div className="p-6 lg:p-10 w-full max-w-350 mx-auto transition-all animate-in fade-in duration-500">

                    {employees.length === 0 ? (
                        <div className="bg-card rounded-[2rem] border-2 border-dashed border-border p-16 text-center flex flex-col items-center justify-center shadow-sm">
                            <div className="w-20 h-20 bg-primary/10 text-primary rounded-3xl flex items-center justify-center mb-6 border border-primary/20">
                                <i className="bi bi-cloud-arrow-up-fill text-4xl"></i>
                            </div>
                            <h2 className="text-2xl font-bold mb-2">Sube tu archivo .csv</h2>
                            <p className="text-muted-foreground max-w-sm mb-4 text-sm font-medium">
                                El archivo debe contener las columnas: <span className="text-foreground font-bold">nombre, email, rol, puesto</span>
                            </p>
                            <p className="text-muted-foreground text-xs mb-10">
                                <i className="bi bi-info-circle"></i> Se generará una contraseña temporal automáticamente.
                            </p>

                            <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" id="csv-upload" />
                            <label
                                htmlFor="csv-upload"
                                className="bg-secondary text-secondary-foreground px-12 py-4 rounded-2xl font-bold cursor-pointer hover:opacity-90 transition-all shadow-lg active:scale-95 flex items-center gap-3"
                            >
                                <i className="bi bi-folder2-open"></i> Seleccionar archivo
                            </label>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="bg-card rounded-[2rem] border border-border shadow-sm overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-muted/50 border-b border-border">
                                                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Nombre</th>
                                                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Email</th>
                                                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Puesto</th>
                                                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center">Rol</th>
                                                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Estado</th>
                                                <th className="px-6 py-5"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border/50">
                                            {employees.map((emp, i) => {
                                                const showSuggestions = activeSuggestionIndex === i && suggestions.length > 0;

                                                return (
                                                    <tr key={i} className={`transition-colors ${emp.status === 'error' ? 'bg-destructive/5' : 'hover:bg-muted/30'}`}>
                                                        <td className="px-4 py-2">
                                                            <input
                                                                className="w-full bg-transparent p-2 text-sm font-bold outline-none focus:text-primary"
                                                                value={emp.name}
                                                                onChange={(e) => updateEmployee(i, 'name', e.target.value)}
                                                            />
                                                        </td>
                                                        <td className="px-4 py-2">
                                                            <input
                                                                className="w-full bg-transparent p-2 text-sm font-bold outline-none focus:text-primary"
                                                                value={emp.email}
                                                                onChange={(e) => updateEmployee(i, 'email', e.target.value)}
                                                            />
                                                        </td>
                                                        <td className="px-4 py-2 relative">
                                                            <div className="relative">
                                                                <input
                                                                    ref={el => { inputRefs.current[i] = el; }}
                                                                    className="w-full bg-transparent p-2 text-sm font-bold outline-none focus:text-primary"
                                                                    value={emp.jobRole}
                                                                    onChange={(e) => handleJobRoleChange(i, e.target.value)}
                                                                    onFocus={() => {
                                                                        setActiveSuggestionIndex(i);
                                                                        setSuggestions(filterSuggestions(emp.jobRole));
                                                                    }}
                                                                    placeholder="Ej. Técnico, Vendedor..."
                                                                />
                                                                {showSuggestions && (
                                                                    <div
                                                                        ref={suggestionsRef}
                                                                        className="absolute z-20 left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-lg max-h-48 overflow-y-auto"
                                                                        style={{ top: '100%' }}
                                                                    >
                                                                        {suggestions.map((suggestion, idx) => (
                                                                            <button
                                                                                key={idx}
                                                                                type="button"
                                                                                onClick={() => selectSuggestion(i, suggestion)}
                                                                                className="w-full text-left px-4 py-2 text-sm hover:bg-muted transition-colors first:rounded-t-xl last:rounded-b-xl font-medium"
                                                                            >
                                                                                {suggestion}
                                                                            </button>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-2 text-center">
                                                            <select
                                                                className="bg-muted px-3 py-1.5 rounded-xl text-[10px] font-black border-none cursor-pointer focus:ring-2 focus:ring-primary/20"
                                                                value={emp.role}
                                                                onChange={(e) => updateEmployee(i, 'role', e.target.value)}
                                                            >
                                                                <option value="EMPLOYEE">EMPLEADO</option>
                                                                <option value="ADMIN">ADMIN</option>
                                                            </select>
                                                        </td>
                                                        <td className="px-6 py-2">
                                                            {emp.status === "completado" ? (
                                                                <span className="inline-flex items-center gap-1.5 text-green-600 text-[10px] font-black tracking-tighter">
                                                                    <i className="bi bi-check-circle-fill text-sm"></i> LISTO
                                                                </span>
                                                            ) : emp.status === "error" ? (
                                                                <div className="flex flex-col">
                                                                    <span className="text-destructive text-[9px] font-black uppercase italic">Error</span>
                                                                    <span className="text-destructive/80 text-[10px] font-medium leading-none truncate max-w-30">{emp.errorMsg}</span>
                                                                </div>
                                                            ) : (
                                                                <span className="text-muted-foreground/40 text-[10px] font-black uppercase italic tracking-tighter">Pendiente</span>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-2 text-right">
                                                            <button
                                                                onClick={() => removeEmployee(i)}
                                                                className="w-8 h-8 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all border-none bg-transparent cursor-pointer"
                                                            >
                                                                <i className="bi bi-trash3"></i>
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {error && (
                                <div className="bg-destructive/10 border border-destructive/20 text-destructive p-4 rounded-2xl text-xs font-bold flex items-center gap-3 animate-in slide-in-from-top-2">
                                    <i className="bi bi-exclamation-triangle-fill text-lg"></i> {error}
                                </div>
                            )}

                            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-card p-6 rounded-[2rem] border border-border">
                                <button
                                    onClick={() => setEmployees([])}
                                    className="text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-destructive transition-colors bg-transparent border-none cursor-pointer"
                                >
                                    <i className="bi bi-x-lg mr-2"></i> Cancelar y limpiar
                                </button>

                                <button
                                    onClick={handleSubmit}
                                    disabled={loading || employees.every(e => e.status === 'completado')}
                                    className="w-full sm:w-auto bg-secondary text-secondary-foreground px-12 py-4 rounded-2xl font-black text-sm shadow-xl shadow-secondary/20 hover:opacity-90 disabled:opacity-50 transition-all active:scale-95 flex items-center justify-center gap-3 border-none cursor-pointer"
                                >
                                    {loading ? (
                                        <><i className="bi bi-arrow-repeat animate-spin text-lg"></i> Procesando...</>
                                    ) : (
                                        <><i className="bi bi-cloud-check-fill text-lg"></i> Procesar {employees.filter(e => e.status !== 'completado').length} registros</>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}