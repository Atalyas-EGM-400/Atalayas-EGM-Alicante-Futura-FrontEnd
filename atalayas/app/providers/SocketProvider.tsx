'use client';

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface SocketContextType {
  socket: Socket | null;
  onlineUsers: number;
  companyOnlineUsers: number; // ← NUEVO
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  onlineUsers: 0,
  companyOnlineUsers: 0, // ← NUEVO
});

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [onlineUsers, setOnlineUsers] = useState(0);
  const [companyOnlineUsers, setCompanyOnlineUsers] = useState(0); // ← NUEVO
  const socketRef = useRef<Socket | null>(null);

  const connect = () => {
    if (socketRef.current?.connected) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    // URL puesta a fuego para que no haya margen de error
    /*const backendUrl = 'https://zoological-passion-atalayas.up.railway.app';*/
    const backendUrl = 'http://localhost:3000';


    const newSocket = io(`${backendUrl}/stats`, {
      transports: ['websocket'],
      auth: { token },
    });

    newSocket.on('connect', () => {
      console.log('✅ Socket conectado a:', backendUrl);
    });

    // Escucha global (Admin General)
    newSocket.on('userCount', (count: number) => {
      setOnlineUsers(count);
    });

    // ← NUEVO: Escucha de la empresa (Admin Empresa)
    newSocket.on('companyUserCount', (count: number) => {
      setCompanyOnlineUsers(count);
    });

    newSocket.on('updateOnlineCount', (data: { count: number } | number) => {
      setOnlineUsers(typeof data === 'number' ? data : data.count);
    });

    newSocket.on('disconnect', () => {
      console.log('❌ Socket desconectado');
    });

    socketRef.current = newSocket;
    setSocket(newSocket);
  };

  const disconnect = () => {
    socketRef.current?.disconnect();
    socketRef.current = null;
    setSocket(null);
    setOnlineUsers(0);
    setCompanyOnlineUsers(0); // ← NUEVO
  };

  useEffect(() => {
    connect();

    const handleLogin = () => connect();
    const handleLogout = () => disconnect();

    window.addEventListener('user:login', handleLogin);
    window.addEventListener('user:logout', handleLogout);

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'token') {
        if (e.newValue) connect();
        else disconnect();
      }
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('user:login', handleLogin);
      window.removeEventListener('user:logout', handleLogout);
      window.removeEventListener('storage', handleStorage);
      disconnect();
    };
  }, []);

  return (
    // ← NUEVO: Exponemos companyOnlineUsers en el Provider
    <SocketContext.Provider value={{ socket, onlineUsers, companyOnlineUsers }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);