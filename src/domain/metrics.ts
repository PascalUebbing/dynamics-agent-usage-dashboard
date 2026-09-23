import type {
  AgentUsageRecord,
  DailyMetric,
  DashboardSummary,
  IntentBreakdown,
  IntentUsageRecord,
} from '../types';

function normalizeDate(value: string): string {
  return value.slice(0, 10);
}

export function startDateForDays(days: number, now = new Date()): string {
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  start.setUTCDate(start.getUTCDate() - Math.max(days - 1, 0));
  return start.toISOString().slice(0, 10);
}

export function filterAgentUsage(
  rows: AgentUsageRecord[],
  agentId: string | undefined,
  startDate: string,
): AgentUsageRecord[] {
  if (!agentId) {
    return [];
  }

  return rows.filter((row) => row.agentId === agentId && normalizeDate(row.date) >= startDate);
}

export function filterIntentUsage(
  rows: IntentUsageRecord[],
  startDate: string,
): IntentUsageRecord[] {
  return rows.filter((row) => normalizeDate(row.date) >= startDate);
}

export function buildDailyMetrics(
  agentRows: AgentUsageRecord[],
  intentRows: IntentUsageRecord[],
): DailyMetric[] {
  const byDate = new Map<string, DailyMetric>();

  const getDay = (dateValue: string): DailyMetric => {
    const date = normalizeDate(dateValue);
    const existing = byDate.get(date);
    if (existing) {
      return existing;
    }

    const created: DailyMetric = {
      date,
      billedCredits: 0,
      nonBilledCredits: 0,
      detectedIntents: 0,
      engagedConversations: 0,
    };
    byDate.set(date, created);
    return created;
  };

  for (const row of agentRows) {
    const day = getDay(row.date);
    day.billedCredits += row.billedCredits;
    day.nonBilledCredits += row.nonBilledCredits;
  }

  for (const row of intentRows) {
    const day = getDay(row.date);
    day.detectedIntents += row.detectedIntents;
    day.engagedConversations += row.engagedConversations;
  }

  return [...byDate.values()].sort((left, right) => left.date.localeCompare(right.date));
}

export function summarize(days: DailyMetric[]): DashboardSummary {
  const summary = days.reduce<DashboardSummary>(
    (total, day) => ({
      billedCredits: total.billedCredits + day.billedCredits,
      nonBilledCredits: total.nonBilledCredits + day.nonBilledCredits,
      detectedIntents: total.detectedIntents + day.detectedIntents,
      engagedConversations: total.engagedConversations + day.engagedConversations,
    }),
    {
      billedCredits: 0,
      nonBilledCredits: 0,
      detectedIntents: 0,
      engagedConversations: 0,
    },
  );

  return {
    ...summary,
    creditsPerIntent:
      summary.detectedIntents > 0 ? summary.billedCredits / summary.detectedIntents : undefined,
    creditsPerConversation:
      summary.engagedConversations > 0
        ? summary.billedCredits / summary.engagedConversations
        : undefined,
  };
}

export function buildIntentBreakdown(rows: IntentUsageRecord[]): IntentBreakdown[] {
  const groups = new Map<string, IntentBreakdown>();

  for (const row of rows) {
    const intentName = row.intentName?.trim() || '—';
    const intentGroupName = row.intentGroupName?.trim() || '—';
    const key = `${intentGroupName}\u0000${intentName}`;
    const current = groups.get(key) ?? {
      key,
      intentName,
      intentGroupName,
      detectedIntents: 0,
      engagedConversations: 0,
    };
    current.detectedIntents += row.detectedIntents;
    current.engagedConversations += row.engagedConversations;
    groups.set(key, current);
  }

  return [...groups.values()].sort(
    (left, right) =>
      right.detectedIntents - left.detectedIntents ||
      left.intentGroupName.localeCompare(right.intentGroupName) ||
      left.intentName.localeCompare(right.intentName),
  );
}
