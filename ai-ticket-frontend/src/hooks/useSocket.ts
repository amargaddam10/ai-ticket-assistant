import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export const useSocket = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Only connect if we have a valid token
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('No auth token found, skipping socket connection');
      return;
    }

    console.log('🔌 Attempting Socket.IO connection...');

    const socketInstance = io(SOCKET_URL, {
      auth: {
        token: token,
      },
      transports: ['websocket', 'polling'], // Allow fallback to polling
      timeout: 10000,
      retries: 3,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socketInstance.on('connect', () => {
      console.log('✅ Connected to Socket.IO server:', socketInstance.id);
      setIsConnected(true);

      // Clear any reconnection timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    });

    socketInstance.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
      setIsConnected(false);

      // Attempt reconnection after delay if not a manual disconnect
      if (reason !== 'io client disconnect') {
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('🔄 Attempting socket reconnection...');
          socketInstance.connect();
        }, 3000);
      }
    });

    socketInstance.on('connect_error', (error) => {
      console.warn('⚠️ Socket connection error:', error.message);
      setIsConnected(false);

      // Don't spam reconnection attempts
      if (!reconnectTimeoutRef.current) {
        reconnectTimeoutRef.current = setTimeout(() => {
          reconnectTimeoutRef.current = undefined;
        }, 5000);
      }
    });

    socketInstance.on('error', (error) => {
      console.error('🚨 Socket error:', error);
    });

    setSocket(socketInstance);

    return () => {
      console.log('🧹 Cleaning up socket connection');

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }

      if (socketInstance) {
        socketInstance.disconnect();
      }
    };
  }, []); // Only run once

  return { socket, isConnected };
};
