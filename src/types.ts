export interface AgentUsageRecord {
  date: string;
  agentId: string;
  agentName: string;
  billedCredits: number;
  nonBilledCredits: number;
  feature?: string;
  product?: string;
}

export interface IntentUsageRecord {
  date: string;
  detectedIntents: number;
  engagedConversations: number;
  intentName?: string;
  intentGroupName?: string;
}

export interface AgentResource {
  id: string;
  name: string;
}

export type SyncState = 'success' | 'failed' | 'running' | 'unknown';

export interface SyncStatus {
  state: SyncState;
  lastSyncedAt?: string;
  sourceAsOf?: string;
  message?: string;
}

export interface DashboardCapabilities {
  detectedIntents: boolean;
  engagedConversations: boolean;
  resourceMapping: boolean;
}

export interface DashboardData {
  agentUsage: AgentUsageRecord[];
  intentUsage: IntentUsageRecord[];
  resources: AgentResource[];
  mappedAgentId?: string;
  sync: SyncStatus;
  capabilities: DashboardCapabilities;
  intentMetricsError?: string;
}

export interface DashboardProvider {
  load(signal?: AbortSignal): Promise<DashboardData>;
}

export interface DailyMetric {
  date: string;
  billedCredits: number;
  nonBilledCredits: number;
  detectedIntents: number;
  engagedConversations: number;
}

export interface DashboardSummary {
  billedCredits: number;
  nonBilledCredits: number;
  detectedIntents: number;
  engagedConversations: number;
  creditsPerIntent?: number;
  creditsPerConversation?: number;
}

export interface IntentBreakdown {
  key: string;
  intentName: string;
  intentGroupName: string;
  detectedIntents: number;
  engagedConversations: number;
}
