/**
 * Intric AI Platform Type Definitions
 */

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

export interface Session {
  id: string;
  state: 'CREATED' | 'RUNNING' | 'FINISHED';
  tokenCount: number;
  input: Record<string, string[]>;
  stepExecutions: Record<string, StepExecution>;
}

export interface StepExecution {
  startedAt: string;
  finishedAt?: string;
  state: 'PENDING' | 'RUNNING' | 'DONE' | 'ERROR';
  output?: string;
  errorMessage?: string;
}

export interface FileUploadResponse {
  id: string;
  name: string;
  mimetype: string;
  size: number;
}

export interface SessionResponse {
  session_id: string;
  question: string;
  files: FileUploadResponse[];
  answer: string;
  references: Reference[];
  model: Model | null;
  tools: Tools;
}

export interface Reference {
  id: string;
  metadata: {
    url?: string;
    title?: string;
    embedding_model_id: string;
    size: number;
  };
  group_id?: string;
  website_id?: string;
  score: number;
}

export interface Model {
  id: string;
  name: string;
  family: string;
  token_limit: number;
  stability: 'stable' | 'experimental';
  hosting: 'usa' | 'eu' | 'swe';
}

export interface Tools {
  assistants: Array<{ id: string }>;
}

export interface ErrorResponse {
  message: string;
  intric_error_code: number;
}