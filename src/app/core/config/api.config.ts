export const API_URL =
  window.location.hostname === 'localhost'
    ? 'http://localhost:3000/api'
    : '/api';

export function bannerSrc(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  if (window.location.hostname === 'localhost') {
    return `http://localhost:3000${path}`;
  }
  return path;
}
