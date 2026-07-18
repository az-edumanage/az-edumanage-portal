import { environment } from '../../../environments/environment';

const API_ORIGIN = environment.apiBaseUrl.replace(/\/api\/v1\/?$/, '');

export function resolvePlatformGuideMediaUrl(raw: string): string {
  const value = raw.trim();
  if (!value || /^(https?:|data:|blob:)/i.test(value)) {
    return value;
  }
  return `${API_ORIGIN}${value.startsWith('/') ? '' : '/'}${value}`;
}

export function platformGuideEmbedUrl(raw: string): string | null {
  const value = raw.trim();
  const youtube = value.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/i);
  if (youtube) {
    return `https://www.youtube.com/embed/${youtube[1]}?autoplay=1&rel=0`;
  }
  const vimeo = value.match(/vimeo\.com\/(?:video\/)?(\d+)/i);
  if (vimeo) {
    return `https://player.vimeo.com/video/${vimeo[1]}?autoplay=1`;
  }
  return null;
}
