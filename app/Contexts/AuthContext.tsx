"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { closeSession, createSession, getSession } from "../services/api";

export type User = { name: string; email: string; avatar?: string; };
type AuthContextValue = {
  user: User | null;
  isSessionReady: boolean;
  login: (email: string, password: string) => Promise<string | null>;
  register: (name: string, email: string, password: string) => Promise<string | null>;
  logout: () => void;
  updateProfile: (name: string, avatar: string) => string | null;
};

const AuthContext = createContext<AuthContextValue | null>(null);
const storageKey = "kurio-session";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isSessionReady, setIsSessionReady] = useState(false);
  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const savedSession = window.localStorage.getItem(storageKey);
      if (savedSession) {
        const savedUser = JSON.parse(savedSession) as User;
        setUser(savedUser);
        void getSession().then((session) => {
          const restoredUser = { ...session.user, name: savedUser.name || session.user.name, avatar: savedUser.avatar ?? session.user.avatar };
          setUser(restoredUser);
          window.localStorage.setItem(storageKey, JSON.stringify(restoredUser));
        }).catch(() => undefined);
      }
      setIsSessionReady(true);
    }, 0);
    return () => window.clearTimeout(timeout);
  }, []);
  useEffect(() => {
    const expireSession = () => { setUser(null); window.localStorage.removeItem(storageKey); window.dispatchEvent(new Event("kurio:session-ended")); };
    window.addEventListener("kurio:session-expired", expireSession);
    return () => window.removeEventListener("kurio:session-expired", expireSession);
  }, []);

  const value = useMemo(() => ({
    user,
    isSessionReady,
    login: async (email: string, password: string) => {
      try {
        const session = await createSession("login", { email, password });
        setUser(session.user);
        window.localStorage.setItem(storageKey, JSON.stringify(session.user));
        return null;
      } catch (error) { return error instanceof Error && "response" in error ? "Não foi possível entrar com estas credenciais." : "Não foi possível iniciar sua sessão. Tente novamente."; }
    },
    register: async (name: string, email: string, password: string) => {
      try {
        const session = await createSession("register", { name, email, password });
        setUser(session.user);
        window.localStorage.setItem(storageKey, JSON.stringify(session.user));
        return null;
      } catch { return email.toLowerCase() === "existente@kurio.io" ? "Este e-mail já possui uma conta." : "Não foi possível criar sua conta. Revise os dados e tente novamente."; }
    },
    logout: () => { void closeSession().catch(() => undefined); setUser(null); window.localStorage.removeItem(storageKey); window.dispatchEvent(new Event("kurio:session-ended")); },
    updateProfile: (name: string, avatar: string) => {
      if (!user) return "Sua sessão expirou. Entre novamente.";
      if (name.trim().length < 2) return "Informe seu nome.";
      const nextUser = { ...user, name: name.trim(), avatar: avatar.trim() };
      setUser(nextUser);
      window.localStorage.setItem(storageKey, JSON.stringify(nextUser));
      return null;
    },
  }), [isSessionReady, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return context;
};
