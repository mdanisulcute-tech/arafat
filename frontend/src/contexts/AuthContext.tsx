import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api, setToken, clearToken, getToken } from "@/src/api/client";
import { AuthResponse, User } from "@/src/types";

type AuthCtx = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  setUser: (u: User) => void;
};

const Ctx = createContext<AuthCtx | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUserState] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const token = await getToken();
    if (!token) {
      setUserState(null);
      return;
    }
    try {
      const me = await api.get<User>("/auth/me");
      setUserState(me);
    } catch {
      await clearToken();
      setUserState(null);
    }
  }, []);

  useEffect(() => {
    (async () => {
      await refresh();
      setLoading(false);
    })();
  }, [refresh]);

  const login = async (email: string, password: string) => {
    const r = await api.post<AuthResponse>("/auth/login", { email, password }, false);
    await setToken(r.token);
    setUserState(r.user);
  };

  const register = async (email: string, username: string, password: string) => {
    const r = await api.post<AuthResponse>(
      "/auth/register",
      { email, username, password },
      false
    );
    await setToken(r.token);
    setUserState(r.user);
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch {}
    await clearToken();
    setUserState(null);
  };

  const setUser = (u: User) => setUserState(u);

  return (
    <Ctx.Provider value={{ user, loading, login, register, logout, refresh, setUser }}>
      {children}
    </Ctx.Provider>
  );
};

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth must be used inside AuthProvider");
  return c;
}
