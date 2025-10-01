
import { useState, useEffect, useCallback } from 'react';
import { ChatSession, Message } from '../types';

const SESSIONS_KEY = 'rafeeq_chat_sessions';
const ACTIVE_SESSION_ID_KEY = 'rafeeq_active_session_id';

export const useChatSessions = () => {
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    try {
      const savedSessions = localStorage.getItem(SESSIONS_KEY);
      return savedSessions ? JSON.parse(savedSessions) : [];
    } catch (error) {
      console.error("Failed to load sessions from localStorage", error);
      return [];
    }
  });

  const [activeSessionId, setActiveSessionId] = useState<string | null>(() => {
     try {
      return localStorage.getItem(ACTIVE_SESSION_ID_KEY);
    } catch (error) {
      console.error("Failed to load active session ID from localStorage", error);
      return null;
    }
  });
  
  // Effect to create a new session if none exist on initial load
  useEffect(() => {
    if (sessions.length === 0) {
        const newSession: ChatSession = {
            id: Date.now().toString(),
            title: "شات جديد",
            messages: [],
            createdAt: Date.now(),
        };
        setSessions([newSession]);
        setActiveSessionId(newSession.id);
    } else if (!activeSessionId || !sessions.some(s => s.id === activeSessionId)) {
        // If activeId is invalid or missing, default to the latest session
        const latestSession = sessions.sort((a,b) => b.createdAt - a.createdAt)[0];
        setActiveSessionId(latestSession.id);
    }
  }, []);


  useEffect(() => {
    try {
      localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
    } catch (error) {
      console.error("Failed to save sessions to localStorage", error);
    }
  }, [sessions]);
  
  useEffect(() => {
    try {
        if (activeSessionId) {
            localStorage.setItem(ACTIVE_SESSION_ID_KEY, activeSessionId);
        } else {
            localStorage.removeItem(ACTIVE_SESSION_ID_KEY);
        }
    } catch (error) {
        console.error("Failed to save active session ID to localStorage", error);
    }
  }, [activeSessionId]);
  
  const activeSession = sessions.find(session => session.id === activeSessionId) || null;

  const createNewSession = useCallback(() => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: "شات جديد",
      messages: [],
      createdAt: Date.now(),
    };
    setSessions(prev => [...prev, newSession]);
    setActiveSessionId(newSession.id);
    return newSession;
  }, []);

  const updateActiveSessionMessages = useCallback((messages: Message[] | ((prevMessages: Message[]) => Message[])) => {
    if (!activeSessionId) return;

    setSessions(prevSessions =>
      prevSessions.map(session => {
        if (session.id === activeSessionId) {
          const newMessages = typeof messages === 'function' ? messages(session.messages) : messages;
          return { ...session, messages: newMessages };
        }
        return session;
      })
    );
  }, [activeSessionId]);
  
  const updateSessionTitle = useCallback((sessionId: string, title: string) => {
    setSessions(prevSessions => prevSessions.map(session => 
      session.id === sessionId ? { ...session, title } : session
    ));
  }, []);
  
  const deleteSession = useCallback((sessionId: string) => {
    setSessions(prev => {
        const remaining = prev.filter(s => s.id !== sessionId);
        if (sessionId === activeSessionId) {
            if(remaining.length > 0) {
                 const latestSession = remaining.sort((a,b) => b.createdAt - a.createdAt)[0];
                 setActiveSessionId(latestSession.id);
            } else {
                 // No sessions left, create a new one
                 const newSession: ChatSession = {
                    id: Date.now().toString(),
                    title: "شات جديد",
                    messages: [],
                    createdAt: Date.now(),
                };
                setActiveSessionId(newSession.id);
                return [newSession];
            }
        }
        return remaining;
    });
  }, [activeSessionId]);

  const clearAllSessions = useCallback(() => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: "شات جديد",
      messages: [],
      createdAt: Date.now(),
    };
    setSessions([newSession]);
    setActiveSessionId(newSession.id);
  }, []);

  return { 
    sessions, 
    activeSessionId, 
    activeSession, 
    setActiveSessionId,
    createNewSession, 
    updateActiveSessionMessages,
    updateSessionTitle,
    deleteSession,
    clearAllSessions,
  };
};
