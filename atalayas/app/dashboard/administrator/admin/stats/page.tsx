'use client';

import { useEffect, useState, useMemo } from 'react';
import Sidebar from '@/components/ui/Sidebar';
import PageHeader from '@/components/ui/pageHeader';
import { API_ROUTES, fetchWithApiFallback } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '@/app/providers/SocketProvider';
import Link from 'next/link';

// ── Tipos e Interfaces ────────────────────────────────────────────────────
interface Overview {
  totalUsers: number;
  totalCourses: number;
  totalEnrollments: number;
  completedEnrollments: number;
  totalDocuments: number;
  avgProgress: number;
  completionRate: number;
}

interface TopCourse {
  id: string;
  title: string;
  _count: { Enrollment: number };
}

interface TrendEntry {
  createdAt: string;
}

interface RoleDist {
  jobRole: string;
  _count: number;
}

interface StatsData {
  overview: Overview;
  top: { courses: TopCourse[] };
  trends: { usersByMonth: TrendEntry[] };
  onboarding: { finished: number; total: number };
  suggestions: { pending: number };
  roles: RoleDist[];
  workforce: {
    hires: TrendEntry[];
    userDepartures: TrendEntry[];
    companyDepartures: TrendEntry[];
  };
}

// ── Utilidades ────────────────────────────────────────────────────────────
const MONTHS_ES = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
];

function groupByMonth(items: TrendEntry[] = []) {
  const result: { label: string; value: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const label = MONTHS_ES[d.getMonth()];
    const count = items.filter((e) => {
      const ed = new Date(e.createdAt);
      return (
        ed.getMonth() === d.getMonth() &&
        ed.getFullYear() === d.getFullYear()
      );
    }).length;
    result.push({ label, value: count });
  }
  return result;
}

function processYearlyData(items: TrendEntry[], targetYear: number) {
  const counts = new Array(12).fill(0);
  items.forEach((item) => {
    const d = new Date(item.createdAt);
    if (d.getFullYear() === targetYear) {
      counts[d.getMonth()]++;
    }
  });
  return MONTHS_ES.map((label, i) => ({ label, value: counts[i] }));
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
          <div className="space-y-1.5">
            <div className="h-2 bg-muted rounded w-16" />
            <div className="h-3.5 bg-muted rounded w-20" />
          </div>
          <div className="space-y-1.5">
            <div className="h-2 bg-muted rounded w-16" />
            <div className="h-3.5 bg-muted rounded w-12" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-card border border-border/50 rounded-2xl p-5 flex flex-col gap-3">
            <div className="w-9 h-9 rounded-xl bg-muted" />
            <div className="space-y-1.5">
              <div className="h-7 bg-muted rounded w-16" />
              <div className="h-2.5 bg-muted rounded w-20" />
            </div>
          </div>
        ))}
      </div>
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-card border border-border/50 rounded-2xl">
          <div className="p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-muted" />
              <div className="h-4 bg-muted rounded w-40" />
            </div>
            <div className="w-4 h-4 bg-muted rounded" />
          </div>
          {i < 2 && (
            <div className="px-5 pb-5 border-t border-border/40 pt-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div className="space-y-3">
                  <div className="h-4 bg-muted rounded w-48" />
                  <div className="h-3 bg-muted rounded w-64" />
                  <div className="h-16 bg-muted rounded-xl mt-4" />
                  <div className="flex justify-between mt-2">
                    {[...Array(6)].map((_, j) => (
                      <div key={j} className="h-2 bg-muted rounded w-6" />
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="h-2.5 bg-muted rounded w-32" />
                  {[...Array(4)].map((_, j) => (
                    <div key={j} className="space-y-1">
                      <div className="flex justify-between">
                        <div className="h-3 bg-muted rounded w-28" />
                        <div className="h-3 bg-muted rounded w-6" />
                      </div>
                      <div className="h-1.5 bg-muted rounded-full w-full" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Componentes ───────────────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  icon,
  color,
  sub,
  delay = 0,
}: {
  label: string;
  value: number | string;
  icon: string;
  color: string;
  sub?: string;
  delay?: number;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut', delay }}
      className="bg-card border border-border/50 rounded-2xl p-5 flex flex-col gap-3 hover:border-border hover:shadow-lg transition-all"
    >
      <div className="flex items-center justify-between">
        <span className={`w-9 h-9 rounded-xl flex items-center justify-center text-base ${color}`}>
          <i className={`bi ${icon}`}></i>
        </span>
        {sub && (
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">
            {sub}
          </span>
        )}
      </div>
      <div>
        <p className="text-3xl font-semibold tabular-nums tracking-tighter">{value}</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">{label}</p>
      </div>
    </motion.div>
  );
}

function MiniLineChart({
  data,
  theme,
}: {
  data: { label: string; value: number }[];
  theme: 'blue' | 'violet' | 'rose';
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const total = data.reduce((sum, d) => sum + d.value, 0) || 1;

  const colors = {
    blue: { stroke: '#3b82f6', fill: 'rgba(59, 130, 246, 0.15)' },
    violet: { stroke: '#8b5cf6', fill: 'rgba(139, 92, 246, 0.15)' },
    rose: { stroke: '#f43f5e', fill: 'rgba(244, 63, 94, 0.15)' },
  };

  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - (d.value / max) * 80;
    return { x, y, value: d.value, label: d.label, pct: (d.value / total) * 100 };
  });

  const pathD =
    `M ${points[0].x} ${points[0].y} ` +
    points.slice(1).map((p) => `L ${p.x} ${p.y}`).join(' ');
  const areaD = `${pathD} L 100 100 L 0 100 Z`;

  return (
    <div className="flex flex-col mt-2">
      <div className="relative h-16 w-full px-2">
        <svg
          viewBox="0 0 100 100"
          className="absolute inset-0 w-full h-full overflow-visible"
          preserveAspectRatio="none"
        >
          <path d={areaD} fill={colors[theme].fill} stroke="none" />
          <path
            d={pathD}
            fill="none"
            stroke={colors[theme].stroke}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
        {points.map((p, i) => (
          <div key={i} className="absolute group z-10" style={{ left: `${p.x}%`, top: `${p.y}%` }}>
            <div
              className="w-2.5 h-2.5 -ml-5px -mt-5px rounded-full bg-background border-2 transition-transform duration-200 group-hover:scale-[1.8] cursor-pointer"
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
          <span key={i} className="text-[9px] text-muted-foreground font-medium capitalize">
            {d.label}
          </span>
        ))}
      </div>
    </div>
  );
}

function DonutChart({
  segments,
  centerValue,
  label,
}: {
  segments: Array<{ label: string; value: number; color: string }>;
  centerValue: number | string;
  label: string;
}) {
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
            return (
              <path
                key={i}
                d={`M ${x1} ${y1} A 1 1 0 ${large} 1 ${x2} ${y2} L 0 0`}
                fill={seg.color}
                className="stroke-card stroke-[0.04]"
              />
            );
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
              <span className="text-[11px] font-medium tabular-nums ml-auto">
                {Math.round((seg.value / total) * 100)}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Section con animación de entrada ─────────────────────────────────────
function Section({
  title,
  icon,
  iconColor,
  defaultOpen = true,
  delay = 0,
  children,
}: {
  title: string;
  icon: string;
  iconColor: string;
  defaultOpen?: boolean;
  delay?: number;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut', delay }}
      className="bg-card border border-border/50 rounded-2xl overflow-hidden"
    >
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between p-5 hover:bg-muted/30 transition-colors group"
      >
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

// ── Modal Histórico ───────────────────────────────────────────────────────
function YearlyHistorySelector({
  data,
  title,
  theme,
  }: {
  data: TrendEntry[];
  title: string;
  theme: 'blue' | 'violet' | 'rose';
}) {
  const [isOpen, setIsOpen] = useState(false);
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);

  const years = useMemo(
    () => Array.from({ length: 5 }, (_, i) => currentYear - i),
    [currentYear],
  );
  const yearlyStats = useMemo(
    () => processYearlyData(data, selectedYear),
    [data, selectedYear],
  );
  const totalInYear = yearlyStats.reduce((acc, curr) => acc + curr.value, 0);

  const themeColors = {
    blue: { stroke: '#3b82f6', bg: 'bg-blue-500' },
    violet: { stroke: '#8b5cf6', bg: 'bg-violet-500' },
    rose: { stroke: '#f43f5e', bg: 'bg-rose-500' },
  };
  const c = themeColors[theme];

  const maxVal = Math.max(...yearlyStats.map((v) => v.value)) || 1;
  const heightFactor = 85;

  const points = yearlyStats.map((d, i) => {
    const x = (i + 0.5) * (100 / 12);
    const h = d.value > 0 ? Math.max((d.value / maxVal) * heightFactor, 3) : 0;
    return { x, y: 100 - h };
  });

  const pathD =
    `M ${points[0].x} ${points[0].y} ` +
    points.slice(1).map((p) => `L ${p.x} ${p.y}`).join(' ');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsOpen(false); };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="group flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors bg-muted/40 px-3 py-1.5 rounded border border-border/50 hover:border-border"
      >
        <i className="bi bi-arrows-fullscreen"></i>
        <span>Histórico anual</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-100 flex items-center justify-center p-4 sm:p-8 bg-background/80 backdrop-blur-sm lg:pl-280px"
          >
            <div className="absolute inset-0" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-5xl h-[80vh] min-h-500px bg-card border border-border shadow-2xl rounded-3xl p-6 md:p-10 flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setIsOpen(false)}
                className="absolute top-6 right-6 w-10 h-10 rounded-full bg-muted/50 hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors z-50"
              >
                <i className="bi bi-x-lg text-lg"></i>
              </button>

              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
                <div>
                  <h2 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h2>
                  <p className="text-sm text-muted-foreground mt-1">Desglose mensual de actividad en tu empresa</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">Año:</span>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    className="bg-muted text-base font-medium border-none rounded-lg px-4 py-2 outline-none cursor-pointer focus:ring-2 focus:ring-primary/20"
                  >
                    {years.map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex-1 w-full mt-4 mb-6 relative">
                <motion.div
                  className="absolute inset-0 z-10 pointer-events-none"
                  initial={{ clipPath: 'inset(-5% 100% -5% -5%)' }}
                  animate={{ clipPath: 'inset(-5% -5% -5% -5%)' }}
                  transition={{ duration: 1, delay: 0.6, ease: 'easeInOut' }}
                >
                  <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
                    <path
                      d={pathD}
                      fill="none"
                      stroke={c.stroke}
                      strokeWidth="2.5"
                      vectorEffect="non-scaling-stroke"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </motion.div>

                <div className="absolute inset-0 z-20 pointer-events-none">
                  {yearlyStats.map(
                    (d, i) =>
                      d.value >= 0 && (
                        <motion.div
                          key={`dot-${i}`}
                          className={`absolute w-2.5 h-2.5 ${c.bg} rounded-full border-2 border-background -ml-5px -mt-5px shadow-sm`}
                          style={{ left: `${points[i].x}%`, top: `${points[i].y}%` }}
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: 1.5, duration: 0.3 }}
                        />
                      ),
                  )}
                </div>

                <div className="absolute inset-0 flex">
                  {yearlyStats.map((d, i) => {
                    const heightPct = d.value > 0 ? Math.max((d.value / maxVal) * heightFactor, 3) : 0;
                    return (
                      <div
                        key={i}
                        className="flex-1 flex flex-col items-center gap-3 group relative h-full justify-end px-1 sm:px-3 lg:px-6"
                      >
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-full mb-4 bg-popover border border-border shadow-xl rounded-lg py-2 px-4 text-sm font-medium whitespace-nowrap z-30 pointer-events-none">
                          {d.value} {d.value === 1 ? 'registro' : 'registros'}
                        </div>
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: `${heightPct}%` }}
                          transition={{ duration: 0.6, ease: 'easeOut' }}
                          className={`w-full max-w-80px rounded-t-lg transition-all hover:brightness-110 ${c.bg}`}
                        />
                        <span className="absolute -bottom-6 text-xs sm:text-sm text-muted-foreground capitalize font-medium">
                          {d.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-border/50 flex justify-between items-end">
                <div>
                  <span className="text-sm text-foreground font-medium block">Total consolidado</span>
                  <span className="text-xs text-muted-foreground">Suma del año {selectedYear}</span>
                </div>
                <span className="text-4xl sm:text-5xl font-semibold tabular-nums tracking-tighter">
                  {totalInYear}
                </span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ── Página principal ──────────────────────────────────────────────────────
export default function CompanyAdminStatsPage() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const { onlineUsers } = useSocket();

  useEffect(() => {
    const token =
      typeof window !== 'undefined' ? localStorage.getItem('token') : '';
    fetchWithApiFallback(API_ROUTES.STATS.GET_ADMIN, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((data) => setStats(data))
      .catch((err) => console.error('Error cargando estadísticas:', err))
      .finally(() => setLoading(false));
  }, []);

  const ov = stats?.overview;
  const onboarding = stats?.onboarding || { finished: 0, total: 0 };
  const suggestions = stats?.suggestions || { pending: 0 };
  const userTrend = groupByMonth(stats?.trends?.usersByMonth || []);
  const rolesData = stats?.roles || [];
  const maxEnrollments = Math.max(
    ...(stats?.top?.courses.map((c) => c._count.Enrollment) ?? [1]),
    1,
  );
  const hireTrend = groupByMonth(stats?.workforce?.hires ?? []);
  const departureTrend = groupByMonth(stats?.workforce?.userDepartures ?? []);
  const totalHires = stats?.workforce?.hires?.length ?? 0;
  const totalDepartures = stats?.workforce?.userDepartures?.length ?? 0;

  const kpiCards = [
    { label: 'Empleados', value: ov?.totalUsers ?? 0, icon: 'bi-people-fill', color: 'bg-blue-500/10 text-blue-400' },
    { label: 'Cursos Activos', value: ov?.totalCourses ?? 0, icon: 'bi-journal-bookmark-fill', color: 'bg-amber-500/10 text-amber-400' },
    { label: 'Matrículas', value: ov?.totalEnrollments ?? 0, icon: 'bi-mortarboard-fill', color: 'bg-orange-500/10 text-orange-400' },
    { label: 'Documentos', value: ov?.totalDocuments ?? 0, icon: 'bi-folder-fill', color: 'bg-cyan-500/10 text-cyan-400' },
    { label: 'Onboarding', value: `${onboarding.finished}/${onboarding.total}`, icon: 'bi-person-check-fill', color: 'bg-emerald-500/10 text-emerald-400' },
    { label: 'Sugerencias', value: suggestions.pending, icon: 'bi-chat-left-dots-fill', color: 'bg-pink-500/10 text-pink-400' },
  ];

  return (
    <div className="flex h-screen bg-background font-sans text-foreground">

      <main className="flex-1 min-h-0 overflow-y-auto no-scrollbar flex flex-col relative">
        <PageHeader
          title="Estadísticas de Empresa"
          description="Monitorea el progreso de formación, onboarding y actividad de tu plantilla en tiempo real."
          icon={<i className="bi bi-bar-chart-fill"></i>}
        />

        {/* ── LOADING SKELETON + SPINNER ────────────────────────── */}
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
              {/* LA RUEDITA: Arriba, centrada horizontalmente, con pt-32 para separarlo del header */}
              <div className="absolute top-0 left-0 right-0 z-50 flex justify-center pt-32">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary shadow-lg bg-card/60 backdrop-blur-sm p-1"></div>
              </div>
              
              {/* SKELETON: Debajo y opacado */}
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
              {/* ── LIVE ACTIVITY BAR ─────────────────────────── */}
              <motion.div
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: 'easeOut', delay: 0 }}
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
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-500 mb-0.5">
                      Live Activity
                    </p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-semibold tabular-nums tracking-tighter">
                        {onlineUsers || 0}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        empleado{onlineUsers !== 1 ? 's' : ''} en línea
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-6 text-[11px] sm:border-l sm:border-border/50 sm:pl-6">
                  <div>
                    <p className="text-muted-foreground uppercase tracking-widest font-medium mb-0.5">Sugerencias</p>
                    <span className={`tabular-nums ${suggestions.pending > 0 ? 'text-amber-500' : 'text-muted-foreground'}`}>
                      {suggestions.pending} pendientes
                    </span>
                  </div>
                  <div>
                    <p className="text-muted-foreground uppercase tracking-widest font-medium mb-0.5">Progreso medio</p>
                    <span className="tabular-nums">{ov?.avgProgress ?? 0}%</span>
                  </div>
                </div>
              </motion.div>

              {/* ── KPI GRID ──────────────────────────────────── */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {kpiCards.map((card, i) => (
                  <KpiCard key={i} {...card} delay={0.05 + 0.05 * i} />
                ))}
              </div>

              {/* ── EQUIPO Y ROLES ────────────────────────────── */}
              <Section title="Equipo y Distribución" icon="bi-person-vcard-fill" iconColor="bg-blue-500/10 text-blue-400" delay={0.3}>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                  <div className="flex flex-col gap-4 border-b lg:border-b-0 lg:border-r border-border/40 pb-6 lg:pb-0 lg:pr-8">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="text-sm font-medium tracking-tight">Crecimiento de Plantilla</h4>
                        <p className="text-xs text-muted-foreground mt-1">Registros de empleados en tu empresa.</p>
                      </div>
                      <YearlyHistorySelector data={stats?.trends.usersByMonth || []} title="Histórico de Plantilla" theme="blue" />
                    </div>
                    <div className="mt-auto">
                      <MiniLineChart data={userTrend} theme="blue" />
                    </div>
                  </div>
                  <div className="flex flex-col gap-3">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Distribución por Cargos</p>
                    <div className="space-y-3">
                      {rolesData.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No hay roles asignados aún.</p>
                      ) : (
                        rolesData.map((r, i) => (
                          <div key={i} className="group">
                            <div className="flex justify-between text-[11px] mb-1">
                              <span className="truncate text-foreground/90 font-medium">{r.jobRole || 'Sin asignar'}</span>
                              <span className="tabular-nums font-semibold">{r._count}</span>
                            </div>
                            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${(r._count / (ov?.totalUsers || 1)) * 100}%` }}
                                transition={{ delay: 0.1 * i, duration: 0.6, ease: 'easeOut' }}
                                className="h-full bg-blue-500/80 group-hover:bg-blue-500 transition-colors"
                              />
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </Section>

              {/* ── MOVIMIENTO DE PLANTILLA ───────────────────── */}
              <Section title="Movimiento de Plantilla" icon="bi-arrow-left-right" iconColor="bg-violet-500/10 text-violet-400" delay={0.35}>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                  <div className="flex flex-col gap-4 border-b lg:border-b-0 lg:border-r border-border/40 pb-6 lg:pb-0 lg:pr-8">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          <h4 className="text-sm font-medium tracking-tight">Altas</h4>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 ml-4">Nuevas incorporaciones — últimos 6 meses</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-2xl font-semibold tabular-nums tracking-tighter">{totalHires}</span>
                        <YearlyHistorySelector data={stats?.workforce?.hires ?? []} title="Histórico de Altas" theme="blue" />
                      </div>
                    </div>
                    <MiniLineChart data={hireTrend} theme="blue" />
                  </div>
                  <div className="flex flex-col gap-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-rose-500" />
                          <h4 className="text-sm font-medium tracking-tight">Bajas</h4>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 ml-4">Empleados que causaron baja — últimos 6 meses</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-2xl font-semibold tabular-nums tracking-tighter">{totalDepartures}</span>
                        <YearlyHistorySelector data={stats?.workforce?.userDepartures ?? []} title="Histórico de Bajas" theme="rose" />
                      </div>
                    </div>
                    <MiniLineChart data={departureTrend} theme="rose" />
                  </div>
                </div>
              </Section>

              {/* ── FORMACIÓN ACADÉMICA ───────────────────────── */}
              <Section title="Formación Académica" icon="bi-mortarboard-fill" iconColor="bg-amber-500/10 text-amber-400" delay={0.4}>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                  <div className="flex flex-col gap-3">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Estado de matrículas</p>
                    <DonutChart
                      centerValue={ov?.totalEnrollments ?? 0}
                      label="Matrículas"
                      segments={[
                        { label: 'Completados', value: ov?.completedEnrollments ?? 0, color: '#f59e0b' },
                        { label: 'En proceso', value: Math.max(0, (ov?.totalEnrollments ?? 0) - (ov?.completedEnrollments ?? 0)), color: '#334155' },
                      ]}
                    />
                  </div>
                  <div className="flex flex-col gap-3">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Rendimiento global</p>
                    <div className="space-y-3">
                      {[
                        { label: 'Tasa de finalización', value: `${ov?.completionRate ?? 0}%`, bar: ov?.completionRate ?? 0, color: 'bg-amber-500' },
                        { label: 'Progreso medio', value: `${ov?.avgProgress ?? 0}%`, bar: ov?.avgProgress ?? 0, color: 'bg-orange-500' },
                      ].map((item, i) => (
                        <div key={i}>
                          <div className="flex justify-between text-[11px] mb-1">
                            <span className="text-muted-foreground">{item.label}</span>
                            <span className="tabular-nums">{item.value}</span>
                          </div>
                          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
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
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Top cursos en tu empresa</p>
                    <div className="space-y-2">
                      {stats?.top.courses.length === 0 ? (
                        <p className="text-xs text-muted-foreground mt-2">No hay matrículas en cursos todavía.</p>
                      ) : (
                        stats?.top.courses.slice(0, 5).map((c, i) => (
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
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </Section>

              {/* ── FEEDBACK Y BIENVENIDA ─────────────────────── */}
              <Section title="Feedback y Bienvenida" icon="bi-stars" iconColor="bg-pink-500/10 text-pink-400" defaultOpen={suggestions.pending > 0} delay={0.45}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                  <div className="flex flex-col gap-4 sm:border-r border-border/40 sm:pr-8">
                    <div>
                      <h4 className="text-sm font-medium tracking-tight">Onboarding de Plantilla</h4>
                      <p className="text-xs text-muted-foreground mt-1">Progreso de adaptación de los empleados.</p>
                    </div>
                    <div className="flex items-center gap-6 mt-2">
                      <DonutChart
                        centerValue={`${Math.round((onboarding.total > 0 ? onboarding.finished / onboarding.total : 0) * 100)}%`}
                        label="Completado"
                        segments={[
                          { label: 'Finalizado', value: onboarding.finished, color: '#10b981' },
                          { label: 'Pendiente', value: Math.max(0, onboarding.total - onboarding.finished), color: '#334155' },
                        ]}
                      />
                    </div>
                  </div>
                  <div className="flex flex-col justify-center gap-2">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-pink-500">Buzón de Sugerencias</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl font-semibold tabular-nums tracking-tighter">{suggestions.pending}</span>
                      <span className="text-sm text-muted-foreground">sin leer</span>
                    </div>
                    {suggestions.pending > 0 ? (
                      <p className="text-xs text-muted-foreground mt-1 max-w-250px">Tienes nuevos mensajes de tu equipo esperando revisión.</p>
                    ) : (
                      <p className="text-xs text-muted-foreground mt-1 max-w-250px">Tu buzón de sugerencias está al día. ¡Buen trabajo!</p>
                    )}
                    {suggestions.pending > 0 && (
                      <div className="mt-4">
                        <Link
                          href="/dashboard/administrator/admin/suggestions"
                          className="inline-flex items-center gap-2 text-xs font-medium bg-pink-500/10 text-pink-500 border border-pink-500/20 px-4 py-2 rounded-xl hover:bg-pink-500/20 transition-colors"
                        >
                          Ir al buzón <i className="bi bi-arrow-right"></i>
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </Section>

            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}