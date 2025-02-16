import { v4 as uuidv4 } from 'uuid';
import { AuthService } from './auth';

const API_BASE = 'https://api-i-test.sundsvall.se/aiflow/2.0';

export interface AIFlowSession {
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

export class AIFlowService {
  private municipalityId = '2281';
  private flowName = 'Tjänsteskrivelse';
  private flowVersion = 2;
  private authService: AuthService;

  constructor() {
    this.authService = AuthService.getInstance();
  }

  private async getHeaders(): Promise<Headers> {
    const token = await this.authService.getToken();
    return new Headers({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  async createSession(): Promise<AIFlowSession> {
    const headers = await this.getHeaders();
    const response = await fetch(
      `${API_BASE}/${this.municipalityId}/session/${this.flowName}/${this.flowVersion}`,
      {
        method: 'POST',
        headers
      }
    );
    
    if (!response.ok) {
      throw new Error('Failed to create session');
    }
    
    return response.json();
  }

  async addInput(sessionId: string, inputs: Record<string, string | File[]>): Promise<AIFlowSession> {
    const encodedInputs = await Promise.all(
      Object.entries(inputs).map(async ([key, value]) => {
        if (Array.isArray(value)) {
          // Handle file arrays
          const fileContents = await Promise.all(
            value.map(async (file) => {
              const buffer = await file.arrayBuffer();
              return btoa(String.fromCharCode(...new Uint8Array(buffer)));
            })
          );
          return fileContents.map(content => ({
            inputId: key,
            value: content
          }));
        } else {
          // Handle string values
          return [{
            inputId: key,
            value: btoa(value)
          }];
        }
      })
    );

    // Flatten the array of arrays
    const flattenedInputs = encodedInputs.flat();

    const headers = await this.getHeaders();
    const response = await fetch(
      `${API_BASE}/${this.municipalityId}/session/${sessionId}`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify(flattenedInputs)
      }
    );

    if (!response.ok) {
      throw new Error('Failed to add input');
    }

    return response.json();
  }

  async runStep(sessionId: string, stepId: string): Promise<StepExecution> {
    const headers = await this.getHeaders();
    const response = await fetch(
      `${API_BASE}/${this.municipalityId}/session/run/${sessionId}/${stepId}`,
      {
        method: 'POST',
        headers
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to run step ${stepId}`);
    }

    return response.json();
  }

  async generateDocument(sessionId: string): Promise<Blob> {
    const headers = await this.getHeaders();
    const response = await fetch(
      `${API_BASE}/${this.municipalityId}/session/${sessionId}/generate`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({
          templateId: 'default-template'
        })
      }
    );

    if (!response.ok) {
      throw new Error('Failed to generate document');
    }

    return response.blob();
  }

  async getStepStatus(sessionId: string, stepId: string): Promise<StepExecution> {
    const headers = await this.getHeaders();
    const response = await fetch(
      `${API_BASE}/${this.municipalityId}/session/${sessionId}/${stepId}`,
      {
        method: 'GET',
        headers
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to get step status for ${stepId}`);
    }

    return response.json();
  }
}