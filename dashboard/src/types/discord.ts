export interface DiscordUser {
  id: string;
  username: string;
  discriminator: string;
  avatar: string | null;
  email?: string;
}

export interface VerificationData {
  discordId: string;
  games: string[];
  platform: string;
  agents?: string[];
  wantsBotUpdates?: boolean;
} 