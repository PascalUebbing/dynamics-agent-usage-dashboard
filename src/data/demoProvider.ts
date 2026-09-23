import type {
  AgentUsageRecord,
  DashboardData,
  DashboardProvider,
  IntentUsageRecord,
} from '../types';

const DAY = 24 * 60 * 60 * 1000;
const INTENTS = [
  ['Order status', 'Orders'],
  ['Return product', 'Returns'],
  ['Update address', 'Account'],
] as const;

function isoDay(offset: number): string {
  const value = new Date(Date.now() - offset * DAY);
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()))
    .toISOString()
    .slice(0, 10);
}

function buildAgentUsage(): AgentUsageRecord[] {
  return Array.from({ length: 90 }, (_, index) => {
    const activity = 48 + ((index * 17) % 31);
    return {
      date: isoDay(89 - index),
      agentId: 'demo-customer-intent-agent',
      agentName: 'Customer Intent Agent',
      billedCredits: activity * 2.4,
      nonBilledCredits: (index * 3) % 13,
      feature: 'Customer Intent',
      product: 'Dynamics 365 Customer Service',
    };
  });
}

function buildIntentUsage(): IntentUsageRecord[] {
  return Array.from({ length: 90 }, (_, dayIndex) =>
    INTENTS.map(([intentName, intentGroupName], intentIndex) => ({
      date: isoDay(89 - dayIndex),
      intentName,
      intentGroupName,
      detectedIntents: 9 + ((dayIndex * (intentIndex + 2)) % 19),
      engagedConversations: 6 + ((dayIndex * (intentIndex + 1)) % 13),
    })),
  ).flat();
}

export class DemoProvider implements DashboardProvider {
  async load(signal?: AbortSignal): Promise<DashboardData> {
    await new Promise<void>((resolve, reject) => {
      const timer = window.setTimeout(resolve, 250);
      signal?.addEventListener(
        'abort',
        () => {
          window.clearTimeout(timer);
          reject(new DOMException('The operation was aborted.', 'AbortError'));
        },
        { once: true },
      );
    });

    return {
      agentUsage: buildAgentUsage(),
      intentUsage: buildIntentUsage(),
      resources: [{ id: 'demo-customer-intent-agent', name: 'Customer Intent Agent' }],
      mappedAgentId: 'demo-customer-intent-agent',
      sync: {
        state: 'success',
        lastSyncedAt: new Date().toISOString(),
        sourceAsOf: isoDay(0),
        message: 'Demo data',
      },
      capabilities: {
        detectedIntents: true,
        engagedConversations: true,
        resourceMapping: true,
      },
    };
  }
}
