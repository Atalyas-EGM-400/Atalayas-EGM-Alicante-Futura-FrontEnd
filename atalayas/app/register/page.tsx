'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() { 
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('http://localhost:3000/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error al registrarse');

      router.push('/login?registered=true');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex font-sans bg-background">
      
      {/* =========================================
          LADO IZQUIERDO: FORMULARIO DE REGISTRO
      ========================================= */}
      <div className="w-full lg:w-1/2 flex flex-col relative z-10 h-screen overflow-y-auto no-scrollbar">
        
        {/* Cabecera / Logo */}
        <nav className="flex items-center px-8 lg:px-12 py-8 shrink-0">
          <Link href="/login" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-primary shadow-lg shadow-primary/20">
              <span className="text-primary-foreground text-lg font-extrabold">A</span>
            </div>
            <span className="text-foreground text-xl font-extrabold tracking-tight">
              Atalayas
            </span>
          </Link>
        </nav>

        {/* Contenedor Central */}
        <main className="flex-1 flex items-center justify-center px-6 lg:px-12 py-10">
          <div className="w-full max-w-100 animate-in fade-in slide-in-from-bottom-4 duration-700">
            
            <div className="mb-10">
              <h1 className="text-3xl lg:text-4xl font-extrabold text-foreground tracking-tight mb-3">
                Crear cuenta
              </h1>
              <p className="text-muted-foreground text-base">
                Accede a los servicios, cursos y documentación exclusiva del polígono industrial.
              </p>
            </div>

            {error && (
              <div className="rounded-2xl px-5 py-4 mb-8 flex items-center gap-3 bg-destructive/10 border border-destructive/20 animate-in fade-in">
                <i className="bi bi-exclamation-triangle-fill text-destructive text-lg"></i>
                <p className="text-destructive text-sm font-bold">{error}</p>
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-foreground px-1">Correo electrónico</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo@empresa.com"
                  required
                  className="w-full bg-card border border-input rounded-2xl px-5 py-4 text-sm text-foreground font-medium placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all shadow-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-bold text-foreground px-1">Contraseña</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  required
                  className="w-full bg-card border border-input rounded-2xl px-5 py-4 text-sm text-foreground font-medium placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all shadow-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-bold text-foreground px-1">Confirmar contraseña</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repite tu contraseña"
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
                  <><i className="bi bi-arrow-repeat animate-spin text-lg"></i> Creando cuenta...</>
                ) : (
                  'Registrarse'
                )}
              </button>
            </form>

            {/* Links inferiores */}
            <div className="mt-10 pt-8 border-t border-border space-y-4">
              <p className="text-center text-muted-foreground text-sm font-medium">
                ¿Ya tienes cuenta?{' '}
                <Link href="/login" className="text-foreground font-bold hover:text-secondary hover:underline transition-all">
                  Inicia sesión
                </Link>
              </p>
              <p className="text-center text-muted-foreground text-sm font-medium">
                ¿Eres una empresa del polígono?{' '}
                <Link href="/company-register" className="text-foreground font-bold hover:text-primary hover:underline transition-all">
                  Solicitar alta
                </Link>
              </p>
            </div>
          </div>
        </main>
      </div>

      {/* =========================================
          LADO DERECHO: IMAGEN Y BRANDING
      ========================================= */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary items-center justify-center overflow-hidden h-screen sticky top-0">
        <img 
          src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop" 
          alt="Edificios modernos de oficinas" 
          className="absolute inset-0 w-full h-full object-cover mix-blend-multiply opacity-40 scale-105"
        />
        <div className="absolute inset-0 bg-linear-to-t from-primary/80 via-transparent to-primary/30"></div>

        <div className="relative z-10 max-w-lg p-12 animate-in fade-in zoom-in-95 duration-1000">
          <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 mb-8">
             <i className="bi bi-person-badge text-white text-3xl"></i>
          </div>
          <h2 className="text-4xl xl:text-5xl font-extrabold text-white tracking-tight mb-6 leading-tight">
            Potencia tu carrera profesional.
          </h2>
          <p className="text-lg text-white/80 font-medium leading-relaxed">
            Fórmate con los mejores cursos, accede a recursos exclusivos y conecta con los servicios de tu empresa en Atalayas.
          </p>
        </div>
      </div>
    </div>
  );
}
