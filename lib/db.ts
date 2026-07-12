import * as SQLite from "expo-sqlite";
import { makeId } from "./id";
import type { DailyActivity, EnergyLevel, Goal, StreakInfo, Task, TaskStatus } from "./types";

const DB_NAME = "anchor.db";

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync(DB_NAME).then(async (db) => {
      await db.execAsync(`
        PRAGMA journal_mode = WAL;
        CREATE TABLE IF NOT EXISTS goals (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          whyItMatters TEXT NOT NULL DEFAULT '',
          createdAt TEXT NOT NULL,
          lastViewedAt TEXT
        );
        CREATE TABLE IF NOT EXISTS tasks (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          notes TEXT NOT NULL DEFAULT '',
          energyLevel TEXT NOT NULL DEFAULT 'medium',
          estimatedMinutes INTEGER,
          actualMinutes INTEGER,
          status TEXT NOT NULL DEFAULT 'now',
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL,
          completedAt TEXT,
          pushCount INTEGER NOT NULL DEFAULT 0,
          parentGoalId TEXT,
          parentTaskId TEXT,
          sortOrder INTEGER NOT NULL DEFAULT 0
        );
        CREATE TABLE IF NOT EXISTS daily_activity (
          date TEXT PRIMARY KEY,
          completedCount INTEGER NOT NULL DEFAULT 0
        );
        CREATE TABLE IF NOT EXISTS app_settings (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
        CREATE INDEX IF NOT EXISTS idx_tasks_parentTaskId ON tasks(parentTaskId);
      `);
      return db;
    });
  }
  return dbPromise;
}

export async function initDb(): Promise<void> {
  await getDb();
}

function nowIso(): string {
  return new Date().toISOString();
}

function todayStr(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}

function statusRank(status: TaskStatus): number {
  return status === "now" ? 0 : status === "next" ? 1 : 2;
}

function rowToTask(row: any): Task {
  return {
    id: row.id,
    title: row.title,
    notes: row.notes ?? "",
    energyLevel: row.energyLevel as EnergyLevel,
    estimatedMinutes: row.estimatedMinutes ?? null,
    actualMinutes: row.actualMinutes ?? null,
    status: row.status as TaskStatus,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    completedAt: row.completedAt ?? null,
    pushCount: row.pushCount ?? 0,
    parentGoalId: row.parentGoalId ?? null,
    parentTaskId: row.parentTaskId ?? null,
    sortOrder: row.sortOrder ?? 0,
  };
}

function rowToGoal(row: any): Goal {
  return {
    id: row.id,
    title: row.title,
    whyItMatters: row.whyItMatters ?? "",
    createdAt: row.createdAt,
    lastViewedAt: row.lastViewedAt ?? null,
  };
}

// ---------- Tasks ----------

export interface CreateTaskInput {
  title: string;
  notes?: string;
  energyLevel?: EnergyLevel;
  estimatedMinutes?: number | null;
  status?: TaskStatus;
  parentGoalId?: string | null;
  parentTaskId?: string | null;
}

export async function createTask(input: CreateTaskInput): Promise<Task> {
  const db = await getDb();
  const status = input.status ?? "now";
  const maxRow = await db.getFirstAsync<{ maxOrder: number | null }>(
    "SELECT MAX(sortOrder) as maxOrder FROM tasks WHERE status = ?",
    [status]
  );
  const sortOrder = (maxRow?.maxOrder ?? -1) + 1;
  const task: Task = {
    id: makeId(),
    title: input.title.trim(),
    notes: input.notes ?? "",
    energyLevel: input.energyLevel ?? "medium",
    estimatedMinutes: input.estimatedMinutes ?? null,
    actualMinutes: null,
    status,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    completedAt: null,
    pushCount: 0,
    parentGoalId: input.parentGoalId ?? null,
    parentTaskId: input.parentTaskId ?? null,
    sortOrder,
  };
  await db.runAsync(
    `INSERT INTO tasks
      (id, title, notes, energyLevel, estimatedMinutes, actualMinutes, status, createdAt, updatedAt, completedAt, pushCount, parentGoalId, parentTaskId, sortOrder)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      task.id,
      task.title,
      task.notes,
      task.energyLevel,
      task.estimatedMinutes,
      task.actualMinutes,
      task.status,
      task.createdAt,
      task.updatedAt,
      task.completedAt,
      task.pushCount,
      task.parentGoalId,
      task.parentTaskId,
      task.sortOrder,
    ]
  );
  return task;
}

export async function listTasksByStatus(status: TaskStatus): Promise<Task[]> {
  const db = await getDb();
  const rows = await db.getAllAsync(
    "SELECT * FROM tasks WHERE status = ? AND parentTaskId IS NULL AND completedAt IS NULL ORDER BY sortOrder ASC, createdAt ASC",
    [status]
  );
  return rows.map(rowToTask);
}

export async function listSubtasks(parentTaskId: string): Promise<Task[]> {
  const db = await getDb();
  const rows = await db.getAllAsync(
    "SELECT * FROM tasks WHERE parentTaskId = ? ORDER BY sortOrder ASC, createdAt ASC",
    [parentTaskId]
  );
  return rows.map(rowToTask);
}

export async function getTask(id: string): Promise<Task | null> {
  const db = await getDb();
  const row = await db.getFirstAsync("SELECT * FROM tasks WHERE id = ?", [id]);
  return row ? rowToTask(row) : null;
}

export async function updateTask(id: string, patch: Partial<Task>): Promise<void> {
  const db = await getDb();
  const existing = await getTask(id);
  if (!existing) return;
  const merged: Task = { ...existing, ...patch, updatedAt: nowIso() };
  await db.runAsync(
    `UPDATE tasks SET title=?, notes=?, energyLevel=?, estimatedMinutes=?, actualMinutes=?,
      status=?, updatedAt=?, completedAt=?, pushCount=?, parentGoalId=?, parentTaskId=?, sortOrder=?
     WHERE id=?`,
    [
      merged.title,
      merged.notes,
      merged.energyLevel,
      merged.estimatedMinutes,
      merged.actualMinutes,
      merged.status,
      merged.updatedAt,
      merged.completedAt,
      merged.pushCount,
      merged.parentGoalId,
      merged.parentTaskId,
      merged.sortOrder,
      id,
    ]
  );
}

export async function deleteTask(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync("DELETE FROM tasks WHERE id = ? OR parentTaskId = ?", [id, id]);
}

/** Moves a task to a new status/sortOrder. Increments pushCount when the move is a deferral (now -> next/someday, next -> someday). */
export async function moveTask(id: string, newStatus: TaskStatus, newSortOrder?: number): Promise<void> {
  const existing = await getTask(id);
  if (!existing) return;
  const db = await getDb();
  const isDeferral = statusRank(newStatus) > statusRank(existing.status);
  let sortOrder = newSortOrder;
  if (sortOrder === undefined) {
    const maxRow = await db.getFirstAsync<{ maxOrder: number | null }>(
      "SELECT MAX(sortOrder) as maxOrder FROM tasks WHERE status = ?",
      [newStatus]
    );
    sortOrder = (maxRow?.maxOrder ?? -1) + 1;
  }
  await updateTask(id, {
    status: newStatus,
    sortOrder,
    pushCount: isDeferral ? existing.pushCount + 1 : existing.pushCount,
  });
}

export async function reorderWithinStatus(status: TaskStatus, orderedIds: string[]): Promise<void> {
  const db = await getDb();
  for (let i = 0; i < orderedIds.length; i++) {
    await db.runAsync("UPDATE tasks SET sortOrder = ? WHERE id = ?", [i, orderedIds[i]]);
  }
}

export async function completeTask(id: string, actualMinutes?: number | null): Promise<void> {
  await updateTask(id, {
    completedAt: nowIso(),
    actualMinutes: actualMinutes ?? null,
  });
  await recordCompletionToday();
}

/** Moves tasks that have sat untouched in "now" for `thresholdDays` into "someday". */
export async function runAutoMigration(thresholdDays: number): Promise<number> {
  const db = await getDb();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - thresholdDays);
  const stale = await db.getAllAsync<{ id: string }>(
    "SELECT id FROM tasks WHERE status = 'now' AND completedAt IS NULL AND updatedAt < ?",
    [cutoff.toISOString()]
  );
  for (const row of stale) {
    await moveTask(row.id, "someday");
  }
  return stale.length;
}

// ---------- Goals ----------

export async function createGoal(title: string, whyItMatters: string): Promise<Goal> {
  const db = await getDb();
  const goal: Goal = {
    id: makeId(),
    title: title.trim(),
    whyItMatters: whyItMatters.trim(),
    createdAt: nowIso(),
    lastViewedAt: null,
  };
  await db.runAsync(
    "INSERT INTO goals (id, title, whyItMatters, createdAt, lastViewedAt) VALUES (?, ?, ?, ?, ?)",
    [goal.id, goal.title, goal.whyItMatters, goal.createdAt, goal.lastViewedAt]
  );
  return goal;
}

export async function listGoals(): Promise<Goal[]> {
  const db = await getDb();
  const rows = await db.getAllAsync("SELECT * FROM goals ORDER BY createdAt DESC");
  return rows.map(rowToGoal);
}

export async function getGoal(id: string): Promise<Goal | null> {
  const db = await getDb();
  const row = await db.getFirstAsync("SELECT * FROM goals WHERE id = ?", [id]);
  return row ? rowToGoal(row) : null;
}

/** Marks a goal as viewed now. Returns whether the why-it-matters note should resurface (goal was stale). */
export async function touchGoalViewed(id: string, staleDays = 5): Promise<boolean> {
  const db = await getDb();
  const goal = await getGoal(id);
  if (!goal) return false;
  const wasStale =
    !goal.lastViewedAt ||
    Date.now() - new Date(goal.lastViewedAt).getTime() > staleDays * 24 * 60 * 60 * 1000;
  await db.runAsync("UPDATE goals SET lastViewedAt = ? WHERE id = ?", [nowIso(), id]);
  return wasStale && goal.whyItMatters.length > 0;
}

// ---------- Settings ----------

const DEFAULT_SETTINGS: Record<string, string> = {
  autoMigrateDays: "3",
};

export async function getSetting(key: string): Promise<string> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ value: string }>(
    "SELECT value FROM app_settings WHERE key = ?",
    [key]
  );
  return row?.value ?? DEFAULT_SETTINGS[key] ?? "";
}

export async function setSetting(key: string, value: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    "INSERT INTO app_settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
    [key, value]
  );
}

// ---------- Streak (non-punishing) ----------

async function recordCompletionToday(): Promise<void> {
  const db = await getDb();
  const date = todayStr();
  await db.runAsync(
    `INSERT INTO daily_activity (date, completedCount) VALUES (?, 1)
     ON CONFLICT(date) DO UPDATE SET completedCount = completedCount + 1`,
    [date]
  );
}

export async function getStreakInfo(): Promise<StreakInfo> {
  const db = await getDb();
  const countRow = await db.getFirstAsync<{ n: number }>(
    "SELECT COUNT(*) as n FROM daily_activity WHERE completedCount > 0"
  );
  const lastRow = await db.getFirstAsync<{ date: string }>(
    "SELECT date FROM daily_activity WHERE completedCount > 0 ORDER BY date DESC LIMIT 1"
  );
  const today = todayStr();
  const yesterday = todayStr(new Date(Date.now() - 24 * 60 * 60 * 1000));
  const lastActiveDate = lastRow?.date ?? null;
  const isFaded = !lastActiveDate || (lastActiveDate !== today && lastActiveDate !== yesterday);
  return {
    count: countRow?.n ?? 0,
    lastActiveDate,
    isFaded,
  };
}

// ---------- Weekly recap ----------

export interface WeeklyRecap {
  completedCount: number;
  averageEnergy: EnergyLevel | null;
  completedTasks: Task[];
}

const ENERGY_SCORE: Record<EnergyLevel, number> = { low: 1, medium: 2, high: 3 };
const SCORE_ENERGY: EnergyLevel[] = ["low", "low", "medium", "high"]; // index by rounded score 1..3

export async function getWeeklyRecap(): Promise<WeeklyRecap> {
  const db = await getDb();
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const rows = await db.getAllAsync(
    "SELECT * FROM tasks WHERE completedAt IS NOT NULL AND completedAt >= ? ORDER BY completedAt DESC",
    [since]
  );
  const tasks = rows.map(rowToTask);
  const avgScore =
    tasks.length > 0
      ? tasks.reduce((sum, t) => sum + ENERGY_SCORE[t.energyLevel], 0) / tasks.length
      : 0;
  return {
    completedCount: tasks.length,
    averageEnergy: tasks.length > 0 ? SCORE_ENERGY[Math.round(avgScore)] : null,
    completedTasks: tasks,
  };
}
