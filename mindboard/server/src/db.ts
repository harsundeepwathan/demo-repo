import Database from "better-sqlite3";
import path from "path";
import type { EntryRecord } from "./types";

const dbPath = path.join(__dirname, "..", "mindboard.db");
export const db = new Database(dbPath);

db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS entries (
    id TEXT PRIMARY KEY,
    created_at TEXT NOT NULL,
    transcript TEXT NOT NULL,
    mood_score REAL NOT NULL,
    themes TEXT NOT NULL,
    supportive_note TEXT NOT NULL,
    suggestion TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_entries_created_at ON entries(created_at);
`);

function rowToEntry(row: any): EntryRecord {
  return {
    id: row.id,
    createdAt: row.created_at,
    transcript: row.transcript,
    moodScore: row.mood_score,
    themes: JSON.parse(row.themes),
    supportiveNote: row.supportive_note,
    suggestion: row.suggestion,
  };
}

export function insertEntry(entry: EntryRecord): void {
  db.prepare(
    `INSERT INTO entries (id, created_at, transcript, mood_score, themes, supportive_note, suggestion)
     VALUES (@id, @createdAt, @transcript, @moodScore, @themes, @supportiveNote, @suggestion)`
  ).run({
    id: entry.id,
    createdAt: entry.createdAt,
    transcript: entry.transcript,
    moodScore: entry.moodScore,
    themes: JSON.stringify(entry.themes),
    supportiveNote: entry.supportiveNote,
    suggestion: entry.suggestion,
  });
}

export function listEntries(limit: number): EntryRecord[] {
  const rows = db
    .prepare(`SELECT * FROM entries ORDER BY created_at DESC LIMIT ?`)
    .all(limit);
  return rows.map(rowToEntry);
}

export function getEntry(id: string): EntryRecord | null {
  const row = db.prepare(`SELECT * FROM entries WHERE id = ?`).get(id);
  return row ? rowToEntry(row as any) : null;
}

export function deleteAllEntries(): void {
  db.prepare(`DELETE FROM entries`).run();
}

export function listEntriesSince(sinceIso: string): EntryRecord[] {
  const rows = db
    .prepare(`SELECT * FROM entries WHERE created_at >= ? ORDER BY created_at ASC`)
    .all(sinceIso);
  return rows.map(rowToEntry);
}
