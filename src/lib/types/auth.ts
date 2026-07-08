export type AuthMethod = "guest" | "email" | "google";

export interface AuthUser {
  id: string;
  username: string;
  displayName: string;
  email: string | null;
  avatarUrl: string;
  authMethod: AuthMethod;
  createdAt: string;
}
