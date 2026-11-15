import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { isMockModeEnabled, setMockModeEnabled, checkBackendHealth, API_BASE_URL } from '../services/api';

interface BackendContextValue {
  isMockMode: boolean;
  toggleMockMode: () => void;
  isBackendHealthy: boolean;
  isCheckingHealth: boolean;
  apiBaseUrl: string;
  refreshHealth: () => Promise<void>;
}

const BackendContext = createContext<BackendContextValue | undefined>(undefined);

export const BackendProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isMockMode, setIsMockModeState] = useState<boolean>(isMockModeEnabled());
  const [isBackendHealthy, setIsBackendHealthy] = useState<boolean>(false);
  const [isCheckingHealth, setIsCheckingHealth] = useState<boolean>(false);

  const refreshHealth = useCallback(async () => {
    setIsCheckingHealth(true);
    const healthy = await checkBackendHealth();
    setIsBackendHealthy(healthy);
    setIsCheckingHealth(false);
  }, []);

  useEffect(() => {
    refreshHealth();
    const interval = setInterval(refreshHealth, 20000);
    return () => clearInterval(interval);
  }, [refreshHealth]);

  useEffect(() => {
    const handleModeChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ enabled: boolean }>;
      setIsMockModeState(customEvent.detail.enabled);
    };
    window.addEventListener('deskpilot_backend_mode_change', handleModeChange);
    return () => window.removeEventListener('deskpilot_backend_mode_change', handleModeChange);
  }, []);

  const toggleMockMode = () => {
    const next = !isMockMode;
    setIsMockModeState(next);
    setMockModeEnabled(next);
  };

  return (
    <BackendContext.Provider
      value={{
        isMockMode,
        toggleMockMode,
        isBackendHealthy,
        isCheckingHealth,
        apiBaseUrl: API_BASE_URL,
        refreshHealth,
      }}
    >
      {children}
    </BackendContext.Provider>
  );
};

export const useBackend = () => {
  const context = useContext(BackendContext);
  if (!context) {
    throw new Error('useBackend must be used within a BackendProvider');
  }
  return context;
};
