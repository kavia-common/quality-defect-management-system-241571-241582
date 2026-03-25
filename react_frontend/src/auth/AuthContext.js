import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { login as apiLogin } from "../api/qdms";
import { setAuthToken, getAuthToken } from "../api/http";

const AuthContext = createContext(null);

// PUBLIC_INTERFACE
export function useAuth() {
  /** Hook to access auth state and actions. */
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

// PUBLIC_INTERFACE
export function AuthProvider({ children }) {
  /** Provides auth state and actions to the app. */
  const [user, setUser] = useState(() => {
    const raw = window.localStorage.getItem("qdms_user");
    return raw ? JSON.parse(raw) : null;
  });
  const [token, setToken] = useState(() => getAuthToken());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token) setAuthToken(token);
    else setAuthToken(null);
  }, [token]);

  useEffect(() => {
    if (user) window.localStorage.setItem("qdms_user", JSON.stringify(user));
    else window.localStorage.removeItem("qdms_user");
  }, [user]);

  // PUBLIC_INTERFACE
  const signIn = async ({ email, password }) => {
    /** Signs in and stores token/user. */
    setLoading(true);
    try {
      const res = await apiLogin({ email, password });
      setToken(res.token);
      setUser(res.user);
      return res.user;
    } finally {
      setLoading(false);
    }
  };

  // PUBLIC_INTERFACE
  const signOut = () => {
    /** Signs out by clearing token/user. */
    setToken(null);
    setUser(null);
  };

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token && user),
      loading,
      signIn,
      signOut,
    }),
    [user, token, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
