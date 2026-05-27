'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Sidebar from '@/components/ui/Sidebar';
import PageHeader from '@/components/ui/pageHeader';
import { API_ROUTES } from '@/lib/utils';

export default function EditCoursePage() {
    const router = useRouter();
    const params = useParams();
    const courseId = params.id;

    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [companies, setCompanies] = useState<any[]>([]);

    // Estados para roles
    const [availableRoles, setAvailableRoles] = useState<string[]>([]);
    const [loadingRoles, setLoadingRoles] = useState(false);

    // Estados para el Buscador de Empresas
    const [companySearch, setCompanySearch] = useState('');
    const [isCompanyListOpen, setIsCompanyListOpen] = useState(false);
    const [companyError, setCompanyError] = useState(false);
    const [titleError, setTitleError] = useState(false);
    const [roleError, setRoleError] = useState(false);

    // Estado para la imagen
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);

    const companyRef = useRef<HTMLDivElement>(null);

    const [formData, setFormData] = useState({
        title: '',
        isPublic: false,
        category: 'BASICO',
        companyId: '',
        requiredRole: '',
        imageFile: null as File | null
    });

    // Cargar roles disponibles
    const fetchAvailableRoles = async () => {
        setLoadingRoles(true);
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const res = await fetch(`${API_ROUTES.USERS.GET_ALL}/roles`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
                const data = await res.json();
                setAvailableRoles(Array.isArray(data) ? data : []);
            } else {
                setAvailableRoles(["Técnico", "Ventas", "Administrativo", "Gerente", "Operaciones"]);
            }
        } catch (err) {
            console.error("Error cargando roles:", err);
            setAvailableRoles(["Técnico", "Ventas", "Administrativo", "Gerente", "Operaciones"]);
        } finally {
            setLoadingRoles(false);
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setFormData({ ...formData, imageFile: file });
            const reader = new FileReader();
            reader.onloadend = () => setImagePreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    router.push('/login');
                    return;
                }

                // Cargar roles disponibles
                await fetchAvailableRoles();

                const baseUrl = API_ROUTES.COURSES.GET_ALL.replace(/\/$/, "");

                const [resCourse, resCompanies] = await Promise.all([
                    fetch(`${baseUrl}/${courseId}`, {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    }),
                    fetch(API_ROUTES.COMPANIES.GET_ALL, {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    })
                ]);

                if (!resCourse.ok) {
                    console.error("Error al cargar curso:", resCourse.status);
                    router.push('/dashboard/administrator/general-admin/courses/manage');
                    return;
                }

                const courseData = await resCourse.json();
                const companiesData = await resCompanies.json();
                const allCompanies = Array.isArray(companiesData) ? companiesData : [];

                setCompanies(allCompanies);

                const isPublicCourse = courseData.isPublic || false;
                const categoryValue = isPublicCourse ? 'BASICO' : (courseData.category?.toUpperCase() === 'ESPECIALIZADO' ? 'ESPECIALIZADO' : 'BASICO');

                setFormData({
                    title: courseData.title || '',
                    isPublic: isPublicCourse,
                    category: categoryValue,
                    companyId: courseData.companyId || '',
                    requiredRole: courseData.jobRole || '',
                    imageFile: null
                });

                // Cargar la imagen actual para preview
                if (courseData.fileUrl) {
                    setCurrentImageUrl(courseData.fileUrl);
                }

                if (courseData.companyId && !isPublicCourse) {
                    const currentComp = allCompanies.find(c => c.id === courseData.companyId);
                    if (currentComp) setCompanySearch(currentComp.name);
                }
            } catch (err) {
                console.error("Error al cargar datos:", err);
            } finally {
                setFetching(false);
            }
        };

        if (courseId) fetchData();

        const handleClickOutside = (event: MouseEvent) => {
            if (companyRef.current && !companyRef.current.contains(event.target as Node)) {
                setIsCompanyListOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [courseId, router]);

    const filteredCompanies = companies.filter(comp =>
        comp.name.toLowerCase().includes(companySearch.toLowerCase())
    );

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        let hasError = false;

        // VALIDACIÓN DE TÍTULO
        if (!formData.title.trim()) {
            setTitleError(true);
            hasError = true;
        }

        // VALIDACIÓN DE EMPRESA (Si es privado)
        if (!formData.isPublic && !formData.companyId) {
            setCompanyError(true);
            hasError = true;
        }

        // VALIDACIÓN DE ROL (Si es especialización privada)
        if (!formData.isPublic && formData.category === 'ESPECIALIZADO' && !formData.requiredRole) {
            setRoleError(true);
            hasError = true;
        }

        if (hasError) return;

        setLoading(true);

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error("No hay sesión iniciada");
            }

            const baseUrl = API_ROUTES.COURSES.GET_ALL.replace(/\/$/, "");

            // Usar FormData si hay imagen nueva, si no usar JSON
            if (formData.imageFile) {
                const formDataToSend = new FormData();
                formDataToSend.append('title', formData.title.trim());
                formDataToSend.append('isPublic', String(formData.isPublic));
                formDataToSend.append('category', formData.isPublic ? 'BASICO' : formData.category);
                if (!formData.isPublic && formData.companyId) {
                    formDataToSend.append('companyId', formData.companyId);
                }
                if (!formData.isPublic && formData.category === 'ESPECIALIZADO' && formData.requiredRole) {
                    formDataToSend.append('jobRole', formData.requiredRole);
                }
                formDataToSend.append('file', formData.imageFile);

                const res = await fetch(`${baseUrl}/${courseId}`, {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    body: formDataToSend,
                });

                if (res.ok) {
                    router.push('/dashboard/administrator/general-admin/courses/manage');
                } else {
                    const errorText = await res.text();
                    alert(errorText || "Error al actualizar el curso.");
                    setLoading(false);
                }
            } else {
                // Sin imagen nueva, usar JSON
                const payload: any = {
                    title: formData.title.trim(),
                    isPublic: formData.isPublic,
                    category: formData.isPublic ? 'BASICO' : formData.category,
                    companyId: formData.isPublic ? null : (formData.companyId || null),
                };

                if (!formData.isPublic && formData.category === 'ESPECIALIZADO') {
                    payload.jobRole = formData.requiredRole;
                } else {
                    payload.jobRole = null;
                }

                const res = await fetch(`${baseUrl}/${courseId}`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(payload),
                });

                if (res.ok) {
                    router.push('/dashboard/administrator/general-admin/courses/manage');
                } else {
                    const errorText = await res.text();
                    alert(errorText || "Error al actualizar el curso.");
                    setLoading(false);
                }
            }
        } catch (err) {
            console.error("Error en la petición:", err);
            alert("Error al conectar con el servidor");
            setLoading(false);
        }
    };

    if (fetching) return (
        <div className="flex min-h-screen bg-muted/30 items-center justify-center font-sans">
            <div className="font-black text-primary animate-pulse text-xs flex flex-col items-center gap-4 uppercase tracking-[0.2em]">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                Sincronizando datos...
            </div>
        </div>
    );

    return (
        <div className="flex min-h-screen bg-muted/30 font-sans text-foreground transition-colors duration-300">

            <main className="flex-1 overflow-auto flex flex-col relative">
                <PageHeader
                    title="Editar Curso"
                    description={formData.isPublic
                        ? 'Gestionando contenido maestro disponible para todas las empresas.'
                        : 'Modifica los detalles del contenido para la empresa seleccionada.'
                    }
                    icon={<i className="bi bi-pencil-square"></i>}
                    backUrl="/dashboard/administrator/general-admin/courses/manage"
                />

                <div className="p-6 lg:p-12 flex-1 max-w-3xl mx-auto w-full">
                    <form onSubmit={handleSubmit} className="bg-card p-6 lg:p-10 rounded-[32px] border border-border/60 shadow-sm space-y-8 transition-colors duration-300">

                        {/* INFO VISIBILIDAD */}
                        <div className={`p-6 rounded-[24px] border flex items-center gap-4 transition-all duration-500 ${formData.isPublic ? 'bg-primary/5 border-primary/20 text-primary' : 'bg-muted/40 border-border/60 text-muted-foreground'}`}>
                            <div className="w-12 h-12 bg-card rounded-[18px] flex items-center justify-center text-xl shadow-sm border border-border/40 shrink-0">
                                <i className={`bi ${formData.isPublic ? 'bi-globe' : 'bi-building'}`}></i>
                            </div>
                            <div>
                                <h3 className="font-black text-[11px] uppercase tracking-widest mb-0.5">
                                    {formData.isPublic ? 'Contenido Público (Global)' : 'Contenido Privado (Por Empresa)'}
                                </h3>
                                <p className="opacity-60 text-[10px] font-bold uppercase tracking-wider">
                                    {formData.isPublic
                                        ? 'Este curso es visible para todas las empresas del sistema.'
                                        : 'Este curso es privado y solo visible para la empresa asignada.'}
                                </p>
                            </div>
                        </div>

                        {/* SELECTOR DE EMPRESA - Solo para cursos privados */}
                        {!formData.isPublic && (
                            <div className="animate-in fade-in slide-in-from-top-4 duration-500" ref={companyRef}>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3 ml-1 text-center sm:text-left">
                                    Empresa Propietaria
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        className={`w-full px-5 py-4 rounded-2xl bg-background border outline-none font-bold text-foreground transition-all text-sm placeholder:text-muted-foreground/40 ${companyError ? 'border-destructive bg-destructive/5' : 'border-border focus:border-primary/40 focus:ring-4 focus:ring-primary/5'}`}
                                        placeholder="Escribe para buscar empresa..."
                                        value={companySearch}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setCompanySearch(val);
                                            setIsCompanyListOpen(true);
                                            setCompanyError(false);
                                            const match = companies.find(c => c.name.toLowerCase() === val.toLowerCase());
                                            setFormData(prev => ({ ...prev, companyId: match ? match.id : '' }));
                                        }}
                                        onFocus={() => setIsCompanyListOpen(true)}
                                    />
                                    {isCompanyListOpen && (
                                        <div className="absolute z-20 w-full mt-2 bg-card border border-border rounded-2xl shadow-xl max-h-60 overflow-y-auto">
                                            {filteredCompanies.length > 0 ? (
                                                filteredCompanies.map(comp => (
                                                    <div
                                                        key={comp.id}
                                                        className={`px-5 py-3.5 hover:bg-muted cursor-pointer text-sm transition-colors border-b border-border/50 last:border-0 ${formData.companyId === comp.id ? 'text-primary bg-primary/5 font-bold' : 'text-foreground font-medium'}`}
                                                        onClick={() => {
                                                            setFormData(prev => ({ ...prev, companyId: comp.id }));
                                                            setCompanySearch(comp.name);
                                                            setIsCompanyListOpen(false);
                                                            setCompanyError(false);
                                                        }}
                                                    >
                                                        {comp.name}
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="px-5 py-4 text-center text-muted-foreground text-sm">
                                                    No se encontraron empresas
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                                {companyError && (
                                    <p className="text-destructive text-[10px] font-bold mt-2 ml-2 flex items-center gap-1">
                                        <i className="bi bi-exclamation-circle-fill"></i> Debes seleccionar una empresa
                                    </p>
                                )}
                            </div>
                        )}

                        {/* IMAGEN DE PORTADA */}
                        <div className="space-y-3">
                            <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                                Imagen de Portada
                            </label>
                            <label className="relative h-40 w-full border-2 border-dashed border-border/60 rounded-[24px] flex items-center justify-center bg-muted/20 hover:bg-muted/40 transition-all cursor-pointer group overflow-hidden">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                />
                                {imagePreview ? (
                                    <>
                                        <img src={imagePreview} className="w-full h-full object-cover" alt="Preview" />
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                            <div className="text-center text-white">
                                                <i className="bi bi-camera text-2xl mb-1 block"></i>
                                                <span className="text-[10px] font-bold">Cambiar imagen</span>
                                            </div>
                                        </div>
                                    </>
                                ) : currentImageUrl ? (
                                    <>
                                        <img src={currentImageUrl} className="w-full h-full object-cover" alt="Current" />
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                            <div className="text-center text-white">
                                                <i className="bi bi-camera text-2xl mb-1 block"></i>
                                                <span className="text-[10px] font-bold">Cambiar imagen</span>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex flex-col items-center gap-2 px-6">
                                        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-card text-primary shadow-sm">
                                            <i className="bi bi-image-fill"></i>
                                        </div>
                                        <p className="font-bold text-xs text-foreground text-center">
                                            Seleccionar imagen de portada
                                        </p>
                                        <p className="text-[9px] text-muted-foreground">
                                            JPG, PNG, GIF hasta 5MB
                                        </p>
                                    </div>
                                )}
                            </label>
                            <p className="text-[9px] text-muted-foreground ml-1">
                                Dejar vacío para mantener la imagen actual
                            </p>
                        </div>

                        {/* TÍTULO DEL CURSO */}
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3 ml-1 text-center sm:text-left">
                                Nombre del Curso
                            </label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={e => {
                                    setFormData({ ...formData, title: e.target.value });
                                    if (titleError) setTitleError(false);
                                }}
                                className={`w-full px-5 py-4 rounded-2xl bg-background border outline-none font-bold text-foreground transition-all text-sm ${titleError ? 'border-destructive bg-destructive/5' : 'border-border focus:border-primary/40 focus:ring-4 focus:ring-primary/5'}`}
                                placeholder="Ej: Manual de Bienvenida"
                            />
                            {titleError && (
                                <p className="text-destructive text-[10px] font-bold mt-2 ml-2 flex items-center gap-1">
                                    <i className="bi bi-exclamation-circle-fill"></i> El título es obligatorio
                                </p>
                            )}
                        </div>

                        {/* TIPO DE FORMACIÓN - Solo visible y editable para cursos privados */}
                        {!formData.isPublic && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center sm:text-left">
                                    Tipo de Formación
                                </label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setFormData({ ...formData, category: 'BASICO', requiredRole: '' });
                                            setRoleError(false);
                                        }}
                                        className={`p-5 rounded-2xl border-2 flex items-center justify-center gap-3 cursor-pointer transition-all font-black text-[11px] uppercase tracking-widest ${formData.category === 'BASICO' ? 'border-primary bg-primary/5 text-primary shadow-sm' : 'border-border/60 bg-muted/20 text-muted-foreground hover:border-primary/40'}`}
                                    >
                                        <i className="bi bi-book-half text-lg"></i> Onboarding
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, category: 'ESPECIALIZADO' })}
                                        className={`p-5 rounded-2xl border-2 flex items-center justify-center gap-3 cursor-pointer transition-all font-black text-[11px] uppercase tracking-widest ${formData.category === 'ESPECIALIZADO' ? 'border-secondary bg-secondary/5 text-secondary shadow-sm' : 'border-border/60 bg-muted/20 text-muted-foreground hover:border-secondary/40'}`}
                                    >
                                        <i className="bi bi-stars text-lg"></i> Especialización
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* ROL REQUERIDO - Solo para cursos privados de especialización */}
                        {!formData.isPublic && formData.category === 'ESPECIALIZADO' && (
                            <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                                    Rol Requerido
                                </label>
                                <select
                                    value={formData.requiredRole}
                                    onChange={(e) => {
                                        setFormData({ ...formData, requiredRole: e.target.value });
                                        setRoleError(false);
                                    }}
                                    className={`w-full px-5 py-4 rounded-2xl bg-background border outline-none font-bold text-foreground transition-all text-sm appearance-none cursor-pointer ${roleError ? 'border-destructive bg-destructive/5' : 'border-border focus:border-primary/40 focus:ring-4 focus:ring-primary/5'}`}
                                    disabled={loadingRoles}
                                    required
                                >
                                    <option value="">Seleccionar rol...</option>
                                    {availableRoles.map((role) => (
                                        <option key={role} value={role}>
                                            {role}
                                        </option>
                                    ))}
                                </select>
                                {roleError && (
                                    <p className="text-destructive text-[10px] font-bold mt-2 ml-2 flex items-center gap-1">
                                        <i className="bi bi-exclamation-circle-fill"></i> Debes seleccionar un rol para el curso de especialización
                                    </p>
                                )}
                                <p className="text-[10px] text-muted-foreground ml-1">
                                    Solo los empleados con este rol podrán ver y acceder al curso
                                </p>
                            </div>
                        )}

                        {/* Información adicional para cursos públicos */}
                        {formData.isPublic && (
                            <div className="p-4 bg-muted/30 rounded-2xl border border-border/40">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground text-center flex items-center justify-center gap-2">
                                    <i className="bi bi-info-circle"></i>
                                    Los cursos públicos son siempre del tipo "Onboarding"
                                </p>
                            </div>
                        )}

                        {/* Información adicional para cursos privados de onboarding */}
                        {!formData.isPublic && formData.category === 'BASICO' && (
                            <div className="p-4 bg-muted/30 rounded-2xl border border-border/40">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground text-center flex items-center justify-center gap-2">
                                    <i className="bi bi-info-circle"></i>
                                    Los cursos de Onboarding están disponibles para todos los empleados sin restricción de rol
                                </p>
                            </div>
                        )}

                        {/* BOTÓN SUBMIT */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4.5 bg-secondary text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:opacity-95 transition-all active:scale-[0.98] shadow-md hover:shadow-secondary/20 disabled:opacity-50 mt-6"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-3">
                                    <i className="bi bi-arrow-repeat animate-spin text-lg"></i> Guardando cambios...
                                </span>
                            ) : (
                                'Guardar Cambios'
                            )}
                        </button>
                    </form>
                </div>
            </main>
        </div>
    );
}