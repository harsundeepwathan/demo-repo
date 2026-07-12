export interface EntryRecord {
  id: string;
  createdAt: string;
  transcript: string;
  moodScore: number;
  themes: string[];
  supportiveNote: string;
  suggestion: string;
}

export interface Analysis {
  moodScore: number;
  themes: string[];
  supportiveNote: string;
  suggestion: string;
}
