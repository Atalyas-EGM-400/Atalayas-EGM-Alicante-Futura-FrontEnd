'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { API_ROUTES } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';

// ── Tipos ─────────────────────────────────────────────────────────────────────
type Message = {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
};

const SUGGESTED = [
    '¿Que hago en mi primer día?',
    '¿Qué servicios tengo disponibles?',
    '¿Qué cursos puedo hacer?',
    'Dame información general de lo que puedo hacer'
];

const WELCOME: Message = {
    id: 'welcome',
    role: 'assistant',
    content: '¡Hola! 👋 Soy el asistente de Atalayas. Puedo ayudarte con la información sobre la plataforma que tienes disponible. ¿En qué te puedo ayudar?',
    timestamp: new Date(),
};

export default function ChatWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([WELCOME]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [hasUnread, setHasUnread] = useState(false);
    const [mounted, setMounted] = useState(false);
    
    const bottomRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    const sendMessage = useCallback(async (text: string) => {
        const trimmed = text.trim();
        if (!trimmed || isLoading) return;

        const userMsg: Message = {
            id: `u-${Date.now()}`,
            role: 'user',
            content: trimmed,
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        if (inputRef.current) inputRef.current.style.height = 'auto';
        setIsLoading(true);

        try {
            const token = localStorage.getItem('token');
            const history = [...messages, userMsg]
                .filter(m => m.id !== 'welcome')
                .map(m => ({ role: m.role, content: m.content }));

            const res = await fetch(API_ROUTES.CHATBOT.SEND, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ messages: history }),
            });

            const data = await res.json();
            const assistantMsg: Message = {
                id: `a-${Date.now()}`,
                role: 'assistant',
                content: data.reply,
                timestamp: new Date(),
            };

            setMessages(prev => [...prev, assistantMsg]);
            if (!isOpen) setHasUnread(true);
        } catch (err) {
            setMessages(prev => [...prev, {
                id: `err-${Date.now()}`,
                role: 'assistant',
                content: 'Ha ocurrido un error. Por favor inténtalo de nuevo.',
                timestamp: new Date(),
            }]);
        } finally {
            setIsLoading(false);
        }
    }, [messages, isLoading, isOpen]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage(input);
        }
    };

    const clearChat = () => setMessages([{ ...WELCOME, id: 'welcome-' + Date.now(), timestamp: new Date() }]);

    if (!mounted) return null;

    return (
        <>
            {/* BOTÓN FLOTANTE (FAB) */}
            <button
                onClick={() => setIsOpen(v => !v)}
                className="fixed bottom-6 right-6 z-100 w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all hover:scale-110 active:scale-95 bg-primary"
                style={{ boxShadow: '0 8px 24px rgba(0,113,227,0.3)' }}
            >
                <AnimatePresence mode="wait">
                    {isOpen ? (
                        <motion.svg key="close" width="18" height="18" viewBox="0 0 18 18" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
                            <path d="M3 3l12 12M15 3L3 15" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
                        </motion.svg>
                    ) : (
                        <motion.div key="bot" initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                            <svg width="28" height="28" viewBox="0 0 100 130" fill="white">
                                <rect x="10" y="14" width="80" height="60" rx="16" opacity="0.95" />
                                <rect x="20" y="74" width="60" height="50" rx="12" opacity="0.95" />
                                <circle cx="31" cy="35" r="6" fill="#0071e3" />
                                <circle cx="69" cy="35" r="6" fill="#0071e3" />
                            </svg>
                        </motion.div>
                    )}
                </AnimatePresence>
                {hasUnread && !isOpen && <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 border-2 border-white rounded-full" />}
            </button>

            {/* PANEL DE CHAT */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className="fixed bottom-24 right-6 z-99 flex flex-col w-95 max-w-[calc(100vw-32px)] h-140 max-h-[calc(100vh-120px)] overflow-hidden rounded-[24px] bg-white dark:bg-[#1c1c1e] border border-black/5 dark:border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.15)] backdrop-blur-xl"
                    >
                        {/* CABECERA */}
                        <div className="p-4 flex items-center justify-between bg-primary text-white">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-lg">
                                    <i className="bi bi-robot"></i>
                                </div>
                                <div>
                                    <p className="text-xs font-black uppercase tracking-widest">Asistente</p>
                                    <p className="text-[10px] opacity-70 flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 bg-green-400 rounded-full" /> En línea
                                    </p>
                                </div>
                            </div>
                            <button onClick={clearChat} className="text-[10px] font-black uppercase tracking-tighter bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-colors">
                                Reiniciar
                            </button>
                        </div>

                        {/* ÁREA DE MENSAJES */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar bg-[#F5F5F7] dark:bg-transparent">
                            {messages.map((msg) => (
                                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                                        msg.role === 'user' 
                                        ? 'bg-primary text-white rounded-br-none' 
                                        : 'bg-white dark:bg-white/10 text-foreground rounded-bl-none border border-black/5 dark:border-white/5'
                                    }`}>
                                        {/* 👇 FIX: Envolvemos ReactMarkdown en un div para los estilos 👇 */}
                                        <div className="prose dark:prose-invert prose-sm max-w-none">
                                            <ReactMarkdown>
                                                {msg.content}
                                            </ReactMarkdown>
                                        </div>
                                        <p className={`text-[9px] mt-1 text-right opacity-50 ${msg.role === 'user' ? 'text-white' : 'text-foreground'}`}>
                                            {mounted && msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex justify-start">
                                    <div className="bg-white dark:bg-white/10 p-3 rounded-2xl rounded-bl-none border border-black/5 dark:border-white/5">
                                        <div className="flex gap-1">
                                            <span className="w-1.5 h-1.5 bg-foreground/30 rounded-full animate-bounce" />
                                            <span className="w-1.5 h-1.5 bg-foreground/30 rounded-full animate-bounce [animation-delay:0.2s]" />
                                            <span className="w-1.5 h-1.5 bg-foreground/30 rounded-full animate-bounce [animation-delay:0.4s]" />
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={bottomRef} />
                        </div>

                        {/* ENTRADA DE TEXTO */}
                        <div className="p-3 bg-white dark:bg-[#1c1c1e] border-t border-black/5 dark:border-white/10">
                            {messages.length === 1 && !isLoading && (
                                <div className="flex flex-col gap-2 mb-3">
                                    {SUGGESTED.map(s => (
                                        <button key={s} onClick={() => sendMessage(s)} className="text-left text-[11px] font-bold text-muted-foreground hover:text-primary bg-muted/50 dark:bg-white/5 p-2.5 rounded-xl border border-border transition-all">
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            )}
                            <div className="flex items-end gap-2 bg-muted/50 dark:bg-white/5 rounded-2xl p-2 border border-transparent focus-within:border-primary/30 transition-all">
                                <textarea
                                    ref={inputRef}
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Pregunta algo..."
                                    rows={1}
                                    className="flex-1 bg-transparent border-none outline-none resize-none text-sm p-1.5 text-foreground placeholder:text-muted-foreground"
                                    style={{ maxHeight: '100px' }}
                                />
                                <button
                                    onClick={() => sendMessage(input)}
                                    disabled={!input.trim() || isLoading}
                                    className="w-8 h-8 rounded-xl bg-primary text-white flex items-center justify-center disabled:opacity-30 disabled:grayscale transition-all active:scale-90"
                                >
                                    <i className="bi bi-send-fill text-xs"></i>
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}