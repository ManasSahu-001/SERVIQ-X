import { apiClient, isMockModeEnabled } from './api';
import {
  AnalyticsMetrics,
  ChartDataPoint,
  CategoryDataPoint,
  PriorityDataPoint,
} from '../types';
import {
  INITIAL_ANALYTICS,
  CONVERSATIONS_TIMELINE,
  CATEGORY_DISTRIBUTION,
  PRIORITY_DISTRIBUTION,
} from './mockData';

export interface AnalyticsResponse {
  isDemoData: boolean;
  metrics: AnalyticsMetrics;
  timeline: ChartDataPoint[];
  categories: CategoryDataPoint[];
  priorities: PriorityDataPoint[];
}

export const analyticsService = {
  async getAnalyticsData(): Promise<AnalyticsResponse> {
    if (!isMockModeEnabled()) {
      try {
        const response = await apiClient.get<AnalyticsResponse>('/api/analytics');
        return {
          ...response.data,
          isDemoData: false,
        };
      } catch (err) {
        console.warn('Backend /api/analytics unavailable, serving demo metrics:', err);
      }
    }

    return {
      isDemoData: true,
      metrics: INITIAL_ANALYTICS,
      timeline: CONVERSATIONS_TIMELINE,
      categories: CATEGORY_DISTRIBUTION,
      priorities: PRIORITY_DISTRIBUTION,
    };
  },
};
