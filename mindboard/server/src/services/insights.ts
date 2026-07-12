import type { EntryRecord } from "../types";

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

function dayKey(iso: string): string {
  return iso.slice(0, 10);
}

export function computeInsights(entries: EntryRecord[]): Insights {
  const byDay = new Map<string, { total: number; count: number }>();
  const themeCounts = new Map<string, number>();

  for (const entry of entries) {
    const key = dayKey(entry.createdAt);
    const bucket = byDay.get(key) ?? { total: 0, count: 0 };
    bucket.total += entry.moodScore;
    bucket.count += 1;
    byDay.set(key, bucket);

    for (const theme of entry.themes) {
      const normalized = theme.trim().toLowerCase();
      if (!normalized) continue;
      themeCounts.set(normalized, (themeCounts.get(normalized) ?? 0) + 1);
    }
  }

  const moodTrend: MoodPoint[] = Array.from(byDay.entries())
    .map(([date, { total, count }]) => ({
      date,
      averageMood: Math.round((total / count) * 100) / 100,
      entryCount: count,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const topThemes: ThemeCount[] = Array.from(themeCounts.entries())
    .map(([theme, count]) => ({ theme, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const observations: string[] = [];
  const now = Date.now();
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
  const recentEntries = entries.filter(
    (e) => new Date(e.createdAt).getTime() >= sevenDaysAgo
  );

  const recentThemeCounts = new Map<string, number>();
  for (const entry of recentEntries) {
    for (const theme of entry.themes) {
      const normalized = theme.trim().toLowerCase();
      if (!normalized) continue;
      recentThemeCounts.set(normalized, (recentThemeCounts.get(normalized) ?? 0) + 1);
    }
  }
  for (const [theme, count] of recentThemeCounts) {
    if (count >= 3) {
      observations.push(`You've mentioned "${theme}" ${count} times this week.`);
    }
  }

  if (recentEntries.length >= 3) {
    const recentAvg =
      recentEntries.reduce((sum, e) => sum + e.moodScore, 0) / recentEntries.length;
    const priorEntries = entries.filter((e) => {
      const t = new Date(e.createdAt).getTime();
      return t < sevenDaysAgo && t >= sevenDaysAgo - 7 * 24 * 60 * 60 * 1000;
    });
    if (priorEntries.length >= 2) {
      const priorAvg =
        priorEntries.reduce((sum, e) => sum + e.moodScore, 0) / priorEntries.length;
      const delta = recentAvg - priorAvg;
      if (delta <= -1.5) {
        observations.push(
          "Your mood trend has dipped compared to last week — might be worth a lighter day or reaching out to someone."
        );
      } else if (delta >= 1.5) {
        observations.push("Your mood trend is up compared to last week.");
      }
    }
  }

  return { moodTrend, topThemes, observations };
}
