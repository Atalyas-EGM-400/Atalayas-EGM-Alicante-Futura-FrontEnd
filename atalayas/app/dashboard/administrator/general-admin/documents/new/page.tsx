'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/ui/Sidebar';
import PageHeader from '@/components/ui/pageHeader';
import { API_ROUTES } from '@/lib/utils';

export default function NewDocumentPage() {
  const router = useRouter();
  
  const [title, setTitle] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [companyId, setCompanyId] = useState(''); 
  const [userId, setUserId] = useState('');       
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [companies, setCompanies] = useState<any[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadInitialData = async () => {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        if (user.role === 'EMPLOYEE') {
            router.push('/dashboard/documents');
            return;
        }
        setCurrentUser(user);

        if (user.role === 'GENERAL_ADMIN') {
          try {
            const token = localStorage.getItem('token');
            const res = await fetch(API_ROUTES.COMPANIES.GET_ALL, {
              headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (Array.isArray(data)) setCompanies(data);
            else if (data?.data && Array.isArray(data.data)) setCompanies(data.data);
          } catch (error) { console.error("Error al cargar empresas:", error); }
        }
      }
    };
    loadInitialData();
  }, [router]);

 const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) { setError('Debes seleccionar un archivo físico.'); return; }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      
      // --- FUNCIÓN DE LIMPIEZA ---
      // Esto quita acentos, eñes y caracteres raros que odia Supabase
      const sanitizeName = (name: string) => {
        return name
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "") // Quita acentos
          .replace(/[^a-zA-Z0-9.\-_]/g, "_") // Cambia paréntesis, espacios y raros por "_"
          .replace(/_{2,}/g, "_"); // Evita que queden "___" seguidos
      };

      const cleanFileName = sanitizeName(file.name);
      // Creamos un nuevo archivo con el nombre limpio para que el backend no reciba basura
      const cleanFile = new File([file], cleanFileName, { type: file.type });

      formData.append('title', title);
      formData.append('file', cleanFile); // Mandamos el archivo "limpio"
      formData.append('isPublic', isPublic.toString());
      
      if (currentUser.role === 'GENERAL_ADMIN') {
        if (companyId.trim() !== '') formData.append('companyId', companyId);
      } else {
        if (currentUser.companyId) formData.append('companyId', currentUser.companyId);
      }

      if (userId.trim() !== '') formData.append('userId', userId.trim());

      const res = await fetch(API_ROUTES.DOCUMENTS.GET_ALL, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Error al subir el documento al servidor');
      }

      router.push('/dashboard/administrator/general-admin/documents');
      
    } catch (err: any) { 
      setError(err.message); 
    } 
    finally { setLoading(false); }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!currentUser) return null;

  return (
    <div className="flex min-h-screen bg-background font-sans">
      <main className="flex-1 flex flex-col overflow-auto">
        
        <PageHeader 
            title="Subir Documento"
            description="Añade archivos al sistema y configura su visibilidad corporativa."
            icon={<i className="bi bi-cloud-arrow-up"></i>}
            backUrl="/dashboard/administrator/general-admin/documents"
        />

        <div className="p-6 lg:p-10 flex justify-center">
            <div className="bg-card rounded-[2.5rem] shadow-sm border border-border p-10 max-w-2xl w-full">
            
            {error && (
              <div className="p-4 mb-6 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive flex items-center gap-3">
                <i className="bi bi-exclamation-octagon-fill"></i>
                <span className="text-sm font-bold">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Título */}
                <div>
                  <label className="block text-[10px] font-black text-foreground uppercase tracking-widest mb-3 ml-1">Título del Documento *</label>
                  <input 
                      type="text" 
                      value={title} 
                      onChange={(e) => setTitle(e.target.value)} 
                      placeholder="Ej: Manual de Bienvenida 2024" 
                      required 
                      className="w-full bg-background border border-input focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-2xl px-5 py-4 text-sm font-medium outline-none transition-all" 
                  />
                </div>

                {/* Área de Archivo Mejorada */}
                <div>
                  <label className="block text-[10px] font-black text-foreground uppercase tracking-widest mb-3 ml-1">Archivo Físico *</label>
                  
                  {!file ? (
                    <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full border-2 border-dashed border-border rounded-3xl p-12 flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 hover:border-primary/50 transition-all group"
                    >
                        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform">
                          <i className="bi bi-cloud-arrow-up text-3xl"></i>
                        </div>
                        <span className="text-sm font-bold text-foreground mb-1">Selecciona un archivo</span>
                        <span className="text-xs text-muted-foreground font-medium text-center max-w-62.5">Formatos soportados: PDF, DOCX, Imágenes (Máx. 10MB)</span>
                        <input type="file" ref={fileInputRef} onChange={(e) => setFile(e.target.files?.[0] || null)} className="hidden" />
                    </div>
                  ) : (
                    <div className="w-full bg-muted/30 border border-border rounded-3xl p-6 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-white text-xl">
                          <i className={`bi ${file.type === 'application/pdf' ? 'bi-file-pdf' : 'bi-file-earmark-text'}`}></i>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-foreground truncate max-w-50 sm:max-w-75">{file.name}</span>
                          <span className="text-[10px] font-black text-muted-foreground uppercase">{formatSize(file.size)}</span>
                        </div>
                      </div>
                      <button 
                        type="button"
                        onClick={() => setFile(null)}
                        className="w-9 h-9 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center hover:bg-destructive hover:text-white transition-all"
                      >
                        <i className="bi bi-x-lg"></i>
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Visibilidad */}
                  <div>
                      <label className="block text-[10px] font-black text-foreground uppercase tracking-widest mb-3 ml-1">Visibilidad</label>
                      <select 
                        value={isPublic ? 'true' : 'false'} 
                        onChange={(e) => setIsPublic(e.target.value === 'true')} 
                        className="w-full bg-background rounded-2xl px-5 py-4 text-sm font-medium outline-none border border-input focus:border-primary transition-all cursor-pointer"
                      >
                        <option value="true">Público (Todo el mundo)</option>
                        <option value="false">Privado (Solo el administrador)</option>
                      </select>
                  </div>

                  {/* Empresa (si es General Admin) */}
                  {currentUser.role === 'GENERAL_ADMIN' && (
                      <div>
                      <label className="block text-[10px] font-black text-foreground uppercase tracking-widest mb-3 ml-1">Empresa asignada</label>
                      <select 
                          value={companyId} 
                          onChange={(e) => setCompanyId(e.target.value)} 
                          className="w-full bg-background rounded-2xl px-5 py-4 text-sm font-medium outline-none border border-input focus:border-primary transition-all cursor-pointer"
                      >
                          <option value="">Global</option>
                          {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                      </div>
                  )}
                </div>

                {/* Botón de envío */}
                <div className="pt-6 border-t border-border flex justify-end">
                <button 
                    type="submit" 
                    disabled={loading || !file || !title} 
                    className="group relative px-10 py-4 rounded-full font-black text-[10px] uppercase tracking-[0.2em] text-white bg-orange-500 hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/20 disabled:opacity-50 active:scale-95 flex items-center gap-2 overflow-hidden"
                >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Subiendo...
                      </>
                    ) : (
                      <>
                        Publicar Documento
                        <i className="bi bi-arrow-right-short text-xl group-hover:translate-x-1 transition-transform"></i>
                      </>
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