import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { io, Socket } from 'socket.io-client';

const SocketContext = createContext<Socket | null>(null);

export const SocketProvider = ({ children }: { children: ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const SOCKET_URL =
      (import.meta as any)?.env?.VITE_SOCKET_URL || 'http://localhost:5000';

    const s = io(SOCKET_URL, {
      path: '/socket.io',
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
    });

    setSocket(s);

    s.on('connect', () => {
      console.log('✅ Connected to Socket.IO server:', s.id);
    });

    let warned = false;
    s.io.on('error', () => {
      if (!warned) {
        console.warn('Socket.IO: waiting for server...');
        warned = true;
      }
    });
    s.on('connect_error', () => {
      // handled by reconnection; keep logs minimal
    });

    s.on('disconnect', () => {
      console.log('❌ Disconnected from server');
    });

    return () => {
      s.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
