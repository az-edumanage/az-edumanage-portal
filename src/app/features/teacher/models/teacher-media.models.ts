export interface MediaItem {
  id: string;
  title: string;
  type: 'Exam' | 'Video' | 'PDF' | 'Image';
  date: string;
  size?: string;
  group?: string;
}
