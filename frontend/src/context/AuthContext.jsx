import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";

import api from "../services/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  // Get logged-in student
  const getMe = useCallback(async () => {
    try {
      const response = await api.get("/auth/me");

      const currentUser = response.data.user;

      setUser(currentUser);
      setIsAuthenticated(true);

      return currentUser;
    } catch (error) {
      setUser(null);
      setIsAuthenticated(false);

      return null;
    } finally {
      setAuthLoading(false);
    }
  }, []);

  // Refresh logged-in user data
  const refreshUser = async () => {
    return await getMe();
  };

  // Update user data in AuthContext
  const updateUser = (updatedData) => {
    if (!updatedData) return;

    setUser((previousUser) => {
      if (!previousUser) return updatedData;

      return {
        ...previousUser,
        ...updatedData,
      };
    });
  };

  // Login
  const login = async (credentials) => {
    const response = await api.post("/auth/login", credentials);

    setUser(response.data.user);
    setIsAuthenticated(true);

    return response.data;
  };

  // Logout
  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } finally {
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  // Restore session on page refresh
  useEffect(() => {
    getMe();
  }, [getMe]);

  const value = {
    user,
    isAuthenticated,
    authLoading,

    login,
    logout,

    getMe,
    refreshUser,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook
export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
};
