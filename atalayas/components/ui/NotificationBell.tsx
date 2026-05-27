"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

interface NotificationBellProps {
  unreadCount: number;
  onReset: () => void;
  latestItems: any[];
  lastResetDate: Date | null;
}

export default function NotificationBell({
  unreadCount,
  onReset,
  latestItems,
  lastResetDate,
}: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);

  // 1. Inicializamos la fecha de corte local intentando leer de localStorage
  const [localResetDate, setLocalResetDate] = useState<Date | null>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("bell_cutoff_date");
      return saved ? new Date(saved) : lastResetDate;
    }
    return lastResetDate;
  });

  const [itemsToShow, setItemsToShow] = useState<any[]>([]);
  const hasInitialized = useRef(false);

  const filterByDate = (items: any[], cutoff: Date | null) => {
    if (!cutoff) return items;
    return items.filter(
      (item) => new Date(item.date).getTime() > cutoff.getTime()
    );
  };

  // Sincronizar el snapshot inicial cuando cargan los ítems
  useEffect(() => {
    if (latestItems.length > 0) {
      setItemsToShow(filterByDate(latestItems, localResetDate));
    }
  }, [latestItems, localResetDate]); 

  const handleOpen = () => {
    if (!isOpen) {
      // Capturar lo que es nuevo HASTA este momento exacto
      const snapshot = filterByDate(latestItems, localResetDate);
      setItemsToShow(snapshot);

      // Avanzar la fecha de corte a AHORA
      const now = new Date();
      setLocalResetDate(now);
      
      // 2. PERSISTENCIA: Guardamos la fecha exacta en el navegador para que sobreviva al reinicio
      localStorage.setItem("bell_cutoff_date", now.toISOString());

      if (unreadCount > 0) onReset();
    }
    setIsOpen((prev) => !prev);
  };

  const formatTimeAgo = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Ahora';
    if (diffInSeconds < 3600) return `Hace ${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400) return `Hace ${Math.floor(diffInSeconds / 3600)}h`;
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  };

  return (
    // ... Tu JSX se mantiene exactamente igual ...
    <div className="relative">
      <button onClick={handleOpen} className="relative w-10 h-10 rounded-xl flex items-center justify-center text-white bg-white/10 hover:bg-white/20 border border-white/20 transition-all duration-300 backdrop-blur-md shadow-lg cursor-pointer">
        <i className={`bi ${unreadCount > 0 ? 'bi-bell-fill' : 'bi-bell'} text-lg`}></i>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] text-white font-black border-2 border-slate-900 shadow-md">
            {unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-90" onClick={() => setIsOpen(false)} />
            <motion.div initial={{ opacity: 0, y: 15, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 15, scale: 0.98 }} className="absolute right-0 top-full mt-4 w-85 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-[2rem] shadow-2xl backdrop-blur-3xl z-100 overflow-hidden">
              <div className="p-5 border-b border-slate-100 dark:border-white/10 flex justify-between items-center bg-slate-50/50 dark:bg-white/5">
                <h3 className="text-[10px] font-black text-slate-500 dark:text-white/90 uppercase tracking-[0.3em]">Notificaciones</h3>
                {itemsToShow.length > 0 ? <span className="text-[9px] bg-amber-400 text-black px-2 py-0.5 rounded-full font-black uppercase">Nuevas</span> : <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Al día</span>}
              </div>
              <div className="max-h-100 overflow-y-auto no-scrollbar">
                {itemsToShow.length > 0 ? itemsToShow.map((item) => (
                  <Link key={`${item.type}-${item.id}`} href={item.href || '#'} onClick={() => setIsOpen(false)} className="block relative px-6 py-5 border-b border-slate-50 dark:border-white/5 transition-all group hover:bg-slate-50 dark:hover:bg-white/5">
                    <div className={`absolute left-0 top-4 bottom-4 w-1 rounded-r-full shadow-sm ${item.type === 'EVENTO' ? 'bg-orange-500' : 'bg-teal-500'}`} />
                    <div className="flex flex-col gap-1.5">
                      <div className="flex justify-between items-center">
                        <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded border ${item.type === 'EVENTO' ? 'border-orange-500/20 text-orange-600 dark:text-orange-400' : 'border-teal-500/20 text-teal-600 dark:text-teal-400'}`}>{item.type}</span>
                        <span className="text-[10px] text-slate-400 font-bold">{formatTimeAgo(item.date)}</span>
                      </div>
                      <h4 className="text-[14px] font-bold text-slate-900 dark:text-white leading-tight group-hover:text-blue-600 dark:group-hover:text-primary transition-colors">{item.title}</h4>
                      <p className="text-[12px] text-slate-600 dark:text-slate-400 line-clamp-2 leading-snug">{item.displayContent || item.content}</p>
                    </div>
                  </Link>
                )) : (
                  <div className="p-16 text-center">
                    <div className="w-12 h-12 bg-slate-100 dark:bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4"><i className="bi bi-check2-circle text-2xl text-slate-300 dark:text-white/20"></i></div>
                    <p className="text-[10px] text-slate-400 dark:text-white/20 uppercase font-bold tracking-[0.2em]">Bandeja limpia</p>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}