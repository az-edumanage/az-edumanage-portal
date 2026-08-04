export interface CourseBuilderExternalVideo {
  provider: 'YOUTUBE' | 'VIMEO';
  videoId: string;
  url: string;
  embedUrl: string;
}

export function parseCourseBuilderExternalVideo(rawUrl: string): CourseBuilderExternalVideo | null {
  try {
    const url = new URL(rawUrl.trim());
    const host = url.hostname.replace(/^www\./, '');
    if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtu.be') {
      const videoId = host === 'youtu.be' ? url.pathname.slice(1) : url.searchParams.get('v');
      return videoId ? {
        provider: 'YOUTUBE',
        videoId,
        url: url.toString(),
        embedUrl: `https://www.youtube.com/embed/${encodeURIComponent(videoId)}`,
      } : null;
    }
    if (host === 'vimeo.com') {
      const videoId = url.pathname.split('/').filter(Boolean)[0];
      return videoId ? {
        provider: 'VIMEO',
        videoId,
        url: url.toString(),
        embedUrl: `https://player.vimeo.com/video/${encodeURIComponent(videoId)}`,
      } : null;
    }
    return null;
  } catch {
    return null;
  }
}

export function validateCourseBuilderVideoFile(file: Pick<File, 'type' | 'size'>, maxBytes = 1024 * 1024 * 1024): string | null {
  if (!['video/mp4', 'video/webm', 'video/quicktime'].includes(file.type)) {
    return 'Unsupported video type. Use MP4, WebM, or MOV.';
  }
  if (file.size > maxBytes) {
    return 'Video is too large. Maximum development upload size is 1GB.';
  }
  return null;
}
