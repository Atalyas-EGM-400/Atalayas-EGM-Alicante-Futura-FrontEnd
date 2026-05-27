'use client';

import { useState, useRef, useEffect } from 'react';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function SearchInput({ value, onChange, placeholder }: SearchInputProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isExpanded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isExpanded]);

  return (
    <div className="relative flex items-center justify-end h-12">
      <div 
        className={`
          flex items-center transition-all duration-500 ease-in-out overflow-hidden
          ${isExpanded 
            ? 'w-64 lg:w-80 bg-card border border-border shadow-sm px-4' 
            : 'w-12 bg-transparent border border-transparent'}
          rounded-2xl h-full
        `}
      >
        {/* Icono de Lupa */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`
            flex items-center justify-center shrink-0 transition-colors outline-none
            ${isExpanded 
              ? 'text-primary' 
              : 'text-muted-foreground hover:text-primary w-12 h-12 rounded-2xl bg-card border border-border shadow-sm'}
          `}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>

        {/* Input con limpieza forzada */}
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={() => { if (!value) setIsExpanded(false); }}
          placeholder={placeholder}
          autoComplete="off"
          className={`
            ml-3 w-full text-sm text-foreground outline-none placeholder:text-muted-foreground transition-opacity duration-300
            /* FORZADO DE TRANSPARENCIA TOTAL */
            appearance-none border-none ring-0 shadow-none
            !bg-transparent! !bg-none! !p-0!
            /* Reset para navegadores que fuerzan el fondo en inputs */
            [-webkit-appearance:none] [bg-clip:text]
            ${isExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none'}
          `}
        />

        {/* Botón Cerrar (X) */}
        {isExpanded && value && (
          <button 
            onClick={() => { onChange(''); inputRef.current?.focus(); }}
            className="ml-2 text-muted-foreground/60 hover:text-foreground transition-colors outline-none"
          >
            <span className="text-lg">×</span>
          </button>
        )}
      </div>
    </div>
  );
}