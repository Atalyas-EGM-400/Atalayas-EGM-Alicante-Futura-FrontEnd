'use client';

import { useEffect, useState, useMemo } from 'react';
import Sidebar from '@/components/ui/Sidebar';
import PageHeader from '@/components/ui/pageHeader';
import { API_ROUTES, fetchWithApiFallback } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '@/app/providers/SocketProvider';

// ── Tipos ─────────────────────────────────────────────────────────────────
interface TrendEntry {
  createdAt: string;
}

interface StatsData {
  overview: {
    totalCompanies: number;
    totalUsers: number;
    totalEmployees: number;
    totalAdmins: number;
    totalCourses: number;
    publicCourses: number;
    totalEnrollments: number;
    completedEnrollments: number;
    completionRate: number;
    avgProgress: number;
    totalDocuments: number;
    totalServices: number;
    pendingRequests: number;
    inactiveUsers?: number; // Para el contador de bajas
    inactiveCompanies?: number; // Para el contador de bajas
  };
  recent: {
    users: Array<{ id: string; name: string; email: string; role: string; createdAt: string; avatarUrl?: string; Company?: { name: string } }>;
    courses: Array<{ id: string; title: string; isPublic: boolean; createdAt: string; category?: string; Company?: { name: string } }>;
  };
  top: {
    courses: Array<{ id: string; title: string; _count: { Enrollment: number } }>;
  };
  trends: {
    usersByMonth: Array<{ createdAt: string }>;
    companiesByMonth: Array<{ createdAt: string }>;
  };
  workforce?: {
    userDepartures: TrendEntry[];
    companyDepartures: TrendEntry[];
  };
}

// ── Utilidades ────────────────────────────────────────────────────────────
function groupByMonth(items: Array<{ createdAt: string }>) {
  const months: Record<string, number> = {};
  items.forEach(({ createdAt }) => {
    const d = new Date(createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    months[key] = (months[key] || 0) + 1;
  });
  
  const result: { label: string; value: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleString('es-ES', { month: 'short' });
    result.push({ label, value: months[key] || 0 });
  }
  return result;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'ahora mismo';
  if (m < 60) return `hace ${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `hace ${h}h`;
  return `hace ${Math.floor(h / 24)}d`;
}

const roleLabel: Record<string, string> = {
  GENERAL_ADMIN: 'Admin General',
  ADMIN: 'Admin',
  EMPLOYEE: 'Empleado',
  PUBLIC: 'Público',
};

const roleColor: Record<string, string> = {
  GENERAL_ADMIN: 'text-violet-400 bg-violet-400/10',
  ADMIN: 'text-blue-400 bg-blue-400/10',
  EMPLOYEE: 'text-emerald-400 bg-emerald-400/10',
  PUBLIC: 'text-gray-400 bg-gray-400/10',
};

const getMonthsLabels = () => ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

function processYearlyData(items: Array<{ createdAt: string }>, targetYear: number) {
  const counts = new Array(12).fill(0);
  items.forEach(item => {
    const d = new Date(item.createdAt);
    if (d.getFullYear() === targetYear) {
      counts[d.getMonth()]++;
    }
  });
  return getMonthsLabels().map((label, i) => ({ label, value: counts[i] }));
}

// ── Skeleton ──────────────────────────────────────────────────────────────
function StatsSkeleton() {
  return (
    <div className="p-6 lg:p-8 space-y-4 max-w-7xl mx-auto w-full animate-pulse">
      <div className="bg-card border border-border/50 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-muted shrink-0" />
          <div className="space-y-2">
            <div className="h-2.5 bg-muted rounded w-20" />
            <div className="h-8 bg-muted rounded w-32" />
          </div>
        </div>
        <div className="flex items-center gap-6 sm:border-l sm:border-border/50 sm:pl-6">
          <div className="space-y-1.5"><div className="h-2 bg-muted rounded w-16" /><div className="h-3.5 bg-muted rounded w-20" /></div>
          <div className="space-y-1.5"><div className="h-2 bg-muted rounded w-16" /><div className="h-3.5 bg-muted rounded w-12" /></div>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-card border border-border/50 rounded-2xl p-5 flex flex-col gap-3">
            <div className="w-9 h-9 rounded-xl bg-muted" />
            <div className="space-y-1.5"><div className="h-7 bg-muted rounded w-16" /><div className="h-2.5 bg-muted rounded w-20" /></div>
          </div>
        ))}
      </div>
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-card border border-border/50 rounded-2xl">
          <div className="p-5 flex items-center justify-between">
            <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-xl bg-muted" /><div className="h-4 bg-muted rounded w-40" /></div>
            <div className="w-4 h-4 bg-muted rounded" />
          </div>
          {i < 2 && (
            <div className="px-5 pb-5 border-t border-border/40 pt-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div className="space-y-3"><div className="h-4 bg-muted rounded w-48" /><div className="h-3 bg-muted rounded w-64" /><div className="h-16 bg-muted rounded-xl mt-4" /></div>
                <div className="space-y-3"><div className="h-2.5 bg-muted rounded w-32" /><div className="h-3 bg-muted rounded w-28" /><div className="h-3 bg-muted rounded w-28" /></div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Componentes Pequeños ──────────────────────────────────────────────────

function KpiCard({ label, value, icon, color, sub }: { label: string; value: number | string; icon: string; color: string; sub?: string; }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border/50 rounded-2xl p-5 flex flex-col gap-3 hover:border-border hover:shadow-lg transition-all"
    >
      <div className="flex items-center justify-between">
        <span className={`w-9 h-9 rounded-xl flex items-center justify-center text-base ${color}`}>
          <i className={`bi ${icon}`}></i>
        </span>
        {sub && <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">{sub}</span>}
      </div>
      <div>
        <p className="text-3xl font-semibold tabular-nums tracking-tighter">{value}</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">{label}</p>
      </div>
    </motion.div>
  );
}

function MiniLineChart({ data, theme }: { data: { label: string; value: number }[]; theme: 'blue' | 'violet' | 'rose' }) {
  const max = Math.max(...data.map(d => d.value), 1);
  const total = data.reduce((sum, d) => sum + d.value, 0) || 1; 

  const colors = {
    blue: { stroke: '#3b82f6', fill: 'rgba(59, 130, 246, 0.15)' },
    violet: { stroke: '#8b5cf6', fill: 'rgba(139, 92, 246, 0.15)' },
    rose: { stroke: '#f43f5e', fill: 'rgba(244, 63, 94, 0.15)' }
  };

  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - (d.value / max) * 80; 
    return { x, y, value: d.value, label: d.label, pct: (d.value / total) * 100 };
  });

  const pathD = `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ');
  const areaD = `${pathD} L 100 100 L 0 100 Z`;

  return (
    <div className="flex flex-col mt-2">
      <div className="relative h-16 w-full px-2">
        <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full overflow-visible" preserveAspectRatio="none">
          <path d={areaD} fill={colors[theme].fill} stroke="none" />
          <path d={pathD} fill="none" stroke={colors[theme].stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        </svg>

        {points.map((p, i) => (
          <div key={i} className="absolute group z-10" style={{ left: `${p.x}%`, top: `${p.y}%` }}>
            <div 
              className="w-2.5 h-2.5 -ml-[5px] -mt-[5px] rounded-full bg-background border-2 transition-transform duration-200 group-hover:scale-[1.8] cursor-pointer" 
              style={{ borderColor: colors[theme].stroke }} 
            />
            <div className="opacity-0 group-hover:opacity-100 absolute bottom-full left-1/2 -translate-x-1/2 mb-3 bg-card border border-border shadow-lg px-2 py-1.5 rounded-lg text-[11px] whitespace-nowrap pointer-events-none transition-all z-20 flex items-center gap-1.5">
              <span className="font-semibold text-foreground">{p.value}</span>
              <span className="text-[10px] text-muted-foreground bg-muted px-1 rounded-sm">
                {Math.round(p.pct)}%
              </span>
            </div>
          </div>
        ))}
      </div>
      
      <div className="flex justify-between items-center px-1 mt-2">
        {data.map((d, i) => (
          <span key={i} className="text-[9px] text-muted-foreground font-medium capitalize">{d.label}</span>
        ))}
      </div>
    </div>
  );
}

function DonutChart({ segments, centerValue, label }: { segments: Array<{ label: string; value: number; color: string }>; centerValue: number | string; label: string; }) {
  const total = segments.reduce((a, s) => a + s.value, 0) || 1;
  let cumulative = 0;
  return (
    <div className="flex items-center gap-6">
      <div className="relative w-28 h-28 shrink-0">
        <svg viewBox="-1 -1 2 2" className="transform -rotate-90 w-full h-full">
          {segments.map((seg, i) => {
            const pct = seg.value / total;
            const start = cumulative;
            cumulative += pct;
            const x1 = Math.cos(2 * Math.PI * start);
            const y1 = Math.sin(2 * Math.PI * start);
            const x2 = Math.cos(2 * Math.PI * cumulative);
            const y2 = Math.sin(2 * Math.PI * cumulative);
            const large = pct > 0.5 ? 1 : 0;
            return <path key={i} d={`M ${x1} ${y1} A 1 1 0 ${large} 1 ${x2} ${y2} L 0 0`} fill={seg.color} className="stroke-card stroke-[0.04]" />;
          })}
          <circle cx="0" cy="0" r="0.72" className="fill-card" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-semibold tabular-nums">{centerValue}</span>
          <span className="text-[10px] text-muted-foreground">{label}</span>
        </div>
      </div>
      <div className="space-y-2 min-w-0">
        {segments.map((seg, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-[11px] text-muted-foreground truncate">{seg.label}</span>
              <span className="text-[11px] font-medium tabular-nums ml-auto">{Math.round((seg.value / total) * 100)}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Section({ title, icon, iconColor, defaultOpen = true, children, delay = 0 }: { title: string; icon: string; iconColor: string; defaultOpen?: boolean; children: React.ReactNode; delay?: number }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut', delay }}
      className="bg-card border border-border/50 rounded-2xl overflow-hidden"
    >
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center justify-between p-5 hover:bg-muted/30 transition-colors group">
        <div className="flex items-center gap-3">
          <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm ${iconColor}`}>
            <i className={`bi ${icon}`}></i>
          </span>
          <span className="text-sm font-medium tracking-tight">{title}</span>
        </div>
        <i className={`bi bi-chevron-down text-muted-foreground transition-transform duration-300 ${open ? 'rotate-180' : ''}`}></i>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }} 
            animate={{ height: 'auto', opacity: 1, transitionEnd: { overflow: 'visible' } }} 
            exit={{ height: 0, opacity: 0, transitionEnd: { overflow: 'hidden' } }} 
            transition={{ duration: 0.25, ease: 'easeInOut' }} 
            style={{ overflow: 'hidden' }}
          >
            <div className="px-5 pb-5 border-t border-border/40 pt-4">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Modales Históricos ────────────────────────────────────────────────────

// 1. Modal simple animado (Usuarios/Mes y Empresas/Mes)
function YearlyHistorySelector({ data, title, theme }: { data: Array<{ createdAt: string }>, title: string, theme: 'blue' | 'violet' | 'rose' }) {
  const [isOpen, setIsOpen] = useState(false);
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  
  const years = useMemo(() => Array.from({ length: 5 }, (_, i) => currentYear - i), [currentYear]);
  const yearlyStats = useMemo(() => processYearlyData(data, selectedYear), [data, selectedYear]);
  const totalInYear = yearlyStats.reduce((acc, curr) => acc + curr.value, 0);

  const themeColors = {
    blue: { stroke: '#3b82f6', bg: 'bg-blue-500' },
    violet: { stroke: '#8b5cf6', bg: 'bg-violet-500' },
    rose: { stroke: '#f43f5e', bg: 'bg-rose-500' }
  };
  const c = themeColors[theme];

  const maxVal = Math.max(...yearlyStats.map(v => v.value)) || 1;
  const heightFactor = 85; 

  const points = yearlyStats.map((d, i) => {
    const x = (i + 0.5) * (100 / 12);
    const h = d.value > 0 ? Math.max((d.value / maxVal) * heightFactor, 3) : 0;
    return { x, y: 100 - h };
  });

  const pathD = `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsOpen(false); };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; }
  }, [isOpen]);

  return (
    <>
      <button onClick={() => setIsOpen(true)} className="group flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors bg-muted/40 px-3 py-1.5 rounded border border-border/50 hover:border-border">
        <i className="bi bi-arrows-fullscreen"></i>
        <span>Histórico anual</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8 bg-background/80 backdrop-blur-sm lg:pl-[280px]"
          >
            <div className="absolute inset-0" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.95 }} transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-5xl h-[80vh] min-h-[500px] bg-card border border-border shadow-2xl rounded-3xl p-6 md:p-10 flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <button onClick={() => setIsOpen(false)} className="absolute top-6 right-6 w-10 h-10 rounded-full bg-muted/50 hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors z-50">
                <i className="bi bi-x-lg text-lg"></i>
              </button>

              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
                <div>
                  <h2 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h2>
                  <p className="text-sm text-muted-foreground mt-1">Desglose mensual de actividad y registros</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">Año:</span>
                  <select 
                    value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    className="bg-muted text-base font-medium border-none rounded-lg px-4 py-2 outline-none cursor-pointer focus:ring-2 focus:ring-primary/20"
                  >
                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>

              {/* Contenedor Gráfico Simple Animado */}
              <div className="flex-1 w-full mt-4 mb-6 relative">
                
                {/* 1. Capa de Línea Animada SVG */}
                <motion.div
                  className="absolute inset-0 z-10 pointer-events-none"
                  initial={{ clipPath: 'inset(-5% 100% -5% -5%)' }}
                  animate={{ clipPath: 'inset(-5% -5% -5% -5%)' }}
                  transition={{ duration: 1, delay: 0.6, ease: "easeInOut" }}
                >
                  <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
                     <path d={pathD} fill="none" stroke={c.stroke} strokeWidth="2.5" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </motion.div>

                {/* 2. Capa de Nodos Interconectados */}
                <div className="absolute inset-0 z-20 pointer-events-none">
                  {yearlyStats.map((d, i) => (
                    d.value >= 0 && (
                      <motion.div 
                        key={`dot-${i}`}
                        className={`absolute w-2.5 h-2.5 ${c.bg} rounded-full border-2 border-background -ml-[5px] -mt-[5px] shadow-sm`}
                        style={{ left: `${points[i].x}%`, top: `${points[i].y}%` }}
                        initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 1.5, duration: 0.3 }}
                      />
                    )
                  ))}
                </div>

                {/* 3. Capa de Barras */}
                <div className="absolute inset-0 flex">
                  {yearlyStats.map((d, i) => {
                    const heightPct = d.value > 0 ? Math.max((d.value / maxVal) * heightFactor, 3) : 0;
                    return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-3 group relative h-full justify-end px-1 sm:px-3 lg:px-6">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-full mb-4 bg-popover border border-border shadow-xl rounded-lg py-2 px-4 text-sm font-medium whitespace-nowrap z-30 pointer-events-none">
                        {d.value} {d.value === 1 ? 'registro' : 'registros'}
                      </div>
                      
                      <motion.div 
                        initial={{ height: 0 }}
                        animate={{ height: `${heightPct}%` }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                        className={`w-full max-w-[80px] rounded-t-lg transition-all hover:brightness-110 ${c.bg}`}
                      />
                      
                      <span className="absolute -bottom-6 text-xs sm:text-sm text-muted-foreground capitalize font-medium">{d.label}</span>
                    </div>
                  )})}
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-border/50 flex justify-between items-end">
                <div>
                  <span className="text-sm text-foreground font-medium block">Total consolidado</span>
                  <span className="text-xs text-muted-foreground">Suma de todos los meses de {selectedYear}</span>
                </div>
                <span className="text-4xl sm:text-5xl font-semibold tabular-nums tracking-tighter">{totalInYear}</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// 2. Modal Complejo (Empresas DEBAJO de Usuarios + Líneas Animadas)
function CombinedYearlyHistorySelector({ users, companies, title }: { users: any[], companies: any[], title: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  
  const years = useMemo(() => Array.from({ length: 5 }, (_, i) => currentYear - i), [currentYear]);
  
  const yearlyStats = useMemo(() => {
    const counts = getMonthsLabels().map(label => ({ label, users: 0, companies: 0, total: 0 }));
    users.forEach(u => {
      const d = new Date(u.createdAt);
      if (d.getFullYear() === selectedYear) { counts[d.getMonth()].users++; counts[d.getMonth()].total++; }
    });
    companies.forEach(c => {
      const d = new Date(c.createdAt);
      if (d.getFullYear() === selectedYear) { counts[d.getMonth()].companies++; counts[d.getMonth()].total++; }
    });
    return counts;
  }, [users, companies, selectedYear]);

  const totalInYear = yearlyStats.reduce((acc, curr) => acc + curr.total, 0);
  const maxVal = Math.max(...yearlyStats.map(v => v.total)) || 1;
  const heightFactor = 85; 

  // Pre-calculamos los vectores: 
  // Violeta (Empresas) está abajo, así que su cima está en `d.companies`.
  // Azul (Usuarios) está arriba, así que su cima total es `d.total`.
  const pointsCompanies = yearlyStats.map((d, i) => {
    const x = (i + 0.5) * (100 / 12);
    const companiesH = d.total > 0 ? (d.companies / maxVal) * heightFactor : 0;
    return { x, y: 100 - companiesH };
  });

  const pointsUsers = yearlyStats.map((d, i) => {
    const x = (i + 0.5) * (100 / 12);
    const totalH = d.total > 0 ? (d.total / maxVal) * heightFactor : 0;
    return { x, y: 100 - totalH };
  });

  const pathC = `M ${pointsCompanies[0].x} ${pointsCompanies[0].y} ` + pointsCompanies.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ');
  const pathU = `M ${pointsUsers[0].x} ${pointsUsers[0].y} ` + pointsUsers.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsOpen(false); };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; }
  }, [isOpen]);

  return (
    <>
      <button onClick={() => setIsOpen(true)} className="group flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors bg-muted/40 px-3 py-1.5 rounded border border-border/50 hover:border-border">
        <i className="bi bi-arrows-fullscreen"></i>
        <span>Histórico anual combinado</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8 bg-background/80 backdrop-blur-sm lg:pl-[280px]"
          >
            <div className="absolute inset-0" onClick={() => setIsOpen(false)} />
            
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.95 }} transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-5xl h-[80vh] min-h-[550px] bg-card border border-border shadow-2xl rounded-3xl p-6 md:p-10 flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <button onClick={() => setIsOpen(false)} className="absolute top-6 right-6 w-10 h-10 rounded-full bg-muted/50 hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors z-50">
                <i className="bi bi-x-lg text-lg"></i>
              </button>

              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
                <div>
                  <h2 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h2>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-violet-500"/> <span className="text-sm text-muted-foreground">Empresas</span></div>
                    <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-blue-500"/> <span className="text-sm text-muted-foreground">Usuarios</span></div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">Año:</span>
                  <select 
                    value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    className="bg-muted text-base font-medium border-none rounded-lg px-4 py-2 outline-none cursor-pointer focus:ring-2 focus:ring-primary/20"
                  >
                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>

              {/* Contenedor Gráfico Mixto */}
              <div className="flex-1 w-full mt-4 mb-6 relative">
                
                {/* 1. Capa de Líneas Animadas */}
                <motion.div
                  className="absolute inset-0 z-10 pointer-events-none"
                  initial={{ clipPath: 'inset(-5% 100% -5% -5%)' }}
                  animate={{ clipPath: 'inset(-5% -5% -5% -5%)' }}
                  transition={{ duration: 1, delay: 0.6, ease: "easeInOut" }}
                >
                  <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
                     {/* Línea Empresas (Violeta - Cima de las empresas) */}
                     <path d={pathC} fill="none" stroke="#8b5cf6" strokeWidth="2.5" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />
                     {/* Línea Usuarios (Azul - Cima total) */}
                     <path d={pathU} fill="none" stroke="#3b82f6" strokeWidth="2.5" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </motion.div>

                {/* 2. Capa de Puntos HTML Absolutos */}
                <div className="absolute inset-0 z-20 pointer-events-none">
                  {yearlyStats.map((d, i) => {
                    return (
                      <div key={`dots-${i}`}>
                        {d.companies >= 0 && (
                          <motion.div 
                            className="absolute w-2.5 h-2.5 bg-violet-500 rounded-full border-2 border-background -ml-[5px] -mt-[5px] shadow-sm"
                            style={{ left: `${pointsCompanies[i].x}%`, top: `${pointsCompanies[i].y}%` }}
                            initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 1.5, duration: 0.3 }}
                          />
                        )}
                        {d.users >= 0 && (
                          <motion.div 
                            className="absolute w-2.5 h-2.5 bg-blue-500 rounded-full border-2 border-background -ml-[5px] -mt-[5px] shadow-sm"
                            style={{ left: `${pointsUsers[i].x}%`, top: `${pointsUsers[i].y}%` }}
                            initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 1.5, duration: 0.3 }}
                          />
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* 3. Capa de Barras Apiladas (Empresas Abajo, Usuarios Arriba) */}
                <div className="absolute inset-0 flex">
                  {yearlyStats.map((d, i) => {
                    const totalH = d.total > 0 ? (d.total / maxVal) * heightFactor : 0;
                    const userPct = d.total > 0 ? (d.users / d.total) * 100 : 0;
                    const companyPct = d.total > 0 ? (d.companies / d.total) * 100 : 0;

                    return (
                      <div key={`bar-${i}`} className="flex-1 flex flex-col items-center justify-end px-1 sm:px-3 lg:px-6 h-full relative group">
                        
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-full mb-3 bg-card border border-border shadow-2xl rounded-xl py-3 px-4 text-xs whitespace-nowrap z-30 pointer-events-none flex flex-col min-w-[140px]">
                           <span className="font-bold border-b border-border/60 pb-1.5 mb-2 text-center uppercase tracking-widest text-[10px] text-muted-foreground">{d.label} {selectedYear}</span>
                           <div className="flex justify-between items-center mb-1">
                              <span className="text-violet-500 font-bold flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-violet-500"/> Empresas</span>
                              <span className="font-bold tabular-nums ml-4">{d.companies}</span>
                           </div>
                           <div className="flex justify-between items-center mb-2">
                              <span className="text-blue-500 font-bold flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-blue-500"/> Usuarios</span>
                              <span className="font-bold tabular-nums ml-4">{d.users}</span>
                           </div>
                           <div className="flex justify-between items-center pt-2 border-t border-border/60">
                              <span className="text-foreground font-black">Total</span>
                              <span className="font-black tabular-nums text-primary">{d.total}</span>
                           </div>
                        </div>

                        <motion.div 
                          className="w-full max-w-[60px] flex flex-col-reverse rounded-t-[4px] overflow-hidden bg-muted/10 relative z-0"
                          initial={{ height: 0 }}
                          animate={{ height: `${totalH}%` }}
                          transition={{ duration: 0.6, ease: 'easeOut' }}
                        >
                          <div className="w-full bg-violet-500/90 transition-all hover:brightness-110" style={{ height: `${companyPct}%` }} />
                          <div className="w-full bg-blue-500/90 transition-all hover:brightness-110" style={{ height: `${userPct}%` }} />
                        </motion.div>
                        
                        <span className="absolute -bottom-6 text-[10px] sm:text-xs text-muted-foreground capitalize font-medium">{d.label}</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-border/50 flex justify-between items-end">
                <div>
                  <span className="text-sm text-foreground font-medium block">Total incorporaciones</span>
                  <span className="text-xs text-muted-foreground">Suma conjunta del año {selectedYear}</span>
                </div>
                <span className="text-4xl sm:text-5xl font-semibold tabular-nums tracking-tighter">{totalInYear}</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// 3. Mini Gráfica del Dashboard
function AdditionsChart({ users, companies }: { users: Array<{ createdAt: string }>, companies: Array<{ createdAt: string }> }) {
  const combinedTrend = useMemo(() => {
    const result = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const m = d.getMonth();
      const y = d.getFullYear();
      
      const uCount = users.filter(x => {
        const date = new Date(x.createdAt);
        return date.getMonth() === m && date.getFullYear() === y;
      }).length;
      
      const cCount = companies.filter(x => {
        const date = new Date(x.createdAt);
        return date.getMonth() === m && date.getFullYear() === y;
      }).length;

      const total = uCount + cCount;

      result.push({ 
        label: d.toLocaleString('es-ES', { month: 'short' }),
        users: uCount,
        companies: cCount,
        total,
        usersPct: total > 0 ? (uCount / total) * 100 : 0,
        companiesPct: total > 0 ? (cCount / total) * 100 : 0
      });
    }
    return result;
  }, [users, companies]);

  const maxTotal = Math.max(...combinedTrend.map(t => t.total), 1);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-medium text-muted-foreground">Proporción de altas</p>
        <div className="flex gap-4">
           <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-sm bg-violet-500"/> <span className="text-[10px] text-foreground">Empresas</span></div>
           <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-sm bg-blue-500"/> <span className="text-[10px] text-foreground">Usuarios</span></div>
        </div>
      </div>
      
      <div className="flex items-end gap-3 h-36 px-1 mt-2">
        {combinedTrend.map((t, i) => {
          const barHeightPct = t.total > 0 ? Math.max((t.total / maxTotal) * 100, 15) : 0;

          return (
          <div key={i} className="flex-1 flex flex-col justify-end gap-1.5 group relative h-full">
            
            <div className="text-center transition-opacity opacity-0 group-hover:opacity-100">
               <span className="text-[10px] bg-muted text-foreground px-1.5 py-0.5 rounded border border-border/50">
                 {t.total > 0 ? t.total : ''}
               </span>
            </div>
            
            <div className="flex flex-col-reverse w-full justify-start items-center gap-[1px] relative rounded-[3px] overflow-hidden bg-muted/20" style={{ height: `${barHeightPct}%` }}>
              {t.companiesPct > 0 && <motion.div initial={{ height: 0 }} animate={{ height: `${t.companiesPct}%` }} className="w-full bg-violet-500 hover:brightness-110 transition-all" />}
              {t.usersPct > 0 && <motion.div initial={{ height: 0 }} animate={{ height: `${t.usersPct}%` }} className="w-full bg-blue-500 hover:brightness-110 transition-all" />}
            </div>
            
            <span className="text-[10px] text-muted-foreground text-center capitalize">{t.label}</span>
            
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-5 opacity-0 group-hover:opacity-100 transition-opacity bg-card text-xs p-3 rounded-lg border border-border shadow-lg z-10 pointer-events-none whitespace-nowrap min-w-[130px]">
              <p className="border-b border-border/60 mb-2 pb-1 text-center text-muted-foreground capitalize">{t.label}</p>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-violet-500 flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-violet-500"/> Empresas</span>
                <span className="tabular-nums ml-4">{t.companies} <span className="text-[10px] text-muted-foreground ml-1">({Math.round(t.companiesPct)}%)</span></span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-blue-500 flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-blue-500"/> Usuarios</span>
                <span className="tabular-nums ml-4">{t.users} <span className="text-[10px] text-muted-foreground ml-1">({Math.round(t.usersPct)}%)</span></span>
              </div>
            </div>
          </div>
        )})}
      </div>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────
export default function RealTimeStatsPage() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const { onlineUsers, companyOnlineUsers } = useSocket();

  useEffect(() => {
    const saved = localStorage.getItem('user');
    if (saved) setCurrentUser(JSON.parse(saved));
    const token = localStorage.getItem('token');

    fetchWithApiFallback(API_ROUTES.STATS.GET_GENERAL, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(setStats)
      .finally(() => setLoading(false));
  }, []);

  const ov = stats?.overview;
  const role = currentUser?.role ?? 'GENERAL_ADMIN';
  
  const displayOnlineUsers = currentUser?.role === 'GENERAL_ADMIN' ? onlineUsers : companyOnlineUsers;
  
  const userTrend = groupByMonth(stats?.trends?.usersByMonth ?? []);
  const companyTrend = groupByMonth(stats?.trends?.companiesByMonth ?? []);
  
  const userDeparturesData = stats?.workforce?.userDepartures ?? [];
  const companyDeparturesData = stats?.workforce?.companyDepartures ?? [];
  const userDepartureTrend = groupByMonth(userDeparturesData);
  const companyDepartureTrend = groupByMonth(companyDeparturesData);
  
  // SOLUCIÓN AL CONTADOR DE BAJAS: Lee de inactiveUsers o de la longitud del array si está vacío
  const totalUserDepartures = ov?.inactiveUsers ?? userDeparturesData.length;
  const totalCompanyDepartures = ov?.inactiveCompanies ?? companyDeparturesData.length;

  const maxEnrollments = Math.max(...(stats?.top?.courses?.map(c => c._count.Enrollment) ?? [1]), 1);

  return (
    <div className="flex h-screen bg-background font-sans text-foreground overflow-hidden">

      <main className="flex-1 overflow-y-auto no-scrollbar flex flex-col relative">
        <PageHeader
          title="Panel de Control"
          description="Monitoreo de infraestructura y métricas de rendimiento en vivo."
          icon={<i className="bi bi-broadcast"></i>}
        />

        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              layout
              key="skeleton"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="relative flex-1 w-full"
            >
              <div className="absolute top-0 left-0 right-0 z-50 flex justify-center pt-32">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary shadow-lg bg-card/60 backdrop-blur-sm p-1"></div>
              </div>
              
              <div className="opacity-30 pointer-events-none transition-opacity duration-300">
                <StatsSkeleton />
              </div>
            </motion.div>
          ) : (
            <motion.div
              layout
              key="content"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="p-6 lg:p-8 space-y-4 max-w-7xl mx-auto w-full"
            >

              {/* ── LIVE ACTIVITY BAR ─────────────────────────────── */}
              <motion.div
                layout
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card border border-border/50 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4">
                  <div className="relative w-10 h-10 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-30"></span>
                    <span className="relative w-10 h-10 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
                      <i className="bi bi-broadcast text-emerald-500 text-base"></i>
                    </span>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-500 mb-0.5">Live Activity</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-semibold tabular-nums tracking-tighter">{displayOnlineUsers}</span>
                      <span className="text-sm text-muted-foreground">
                        {displayOnlineUsers === 1 ? 'usuario conectado' : 'usuarios conectados'} ahora mismo
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-6 text-[11px] sm:border-l sm:border-border/50 sm:pl-6">
                  <div>
                    <p className="text-muted-foreground uppercase tracking-widest font-medium mb-0.5">Sistema</p>
                    <div className="flex items-center gap-1.5">
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      <span className="font-medium uppercase tracking-tight">Operativo</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-muted-foreground uppercase tracking-widest font-medium mb-0.5">Solicitudes</p>
                    <span className={`tabular-nums ${(ov?.pendingRequests ?? 0) > 0 ? 'text-red-400' : 'text-muted-foreground'}`}>
                      {ov?.pendingRequests ?? 0} pendientes
                    </span>
                  </div>
                  <div>
                    <p className="text-muted-foreground uppercase tracking-widest font-medium mb-0.5">Progreso medio</p>
                    <span className="tabular-nums">{ov?.avgProgress ?? 0}%</span>
                  </div>
                </div>
              </motion.div>

              {/* ── KPI GRID ──────────────────────────────────────── */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <KpiCard label="Empresas" value={ov?.totalCompanies ?? 0} icon="bi-buildings-fill" color="bg-violet-500/10 text-violet-400" />
                <KpiCard label="Usuarios" value={ov?.totalUsers ?? 0} icon="bi-people-fill" color="bg-blue-500/10 text-blue-400" />
                <KpiCard label="Cursos" value={ov?.totalCourses ?? 0} icon="bi-journal-bookmark-fill" color="bg-amber-500/10 text-amber-400" />
                <KpiCard label="Matrículas" value={ov?.totalEnrollments ?? 0} icon="bi-mortarboard-fill" color="bg-orange-500/10 text-orange-400" />
                <KpiCard label="Documentos" value={ov?.totalDocuments ?? 0} icon="bi-folder-fill" color="bg-cyan-500/10 text-cyan-400" />
                <KpiCard label="Servicios" value={ov?.totalServices ?? 0} icon="bi-briefcase-fill" color="bg-pink-500/10 text-pink-400" />
              </div>

              {/* ── SECCIÓN: USUARIOS & EMPRESAS (ALTAS) ──────────── */}
              <Section title="Usuarios y Empresas" icon="bi-people-fill" iconColor="bg-blue-500/10 text-blue-400" delay={0.1}>
                <div className="space-y-8">
                  
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center border-b border-border/40 pb-6">
                    <div className="lg:col-span-1">
                      <h4 className="text-sm font-medium tracking-tight mb-1">Crecimiento de red</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                        Balance entre altas de empresas y registros de nuevos usuarios.
                      </p>
                      <CombinedYearlyHistorySelector 
                        users={stats?.trends?.usersByMonth || []} 
                        companies={stats?.trends?.companiesByMonth || []} 
                        title="Crecimiento global de Atalayas"
                      />
                    </div>
                    <div className="lg:col-span-2 bg-muted/20 p-5 rounded-2xl border border-border/40">
                      <AdditionsChart users={stats?.trends?.usersByMonth || []} companies={stats?.trends?.companiesByMonth || []} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                    <div className="flex flex-col gap-3">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Composición de red</p>
                      <DonutChart
                        centerValue={ov?.totalUsers ?? 0}
                        label="Usuarios"
                        segments={[
                          { label: 'Empleados', value: ov?.totalEmployees ?? 0, color: '#10b981' },
                          { label: 'Admins', value: ov?.totalAdmins ?? 0, color: '#3b82f6' },
                          { label: 'Invitados', value: Math.max(0, (ov?.totalUsers ?? 0) - (ov?.totalEmployees ?? 0) - (ov?.totalAdmins ?? 0)), color: '#a855f7' },
                        ]}
                      />
                    </div>

                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Usuarios / mes</p>
                        <YearlyHistorySelector data={stats?.trends?.usersByMonth || []} title="Altas de Usuarios" theme="blue" />
                      </div>
                      <MiniLineChart data={userTrend} theme="blue" />
                    </div>

                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Empresas / mes</p>
                        <YearlyHistorySelector data={stats?.trends?.companiesByMonth || []} title="Altas de Empresas" theme="violet" />
                      </div>
                      <MiniLineChart data={companyTrend} theme="violet" />
                    </div>
                  </div>
                </div>
              </Section>

              {/* ── SECCIÓN NUEVA: DESVINCULACIONES Y BAJAS ───────── */}
              <Section title="Desvinculaciones y Bajas" icon="bi-person-dash-fill" iconColor="bg-rose-500/10 text-rose-500" delay={0.2}>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                  <div className="flex flex-col gap-4 border-b lg:border-b-0 lg:border-r border-border/40 pb-6 lg:pb-0 lg:pr-8">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-rose-500" />
                          <h4 className="text-sm font-medium tracking-tight">Bajas de Usuarios</h4>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 ml-4">Usuarios desactivados o eliminados — últimos 6 meses</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-2xl font-semibold tabular-nums tracking-tighter">{totalUserDepartures}</span>
                        <YearlyHistorySelector data={userDeparturesData} title="Histórico de Bajas (Usuarios)" theme="rose" />
                      </div>
                    </div>
                    <MiniLineChart data={userDepartureTrend} theme="rose" />
                  </div>
                  
                  <div className="flex flex-col gap-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-red-600" />
                          <h4 className="text-sm font-medium tracking-tight">Bajas de Empresas</h4>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 ml-4">Empresas dadas de baja — últimos 6 meses</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-2xl font-semibold tabular-nums tracking-tighter">{totalCompanyDepartures}</span>
                        <YearlyHistorySelector data={companyDeparturesData} title="Histórico de Bajas (Empresas)" theme="rose" />
                      </div>
                    </div>
                    <MiniLineChart data={companyDepartureTrend} theme="rose" />
                  </div>
                </div>
              </Section>

              {/* ── SECCIÓN: FORMACIÓN ────────────────────────────── */}
              <Section title="Formación y Cursos" icon="bi-mortarboard-fill" iconColor="bg-amber-500/10 text-amber-400" delay={0.3}>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                  <div className="flex flex-col gap-3">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Estado de matrículas</p>
                    <DonutChart
                      centerValue={ov?.totalEnrollments ?? 0}
                      label="Matrículas"
                      segments={[
                        { label: 'Completados', value: ov?.completedEnrollments ?? 0, color: '#f59e0b' },
                        { label: 'En proceso', value: (ov?.totalEnrollments ?? 0) - (ov?.completedEnrollments ?? 0), color: '#334155' },
                      ]}
                    />
                  </div>

                  <div className="flex flex-col gap-3">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest">KPIs de formación</p>
                    <div className="space-y-3">
                      {[
                        { label: 'Tasa de finalización', value: `${ov?.completionRate ?? 0}%`, bar: ov?.completionRate ?? 0, color: 'bg-amber-500' },
                        { label: 'Progreso medio', value: `${ov?.avgProgress ?? 0}%`, bar: ov?.avgProgress ?? 0, color: 'bg-orange-500' },
                        { label: 'Cursos públicos', value: `${ov?.publicCourses ?? 0} / ${ov?.totalCourses ?? 0}`, bar: ov?.totalCourses ? Math.round(((ov?.publicCourses ?? 0) / ov.totalCourses) * 100) : 0, color: 'bg-yellow-500' },
                      ].map((item, i) => (
                        <div key={i}>
                          <div className="flex justify-between text-[11px] mb-1">
                            <span className="text-muted-foreground">{item.label}</span>
                            <span className="tabular-nums">{item.value}</span>
                          </div>
                          <div className="h-1 bg-muted rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${item.bar}%` }}
                              transition={{ delay: 0.1 * i, duration: 0.6, ease: 'easeOut' }}
                              className={`h-full rounded-full ${item.color}`}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Top cursos por matrículas</p>
                    <div className="space-y-2">
                      {stats?.top?.courses?.slice(0, 5).map((c, i) => (
                        <div key={c.id} className="flex items-center gap-2">
                          <span className="text-[10px] font-semibold text-muted-foreground w-4 text-right">{i + 1}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between text-[11px] mb-0.5">
                              <span className="truncate text-foreground/80">{c.title}</span>
                              <span className="tabular-nums ml-2 shrink-0">{c._count.Enrollment}</span>
                            </div>
                            <div className="h-1 bg-muted rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${(c._count.Enrollment / maxEnrollments) * 100}%` }}
                                transition={{ delay: 0.08 * i, duration: 0.5, ease: 'easeOut' }}
                                className="h-full bg-amber-500/70 rounded-full"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Section>

              {/* ── SECCIÓN: ACTIVIDAD RECIENTE ───────────────────── */}
              <Section title="Actividad Reciente" icon="bi-clock-history" iconColor="bg-emerald-500/10 text-emerald-400" delay={0.4}>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-3">Últimos registros</p>
                    <div className="space-y-2">
                      {stats?.recent?.users?.map((u) => (
                        <div key={u.id} className="flex items-center gap-3 py-2 border-b border-border/30 last:border-0">
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0 overflow-hidden border border-border/50">
                            {u.avatarUrl
                              ? <img src={u.avatarUrl} alt={u.name} className="w-full h-full object-cover" />
                              : <span className="text-xs font-semibold text-muted-foreground">{u.name?.charAt(0)}</span>
                            }
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[12px] font-medium truncate">{u.name}</p>
                            <p className="text-[10px] text-muted-foreground truncate">{u.Company?.name ?? u.email}</p>
                          </div>
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            <span className={`text-[9px] uppercase px-1.5 py-0.5 rounded ${roleColor[u.role] ?? 'text-gray-400 bg-gray-400/10'}`}>
                              {roleLabel[u.role] ?? u.role}
                            </span>
                            <span className="text-[9px] text-muted-foreground">{timeAgo(u.createdAt)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-3">Últimos cursos creados</p>
                    <div className="space-y-2">
                      {stats?.recent?.courses?.map((c) => (
                        <div key={c.id} className="flex items-center gap-3 py-2 border-b border-border/30 last:border-0">
                          <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0 border border-amber-500/20">
                            <i className="bi bi-journal-bookmark-fill text-amber-400 text-xs"></i>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[12px] font-medium truncate">{c.title}</p>
                            <p className="text-[10px] text-muted-foreground truncate">{c.Company?.name ?? (c.category ?? 'Sin categoría')}</p>
                          </div>
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            <span className={`text-[9px] uppercase px-1.5 py-0.5 rounded ${c.isPublic ? 'text-emerald-400 bg-emerald-400/10' : 'text-gray-400 bg-gray-400/10'}`}>
                              {c.isPublic ? 'Público' : 'Privado'}
                            </span>
                            <span className="text-[9px] text-muted-foreground">{timeAgo(c.createdAt)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Section>

              {/* ── SECCIÓN: GESTIÓN DE ACCESO ────────────────────── */}
              <Section title="Gestión de Acceso" icon="bi-shield-lock-fill" iconColor="bg-red-500/10 text-red-400" defaultOpen={(ov?.pendingRequests ?? 0) > 0} delay={0.5}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-4xl font-semibold tabular-nums tracking-tighter">
                      {ov?.pendingRequests ?? 0}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {(ov?.pendingRequests ?? 0) === 0
                        ? 'No hay solicitudes pendientes de revisión.'
                        : `solicitud${(ov?.pendingRequests ?? 0) > 1 ? 'es' : ''} pendiente${(ov?.pendingRequests ?? 0) > 1 ? 's' : ''} de aprobación`}
                    </p>
                  </div>
                  {(ov?.pendingRequests ?? 0) > 0 && (
                    <a
                      href="/dashboard/administrator/general-admin/company-request"
                      className="text-[11px] font-medium bg-red-500/10 text-red-400 border border-red-500/20 px-4 py-2 rounded-xl hover:bg-red-500/20 transition-colors"
                    >
                      Revisar ahora <i className="bi bi-arrow-right ml-1"></i>
                    </a>
                  )}
                </div>
              </Section>

            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}