export function generateGuestUsername(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let suffix = "";
  for (let i = 0; i < 8; i++) {
    suffix += chars[Math.floor(Math.random() * chars.length)];
  }
  return `guest_${suffix}`;
}

export function avatarUrlForUser(id: string): string {
  return `https://picsum.photos/seed/lumina-${id.slice(0, 8)}/128/128`;
}
