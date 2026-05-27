'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from '@studio-freight/lenis';
import Aurora from '@/components/Aurora'; 
import CountUp from '@/components/CountUp'; 

const PREMIUM_GRADIENT = "bg-gradient-to-r from-teal-400 via-amber-400 to-orange-500";

const ATALAYAS_INFO = [
  {
    title: "Hub de Innovación",
    desc: "Un centro neurálgico diseñado para que la Pyme alicantina acceda a tecnología punta y servicios de valor añadido.",
    img: "/images/aerial.jpg",
    color: "text-teal-400"
  },
  {
    title: "+200 Empresas",
    desc: "Un ecosistema vibrante donde medianas y grandes empresas comparten un espacio de crecimiento y sinergia real.",
    img: "/images/empresas.jpg",
    color: "text-amber-400"
  },
  {
    title: "Talento y Vivero",
    desc: "Fomentamos la formación especializada en el sector industrial y tecnológico.",
    img: "/images/talento.jpg",
    color: "text-orange-500"
  },
  {
    title: "Conectividad 4.0",
    desc: "Infraestructura de alta disponibilidad con monitorización avanzada.",
    img: "/images/infraestructura.jpg",
    color: "text-indigo-400"
  }
];

export default function LandingPage() {
  const [mounted, setMounted] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const iconRef = useRef(null);

  useEffect(() => {
    setMounted(true);
    gsap.registerPlugin(ScrollTrigger);

    const savedTheme = document.cookie.split('; ').find(row => row.startsWith('theme='))?.split('=')[1];
    const initialTheme = savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    setIsDark(initialTheme);
    if (initialTheme) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');

    const lenis = new Lenis({ lerp: 0.08, smoothWheel: true });
    const raf = (time: number) => { 
      lenis.raf(time * 1000); 
    };
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    return () => {
      if (lenis) lenis.destroy();
    };
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDark;
    gsap.to(iconRef.current, {
        rotation: isDark ? 180 : 0,
        scale: 0,
        duration: 0.25,
        onComplete: () => {
            setIsDark(newTheme);
            if (newTheme) document.documentElement.classList.add('dark');
            else document.documentElement.classList.remove('dark');
            document.cookie = `theme=${newTheme ? 'dark' : 'light'}; path=/; max-age=31536000`;
            
            gsap.to(iconRef.current, {
                scale: 1,
                rotation: isDark ? 360 : 180,
                duration: 0.5,
                ease: "elastic.out(1, 0.6)"
            });
        }
    });
  };

  if (!mounted) return null;

  return (
    <div className="bg-background text-foreground transition-colors duration-500 overflow-x-hidden selection:bg-orange-500/30">
      
      {/* ── NAV ── */}
      <nav className="fixed top-6 md:top-8 left-1/2 -translate-x-1/2 z-100 flex items-center gap-1 md:gap-2 p-1.5 md:p-2 rounded-full border border-black/5 dark:border-white/10 bg-white/40 dark:bg-white/3 backdrop-blur-3xl shadow-xl transition-all duration-500 w-[90%] max-w-fit">
        <button onClick={toggleTheme} className="w-9 h-9 md:w-10 md:h-10 flex items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
          <div ref={iconRef} className="w-5 h-5 flex items-center justify-center">
            {isDark ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-400">
                <circle cx="12" cy="12" r="5" fill="currentColor"/>
                <path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" strokeLinecap="round"/>
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-indigo-600">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" fill="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </div>
        </button>
        <div className="h-4 w-px bg-black/10 dark:bg-white/10 mx-1 md:mx-2"></div>
        <Link href="/login" className="px-5 md:px-8 py-2 md:py-2.5 text-[9px] md:text-[10px] font-black uppercase tracking-widest bg-foreground text-background rounded-full hover:scale-105 active:scale-95 transition-all shadow-lg whitespace-nowrap">
          Acceso Portal
        </Link>
      </nav>

      {/* ── HERO ── */}
      <section className="relative min-h-screen flex items-center px-6 md:px-12 lg:px-24 pt-32 pb-20 overflow-hidden transition-colors duration-500">
        <div className="absolute inset-0 z-0 pointer-events-none transition-opacity duration-1000 opacity-60">
            <Aurora colorStops={isDark ? ["#2DD4BF", "#FBBF24", "#6366F1"] : ["#00897b", "#f97316", "#4338ca"]} amplitude={1.2} blend={0.6} />
        </div>

        {/* Floating Card - Responsive behavior */}
        <div className="absolute inset-0 pointer-events-none hidden lg:flex items-center justify-end px-24 z-10">
          <div className="w-96 xl:w-120 h-auto rounded-[3rem] backdrop-blur-3xl bg-white/40 dark:bg-white/3 border border-black/5 dark:border-white/10 shadow-2xl relative group overflow-hidden pointer-events-auto transition-all duration-500 p-10 flex flex-col gap-8">
             <div className="relative z-10 flex flex-col gap-8">
                <div className="space-y-3">
                    <span className="text-[9px] font-black uppercase tracking-[0.3em] text-orange-500">Ecosistema Activo</span>
                    <h3 className="text-3xl xl:text-4xl font-extrabold text-foreground tracking-tighter leading-tight">Servicios de <br /> Impulso.</h3>
                    <p className="text-xs font-medium text-muted-foreground leading-relaxed">Recursos estratégicos diseñados para potenciar la competitividad de la mediana empresa en Atalayas.</p>
                </div>
                <div className="space-y-4">
                    {[
                        { title: 'Capacitación', desc: 'Formación técnica y talento dual.', icon: 'bi-mortarboard' },
                        { title: 'Servicios', desc: 'Explora los beneficios a tu disposición.', icon: 'bi-bank' },
                        { title: 'Networking', desc: 'Conexiones industriales directas.', icon: 'bi-people' },
                        { title: 'Digitalización', desc: 'Transformación y tecnología.', icon: 'bi-cpu' }
                    ].map((serv, i) => (
                        <div key={i} className="flex items-start gap-4 transition-all">
                            <div className="w-8 h-8 rounded-lg bg-foreground/5 border border-foreground/10 flex items-center justify-center shrink-0">
                                <i className={`bi ${serv.icon} text-teal-600 dark:text-teal-400 text-sm`}></i>
                            </div>
                            <div className="space-y-0.5">
                                <p className="text-xs font-bold text-foreground uppercase tracking-wider">{serv.title}</p>
                                <p className="text-[10px] xl:text-[11px] text-muted-foreground font-medium">{serv.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
             </div>
          </div>
        </div>

        <div className="w-full max-w-7xl mx-auto grid lg:grid-cols-2 items-center z-10">
          <div className="text-center lg:text-left lg:pr-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-foreground/5 border border-foreground/10 backdrop-blur-md text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-6 md:mb-8">
              <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
              Vivero de Empresas y Talento
            </div>
            <div className="flex flex-col gap-0 mb-8 md:mb-10">
              <h1 className="text-6xl sm:text-7xl md:text-8xl lg:text-[100px] font-black tracking-tighter leading-[0.9] text-foreground">Atalayas</h1>
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-[55px] font-black tracking-tighter leading-tight text-muted-foreground/30 dark:text-white/30">Ecosistema de</h2>
              <h2 className={`text-5xl sm:text-6xl md:text-7xl lg:text-[90px] font-black tracking-tighter leading-[0.9] text-transparent bg-clip-text pb-2 ${PREMIUM_GRADIENT}`}>Innovación.</h2>
            </div>
            <p className="max-w-md mx-auto lg:mx-0 text-lg md:text-xl font-medium text-muted-foreground leading-relaxed mb-10 md:mb-12 px-4 lg:px-0">Mucho más que un espacio industrial. Somos el vivero donde las medianas empresas alicantinas se conectan e innovan.</p>
            <Link href="/company-register" className="inline-block px-10 md:px-12 py-4 md:py-5 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-black text-[10px] md:text-[11px] uppercase tracking-[0.2em] transition-all hover:scale-105 shadow-xl shadow-orange-500/20">Registrar mi Empresa</Link>
          </div>
        </div>
      </section>

      {/* ── BENTO GRID RESPONSIVE ── */}
      <div className="relative w-full py-20 md:py-32 px-4 md:px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 auto-rows-[350px] md:auto-rows-[400px]">
          {ATALAYAS_INFO.map((item, i) => {
            // Mobile: always 1 col. Desktop: specific spans
            const colSpan = i === 0 || i === 3 ? 'lg:col-span-2 md:col-span-2' : 'lg:col-span-1 md:col-span-1';

            return (
              <div 
                key={i} 
                className={`${colSpan} relative h-full w-full rounded-[1.5rem] md:rounded-[2rem] overflow-hidden group shadow-2xl bg-black`}
              >
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-110"
                  style={{ 
                    backgroundImage: `linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.3) 100%), url(${item.img})` 
                  }}
                />
                
                <div className="absolute inset-0 bg-white/0 group-hover:bg-white/2 transition-colors duration-500" />
                
                <div className="relative z-10 flex flex-col justify-end h-full w-full p-6 md:p-10 pointer-events-none">
                  <span className={`block text-[9px] md:text-[10px] font-black uppercase tracking-[0.5em] mb-3 md:mb-4 ${item.color}`}>
                    Impulso Corporativo
                  </span>
                  
                  <h2 className="text-2xl md:text-4xl lg:text-5xl font-black text-white tracking-tighter leading-none mb-3 md:mb-4">
                    {item.title === "+200 Empresas" ? (
                      <div className="flex items-center gap-2 md:gap-3">
                        <span>+</span>
                        <CountUp 
                          from={0} 
                          to={200} 
                          duration={1.5} 
                          className="text-white" 
                          onStart={() => {}} 
                          onEnd={() => {}} 
                        />
                        <span className="text-lg md:text-2xl lg:text-3xl mt-1 uppercase">Empresas</span>
                      </div>
                    ) : (
                      item.title
                    )}
                  </h2>
                  
                  <p className="text-xs md:text-sm lg:text-base text-white/60 font-medium max-w-xl leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── FOOTER ── */}
      <footer className="relative w-full border-t border-black/10 dark:border-white/10 py-10 md:py-16 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-10">
          
          <div className="text-center md:text-left">
            <h3 className="text-2xl font-black tracking-tighter text-foreground">Atalayas</h3>
            <p className="text-[11px] md:text-xs text-muted-foreground mt-2 font-medium max-w-xs md:max-w-none">
              © {new Date().getFullYear()} Atalayas Ecosistema de Innovación. <br className="hidden md:block" /> Todos los derechos reservados.
            </p>
          </div>
          
          <div className="flex flex-wrap justify-center gap-4 md:gap-8 text-xs md:text-sm font-bold uppercase tracking-widest text-muted-foreground">
            <Link href="#" className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">Privacidad</Link>
            <Link href="#" className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">Términos</Link>
            <Link href="#" className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">Contacto</Link>
          </div>

          <div className="flex gap-3 md:gap-4">
            {[
              { icon: 'bi-linkedin', link: '#' },
              { icon: 'bi-twitter-x', link: '#' },
              { icon: 'bi-instagram', link: '#' }
            ].map((social, i) => (
              <Link key={i} href={social.link} className="w-10 h-10 md:w-11 md:h-11 rounded-full bg-foreground/5 border border-foreground/10 flex items-center justify-center text-muted-foreground hover:bg-foreground/10 hover:text-orange-500 transition-all">
                <i className={`bi ${social.icon} md:text-lg`}></i>
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}