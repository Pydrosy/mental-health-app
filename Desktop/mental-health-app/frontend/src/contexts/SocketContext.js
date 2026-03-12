import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const { token, user, isAuthenticated } = useAuth();
  const socketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  const SOCKET_URL = 'http://localhost:5000';

  // Initialize socket connection
  const connectSocket = useCallback(() => {
    if (!token || !user || !isAuthenticated) {
      console.log('No authentication, skipping socket connection');
      return null;
    }

    if (socketRef.current?.connected) {
      console.log('Socket already connected');
      return socketRef.current;
    }

    console.log('🔄 Initializing socket connection with token');
    
    // Close existing socket if any
    if (socketRef.current) {
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
    }

    // Create new socket connection
    const newSocket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
      forceNew: true,
    });

    socketRef.current = newSocket;

    // Connection event handlers
    newSocket.on('connect', () => {
      console.log('✅ Socket connected successfully with ID:', newSocket.id);
      setIsConnected(true);
      
      // Clear any reconnect timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    });

    newSocket.on('disconnect', (reason) => {
      console.log('🔌 Socket disconnected:', reason);
      setIsConnected(false);
      
      // Attempt to reconnect if disconnected unexpectedly
      if (reason === 'io server disconnect' || reason === 'transport close') {
        console.log('Attempting to reconnect...');
        reconnectTimeoutRef.current = setTimeout(() => {
          connectSocket();
        }, 2000);
      }
    });

    newSocket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error.message);
      setIsConnected(false);
    });

    newSocket.on('reconnect', (attemptNumber) => {
      console.log('🔄 Socket reconnected after', attemptNumber, 'attempts');
      setIsConnected(true);
    });

    newSocket.on('reconnect_attempt', (attemptNumber) => {
      console.log('🔄 Socket reconnection attempt', attemptNumber);
    });

    newSocket.on('reconnect_error', (error) => {
      console.error('❌ Socket reconnection error:', error);
    });

    newSocket.on('reconnect_failed', () => {
      console.error('❌ Socket reconnection failed');
      setIsConnected(false);
    });

    // User online/offline events
    newSocket.on('user-online', (userId) => {
      console.log('User online:', userId);
      setOnlineUsers(prev => [...new Set([...prev, userId])]);
    });

    newSocket.on('user-offline', (userId) => {
      console.log('User offline:', userId);
      setOnlineUsers(prev => prev.filter(id => id !== userId));
    });

    return newSocket;
  }, [token, user, isAuthenticated]);

  // Connect when authenticated
  useEffect(() => {
    if (isAuthenticated && token && user) {
      console.log('User authenticated, connecting socket...');
      connectSocket();
    }

    return () => {
      console.log('Cleaning up socket connection');
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socketRef.current) {
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [isAuthenticated, token, user, connectSocket]);

  const joinChat = (recipientId) => {
    if (socketRef.current && isConnected) {
      console.log('Emitting join-chat event for recipient:', recipientId);
      socketRef.current.emit('join-chat', { recipientId });
    } else {
      console.warn('Cannot join chat: socket not connected');
      // Try to reconnect
      if (isAuthenticated) {
        console.log('Attempting to reconnect socket...');
        connectSocket();
      }
    }
  };

  const sendMessage = (recipientId, content, messageType = 'text') => {
    if (socketRef.current && isConnected) {
      console.log('Emitting send-message event:', { recipientId, content, messageType });
      socketRef.current.emit('send-message', { recipientId, content, messageType });
      return true;
    } else {
      console.error('Cannot send message: socket not connected');
      return false;
    }
  };

  const onNewMessage = (callback) => {
    if (socketRef.current) {
      console.log('Setting up new-message listener');
      socketRef.current.on('new-message', callback);
      return () => socketRef.current?.off('new-message', callback);
    }
    return () => {};
  };

  const onMessageSent = (callback) => {
    if (socketRef.current) {
      console.log('Setting up message-sent listener');
      socketRef.current.on('message-sent', callback);
      return () => socketRef.current?.off('message-sent', callback);
    }
    return () => {};
  };

  const sendTyping = (recipientId, isTyping) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('typing', { recipientId, isTyping });
    }
  };

  const onUserTyping = (callback) => {
    if (socketRef.current) {
      socketRef.current.on('user-typing', callback);
      return () => socketRef.current?.off('user-typing', callback);
    }
    return () => {};
  };

  const markAsRead = (messageIds) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('mark-read', { messageIds });
    }
  };

  const value = {
    socket: socketRef.current,
    onlineUsers,
    isConnected,
    joinChat,
    sendMessage,
    onNewMessage,
    onMessageSent,
    sendTyping,
    onUserTyping,
    markAsRead,
    isUserOnline: (userId) => onlineUsers.includes(userId)
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};