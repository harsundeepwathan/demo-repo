export interface Entry {
  id: string;
  createdAt: string;
  transcript: string;
  moodScore: number;
  themes: string[];
  supportiveNote: string;
  suggestion: string;
}

export interface MoodPoint {
  date: string;
  averageMood: number;
  entryCount: number;
}

export interface ThemeCount {
  theme: string;
  count: number;
}

export interface Insights {
  moodTrend: MoodPoint[];
  topThemes: ThemeCount[];
  observations: string[];
}
