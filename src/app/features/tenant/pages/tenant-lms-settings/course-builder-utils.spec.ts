import { parseCourseBuilderExternalVideo, validateCourseBuilderVideoFile } from './course-builder-utils';

describe('course-builder-utils', () => {
  it('parses YouTube watch URLs into safe embed metadata', () => {
    expect(parseCourseBuilderExternalVideo('https://www.youtube.com/watch?v=abc123')).toEqual({
      provider: 'YOUTUBE',
      videoId: 'abc123',
      url: 'https://www.youtube.com/watch?v=abc123',
      embedUrl: 'https://www.youtube.com/embed/abc123',
    });
  });

  it('parses Vimeo URLs into safe embed metadata', () => {
    expect(parseCourseBuilderExternalVideo('https://vimeo.com/123456')).toEqual({
      provider: 'VIMEO',
      videoId: '123456',
      url: 'https://vimeo.com/123456',
      embedUrl: 'https://player.vimeo.com/video/123456',
    });
  });

  it('rejects malformed and unsupported external video URLs', () => {
    expect(parseCourseBuilderExternalVideo('not a url')).toBeNull();
    expect(parseCourseBuilderExternalVideo('https://example.com/video')).toBeNull();
  });

  it('validates supported video uploads', () => {
    expect(validateCourseBuilderVideoFile({ type: 'video/mp4', size: 1000 } as File)).toBeNull();
    expect(validateCourseBuilderVideoFile({ type: 'application/pdf', size: 1000 } as File)).toContain('Unsupported');
    expect(validateCourseBuilderVideoFile({ type: 'video/mp4', size: 20 }, 10)).toContain('too large');
  });
});
