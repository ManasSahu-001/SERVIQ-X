import axios from 'axios';

// Base API URL configurable via environment variable
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

// Storage keys
const MOCK_MODE_KEY = 'deskpilot_mock_mode';

// Default mock mode is enabled until backend connection is verified
export const isMockModeEnabled = (): boolean => {
  const saved = localStorage.getItem(MOCK_MODE_KEY);
  if (saved !== null) {
    return saved === 'true';
  }
  return true; // Default to demo/mock mode for hackathon reliability
};

export const setMockModeEnabled = (enabled: boolean): void => {
  localStorage.setItem(MOCK_MODE_KEY, String(enabled));
  window.dispatchEvent(new CustomEvent('deskpilot_backend_mode_change', { detail: { enabled } }));
};

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 8000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // If backend is unreachable or returns error, log cleanly
    if (!error.response) {
      console.warn('[DeskPilot API] Backend service unreachable. Working in Demo/Mock Mode.');
    }
    return Promise.reject(error);
  }
);

export const checkBackendHealth = async (): Promise<boolean> => {
  try {
    const res = await apiClient.get('/api/health', { timeout: 2500 });
    return res.status >= 200 && res.status < 300;
  } catch {
    return false;
  }
};
