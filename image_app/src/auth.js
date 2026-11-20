import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { api, clearSession, loadToken, loadUser, restoreApiUrl, saveSession } from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [bootstrapping, setBootstrapping] = useState(true);
  const sessionVersionRef = useRef(0);

  useEffect(() => {
    let active = true;
    const version = sessionVersionRef.current;

    (async () => {
      const [, stored, cachedUser] = await Promise.all([
        restoreApiUrl(),
        loadToken(),
        loadUser(),
      ]);

      if (!active || sessionVersionRef.current !== version) return;

      if (stored) {
        setToken(stored);
        if (cachedUser) {
          setUser(cachedUser);
        }
      }
      setBootstrapping(false);

      if (stored) {
        try {
          const data = await api.me(stored);
          if (!active || sessionVersionRef.current !== version) return;
          if (data?.user) {
            setUser(data.user);
            saveSession(stored, data.user).catch(() => {});
          }
        } catch (error) {
          if (!active || sessionVersionRef.current !== version) return;
          if (error?.status === 401 || error?.status === 403) {
            await clearSession();
            setToken(null);
            setUser(null);
          }
        }
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const login = async (email, password) => {
    sessionVersionRef.current += 1;
    const data = await api.login(email, password);
    await saveSession(data.token, data.user);
    setToken(data.token);
    setUser(data.user);
  };

  const logout = async () => {
    sessionVersionRef.current += 1;
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
