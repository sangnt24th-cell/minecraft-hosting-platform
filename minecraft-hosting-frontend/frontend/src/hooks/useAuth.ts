import { useState } from 'react';

export function useAuth() {
  const [token, setToken] = useState<string | null>(
    () => localStorage.getItem('accessToken'),
  );

  const setAuthToken = (newToken: string) => {
    localStorage.setItem('accessToken', newToken);
    setToken(newToken);
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    setToken(null);
  };

  return { token, isAuthenticated: !!token, setAuthToken, logout };
}
