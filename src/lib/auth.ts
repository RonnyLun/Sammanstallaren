interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

function btoa(str: string): string {
  return window.btoa(str);
}

export class AuthService {
  private static instance: AuthService;
  private token: string | null = null;
  private tokenExpiry: Date | null = null;

  private constructor() {}

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  private async fetchToken(): Promise<string> {
    const clientId = import.meta.env.VITE_CLIENT_ID;
    const clientSecret = import.meta.env.VITE_CLIENT_SECRET;
    const tokenUrl = 'https://auth-i-test.sundsvall.se/oauth2/token';

    if (!clientId || !clientSecret) {
      throw new Error('Missing OAuth2 credentials');
    }

    const basicAuth = btoa(`${clientId}:${clientSecret}`);

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${basicAuth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials'
    });

    if (!response.ok) {
      throw new Error('Failed to obtain access token');
    }

    const data: TokenResponse = await response.json();
    
    // Set token and expiry
    this.token = data.access_token;
    this.tokenExpiry = new Date(Date.now() + (data.expires_in * 1000));
    
    return data.access_token;
  }

  async getToken(): Promise<string> {
    // If we have a valid token, return it
    if (this.token && this.tokenExpiry && this.tokenExpiry > new Date()) {
      return this.token;
    }

    // Otherwise, fetch a new token
    return this.fetchToken();
  }
}