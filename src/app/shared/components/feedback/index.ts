export interface FeedbackMessage {
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
}
