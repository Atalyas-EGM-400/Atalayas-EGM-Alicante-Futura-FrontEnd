'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Sidebar from '@/components/ui/Sidebar';
import PageHeader from '@/components/ui/pageHeader';
import { API_ROUTES } from '@/lib/utils';
import Link from 'next/link';

export default function EditCoursePage() {
    const router = useRouter();
    const params = useParams();
    const courseId = params.id;

    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [titleError, setTitleError] = useState(false);

    const user = typeof window !== 'undefined'
        ? JSON.parse(localStorage.getItem('user') || '{"companyId": null}')
        : { companyId: null };

    const [formData, setFormData] = useState({
        title: '',
        isPublic: false,
        category: 'BASICO',
        file: null as File | null
    });

    useEffect(() => {
        const fetchCourseData = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    router.push('/login');
                    return;
                }

                // Limpiamos la URL base de posibles slashes duplicados
                const baseUrl = API_ROUTES.COURSES.GET_ALL.replace(/\/$/, "");

                console.log("Cargando curso:", `${baseUrl}/${courseId}`);

                const res = await fetch(`${baseUrl}/${courseId}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (res.ok) {
                    const data = await res.json();
                    console.log("Datos del curso:", data);
                    setFormData({
                        title: data.title || '',
                        isPublic: data.isPublic || false,
                        category: data.category?.toUpperCase() === 'ESPECIALIZADO' ? 'ESPECIALIZADO' : 'BASICO',
                        file: null // El input file siempre empieza vacío
                    });
                } else {
                    console.error("Error al cargar curso:", res.status);
                    router.push('/dashboard/administrator/admin/courses/manage');
                }
            } catch (err) {
                console.error("Error al cargar:", err);
            } finally {
                setFetching(false);
            }
        };

        if (courseId) fetchCourseData();
    }, [courseId, router]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!formData.title.trim()) {
            setTitleError(true);
            return;
        }

        setLoading(true);

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error("No hay sesión iniciada");
            }

            const baseUrl = API_ROUTES.COURSES.GET_ALL.replace(/\/$/, "");

            const payload = {
                title: formData.title.trim(),
                isPublic: formData.isPublic,
                category: formData.category,
                companyId: user.companyId || null
            };

            console.log("Enviando actualización:", payload);
            console.log("URL:", `${baseUrl}/${courseId}`);

            const res = await fetch(`${baseUrl}/${courseId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                console.log("Curso actualizado correctamente");
                router.push('/dashboard/administrator/admin/courses/manage');
            } else {
                const errorText = await res.text();
                console.error("Error al actualizar:", res.status, errorText);
                alert(`Error al actualizar el curso: ${res.status}`);
                setLoading(false);
            }
        } catch (err) {
            console.error("Error en la petición:", err);
            alert("Error al conectar con el servidor");
            setLoading(false);
        }
    };

    if (fetching) return (
        <div className="flex min-h-screen bg-background items-center justify-center font-sans">
            <div className="font-bold text-primary animate-pulse text-lg flex items-center gap-3">
                <i className="bi bi-arrow-repeat animate-spin text-2xl"></i> Sincronizando datos...
            </div>
        </div>
    );

    return (
        <div className="flex min-h-screen bg-background font-sans">

            <main className="flex-1 overflow-auto flex flex-col relative">
                <PageHeader
                    title="Editar Curso"
                    description="Actualiza la información, categoría y materiales del curso seleccionado."
                    icon={<i className="bi bi-pencil-square"></i>}
                    backUrl="/dashboard/administrator/admin/courses/manage"
                />

                <div className="p-6 lg:p-10 max-w-3xl mx-auto w-full">
                    <form onSubmit={handleSubmit} className="bg-card p-8 lg:p-10 rounded-[2.5rem] border border-border shadow-sm space-y-10">

                        {/* 1. TÍTULO */}
                        <div className="space-y-2">
                            <label className="block text-[11px] font-black uppercase tracking-widest text-muted-foreground ml-1">Nombre del Curso</label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={e => {
                                    setFormData({ ...formData, title: e.target.value });
                                    if (titleError) setTitleError(false);
                                }}
                                className={`w-full px-6 py-4 rounded-2xl bg-background border outline-none font-bold text-foreground transition-all ${titleError ? 'border-destructive ring-2 ring-destructive/10' : 'border-input focus:border-primary focus:ring-4 focus:ring-primary/5'}`}
                                placeholder="Ej: Seguridad en el Trabajo"
                            />
                            {titleError && (
                                <p className="text-destructive text-xs font-bold mt-2 ml-1 flex items-center gap-1 animate-in fade-in">
                                    <i className="bi bi-exclamation-circle-fill"></i> El nombre es obligatorio
                                </p>
                            )}
                        </div>

                        {/* 2. CATEGORÍA */}
                        <div className="space-y-4">
                            <label className="block text-[11px] font-black uppercase tracking-widest text-muted-foreground ml-1">Tipo de Formación</label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, category: 'BASICO' })}
                                    className={`p-5 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all font-bold ${formData.category === 'BASICO' ? 'border-primary bg-primary/5 text-primary shadow-sm' : 'border-transparent bg-muted/40 text-muted-foreground hover:bg-muted'}`}
                                >
                                    <i className="bi bi-book-half text-xl"></i>
                                    <span className="text-sm">Onboarding</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, category: 'ESPECIALIZADO' })}
                                    className={`p-5 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all font-bold ${formData.category === 'ESPECIALIZADO' ? 'border-secondary bg-secondary/5 text-secondary shadow-sm' : 'border-transparent bg-muted/40 text-muted-foreground hover:bg-muted'}`}
                                >
                                    <i className="bi bi-stars text-xl"></i>
                                    <span className="text-sm">Especialización</span>
                                </button>
                            </div>
                        </div>

                        {/* 3. DOCUMENTO */}
                        <div className="space-y-3">
                            <label className="block text-[11px] font-black uppercase tracking-widest text-muted-foreground ml-1">Actualizar Material (PDF)</label>
                            <label className="relative h-28 w-full border-2 border-dashed border-border rounded-2xl flex items-center justify-center bg-muted/20 hover:border-primary transition-all cursor-pointer group">
                                <input
                                    type="file"
                                    accept=".pdf"
                                    onChange={e => setFormData({ ...formData, file: e.target.files?.[0] || null })}
                                    className="hidden"
                                />
                                <div className="text-center">
                                    <p className="font-bold text-sm text-foreground flex items-center justify-center gap-2">
                                        <i className={`bi ${formData.file ? 'bi-file-earmark-check-fill text-emerald-500' : 'bi-cloud-upload text-primary'} text-2xl`}></i>
                                        {formData.file ? formData.file.name : 'Subir nueva versión'}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground mt-1">Dejar vacío para mantener el archivo actual</p>
                                </div>
                            </label>
                        </div>

                        {/* 4. BOTÓN GUARDAR */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-primary text-primary-foreground rounded-2xl font-bold text-lg hover:opacity-90 shadow-xl shadow-primary/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {loading ? (
                                <><i className="bi bi-arrow-repeat animate-spin text-xl"></i> Guardando cambios...</>
                            ) : (
                                <><i className="bi bi-check-lg text-xl"></i> Actualizar Curso</>
                            )}
                        </button>
                    </form>
                </div>
            </main>
        </div>
    );
}