import { apiClient, isMockModeEnabled } from './api';
import { KnowledgeDocument } from '../types';
import { INITIAL_DOCUMENTS } from './mockData';

const STORAGE_KEY = 'deskpilot_kb_documents';

const loadLocalDocuments = (): KnowledgeDocument[] => {
  const data = localStorage.getItem(STORAGE_KEY);
  if (data) {
    try {
      return JSON.parse(data);
    } catch {
      // fallback
    }
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DOCUMENTS));
  return INITIAL_DOCUMENTS;
};

const saveLocalDocuments = (docs: KnowledgeDocument[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(docs));
  window.dispatchEvent(new CustomEvent('deskpilot_kb_updated'));
};

export const knowledgeBaseService = {
  async getDocuments(): Promise<KnowledgeDocument[]> {
    if (!isMockModeEnabled()) {
      try {
        const response = await apiClient.get<any>('/api/documents');
        const docs = Array.isArray(response.data) ? response.data : response.data?.documents;
        if (Array.isArray(docs)) return docs;
      } catch {
        try {
          const response = await apiClient.get<any>('/api/knowledge-base');
          const docs = Array.isArray(response.data) ? response.data : response.data?.documents;
          if (Array.isArray(docs)) return docs;
        } catch (err) {
          console.warn('Backend unavailable, using local KB docs:', err);
        }
      }
    }
    return loadLocalDocuments();
  },

  async uploadDocument(
    file: File,
    category: KnowledgeDocument['category'] = 'General',
    onProgress?: (progress: number) => void
  ): Promise<KnowledgeDocument> {
    if (!isMockModeEnabled()) {
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('category', category);

        const response = await apiClient.post<any>('/api/documents/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total && onProgress) {
              const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              onProgress(percentCompleted);
            }
          },
        });
        return response.data?.document || response.data;
      } catch {
        try {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('category', category);

          const response = await apiClient.post<any>('/api/knowledge-base/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            onUploadProgress: (progressEvent) => {
              if (progressEvent.total && onProgress) {
                const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                onProgress(percentCompleted);
              }
            },
          });
          return response.data?.document || response.data;
        } catch (err) {
          console.warn('Backend upload unavailable, using simulated upload with progress:', err);
        }
      }
    }

    // Realistic simulated upload progress for demo
    if (onProgress) {
      onProgress(30);
      await new Promise((r) => setTimeout(r, 200));
      onProgress(70);
      await new Promise((r) => setTimeout(r, 250));
      onProgress(100);
    }

    const formatSize = (bytes: number) => {
      if (bytes < 1024) return bytes + ' B';
      if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
      return (bytes / 1048576).toFixed(1) + ' MB';
    };

    const isPdf = file.name.toLowerCase().endsWith('.pdf');
    const newDoc: KnowledgeDocument = {
      id: `doc-${Date.now()}`,
      name: file.name,
      size: formatSize(file.size),
      sizeBytes: file.size,
      uploadedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
      category,
      status: 'Indexed',
      type: isPdf ? 'pdf' : 'txt',
      tokensCount: Math.floor(file.size / 3.8),
    };

    const docs = loadLocalDocuments();
    docs.unshift(newDoc);
    saveLocalDocuments(docs);
    return newDoc;
  },

  async deleteDocument(id: string): Promise<boolean> {
    if (!isMockModeEnabled()) {
      try {
        await apiClient.delete(`/api/documents/${id}`);
        return true;
      } catch {
        try {
          await apiClient.delete(`/api/knowledge-base/${id}`);
          return true;
        } catch (err) {
          console.warn('Backend unavailable, falling back to local doc delete:', err);
        }
      }
    }

    const docs = loadLocalDocuments();
    const updated = docs.filter((d) => d.id !== id);
    saveLocalDocuments(updated);
    return true;
  },
};
