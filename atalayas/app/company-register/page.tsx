'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { API_ROUTES } from '@/lib/utils';

export default function RegisterCompanyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState({
    companyName: '',
    cif: '',
    contactName: '',
    contactEmail: '',
    phone: '',
    address: '',
    activity: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (fieldErrors[e.target.name]) {
      setFieldErrors({ ...fieldErrors, [e.target.name]: '' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    const newErrors: Record<string, string> = {};

    if (!form.companyName) newErrors.companyName = 'El nombre es obligatorio';
    
    if (!form.cif) {
      newErrors.cif = 'El CIF es obligatorio';
    } else if (!/^[ABCDEFGHJKLMNPQSVW]\d{7}[0-9A-J]$/i.test(form.cif)) {
      newErrors.cif = 'Formato no válido (ej: B12345678)';
    }

    if (!form.contactEmail) {
      newErrors.contactEmail = 'El email es obligatorio';
    } else if (!/\S+@\S+\.\S+/.test(form.contactEmail)) {
      newErrors.contactEmail = 'Introduce un email válido';
    }

    if (!form.contactName) newErrors.contactName = 'El responsable es obligatorio';

    if (form.phone && !/^\+?[\d\s]{9,}$/.test(form.phone)) {
      newErrors.phone = 'Teléfono no válido';
    }

    if (Object.keys(newErrors).length > 0) {
      setFieldErrors(newErrors);
      setError('Por favor, revisa los campos marcados en rojo');
      return;
    }

    if (!file) {
      setError('Debes adjuntar un documento acreditativo');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        if (value) formData.append(key, value);
      });
      formData.append('document', file);

      const res = await fetch(API_ROUTES.COMPANY_REQUESTS.CREATE, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error al enviar la solicitud');

      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderInput = (name: string, label: string, placeholder: string, type = 'text', required = false) => {
    const hasError = !!fieldErrors[name];
    return (
      <div className="space-y-1.5">
        <label className="text-sm font-bold text-foreground px-1">{label}</label>
        <input
          name={name}
          type={type}
          value={(form as any)[name]}
          onChange={handleChange}
          placeholder={placeholder}
          required={required}
          className={`w-full bg-card rounded-2xl px-5 py-4 text-sm outline-none transition-all text-foreground placeholder:text-muted-foreground/50 font-medium shadow-sm ${
            hasError 
              ? 'border-2 border-destructive bg-destructive/5' 
              : 'border border-input focus:border-primary focus:ring-2 focus:ring-primary/30'
          }`}
        />
        {hasError && (
          <span className="text-destructive text-xs font-bold ml-2 mt-1.5 flex items-center gap-1 animate-in fade-in slide-in-from-top-1">
            <i className="bi bi-exclamation-triangle-fill"></i> {fieldErrors[name]}
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen flex font-sans bg-background">
      
      {/* =========================================
          LADO IZQUIERDO: FORMULARIO CON SCROLL
      ========================================= */}
      <div className="w-full lg:w-[55%] flex flex-col relative z-10 h-screen overflow-y-auto no-scrollbar">
        
        {/* Cabecera / Logo */}
        <nav className="flex items-center justify-between px-8 lg:px-12 py-8 shrink-0">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="w-15 h-15 rounded-xl flex items-center justify-center bg-white shadow-lg shadow-primary/20">
                <img src="/favicon.ico" alt="Logo" className="w-10 h-10" />
              </div>
            </Link>
            <span className="text-foreground text-xl font-bold tracking-tight">Atalayas EGM</span>
          </div>
        </nav>

        {/* Contenedor Central */}
        <main className="flex-1 flex flex-col justify-center px-6 lg:px-12 py-6 max-w-2xl mx-auto w-full">
          
          {success ? (
            // PANTALLA DE ÉXITO INCRUSTADA
            <div className="bg-card rounded-[2rem] p-10 text-center shadow-xl border border-border animate-in zoom-in-95 duration-500">
              <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-6 text-4xl text-primary shadow-sm border border-primary/20">
                <i className="bi bi-check-lg"></i>
              </div>
              <h2 className="text-foreground text-3xl font-extrabold mb-3 tracking-tight">
                ¡Solicitud enviada!
              </h2>
              <p className="text-muted-foreground text-base leading-relaxed mb-8">
                Hemos recibido la información de <strong>{form.companyName}</strong>. El equipo administrador la revisará detalladamente y recibirás un email con la resolución en breve.
              </p>
              <Link 
                href="/login" 
                className="inline-flex items-center justify-center w-full bg-secondary text-secondary-foreground rounded-2xl px-6 py-4 text-base font-bold transition-all hover:opacity-90 shadow-xl shadow-secondary/20 active:scale-95 gap-2"
              >
                Volver al inicio <i className="bi bi-arrow-right"></i>
              </Link>
            </div>
          ) : (
            // FORMULARIO DE REGISTRO
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
              <div className="mb-10">
                <h1 className="text-3xl lg:text-4xl font-extrabold text-foreground tracking-tight mb-3">
                  Alta de empresa
                </h1>
                <p className="text-muted-foreground text-base">
                  Solicita acceso al ecosistema digital de Atalayas para empezar a gestionar a tu equipo.
                </p>
              </div>

              {error && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-2xl p-5 mb-8 flex items-center gap-3 animate-in fade-in">
                  <i className="bi bi-exclamation-octagon-fill text-2xl text-destructive"></i>
                  <p className="text-destructive text-sm font-bold">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate className="space-y-10">
                
                {/* Sección 1 */}
                <div className="space-y-5">
                  <h3 className="text-foreground text-lg font-bold tracking-tight border-b border-border pb-2">1. Datos de la entidad</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="md:col-span-2">{renderInput('companyName', 'Nombre de la empresa *', 'Mi Empresa S.L.', 'text', true)}</div>
                    {renderInput('cif', 'CIF *', 'B12345678', 'text', true)}
                    {renderInput('activity', 'Sector / Actividad', 'Tecnología, Logística...')}
                    <div className="md:col-span-2">{renderInput('address', 'Dirección en el polígono', 'C/ Ejemplo, Nave 4')}</div>
                  </div>
                </div>

                {/* Sección 2 */}
                <div className="space-y-5">
                  <h3 className="text-foreground text-lg font-bold tracking-tight border-b border-border pb-2">2. Persona de contacto</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="md:col-span-2">{renderInput('contactName', 'Nombre y apellidos *', 'Juan Pérez', 'text', true)}</div>
                    {renderInput('contactEmail', 'Email corporativo *', 'juan@empresa.com', 'email', true)}
                    {renderInput('phone', 'Teléfono', '+34 600 000 000', 'tel')}
                  </div>
                </div>

                {/* Sección 3 */}
                <div className="space-y-5">
                  <h3 className="text-foreground text-lg font-bold tracking-tight border-b border-border pb-2">3. Documento acreditativo</h3>
                  <p className="text-muted-foreground text-sm font-medium">
                    Adjunta un documento que demuestre tu vinculación con el polígono (contrato, escrituras, recibo).
                  </p>
                  
                  <label className={`relative flex flex-col items-center justify-center gap-3 p-8 rounded-3xl border-2 border-dashed transition-all cursor-pointer group ${
                      file 
                        ? 'border-primary bg-primary/5' 
                        : 'border-input bg-card hover:bg-muted hover:border-primary/50'
                    }`}
                  >
                    <span className={`text-4xl transition-transform group-hover:scale-110 ${file ? 'text-primary' : 'text-muted-foreground'}`}>
                      <i className={`bi ${file ? 'bi-check-circle-fill' : 'bi-file-earmark-arrow-up'}`}></i>
                    </span>
                    <span className={`text-sm font-bold text-center ${file ? 'text-primary' : 'text-foreground'}`}>
                      {file ? file.name : 'Haz clic para seleccionar archivo'}
                    </span>
                    {!file && <span className="text-muted-foreground text-xs font-medium">PDF, Word o imagen (máx. 10MB)</span>}
                    
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      className="hidden"
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                    />
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-5 bg-secondary text-secondary-foreground rounded-2xl font-bold text-base hover:opacity-90 transition-opacity shadow-xl shadow-secondary/20 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <><i className="bi bi-arrow-repeat animate-spin text-xl"></i> Procesando solicitud...</>
                  ) : (
                    'Enviar solicitud de alta'
                  )}
                </button>
              </form>
            </div>
          )}
        </main>
      </div>

      {/* =========================================
          LADO DERECHO: IMAGEN Y BRANDING (FIJO)
      ========================================= */}
      <div className="hidden lg:flex lg:w-[45%] relative bg-primary items-center justify-center overflow-hidden h-screen sticky top-0">
        <img 
          src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop" 
          alt="Edificios modernos de oficinas" 
          className="absolute inset-0 w-full h-full object-cover mix-blend-multiply opacity-40 scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/50 to-primary/20"></div>

        <div className="relative z-10 max-w-lg p-12 animate-in fade-in zoom-in-95 duration-1000">
          <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 mb-8">
             <i className="bi bi-briefcase text-white text-3xl"></i>
          </div>
          <h2 className="text-4xl xl:text-5xl font-extrabold text-white tracking-tight mb-6 leading-tight">
            Haz crecer tu negocio en Atalayas.
          </h2>
          <p className="text-lg text-white/80 font-medium leading-relaxed">
            Forma parte de la red de empresas más avanzada. Gestiona a tus empleados, publica servicios y accede a recursos exclusivos del ecosistema de Atalayas EGM.
          </p>
        </div>
      </div>
    </div>
  );
}