import type { DiscordUser, VerificationData } from '../types/discord';

export type { DiscordUser, VerificationData };

class DiscordAuth {
  private clientId: string;
  private redirectUri: string;
  private scope = 'identify';

  constructor() {
    this.clientId = import.meta.env.VITE_DISCORD_CLIENT_ID || '';
    this.redirectUri = import.meta.env.VITE_DISCORD_REDIRECT_URI || `${window.location.origin}/verify`;
  }

  // OAuth2-URL generieren
  getAuthUrl(): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: this.scope,
    });

    const authUrl = `https://discord.com/api/oauth2/authorize?${params.toString()}`;
    return authUrl;
  }

  // Token Exchange über Backend-API
  async authenticateWithCode(code: string, redirectUri?: string): Promise<DiscordUser> {
    const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
    const response = await fetch(`${apiUrl}/auth/discord/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        code,
        redirectUri: redirectUri || this.redirectUri
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(`Authentication failed: ${errorData.error || 'Unknown error'}`);
    }

    const data = await response.json();
    return data.user;
  }

  // Verifizierungsdaten an Bot-API senden
  async submitVerification(data: VerificationData): Promise<boolean> {
    try {
      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
      const response = await fetch(`${apiUrl}/verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      return response.ok;
    } catch (error) {
      return false;
    }
  }

  // Avatar-URL generieren
  getAvatarUrl(user: DiscordUser): string {
    if (!user.avatar) {
      const defaultAvatar = parseInt(user.discriminator) % 5;
      return `https://cdn.discordapp.com/embed/avatars/${defaultAvatar}.png`;
    }
    
    return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=128`;
  }
}

export const discordAuth = new DiscordAuth(); 