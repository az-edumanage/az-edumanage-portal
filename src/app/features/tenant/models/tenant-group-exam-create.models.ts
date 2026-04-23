export interface TenantGroupExamCreatePayload {
  title: string;
  date: string;
  duration: number;
  instructions: string;
  saveToCenterBank: boolean;
  saveToMyMedia: boolean;
  shuffleQuestions: boolean;
  showResultsImmediately: boolean;
  allowRetakes: boolean;
}
