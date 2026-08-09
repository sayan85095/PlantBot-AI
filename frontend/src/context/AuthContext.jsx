import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('plantbot_token') || '');
  const [loading, setLoading] = useState(true);
  const [themeMode, setThemeModeState] = useState(
    localStorage.getItem('plantbot_theme') || 'system'
  );

  useEffect(() => {
    const root = document.documentElement;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const applyTheme = (mode) => {
      const isDark = mode === 'dark' || (mode === 'system' && mediaQuery.matches);
      if (isDark) {
        root.classList.add('dark');
        root.style.colorScheme = 'dark';
        root.style.backgroundColor = '#020617';
        document.body.style.backgroundColor = '#020617';
      } else {
        root.classList.remove('dark');
        root.style.colorScheme = 'light';
        root.style.backgroundColor = '#f8fafc';
        document.body.style.backgroundColor = '#f8fafc';
      }
    };

    applyTheme(themeMode);
    localStorage.setItem('plantbot_theme', themeMode);

    const handleSystemChange = () => {
      if (themeMode === 'system') {
        applyTheme('system');
      }
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleSystemChange);
      return () => mediaQuery.removeEventListener('change', handleSystemChange);
    }
  }, [themeMode]);

  const setThemeMode = (mode) => {
    setThemeModeState(mode);
  };

  const isDarkMode = themeMode === 'dark' || (themeMode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  const toggleDarkMode = () => setThemeMode(isDarkMode ? 'light' : 'dark');

  useEffect(() => {
    const fetchUser = async () => {
      if (token) {
        try {
          const res = await api.get('/auth/me');
          setUser(res.data);
        } catch (err) {
          console.warn('Token verification failed:', err);
          logout();
        }
      }
      setLoading(false);
    };
    fetchUser();
  }, [token]);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { access_token, refresh_token, user: userData } = res.data;
    localStorage.setItem('plantbot_token', access_token);
    localStorage.setItem('plantbot_refresh_token', refresh_token);
    setToken(access_token);
    setUser(userData);
    return userData;
  };

  const register = async (name, email, password, role, phone) => {
    const res = await api.post('/auth/register', { name, email, password, role, phone });
    return res.data;
  };

  const refreshAuthToken = async () => {
    const refreshToken = localStorage.getItem('plantbot_refresh_token');
    if (!refreshToken) {
      logout();
      return;
    }

    try {
      const res = await api.post('/auth/refresh', { token: refreshToken });
      localStorage.setItem('plantbot_token', res.data.access_token);
      localStorage.setItem('plantbot_refresh_token', res.data.refresh_token);
      setToken(res.data.access_token);
      return res.data.access_token;
    } catch (err) {
      logout();
      return null;
    }
  };

  const googleLogin = async (googlePayload) => {
    const res = await api.post('/auth/google', googlePayload);
    const { access_token, refresh_token, user: userData } = res.data;
    localStorage.setItem('plantbot_token', access_token);
    localStorage.setItem('plantbot_refresh_token', refresh_token);
    setToken(access_token);
    setUser(userData);
    return userData;
  };

  const sendPhoneOTP = async (phone) => {
    const res = await api.post('/auth/phone/send-otp', { phone });
    return res.data;
  };

  const phoneLogin = async (phone, code) => {
    const res = await api.post('/auth/phone/login', { phone, code });
    const { access_token, refresh_token, user: userData } = res.data;
    localStorage.setItem('plantbot_token', access_token);
    localStorage.setItem('plantbot_refresh_token', refresh_token);
    setToken(access_token);
    setUser(userData);
    return userData;
  };

  const linkPhone = async (phone, code) => {
    const res = await api.post('/auth/phone/link', { phone, code });
    setUser(res.data);
    return res.data;
  };

  const updateProfile = async (profileData) => {
    const res = await api.put('/auth/profile', profileData);
    setUser(res.data);
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('plantbot_token');
    localStorage.removeItem('plantbot_refresh_token');
    setToken('');
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        themeMode,
        setThemeMode,
        isDarkMode,
        toggleDarkMode,
        login,
        register,
        googleLogin,
        sendPhoneOTP,
        phoneLogin,
        linkPhone,
        updateProfile,
        logout,
        isAuthenticated: !!token && !!user
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
