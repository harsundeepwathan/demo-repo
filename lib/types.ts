export type EnergyLevel = "low" | "medium" | "high";

export type TaskStatus = "now" | "next" | "someday";

export interface Task {
  id: string;
  title: string;
  notes: string;
  energyLevel: EnergyLevel;
  estimatedMinutes: number | null;
  actualMinutes: number | null;
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  pushCount: number;
  parentGoalId: string | null;
  parentTaskId: string | null;
  sortOrder: number;
}

export interface Goal {
  id: string;
  title: string;
  whyItMatters: string;
  createdAt: string;
  lastViewedAt: string | null;
}

export interface DailyActivity {
  date: string; // YYYY-MM-DD
  completedCount: number;
}

export interface StreakInfo {
  count: number;
  lastActiveDate: string | null;
  isFaded: boolean;
}

export interface TaskBreakdownStep {
  title: string;
  isFirstStep: boolean;
}
