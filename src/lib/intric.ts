import axios, { AxiosInstance } from 'axios';

export class IntricClient {
  private baseURL = 'https://sundsvall.backend.intric.ai';
  private client: AxiosInstance;
  private token: string | null = null;
  private tokenExpiry: Date | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Accept': '*/*',
        'Accept-Encoding': 'gzip,deflate'
      },
    });

    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response) {
          const { status, data } = error.response;
          const errorMessage = data?.message || data?.detail || 'Unknown error occurred';
          
          switch (status) {
            case 401:
              this.token = null;
              this.tokenExpiry = null;
              throw new Error(`Authentication failed: ${errorMessage}`);
            case 403:
              throw new Error(`Permission denied: ${errorMessage}`);
            case 404:
              throw new Error(`Resource not found: ${errorMessage}`);
            case 422:
              throw new Error(`Validation error: ${errorMessage}`);
            default:
              throw new Error(`Server error (${status}): ${errorMessage}`);
          }
        }
        throw new Error('Network error occurred');
      }
    );
  }

  private async authenticate(): Promise<void> {
    if (this.token && this.tokenExpiry && this.tokenExpiry > new Date()) {
      return;
    }

    const username = import.meta.env.VITE_INTRIC_USER;
    const password = import.meta.env.VITE_INTRIC_PASSWORD;

    if (!username || !password) {
      throw new Error('Missing Intric credentials');
    }

    try {
      const params = new URLSearchParams();
      params.append('grant_type', 'password');
      params.append('scope', 'OAuth2PasswordBearer');
      params.append('username', username);
      params.append('password', password);

      const response = await this.client.post('/api/v1/users/login/token/', params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Host': this.baseURL.replace('https://', ''),
        },
      });

      if (!response.data.access_token) {
        throw new Error('No access token received');
      }

      this.token = response.data.access_token;
      this.tokenExpiry = new Date(Date.now() + (response.data.expires_in || 3600) * 1000);
      
      this.client.defaults.headers.common['Authorization'] = `Bearer ${this.token}`;
    } catch (error) {
      this.token = null;
      this.tokenExpiry = null;
      throw new Error('Authentication failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  private async ensureAuthenticated(): Promise<void> {
    try {
      await this.authenticate();
    } catch (error) {
      console.error('Authentication error:', error);
      throw error;
    }
  }

  async createSession(
    assistantId: string,
    question: string = '',
    fileIds: string[] = []
  ): Promise<any> {
    if (!assistantId) {
      throw new Error('Assistant ID is required');
    }

    await this.ensureAuthenticated();
    
    try {
      const body = {
        question,
        stream: false,
        files: fileIds.map(id => ({ id }))
      };

      console.log('Creating session with body:', JSON.stringify(body, null, 2));

      const response = await this.client.post(
        `/api/v1/assistants/${assistantId}/sessions/`,
        body,
        {
          headers: {
            'Content-Type': 'application/json; charset=utf-8'
          }
        }
      );

      // The response contains session_id instead of id
      if (!response.data || !response.data.session_id) {
        console.error('Invalid session response:', response.data);
        throw new Error('Invalid session response structure');
      }

      // Transform the response to match our expected format
      return {
        id: response.data.session_id,
        answer: response.data.answer,
        files: response.data.files,
        model: response.data.model,
        question: response.data.question,
        references: response.data.references,
        tools: response.data.tools
      };
    } catch (error) {
      console.error('Create session error:', error);
      throw new Error('Failed to create session: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  async interactWithSession(
    assistantId: string, 
    sessionId: string, 
    question: string,
    fileIds: string[] = []
  ): Promise<any> {
    if (!assistantId || !sessionId) {
      throw new Error('Assistant ID and session ID are required');
    }

    await this.ensureAuthenticated();

    try {
      const body = {
        question
      };

      console.log('Interacting with session, body:', JSON.stringify(body, null, 2));

      const response = await this.client.post(
        `/api/v1/assistants/${assistantId}/sessions/${sessionId}/`,
        body,
        {
          headers: {
            'Content-Type': 'application/json; charset=utf-8'
          },
          timeout: 240000, // 240 seconds timeout
        }
      );

      if (!response.data) {
        throw new Error('Invalid session interaction response');
      }

      return response.data;
    } catch (error) {
      console.error('Session interaction error:', error);
      throw new Error('Failed to interact with session: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  async uploadFile(file: File): Promise<any> {
    if (!file) {
      throw new Error('File is required');
    }

    await this.ensureAuthenticated();

    const formData = new FormData();
    formData.append('upload_file', file);

    try {
      const response = await this.client.post('/api/v1/files/', formData, {
        headers: {
          'accept': 'application/json',
          'Content-Type': 'multipart/form-data'
        }
      });

      if (!response.data || !response.data.id) {
        throw new Error('Invalid file upload response');
      }

      return response.data;
    } catch (error) {
      console.error('File upload error:', error);
      throw new Error('Failed to upload file: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  async deleteFile(fileId: string): Promise<void> {
    if (!fileId) {
      throw new Error('File ID is required');
    }

    await this.ensureAuthenticated();

    try {
      await this.client.delete(`/api/v1/files/${fileId}/`, {
        headers: {
          'Content-Type': 'application/json; charset=utf-8'
        }
      });
    } catch (error) {
      console.error('File deletion error:', error);
      throw new Error('Failed to delete file: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }
}