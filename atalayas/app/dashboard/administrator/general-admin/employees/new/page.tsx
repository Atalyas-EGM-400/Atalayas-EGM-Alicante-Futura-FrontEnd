"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/ui/Sidebar";
import PageHeader from "@/components/ui/pageHeader";
import { API_ROUTES } from "@/lib/utils";

export default function NewEmployeePage() {
  const router = useRouter();

  // Estados de UI
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Estados para autocompletado de puestos
  const [availableJobRoles, setAvailableJobRoles] = useState<string[]>([]);
  const [filteredJobRoles, setFilteredJobRoles] = useState<string[]>([]);
  const [showJobRoleSuggestions, setShowJobRoleSuggestions] = useState(false);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const jobRoleInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Estado del formulario unificado (sin password)
  const [form, setForm] = useState({
    name: "",
    email: "",
    jobRole: "",
    role: "EMPLOYEE",
    companyId: "",
  });

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
    if (form.jobRole.trim() === "") {
      setFilteredJobRoles([]);
      return;
    }

    const filtered = availableJobRoles.filter(role =>
      role.toLowerCase().includes(form.jobRole.toLowerCase())
    );
    setFilteredJobRoles(filtered);
  }, [form.jobRole, availableJobRoles]);

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

  // Función para generar contraseña aleatoria
  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  // Inicialización de usuario
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const user = JSON.parse(storedUser);
      setCurrentUser(user);
      setForm((prev) => ({ ...prev, companyId: user.companyId || "" }));
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");

      // Generar contraseña aleatoria
      const randomPassword = generateRandomPassword();

      const payload = {
        ...form,
        password: randomPassword,
      };

      const res = await fetch(API_ROUTES.USERS.CREATE || API_ROUTES.USERS.GET_ALL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error al registrar el usuario");

      router.push("/dashboard/administrator/general-admin/employees");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) return null;

  return (
    <div className="flex min-h-screen bg-background font-sans">

      <main className="flex-1 overflow-auto flex flex-col relative">
        <PageHeader
          title="Nuevo Empleado"
          description="Añade un nuevo miembro a tu organización. Se generará una contraseña temporal automáticamente."
          icon={<i className="bi bi-person-plus-fill"></i>}
          backUrl="/dashboard/administrator/general-admin/employees"
        />

        <div className="p-6 lg:p-10 max-w-3xl mx-auto w-full">
          <div className="bg-card rounded-[2rem] shadow-sm border border-border p-8 lg:p-10 transition-all">

            {/* Mensaje de Error */}
            {error && (
              <div className="p-4 mb-8 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive font-bold text-xs flex items-center gap-2 animate-in fade-in">
                <i className="bi bi-exclamation-octagon-fill text-sm"></i> {error}
              </div>
            )}

            {/* Mensaje informativo sobre la contraseña */}
            <div className="p-4 mb-8 bg-primary/5 border border-primary/20 rounded-xl text-primary text-xs flex items-center gap-2">
              <i className="bi bi-info-circle-fill text-sm"></i>
              <span>Se generará una contraseña temporal automáticamente y se enviará al correo del usuario.</span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-10">

              {/* Encabezado de Sección */}
              <div className="flex items-center gap-4 pb-2 border-b border-border/50">
                <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center text-lg shrink-0 border border-primary/20">
                  <i className="bi bi-person-vcard"></i>
                </div>
                <h3 className="font-bold text-foreground text-base tracking-tight">
                  Información del empleado
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
                    placeholder="Ej. Juan Pérez García"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full bg-background border border-input rounded-xl px-5 py-3 text-sm font-semibold focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all shadow-sm"
                  />
                </div>

                {/* Email */}
                <div className="md:col-span-2 space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80 ml-1">
                    Email Corporativo
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="nombre@empresa.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full bg-background border border-input rounded-xl px-5 py-3 text-sm font-semibold focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all shadow-sm"
                  />
                </div>

                {/* Puesto de Trabajo con autocompletado */}
                <div className="relative space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80 ml-1">
                    Puesto de Trabajo
                  </label>
                  <input
                    ref={jobRoleInputRef}
                    type="text"
                    required
                    placeholder="Ej. Técnico de Mantenimiento"
                    value={form.jobRole}
                    onChange={(e) => {
                      setForm({ ...form, jobRole: e.target.value });
                      setShowJobRoleSuggestions(true);
                    }}
                    onFocus={() => setShowJobRoleSuggestions(true)}
                    className="w-full bg-background border border-input rounded-xl px-5 py-3 text-sm font-semibold focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all shadow-sm"
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
                            setForm({ ...form, jobRole: role });
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

                {/* Rol de Acceso */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80 ml-1">
                    Rol de Acceso
                  </label>
                  <select
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                    className="w-full bg-background border border-input rounded-xl px-5 py-3 text-sm font-bold focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none cursor-pointer transition-all shadow-sm"
                  >
                    <option value="EMPLOYEE">Empleado Estándar</option>
                    <option value="ADMIN">Administrador de Empresa</option>
                  </select>
                </div>
              </div>

              {/* Botones de Acción */}
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
                    <><i className="bi bi-arrow-repeat animate-spin"></i> Creando...</>
                  ) : (
                    'Crear Empleado'
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