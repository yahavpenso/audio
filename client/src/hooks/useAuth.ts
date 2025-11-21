import { useState, useCallback, useEffect } from "react";

interface User {
  username: string;
  loginTime: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load user from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem("audioeditor_user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem("audioeditor_user");
      }
    }
  }, []);

  const login = useCallback((username: string) => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      const newUser = {
        username,
        loginTime: new Date().toISOString(),
      };
      setUser(newUser);
      localStorage.setItem("audioeditor_user", JSON.stringify(newUser));
      setIsLoading(false);
    }, 800);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem("audioeditor_user");
  }, []);

  return { user, isLoading, login, logout };
}
