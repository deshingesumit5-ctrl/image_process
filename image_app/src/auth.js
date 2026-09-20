import React, { createContext, useContext, useEffect, useState } from 'react';
import { api, clearSession, loadToken, saveSession } from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [bootstrapping, setBootstrapping] = useState(true);

  useEffect(() => {
    (async () => {
      const stored = await loadToken();
      if (stored) {
        try {
          const data = await api.me(stored);
          setToken(stored);
          setUser(data.user);
        } catch {
          await clearSession();
        }
      }
      setBootstrapping(false);
    })();
  }, []);

  const login = async (email, password) => {
    const data = await api.login(email, password);
    await saveSession(data.token, data.user);
    setToken(data.token);
    setUser(data.user);
  };

  const logout = async () => {
    await clearSession();
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout, bootstrapping }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
