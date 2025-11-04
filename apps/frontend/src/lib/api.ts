import { getToken } from './auth';

const API_BASE = '/api';

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  [key: string]: any;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public data?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new ApiError(
      response.status,
      data.message || 'Błąd API',
      data
    );
  }

  return data;
}

export const api = {
  auth: {
    login: (email: string, password: string) =>
      fetchApi<{ success: boolean; user: any; token: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),

    logout: () =>
      fetchApi<{ success: boolean }>('/auth/logout', {
        method: 'POST',
      }),

    status: () =>
      fetchApi<{ authenticated: boolean; user: any | null }>('/auth/status'),
  },

  chat: {
    createSession: (title?: string) =>
      fetchApi<{ success: boolean; session: any }>('/chat/sessions', {
        method: 'POST',
        body: JSON.stringify({ title }),
      }),

    getSessions: () =>
      fetchApi<{ success: boolean; sessions: any[] }>('/chat/sessions'),

    getMessages: (sessionId: string) =>
      fetchApi<{ success: boolean; messages: any[] }>(
        `/chat/sessions/${sessionId}/messages`
      ),

    sendMessage: (sessionId: string, question: string, k?: number) =>
      fetchApi<{ success: boolean; message: any }>(
        `/chat/sessions/${sessionId}/message`,
        {
          method: 'POST',
          body: JSON.stringify({ question, k }),
        }
      ),

    deleteSession: (sessionId: string) =>
      fetchApi<{ success: boolean }>(`/chat/sessions/${sessionId}`, {
        method: 'DELETE',
      }),
  },

  documents: {
    add: (content: string, metadata?: any) =>
      fetchApi<{ success: boolean; documentId: string; chunkCount: number }>(
        '/documents/add',
        {
          method: 'POST',
          body: JSON.stringify({ content, metadata }),
        }
      ),

    getAll: () =>
      fetchApi<{ success: boolean; documents: any[] }>('/documents'),

    getById: (id: string) =>
      fetchApi<{ success: boolean; document: any }>(`/documents/${id}`),

    delete: (id: string) =>
      fetchApi<{ success: boolean }>(`/documents/${id}`, {
        method: 'DELETE',
      }),
  },
};
