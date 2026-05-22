'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import Sidebar from '@/components/ui/Sidebar';
import PageHeader from '@/components/ui/pageHeader';
import { API_ROUTES } from '@/lib/utils';
import { useRouter, useSearchParams } from 'next/navigation';

function ProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromTaskId = searchParams.get('fromTask');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [jobRole, setJobRole] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState<string | null>(null);
  const [newFile, setNewFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      setCurrentUser(user);
      setName(user.name || '');
      setEmail(user.email || '');
      setJobRole(user.jobRole || '');
      setCurrentAvatarUrl(user.avatarUrl || null);
    } else {
      router.push('/login');
    }
  }, [router]);

  useEffect(() => {
    const autoConfirmTask = async () => {
      if (fromTaskId) {
        try {
          const token = localStorage.getItem("token");
          await fetch(API_ROUTES.ONBOARDING.TOGGLE, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ taskId: fromTaskId, done: true }),
          });
        } catch (err) { console.error("Error onboarding:", err); }
      }
    };
    autoConfirmTask();
  }, [fromTaskId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setAvatarPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(''); setSuccess('');
    if (password && (password.length < 6 || password !== confirmPassword)) {
      setError(password.length < 6 ? 'Mínimo 6 caracteres.' : 'Las contraseñas no coinciden.');
      setLoading(false); return;
    }
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      if (name) formData.append('name', name);
      if (password) formData.append('password', password);
      if (newFile) formData.append('file', newFile);

      const res = await fetch(API_ROUTES.AUTH.PROFILE, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error al actualizar');

      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      const updatedUser = { ...storedUser, ...data };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setCurrentUser(updatedUser);
      setSuccess('Perfil actualizado correctamente.');
      if (newFile) window.location.reload();
    } catch (err: any) { setError(err.message); } finally { setLoading(false); }
  };

  if (!currentUser) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-background font-sans">
      <Sidebar role={currentUser.role} />
      <main className="flex-1 overflow-y-auto flex flex-col relative no-scrollbar">
        <PageHeader title="Mi Perfil" description="Gestiona tus datos personales y seguridad corporativa." icon={<i className="bi bi-person-badge"></i>} onBack={() => router.back()} />
        <div className="p-6 lg:p-10 flex-1 flex justify-center pb-24">
          <div className="w-full max-w-3xl space-y-6">
            <form onSubmit={handleSubmit} className="bg-card border border-border rounded-[2.5rem] p-8 md:p-12 shadow-sm space-y-10">
              {error && <div className="p-4 bg-destructive/10 text-destructive rounded-2xl text-sm font-bold flex items-center gap-3 animate-in fade-in"><i className="bi bi-exclamation-triangle-fill text-lg"></i>{error}</div>}
              {success && <div className="p-4 bg-teal-500/10 text-teal-600 rounded-2xl text-sm font-bold flex items-center gap-3 animate-in fade-in"><i className="bi bi-check-circle-fill text-lg"></i>{success}</div>}
              
              <div className="flex flex-col items-center gap-4 pb-4">
                <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                  <div className="absolute -inset-1.5 bg-linear-to-r from-teal-400 via-amber-400 to-orange-500 rounded-full blur-md opacity-0 group-hover:opacity-30 transition-opacity duration-500" />
                  <img src={avatarPreview || (currentAvatarUrl ? encodeURI(currentAvatarUrl) : 'https://www.gravatar.com/avatar/0?d=mp')} alt="Avatar" className="relative w-32 h-32 rounded-full object-cover border-4 border-card shadow-xl" />
                  <div className="absolute inset-0 bg-black/40 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <i className="bi bi-camera text-white text-2xl mb-1"></i>
                    <span className="text-white text-[9px] uppercase tracking-widest font-bold">Cambiar</span>
                  </div>
                </div>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
              </div>

              <div className="space-y-6">
                <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-teal-500 border-b border-border/50 pb-3">Datos Personales</h2>
                <div>
                  <label className="block text-[10px] font-black text-foreground uppercase tracking-widest mb-2 ml-1">Correo Electrónico <span className="text-muted-foreground/50 lowercase tracking-normal">(No editable)</span></label>
                  <input type="email" value={email} disabled className="w-full bg-muted/50 border border-border/50 rounded-2xl px-5 py-4 text-sm font-medium text-muted-foreground cursor-not-allowed opacity-70" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-foreground uppercase tracking-widest mb-2 ml-1">Nombre Completo <span className="text-orange-500">*</span></label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full bg-background border border-input focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 rounded-2xl px-5 py-4 text-sm font-medium outline-none transition-all text-foreground" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-foreground uppercase tracking-widest mb-2 ml-1">Puesto de Trabajo</label>
                  <input type="text" value={jobRole} disabled className="w-full bg-muted/50 border border-border/50 rounded-2xl px-5 py-4 text-sm font-medium text-muted-foreground cursor-not-allowed opacity-70" />
                </div>
              </div>

              <div className="space-y-6 pt-4">
                <div className="border-b border-border/50 pb-3">
                  <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-teal-500 mb-1">Seguridad</h2>
                  <p className="text-[11px] text-muted-foreground font-medium">Solo si deseas actualizar tu contraseña de acceso.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Nueva Contraseña" className="w-full bg-background border border-input focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 rounded-2xl px-5 py-4 text-sm font-medium outline-none transition-all text-foreground" />
                  <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirmar Contraseña" className="w-full bg-background border border-input focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 rounded-2xl px-5 py-4 text-sm font-medium outline-none transition-all text-foreground" />
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-border flex justify-end">
                <button type="submit" disabled={loading} className="w-full md:w-auto px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest text-white bg-orange-500 hover:brightness-110 shadow-lg transition-all active:scale-95 disabled:opacity-50">
                  {loading ? 'Guardando...' : 'Guardar Perfil'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="flex h-screen w-full items-center justify-center bg-background"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>}>
      <ProfileContent />
    </Suspense>
  );
}