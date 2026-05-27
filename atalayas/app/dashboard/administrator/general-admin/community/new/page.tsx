'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/ui/pageHeader';
import { API_ROUTES } from '@/lib/utils';

export default function NewCollaboratorPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  
  const [logoSource, setLogoSource] = useState<'upload' | 'url'>('upload');
  const [logoFile, setLogoFile] = useState<File | null>(null);

  // Estados para el autocompletado inteligente de la categoría
  const [availableTypes, setAvailableTypes] = useState<string[]>([]);
  const [filteredTypes, setFilteredTypes] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    website: '',
    tipoName: '', // Campo de texto libre para la categoría
    logoUrl: '',
    description: ''
  });

  // 1. Cargar los tipos que ya existen en la base de datos al inicializar
  useEffect(() => {
    const fetchTypes = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_ROUTES.COMMUNITY.GET_TYPES}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setAvailableTypes(data);
        }
      } catch (err) {
        console.error("Error cargando categorías:", err);
      }
    };
    fetchTypes();
  }, []);

  // 2. Filtrado interactivo en caliente de las sugerencias
  useEffect(() => {
    if (formData.tipoName.trim() === "") {
      setFilteredTypes([]);
      return;
    }
    const filtered = availableTypes.filter(tipo =>
      tipo.toLowerCase().includes(formData.tipoName.toLowerCase())
    );
    setFilteredTypes(filtered);
  }, [formData.tipoName, availableTypes]);

  // 3. Cerrar sugerencias al clickear fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current && !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 4. Envío del Formulario (Soporta JSON o multipart/form-data según el logo)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const token = localStorage.getItem('token');
      let response;

      if (logoSource === 'upload' && !logoFile) {
        throw new Error("Por favor, selecciona un archivo de imagen para el logo.");
      }

      // Si se sube archivo físico local, usamos FormData
      if (logoSource === 'upload' && logoFile) {
        const data = new FormData();
        data.append('name', formData.name);
        data.append('website', formData.website);
        data.append('tipoName', formData.tipoName);
        data.append('description', formData.description);
        data.append('file', logoFile); // Campo del archivo binario recibido por NestJS Interceptor

        response = await fetch(`${API_ROUTES.COMMUNITY.CREATE_WITH_UPLOAD}`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }, // NO poner Content-Type manual con FormData
          body: data,
        });
      } else {
        // Si es por URL estática, mandamos un JSON tradicional
        response = await fetch(`${API_ROUTES.COMMUNITY.CREATE}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: formData.name,
            website: formData.website,
            tipoName: formData.tipoName,
            description: formData.description,
            logoUrl: formData.logoUrl,
          }),
        });
      }

      const resData = await response.json();
      if (!response.ok) throw new Error(resData.message || "Error al procesar la solicitud.");

      router.push('/dashboard/administrator/general-admin/community');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-background font-sans text-foreground">
      <main className="flex-1 overflow-auto flex flex-col relative">
        <PageHeader 
          title="Nuevo Colaborador"
          description="Añade una entidad o institución al ecosistema de proximidad de Atalayas."
          icon={<i className="bi bi-diagram-3-fill"></i>}
          backUrl="/dashboard/administrator/general-admin/community"
        />

        <div className="p-6 lg:p-10 flex-1">
          <div className="max-w-2xl mx-auto w-full">
            
            {error && (
              <div className="p-4 mb-6 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive font-bold text-xs flex items-center gap-2">
                <i className="bi bi-exclamation-octagon-fill"></i> {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="bg-card border border-border rounded-[2rem] p-8 lg:p-10 shadow-sm space-y-8">
                
                {/* Nombre de la Entidad */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3 ml-1">
                    Nombre de la Entidad
                  </label>
                  <div className="relative">
                    <i className="bi bi-bank absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground text-lg"></i>
                    <input 
                      type="text" required placeholder="Ej. Ayuntamiento de Alicante"
                      className="w-full pl-14 pr-5 py-3.5 bg-background border border-input rounded-xl text-sm font-semibold focus:border-primary outline-none transition-all shadow-sm"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                </div>

                {/* Tipo de Entidad con Input Inteligente Autocompletable */}
                <div className="relative">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3 ml-1">
                    Tipo de Colaboración / Categoría
                  </label>
                  <div className="relative">
                    <i className="bi bi-diagram-3 absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground text-lg z-10"></i>
                    <input 
                      ref={inputRef} type="text" required placeholder="Escribe o selecciona una categoría"
                      className="w-full pl-14 pr-5 py-3.5 bg-background border border-input rounded-xl text-sm font-semibold focus:border-primary outline-none transition-all shadow-sm"
                      value={formData.tipoName}
                      onChange={(e) => {
                        setFormData({...formData, tipoName: e.target.value});
                        setShowSuggestions(true);
                      }}
                      onFocus={() => setShowSuggestions(true)}
                    />
                  </div>

                  {/* Dropdown flotante de sugerencias directas de la base de datos */}
                  {showSuggestions && filteredTypes.length > 0 && (
                    <div ref={suggestionsRef} className="absolute z-30 left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-lg max-h-48 overflow-y-auto">
                      {filteredTypes.map((tipo, idx) => (
                        <button
                          key={idx} type="button"
                          onClick={() => {
                            setFormData({ ...formData, tipoName: tipo });
                            setShowSuggestions(false);
                          }}
                          className="w-full text-left px-5 py-2.5 text-xs font-bold uppercase tracking-wider hover:bg-muted text-foreground transition-colors"
                        >
                          {tipo}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Selector de subida de Logo */}
                <div className="p-5 bg-background border border-border rounded-2xl">
                  <div className="flex items-center justify-between mb-4">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                      Logo de la Entidad
                    </label>
                    <div className="relative group cursor-help flex items-center justify-center w-6 h-6 rounded-full hover:bg-muted">
                      <i className="bi bi-info-circle text-muted-foreground"></i>
                    </div>
                  </div>

                  <div className="flex gap-1 mb-5 p-1 bg-muted/40 rounded-xl w-fit border border-border">
                    <button 
                      type="button" onClick={() => setLogoSource('upload')} 
                      className={`px-5 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all duration-300 ${logoSource === 'upload' ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                      Subir Archivo
                    </button>
                    <button 
                      type="button" onClick={() => setLogoSource('url')} 
                      className={`px-5 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all duration-300 ${logoSource === 'url' ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                      Pegar URL
                    </button>
                  </div>

                  {logoSource === 'upload' ? (
                    <label className="border-2 border-dashed border-border rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-primary/5 hover:border-primary/50 transition-all group bg-background relative overflow-hidden">
                      <input 
                        type="file" accept="image/png, image/jpeg, image/webp, image/svg+xml" className="hidden" 
                        onChange={(e) => setLogoFile(e.target.files?.[0] || null)} 
                      />
                      <i className={`bi bi-cloud-arrow-up text-3xl mb-2 transition-transform ${logoFile ? 'text-primary' : 'text-muted-foreground/40'}`}></i>
                      <p className={`text-xs font-bold ${logoFile ? 'text-primary' : 'text-muted-foreground'}`}>
                        {logoFile ? logoFile.name : "Haz clic o arrastra una imagen aquí"}
                      </p>
                    </label>
                  ) : (
                    <div className="relative">
                      <i className="bi bi-link-45deg absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-xl"></i>
                      <input 
                        type="url" placeholder="https://atalayas.com/logo.png"
                        className="w-full pl-12 pr-5 py-3.5 bg-background border border-input rounded-xl text-sm font-semibold focus:border-primary outline-none"
                        value={formData.logoUrl}
                        onChange={(e) => setFormData({...formData, logoUrl: e.target.value})}
                      />
                    </div>
                  )}
                </div>

                {/* Link Web */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3 ml-1">
                    Enlace Directo (Web)
                  </label>
                  <div className="relative">
                    <i className="bi bi-globe absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground text-lg"></i>
                    <input 
                      type="url" required placeholder="https://www.alicantefutura.org"
                      className="w-full pl-14 pr-5 py-3.5 bg-background border border-input rounded-xl text-sm font-semibold focus:border-primary outline-none transition-all shadow-sm"
                      value={formData.website}
                      onChange={(e) => setFormData({...formData, website: e.target.value})}
                    />
                  </div>
                </div>

              </div>

              {/* Barra de Acciones */}
              <div className="flex justify-end items-center gap-4 pt-2">
                <button type="button" onClick={() => router.back()} className="px-5 py-3 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">
                  Cancelar
                </button>
                <button 
                  type="submit" disabled={saving}
                  className="px-8 py-3.5 bg-secondary text-secondary-foreground rounded-xl font-bold text-xs uppercase tracking-widest hover:opacity-90 shadow-md transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {saving ? "Guardando..." : "Publicar Entidad"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}