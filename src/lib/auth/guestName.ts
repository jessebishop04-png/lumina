export function generateGuestUsername(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let suffix = "";
  for (let i = 0; i < 8; i++) {
    suffix += chars[Math.floor(Math.random() * chars.length)];
  }
  return `guest_${suffix}`;
}

export function avatarUrlForUser(id: string): string {
  const hue = [...id].reduce((sum, char) => sum + char.charCodeAt(0), 0) % 360;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128"><rect width="128" height="128" rx="64" fill="hsl(${hue},52%,42%)"/><circle cx="64" cy="52" r="22" fill="rgba(255,255,255,0.35)"/><ellipse cx="64" cy="108" rx="36" ry="28" fill="rgba(255,255,255,0.25)"/></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export const DEFAULT_AVATAR_URL = avatarUrlForUser("lumina-default");
