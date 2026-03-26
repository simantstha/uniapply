import { createContext, useState, useEffect, useContext } from 'react';
import apiClient from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      apiClient.get('/api/auth/me')
        .then((res) => setUser(res.data))
        .catch(() => localStorage.removeItem('token'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const signup = async (email, password, name) => {
    const res = await apiClient.post('/api/auth/signup', { email, password, name });
    localStorage.setItem('token', res.data.token);
    setUser(res.data.user);
  };

  const login = async (email, password) => {
    const res = await apiClient.post('/api/auth/login', { email, password });
    localStorage.setItem('token', res.data.token);
    setUser(res.data.user);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const completeOnboarding = async () => {
    await apiClient.patch('/api/auth/onboarding');
    setUser(u => ({ ...u, onboardingCompleted: true }));
  };

  return (
    <AuthContext.Provider value={{ user, loading, signup, login, logout, completeOnboarding }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
