export interface Document {
  id: string;
  content: string;
  metadata: Record<string, any>;
  createdAt?: Date;
}

export interface AddDocumentRequest {
  content: string;
  metadata?: Record<string, any>;
}

export interface AddDocumentResponse {
  success: boolean;
  documentId: string;
  message: string;
}

export interface ChatRequest {
  question: string;
  k?: number;
}

export interface ChatResponse {
  answer: string;
  sources?: Array<{
    content: string;
    metadata: Record<string, any>;
  }>;
}

export interface HealthResponse {
  status: 'ok' | 'error';
  backend: boolean;
  qdrant: boolean;
  message?: string;
}

export interface ErrorResponse {
  error: string;
  message: string;
}
