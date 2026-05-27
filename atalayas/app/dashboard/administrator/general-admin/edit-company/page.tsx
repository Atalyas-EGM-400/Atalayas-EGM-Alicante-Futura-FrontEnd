'use client';

import { useState, useEffect, useRef } from 'react';
import Sidebar from '@/components/ui/Sidebar';
import PageHeader from '@/components/ui/pageHeader';
import { API_ROUTES } from '@/lib/utils';
import { useRouter } from 'next/navigation';

export default function CompanyProfilePage() {
  const router = useRouter();
  
  // Estados de contexto
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  
  // Estados del formulario
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [website, setWebsite] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [cif, setCif] = useState('');
  const [activity, setActivity] = useState('');
  
  // Estados del Logo
  const [currentLogoUrl, setCurrentLogoUrl] = useState<string | null>(null);
  const [newFile, setNewFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  // Estados de UI
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) return router.push('/login');
        
        const user = JSON.parse(storedUser);
        setCurrentUser(user);

        if (user.companyId) {
          setSelectedCompanyId(user.companyId);
        } else {
          setError('No tienes una empresa asociada a tu cuenta.');
        }
      } catch (err) {
        console.error('Error init:', err);
      } finally {
        setInitializing(false);
      }
    };
    init();
  }, [router]);

  useEffect(() => {
  if (!selectedCompanyId) {
    setFetching(false);
    return;
  }

  // Creamos un controlador para poder abortar la petición si el componente se desmonta
  const controller = new AbortController();

  const fetchCompanyData = async () => {
    setFetching(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      
      // Control de seguridad: Si no hay token, no disparamos la petición y evitamos el cuelgue
      if (!token) {
        throw new Error('Sesión expirada o sin token válido. Por favor, inicia sesión.');
      }

      const res = await fetch(`${API_ROUTES.COMPANIES.GET_ALL}/${selectedCompanyId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
        signal: controller.signal // Vinculamos el controlador de aborto
      });
      
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          throw new Error('No tienes permisos para ver esta empresa o el token ha expirado.');
        }
        throw new Error(`Error del servidor: ${res.status} - No se pudieron obtener los datos.`);
      }
      
      const company = await res.json();
      setName(company.name || '');
      setAddress(company.address || '');
      setDescription(company.description || '');
      setWebsite(company.website || '');
      setContactEmail(company.contactEmail || '');
      setContactPhone(company.contactPhone || '');
      setCif(company.cif || '');
      setActivity(company.activity || '');
      setCurrentLogoUrl(company.logoUrl || null);
      setNewFile(null);
      setLogoPreview(null);
      
    } catch (err: any) {
      // Si la petición fue abortada intencionadamente por React, no actualizamos el estado de error
      if (err.name !== 'AbortError') {
        console.error("Error cargando empresa:", err);
        setError(err.message || 'Error de conexión con el servidor.');
      }
    } finally {
      // Al usar el AbortController, verificamos que no estemos en una petición cancelada
      if (!controller.signal.aborted) {
        setFetching(false);
      }
    }
  };

  fetchCompanyData();

  // Función de limpieza: si el id cambia o el usuario navega a otra página, cancelamos el fetch antiguo
  return () => {
    controller.abort();
  };
}, [selectedCompanyId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setLogoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      
      formData.append('name', name);
      formData.append('address', address);
      formData.append('description', description);
      formData.append('website', website);
      formData.append('contactEmail', contactEmail);
      formData.append('contactPhone', contactPhone);
      formData.append('cif', cif);
      formData.append('activity', activity);
      if (newFile) formData.append('file', newFile); 

      const res = await fetch(`${API_ROUTES.COMPANIES.GET_ALL}/${selectedCompanyId}`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error('Error al actualizar el perfil');

      // Actualizamos la persistencia local de sesión
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const userObj = JSON.parse(storedUser);
        userObj.Company = { ...userObj.Company, name, logoUrl: data.logoUrl || currentLogoUrl };
        localStorage.setItem('user', JSON.stringify(userObj));
      }

      // Sincronizamos el estado de la UI reactivamente para no necesitar recargar la página entera
      if (data.logoUrl) {
        setCurrentLogoUrl(data.logoUrl);
      }
      setNewFile(null);
      setLogoPreview(null);

      setSuccess('Perfil corporativo actualizado correctamente.');
      
      // Limpiamos el mensaje de éxito automáticamente tras 3 segundos
      setTimeout(() => setSuccess(''), 3000);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (initializing) {
    return (
      <div className="flex min-h-screen bg-background items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-primary animate-pulse">Sincronizando Entidad...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-muted/30 font-sans text-foreground transition-colors duration-300">
      
      <main className="flex-1 overflow-auto flex flex-col relative">
        
        <PageHeader 
          title="Perfil de Empresa"
          description="Gestión integral de la identidad y datos operativos de tu organización."
          icon={<i className="bi bi-building-fill"></i>}
        />

        <div className="p-6 lg:p-10 flex-1 flex justify-center w-full">
          <div className="w-full max-w-5xl">
            
            <form 
              onSubmit={handleSubmit} 
              className="bg-card rounded-[32px] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-border/60 p-8 lg:p-14 space-y-12 relative"
            >
              
              {/* CAPA DE CARGA Y SPINNER */}
              {(loading || fetching) && (
  <div className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-card/60 rounded-[32px] backdrop-blur-md animate-in fade-in duration-300">
    <div className="w-12 h-12 border-4 border-secondary border-t-transparent rounded-full animate-spin"></div>
    <p className="text-xs font-black uppercase tracking-[0.2em] text-secondary">
      {fetching ? 'Cargando empresa...' : 'Actualizando perfil corporativo...'}
    </p>
  </div>
)}

              {error && <div className="p-5 bg-destructive/5 border border-destructive/20 rounded-[20px] text-destructive font-black text-[11px] uppercase tracking-widest flex items-center gap-3 animate-in slide-in-from-top-2"><i className="bi bi-exclamation-octagon-fill text-lg"></i> {error}</div>}
              {success && <div className="p-5 bg-emerald-500/5 border border-emerald-500/20 rounded-[20px] text-emerald-600 font-black text-[11px] uppercase tracking-widest flex items-center gap-3 animate-in slide-in-from-top-2"><i className="bi bi-check-circle-fill text-lg"></i> {success}</div>}

              <div className="grid lg:grid-cols-[220px_1fr] gap-12 items-start">
                
                {/* COLUMNA IZQUIERDA: LOGO */}
                <div className="flex flex-col items-center lg:items-start gap-6">
                  <div className="relative group" title="Haz clic para subir un nuevo logo">
                    <div className="w-48 h-48 rounded-[40px] overflow-hidden border-8 border-background shadow-xl relative bg-muted/20">
                      <img 
                        src={logoPreview || (currentLogoUrl ? encodeURI(currentLogoUrl) : 'https://placehold.co/400x400/f5f5f7/86868b?text=LOGO')} 
                        alt="Logo" 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute inset-0 bg-primary/80 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 cursor-pointer backdrop-blur-sm"
                      >
                        <i className="bi bi-cloud-arrow-up-fill text-white text-3xl mb-2"></i>
                        <span className="text-white text-[10px] font-black uppercase tracking-widest">Actualizar</span>
                      </div>
                    </div>
                    <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-secondary rounded-2xl flex items-center justify-center text-white shadow-lg border-4 border-card">
                       <i className="bi bi-pencil-fill text-xs"></i>
                    </div>
                  </div>
                  <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                  <div className="text-center lg:text-left px-2">
                    <p className="text-foreground font-black text-xs uppercase tracking-widest">Branding Corporativo</p>
                    <p className="text-muted-foreground text-[10px] mt-1.5 font-bold uppercase opacity-60">Recomendado: 512x512px</p>
                  </div>
                </div>

                {/* COLUMNA DERECHA: FORMULARIO */}
                <div className="space-y-10">
                  
                  {/* SECCIÓN 1: IDENTIDAD */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 border-b border-border/60 pb-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-xl flex items-center justify-center text-primary"><i className="bi bi-info-circle"></i></div>
                      <h2 className="text-xs font-black text-foreground uppercase tracking-[0.2em]">Identidad y Registro</h2>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 ml-1">Nombre Comercial / Razón Social *</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} required className="w-full bg-background border border-border focus:border-primary/40 focus:ring-4 focus:ring-primary/5 rounded-[18px] px-6 py-4 text-sm font-bold outline-none transition-all placeholder:text-muted-foreground/30" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 ml-1">Identificación Fiscal (CIF)</label>
                        <input type="text" value={cif} onChange={e => setCif(e.target.value)} className="w-full bg-background border border-border focus:border-primary/40 focus:ring-4 focus:ring-primary/5 rounded-[18px] px-6 py-4 text-sm font-bold outline-none transition-all" placeholder="Ej: B12345678" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 ml-1">Sector de Actividad</label>
                      <input type="text" value={activity} onChange={e => setActivity(e.target.value)} className="w-full bg-background border border-border focus:border-primary/40 focus:ring-4 focus:ring-primary/5 rounded-[18px] px-6 py-4 text-sm font-bold outline-none transition-all" placeholder="Ej: Desarrollo de Software, Hostelería..." />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 ml-1">Propósito / Descripción Corporativa</label>
                      <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="w-full bg-background border border-border focus:border-primary/40 focus:ring-4 focus:ring-primary/5 rounded-[18px] px-6 py-4 text-sm font-bold outline-none transition-all resize-none" placeholder="Describe brevemente la empresa..." />
                    </div>
                  </div>

                  {/* SECCIÓN 2: CONTACTO */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 border-b border-border/60 pb-3">
                      <div className="w-8 h-8 bg-secondary/10 rounded-xl flex items-center justify-center text-secondary"><i className="bi bi-geo-alt"></i></div>
                      <h2 className="text-xs font-black text-foreground uppercase tracking-[0.2em]">Localización y Contacto</h2>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 ml-1">Dirección de Sede Central</label>
                      <input type="text" value={address} onChange={e => setAddress(e.target.value)} className="w-full bg-background border border-border focus:border-primary/40 focus:ring-4 focus:ring-primary/5 rounded-[18px] px-6 py-4 text-sm font-bold outline-none transition-all" placeholder="C/ Principal 1, Polígono Ind. Atalayas" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 ml-1">Email de Contacto</label>
                        <input type="email" value={contactEmail} onChange={e => setContactEmail(e.target.value)} className="w-full bg-background border border-border focus:border-primary/40 focus:ring-4 focus:ring-primary/5 rounded-[18px] px-6 py-4 text-sm font-bold outline-none transition-all" placeholder="info@empresa.com" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 ml-1">Teléfono Directo</label>
                        <input type="text" value={contactPhone} onChange={e => setContactPhone(e.target.value)} className="w-full bg-background border border-border focus:border-primary/40 focus:ring-4 focus:ring-primary/5 rounded-[18px] px-6 py-4 text-sm font-bold outline-none transition-all" placeholder="+34 966 000 000" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 ml-1">Portal Web / LinkedIn</label>
                      <div className="relative group">
                        <i className="bi bi-link-45deg absolute left-5 top-1/2 -translate-y-1/2 text-primary text-xl opacity-40 group-focus-within:opacity-100 transition-opacity"></i>
                        <input type="url" value={website} onChange={e => setWebsite(e.target.value)} className="w-full bg-background border border-border focus:border-primary/40 focus:ring-4 focus:ring-primary/5 rounded-[18px] pl-14 pr-6 py-4 text-sm font-bold outline-none transition-all" placeholder="https://www.tuempresa.com" />
                      </div>
                    </div>
                  </div>

                  {/* ACCIÓN FINAL */}
                  <div className="pt-8 border-t border-border/60 flex flex-col sm:flex-row justify-between items-center gap-6">
                    <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest">Última revisión: {new Date().toLocaleDateString()}</p>
                    <button 
                      type="submit" 
                      disabled={loading || fetching} 
                      className="bg-secondary text-white px-12 py-5 rounded-[22px] font-black text-xs uppercase tracking-[0.2em] hover:opacity-90 hover:shadow-xl hover:shadow-secondary/20 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-3 shadow-lg"
                    >
                      {loading ? (
                        <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Guardando...</>
                      ) : (
                        <><i className="bi bi-shield-check text-lg"></i> Confirmar Cambios</>
                      )}
                    </button>
                  </div>

                </div>
              </div>

            </form>
          </div>
        </div>
      </main>
    </div>
  );
}