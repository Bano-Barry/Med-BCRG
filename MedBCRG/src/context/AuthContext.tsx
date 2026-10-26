import React, { createContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  login: (matricule: string, password: string) => Promise<{ success: boolean; role?: string; isFirstLogin?: boolean; error?: string }>;
  loginWithSso: (ssoToken: string) => Promise<{ success: boolean; role?: string; error?: string }>;
  logout: () => void;
  isAuthenticated: boolean;
}

const API_BASE_URL = import.meta.env.VITE_API_URL !== undefined ? import.meta.env.VITE_API_URL : '';

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = sessionStorage.getItem('bcrg_auth_user');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    if (user) {
      sessionStorage.setItem('bcrg_auth_user', JSON.stringify(user));
    } else {
      sessionStorage.removeItem('bcrg_auth_user');
      sessionStorage.removeItem('bcrg_access_token');
    }
  }, [user]);

  const login = async (matricule: string, password: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matricule, password })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const userData = data.data.user;
        const tokens = data.data.tokens;
        
        sessionStorage.setItem('bcrg_access_token', tokens.accessToken);
        
        let phone = userData.phone || '';
        let jobTitle = userData.jobTitle || '';
        const matriculeValue = userData.matricule || matricule;

        // Fetch /api/auth/me to get additional fields (phone, job title, etc.) if available
        try {
          const meRes = await fetch(`${API_BASE_URL}/api/auth/me`, {
            headers: {
              'Authorization': `Bearer ${tokens.accessToken}`
            }
          });
          if (meRes.ok) {
            const meData = await meRes.json();
            const meUser = meData.data?.user || meData.data;
            if (meUser) {
              if (meUser.phone) phone = meUser.phone;
              if (meUser.jobTitle) jobTitle = meUser.jobTitle;
            }
          }
        } catch (e) {
          console.warn('Could not fetch user profile details:', e);
        }

        let mappedRole: UserRole = 'PATIENT';
        const rawRole = (userData.role || '').toUpperCase();
        if (rawRole === 'DOCTOR' || rawRole === 'MEDECIN') {
          mappedRole = 'MEDECIN';
        } else if (rawRole === 'HR' || rawRole === 'ADMIN') {
          mappedRole = 'ADMIN';
        } else {
          mappedRole = 'PATIENT';
        }

        const mappedUser: User = {
          id: userData.id,
          name: `${userData.firstName} ${userData.lastName}`,
          email: userData.email,
          role: mappedRole,
          title: mappedRole === 'ADMIN' ? 'Administrateur (RH)' : mappedRole === 'MEDECIN' ? 'Médecin' : 'Patient',
          avatar: 'https://ui-avatars.com/api/?name=' + userData.firstName + '+' + userData.lastName + '&background=1b3b31&color=fff',
          matricule: matriculeValue,
          phone: phone,
          jobTitle: jobTitle || (mappedRole === 'ADMIN' ? 'Responsable RH' : undefined),
        };
        
        setUser(mappedUser);
        return { success: true, role: mappedUser.role, isFirstLogin: userData.isFirstLogin };
      } else {
        return { success: false, error: data.message || 'Identifiants incorrects' };
      }
    } catch (err) {
      return { success: false, error: 'Erreur de connexion au serveur' };
    }
  };

  /**
   * Connexion Single Sign-On (SSO) fédérée via le BCRG HUB.
   */
  const loginWithSso = async (ssoToken: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/sso-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sso_token: ssoToken.trim() })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const userData = data.data.user;
        const tokens = data.data.tokens;

        sessionStorage.setItem('bcrg_access_token', tokens.accessToken);

        let phone = userData.phone || '';
        let jobTitle = userData.jobTitle || '';
        const matriculeValue = userData.matricule || '';

        // Tenter de récupérer les informations détaillées si besoin
        try {
          const meRes = await fetch(`${API_BASE_URL}/api/auth/me`, {
            headers: {
              'Authorization': `Bearer ${tokens.accessToken}`
            }
          });
          if (meRes.ok) {
            const meData = await meRes.json();
            const meUser = meData.data?.user || meData.data;
            if (meUser) {
              if (meUser.phone) phone = meUser.phone;
              if (meUser.jobTitle) jobTitle = meUser.jobTitle;
            }
          }
        } catch (e) {
          console.warn('Could not fetch user profile details:', e);
        }

        let mappedRole: UserRole = 'PATIENT';
        const rawRole = (userData.role || '').toUpperCase();
        if (rawRole === 'DOCTOR' || rawRole === 'MEDECIN') {
          mappedRole = 'MEDECIN';
        } else if (rawRole === 'HR' || rawRole === 'ADMIN') {
          mappedRole = 'ADMIN';
        } else {
          mappedRole = 'PATIENT';
        }

        const mappedUser: User = {
          id: userData.id,
          name: `${userData.firstName} ${userData.lastName}`,
          email: userData.email,
          role: mappedRole,
          title: mappedRole === 'ADMIN' ? 'Administrateur (RH)' : mappedRole === 'MEDECIN' ? 'Médecin' : 'Patient',
          avatar: 'https://ui-avatars.com/api/?name=' + userData.firstName + '+' + userData.lastName + '&background=1b3b31&color=fff',
          matricule: matriculeValue,
          phone: phone,
          jobTitle: jobTitle || (mappedRole === 'ADMIN' ? 'Responsable RH' : undefined),
        };

        setUser(mappedUser);
        return { success: true, role: mappedUser.role };
      } else {
        return { success: false, error: data.message || 'Échec de validation du jeton SSO' };
      }
    } catch (err: any) {
      return { success: false, error: err.message || 'Erreur lors de la validation du jeton SSO auprès du serveur' };
    }
  };

  const logout = () => {
    sessionStorage.removeItem('bcrg_auth_user');
    sessionStorage.removeItem('bcrg_access_token');
    setUser(null);
    const hubUrl = import.meta.env.VITE_BCRG_HUB_URL || 'http://localhost:5173';
    window.location.href = hubUrl;
  };

  // Surveillance proactive de la validité de la session (Single Logout - SLO)
  useEffect(() => {
    if (!user) return;

    const checkSessionValidity = async () => {
      const token = sessionStorage.getItem('bcrg_access_token');
      if (!token) {
        logout();
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.status === 401) {
          console.warn('[SLO Watchdog] Session révoquée par Single Logout (SLO). Redirection vers le Hub...');
          logout();
        }
      } catch (err) {
        // Ignorer les erreurs réseau temporaires
      }
    };

    const onFocus = () => {
      checkSessionValidity();
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkSessionValidity();
      }
    };

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibilityChange);
    const interval = setInterval(checkSessionValidity, 15000);

    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      clearInterval(interval);
    };
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        loginWithSso,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
