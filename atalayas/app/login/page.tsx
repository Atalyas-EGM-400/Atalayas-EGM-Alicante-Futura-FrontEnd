'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { API_ROUTES } from '@/lib/utils';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Función para mensajes de validación
  const handleInvalid = (e: React.FormEvent<HTMLInputElement>, fieldName: string) => {
    const target = e.target as HTMLInputElement;
    if (target.validity.valueMissing) {
      target.setCustomValidity(`Por favor, introduce tu ${fieldName}`);
    } else if (target.validity.typeMismatch) {
      target.setCustomValidity('Formato de correo no válido');
    } else {
      target.setCustomValidity('');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch(API_ROUTES.AUTH.LOGIN, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
if (!res.ok) {
        // Control de errores específicos del servidor
        if (res.status === 401) throw new Error('El correo o la contraseña son incorrectos.');
        if (res.status === 404) throw new Error('Este usuario no existe en nuestro sistema.');
        if (res.status === 429) throw new Error('Demasiados intentos. Inténtalo más tarde.');
        throw new Error(data.message || 'Hubo un problema al conectar con el servidor.');
      }
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      window.dispatchEvent(new Event('user:login')); // Emitimos evento global para que otros componentes puedan reaccionar

      const role = data.user.role;
      
      if (role === 'GENERAL_ADMIN') router.push('/dashboard/administrator/general-admin');
      else if (role === 'ADMIN') router.push('/dashboard/administrator/admin');
      else if (role === 'EMPLOYEE') router.push('/dashboard/employee');
      else router.push('/dashboard/public');
      
    } catch (err: any) {
      setError(err.message === 'Failed to fetch' 
        ? 'No se pudo conectar con el servidor. Revisa tu conexión.' 
        : err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex font-sans bg-background">
      
      {/* =========================================
          LADO IZQUIERDO: FORMULARIO DE LOGIN
      ========================================= */}
      <div className="w-full lg:w-1/2 flex flex-col relative z-10">
        
        {/* Cabecera / Logo */}
        <nav className="flex items-center px-8 lg:px-12 py-8">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="w-15 h-15 rounded-xl flex items-center justify-center bg-white shadow-lg shadow-primary/20">
                <img src="/favicon.ico" alt="Logo" className="w-10 h-10" />
              </div>
            </Link>
            <span className="text-foreground text-xl font-bold tracking-tight">
              Atalayas EGM
            </span>
          </div>
        </nav>

        {/* Contenedor Central */}
        <main className="flex-1 flex items-center justify-center px-6 lg:px-12 py-10">
          <div className="w-full max-w-100 animate-in fade-in slide-in-from-bottom-4 duration-700">
            
            <div className="mb-10">
              <h1 className="text-3xl lg:text-4xl font-extrabold text-foreground tracking-tight mb-3">
                Iniciar sesión
              </h1>
              <p className="text-muted-foreground text-base">
                Bienvenido al hub de recursos de <strong>Alicante Futura</strong>. Por favor, introduce tus credenciales.
              </p>
            </div>

            {error && (
              <div className="rounded-2xl px-5 py-4 mb-8 flex items-center gap-3 bg-destructive/10 border border-destructive/20 animate-in fade-in">
                <i className="bi bi-exclamation-triangle-fill text-destructive text-lg"></i>
                <p className="text-destructive text-sm font-bold">{error}</p>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-foreground px-1">Correo electrónico</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onInvalid={(e) => handleInvalid(e, 'correo electrónico')}
                  placeholder="ejemplo@empresa.com"
                  required
                  className="w-full bg-card border border-input rounded-2xl px-5 py-4 text-sm text-foreground font-medium placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all shadow-sm"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between px-1">
                  <label className="text-sm font-bold text-foreground">Contraseña</label>
                  <Link href="/forgot-password" className="text-secondary text-xs font-bold hover:underline transition-all">
                    ¿La has olvidado?
                  </Link>
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) =>{ setPassword(e.target.value);
                    e.target.setCustomValidity('');
                  }}
                  onInvalid={(e) => handleInvalid (e, 'contraseña')}
                  placeholder="••••••••"
                  required
                  className="w-full bg-card border border-input rounded-2xl px-5 py-4 text-sm text-foreground font-medium placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all shadow-sm"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-secondary text-secondary-foreground font-bold rounded-2xl px-4 py-4 mt-6 hover:opacity-90 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-secondary/20 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <><i className="bi bi-arrow-repeat animate-spin text-lg"></i> Iniciando...</>
                ) : (
                  'Acceder a mi cuenta'
                )}
              </button>
            </form>

            {/* Links inferiores */}
            <div className="mt-10 pt-8 border-t border-border space-y-4">
              <p className="text-center text-muted-foreground text-sm font-medium">
                ¿Eres una empresa del polígono?{' '}
                <Link href="/company-register" className="text-foreground font-bold hover:text-primary hover:underline transition-all">
                  Solicitar alta
                </Link>
              </p>
            </div>
          </div>
        </main>

        {/* Footer del lado izquierdo */}
        <footer className="px-8 lg:px-12 py-6">
          <div className="flex items-center justify-between flex-wrap gap-4 text-xs font-medium text-muted-foreground">
            <p>© 2026 Atalayas EGM</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-foreground transition-colors">Privacidad</a>
              <a href="#" className="hover:text-foreground transition-colors">Términos</a>
              <a href="#" className="hover:text-foreground transition-colors">Soporte</a>
            </div>
          </div>
        </footer>
      </div>

      {/* =========================================
          LADO DERECHO: IMAGEN Y BRANDING (Escritorio)
      ========================================= */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-primary items-center justify-center overflow-hidden">
        
        {/* Imagen de fondo */}
        <img 
          src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop" 
          alt="Edificios modernos de oficinas" 
          className="absolute inset-0 w-full h-full object-cover mix-blend-multiply opacity-40 scale-105"
        />
        
        <div className="absolute inset-0 bg-linear-to-t from-primary/80 via-transparent to-primary/30"></div>

        {/* 🚀 SOLUCIÓN: Eliminado el delay-300 */}
        <div className="relative z-10 max-w-lg p-12 animate-in fade-in zoom-in-95 duration-1000">
          <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 mb-8">
             <i className="bi bi-buildings text-white text-3xl"></i>
          </div>
          <h2 className="text-4xl xl:text-5xl font-extrabold text-white tracking-tight mb-6 leading-tight">
            Conectando el ecosistema empresarial de Alicante.
          </h2>
          <p className="text-lg text-white/80 font-medium leading-relaxed">
            Un entorno digital exclusivo para las empresas de Atalayas. Gestiona formación, recursos y servicios desde un solo lugar.
          </p>
        </div>

      </div>
    </div>
  );
}