import { describe, expect, it } from 'vitest';
import {
  buildDailyMetrics,
  buildIntentBreakdown,
  filterAgentUsage,
  startDateForDays,
  summarize,
} from './metrics';

describe('dashboard metrics', () => {
  it('aggregates API dimension rows without double-counting intent rows', () => {
    const days = buildDailyMetrics(
      [
        {
          date: '2026-09-20',
          agentId: 'agent-a',
          agentName: 'Agent A',
          billedCredits: 10,
          nonBilledCredits: 2,
        },
        {
          date: '2026-09-20',
          agentId: 'agent-a',
          agentName: 'Agent A',
          billedCredits: 4,
          nonBilledCredits: 1,
        },
      ],
      [
        {
          date: '2026-09-20',
          detectedIntents: 7,
          engagedConversations: 5,
        },
      ],
    );

    expect(days).toEqual([
      {
        date: '2026-09-20',
        billedCredits: 14,
        nonBilledCredits: 3,
        detectedIntents: 7,
        engagedConversations: 5,
      },
    ]);
    expect(summarize(days)).toMatchObject({
      billedCredits: 14,
      detectedIntents: 7,
      creditsPerIntent: 2,
      creditsPerConversation: 2.8,
    });
  });

  it('filters strictly by the confirmed resource id', () => {
    const rows = [
      {
        date: '2026-09-20',
        agentId: 'intent',
        agentName: 'Customer Intent Agent',
        billedCredits: 10,
        nonBilledCredits: 0,
      },
      {
        date: '2026-09-20',
        agentId: 'other',
        agentName: 'Other Agent',
        billedCredits: 100,
        nonBilledCredits: 0,
      },
    ];

    expect(filterAgentUsage(rows, 'intent', '2026-09-01')).toHaveLength(1);
    expect(filterAgentUsage(rows, undefined, '2026-09-01')).toEqual([]);
  });

  it('builds a stable intent breakdown', () => {
    const result = buildIntentBreakdown([
      {
        date: '2026-09-20',
        intentName: 'Returns',
        intentGroupName: 'Orders',
        detectedIntents: 4,
        engagedConversations: 2,
      },
      {
        date: '2026-09-21',
        intentName: 'Returns',
        intentGroupName: 'Orders',
        detectedIntents: 5,
        engagedConversations: 3,
      },
    ]);

    expect(result[0]).toMatchObject({
      detectedIntents: 9,
      engagedConversations: 5,
    });
  });

  it('uses an inclusive UTC period start', () => {
    expect(startDateForDays(7, new Date('2026-09-23T23:15:00Z'))).toBe('2026-09-17');
  });
});
