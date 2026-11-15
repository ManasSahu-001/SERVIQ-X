import { apiClient, isMockModeEnabled } from './api';
import { AgentSettings } from '../types';
import { INITIAL_SETTINGS } from './mockData';

const STORAGE_KEY = 'deskpilot_settings';

const loadLocalSettings = (): AgentSettings => {
  const data = localStorage.getItem(STORAGE_KEY);
  if (data) {
    try {
      return JSON.parse(data);
    } catch {
      // fallback
    }
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_SETTINGS));
  return INITIAL_SETTINGS;
};

const saveLocalSettings = (settings: AgentSettings) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  window.dispatchEvent(new CustomEvent('deskpilot_settings_updated'));
};

export const settingsService = {
  async getSettings(): Promise<AgentSettings> {
    if (!isMockModeEnabled()) {
      try {
        const response = await apiClient.get<AgentSettings>('/api/settings');
        return response.data;
      } catch (err) {
        console.warn('Backend unavailable, using local settings:', err);
      }
    }
    return loadLocalSettings();
  },

  async updateSettings(settings: AgentSettings): Promise<AgentSettings> {
    if (!isMockModeEnabled()) {
      try {
        const response = await apiClient.patch<AgentSettings>('/api/settings', settings);
        return response.data;
      } catch (err) {
        console.warn('Backend unavailable, falling back to local settings update:', err);
      }
    }

    saveLocalSettings(settings);
    return settings;
  },
};
