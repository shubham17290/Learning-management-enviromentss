// PHASE 8 — Analytics/dashboard derivation service (Phase 4 §3.2.10–3.2.12; Phase 3 §11.2/11.4)
import { config } from "../config/env";
import * as analyticsRepo from "../repositories/analytics.repo";
import type { AttemptFactRow } from "../repositories/analytics.repo";

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

interface GroupStats {
  attempts: number;
  correct: number;
  total_time_s: number;
  last_answered_at: Date | null;
}

function emptyStats(): GroupStats {
  return { attempts: 0, correct: 0, total_time_s: 0, last_answered_at: null };
}

function fold(stats: Map<string | null, GroupStats>, rows: AttemptFactRow[], keyFn: (row: AttemptFactRow) => string | null): void {
  for (const row of rows) {
    const key = keyFn(row);
    const entry = stats.get(key) ?? emptyStats();
    entry.attempts += 1;
    if (row.isCorrect) entry.correct += 1;
    entry.total_time_s += row.timeTakenSeconds;
    if (!entry.last_answered_at || row.answeredAt > entry.last_answered_at) {
      entry.last_answered_at = row.answeredAt;
    }
    stats.set(key, entry);
  }
}

function accuracyOf(entry: GroupStats): number {
  return entry.attempts === 0 ? 0 : round2(entry.correct / entry.attempts);
}

function isWeak(accuracy: number, attempts: number): boolean {
  return attempts >= config.analytics.weakMinAttempts && accuracy < config.analytics.weakAccuracyBelow;
}

export async function performanceOverview(userId: string) {
  const [facts, lastSession] = await Promise.all([
    analyticsRepo.attemptFactsForUser(userId),
    analyticsRepo.lastSessionForUser(userId),
  ]);

  const attempts = facts.length;
  const correct = facts.filter((row) => row.isCorrect).length;
  const totalTime = facts.reduce((total, row) => total + row.timeTakenSeconds, 0);

  // Streak = consecutive distinct active days ending today or yesterday (MA-STRK).
  const dayKeys = new Set(facts.map((row) => row.answeredAt.toISOString().slice(0, 10)));
  let streakDays = 0;
  const cursor = new Date();
  for (;;) {
    const key = cursor.toISOString().slice(0, 10);
    if (dayKeys.has(key)) {
      streakDays += 1;
      cursor.setDate(cursor.getDate() - 1);
    } else if (streakDays === 0 && key === new Date().toISOString().slice(0, 10)) {
      cursor.setDate(cursor.getDate() - 1); // allow streak anchored on yesterday
    } else {
      break;
    }
  }

  return {
    total_attempts: attempts,
    accuracy: attempts === 0 ? 0 : round2(correct / attempts),
    avg_time_s: attempts === 0 ? 0 : Math.round(totalTime / attempts),
    streak_days: streakDays,
    last_session: lastSession
      ? { id: lastSession.id, mode: lastSession.modeCode, status: lastSession.status, started_at: lastSession.startedAt.toISOString() }
      : null,
  };
}

export interface TopicPerformanceItem {
  topic_id: string | null;
  topic_name?: string;
  subject_id: string;
  subject_name?: string;
  attempts: number;
  correct: number;
  accuracy: number;
  avg_time_s: number;
  weak: boolean;
  last_activity: string | null;
}

async function topicInfoLookup(): Promise<Map<string, { name: string; subjectId: string; subjectName: string }>> {
  const { topicInfoMap } = await import("../repositories/taxonomy.repo");
  return topicInfoMap();
}

export async function performanceTopics(
  userId: string,
  page: number,
  pageSize: number,
): Promise<{ items: TopicPerformanceItem[]; meta: { page: number; page_size: number; total: number } }> {
  const facts = await analyticsRepo.attemptFactsForUser(userId);
  const stats = new Map<string | null, GroupStats>();
  fold(stats, facts, (row) => row.topicId);

  const info = await topicInfoLookup();
  const all: TopicPerformanceItem[] = [...stats.entries()]
    .filter(([topicId]) => topicId !== null && info.has(topicId as string))
    .map(([topicId, entry]) => {
      const accuracy = accuracyOf(entry);
      const meta = info.get(topicId as string);
      return {
        topic_id: topicId as string,
        topic_name: meta?.name,
        subject_id: meta?.subjectId ?? "",
        subject_name: meta?.subjectName,
        attempts: entry.attempts,
        correct: entry.correct,
        accuracy,
        avg_time_s: Math.round(entry.total_time_s / entry.attempts),
        weak: isWeak(accuracy, entry.attempts),
        last_activity: entry.last_answered_at ? entry.last_answered_at.toISOString() : null,
      };
    })
    .sort((a, b) => b.attempts - a.attempts || a.accuracy - b.accuracy);

  return {
    items: all.slice((page - 1) * pageSize, page * pageSize),
    meta: { page, page_size: pageSize, total: all.length },
  };
}

export interface SubjectPerformanceItem {
  subject_id: string;
  subject_name?: string;
  attempts: number;
  correct: number;
  accuracy: number;
  avg_time_s: number;
}

export async function performanceSubjects(
  userId: string,
  page: number,
  pageSize: number,
): Promise<{ items: SubjectPerformanceItem[]; meta: { page: number; page_size: number; total: number } }> {
  const facts = await analyticsRepo.attemptFactsForUser(userId);
  const stats = new Map<string | null, GroupStats>();
  fold(stats, facts, (row) => row.subjectId);

  const { prisma } = await import("../repositories/prisma");
  const subjects = await prisma.subject.findMany({ select: { id: true, name: true } });
  const nameMap = new Map(subjects.map((subject) => [subject.id, subject.name]));

  const all: SubjectPerformanceItem[] = [...stats.entries()].map(([subjectId, entry]) => ({
    subject_id: subjectId as string,
    subject_name: nameMap.get(subjectId as string),
    attempts: entry.attempts,
    correct: entry.correct,
    accuracy: accuracyOf(entry),
    avg_time_s: Math.round(entry.total_time_s / entry.attempts),
  }));
  all.sort((a, b) => b.attempts - a.attempts);

  return {
    items: all.slice((page - 1) * pageSize, page * pageSize),
    meta: { page, page_size: pageSize, total: all.length },
  };
}

export async function dashboardWeakTopics(userId: string, limit: number) {
  const facts = await analyticsRepo.attemptFactsForUser(userId);
  const stats = new Map<string | null, GroupStats>();
  fold(stats, facts, (row) => row.topicId);

  const info = await topicInfoLookup();
  const now = Date.now();
  const ranked = [...stats.entries()]
    .filter(([topicId]) => topicId !== null && info.has(topicId as string))
    .map(([topicId, entry]) => {
      const accuracy = accuracyOf(entry);
      const daysIdle = entry.last_answered_at ? (now - entry.last_answered_at.getTime()) / 86_400_000 : 30;
      const recencyWeight = 1 / (1 + daysIdle);
      return {
        topic_id: topicId as string,
        topic_name: info.get(topicId as string)?.name,
        attempts: entry.attempts,
        accuracy,
        weak: isWeak(accuracy, entry.attempts),
        priority: round2((1 - accuracy) * recencyWeight),
        recommendation: { mode: "topic", filters: { topic_id: topicId }, timed: false },
      };
    })
    .filter((item) => item.weak)
    .sort((a, b) => b.priority - a.priority)
    .slice(0, limit);

  return ranked;
}
