'use client'
import ChatWidget from '@/components/ui/ChatBot';
import Sidebar from '@/components/ui/Sidebar';

export default function EmployeeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-[#f5f5f7] dark:bg-[#0d0d0f] overflow-hidden">
      {/* 1. El Sidebar se queda fijo aquí y no se desmonta al navegar */}
      <Sidebar role="GENERAL_ADMIN" />
      <main className="flex-1 flex flex-col min-w-0 bg-white/40 dark:bg-transparent backdrop-blur-3xl overflow-hidden relative">
      {children}
      </main>
    </div>
  );
}