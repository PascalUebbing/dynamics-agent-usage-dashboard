import type {
  AgentUsageRecord,
  DashboardData,
  DashboardProvider,
  IntentUsageRecord,
  SyncState,
} from '../types';

interface ODataResponse<T> {
  value: T[];
  '@odata.nextLink'?: string;
}

interface AgentUsageRow {
  cat_reportdate: string;
  cat_agentid?: string;
  cat_agentname?: string;
  cat_billedcredit?: number | string;
  cat_nonbilledcredit?: number | string;
  cat_feature?: string;
  cat_product?: string;
}

interface IntentUsageRow {
  pue_reportdate: string;
  pue_detectedintents?: number;
  pue_engagedconversations?: number;
  pue_intentname?: string;
  pue_intentgroupname?: string;
}

interface IntentEntityRow {
  createdon: string;
  msdyn_name?: string;
  '_msdyn_intentid_value@OData.Community.Display.V1.FormattedValue'?: string;
  '_msdyn_intentgroupid_value@OData.Community.Display.V1.FormattedValue'?: string;
}

interface SyncRow {
  cat_lastsyncstatus?: number;
  cat_lastsyncmessage?: string;
  cat_lastsyncedat?: string;
}

interface EnvironmentVariableDefinitionRow {
  environmentvariabledefinitionid: string;
  defaultvalue?: string;
}

interface EnvironmentVariableValueRow {
  value?: string;
}

interface XrmContext {
  getClientUrl(): string;
}

declare global {
  interface Window {
    Xrm?: {
      Utility: {
        getGlobalContext(): XrmContext & {
          userSettings: {
            languageId: number;
          };
        };
      };
    };
  }
}

function getContext(): XrmContext {
  const context = window.parent?.Xrm?.Utility.getGlobalContext();
  if (!context) {
    throw new Error('Dynamics Xrm context is not available.');
  }
  return context;
}

function toNumber(value: number | string | undefined): number {
  const parsed = typeof value === 'number' ? value : Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function encodeODataString(value: string): string {
  return value.replaceAll("'", "''");
}

function normalizeResourceId(value: string | undefined): string | undefined {
  const normalized = value?.trim().replace(/^\{|\}$/g, '').toLowerCase();
  return normalized || undefined;
}

async function getAll<T>(
  path: string,
  signal: AbortSignal | undefined,
  allowNotFound = false,
): Promise<T[] | undefined> {
  const baseUrl = `${getContext().getClientUrl()}/api/data/v9.2/`;
  let nextUrl: string | undefined = new URL(path, baseUrl).toString();
  const rows: T[] = [];

  while (nextUrl) {
    const response = await fetch(nextUrl, {
      method: 'GET',
      credentials: 'same-origin',
      headers: {
        Accept: 'application/json',
        'OData-MaxVersion': '4.0',
        'OData-Version': '4.0',
        Prefer:
          'odata.include-annotations="OData.Community.Display.V1.FormattedValue",odata.maxpagesize=5000',
        'Content-Type': 'application/json; charset=utf-8',
      },
      signal,
    });

    if (allowNotFound && response.status === 404) {
      return undefined;
    }
    if (!response.ok) {
      const detail = await response.text();
      throw new Error(`Dataverse request failed (${response.status}): ${detail}`);
    }

    const page = (await response.json()) as ODataResponse<T>;
    rows.push(...page.value);
    nextUrl = page['@odata.nextLink'];
  }

  return rows;
}

function mapSyncState(value: number | undefined): SyncState {
  switch (value) {
    case 1:
      return 'success';
    case 2:
      return 'failed';
    case 3:
      return 'running';
    default:
      return 'unknown';
  }
}

export class DataverseProvider implements DashboardProvider {
  async load(signal?: AbortSignal): Promise<DashboardData> {
    const from = new Date();
    from.setUTCDate(from.getUTCDate() - 370);
    const fromDate = from.toISOString().slice(0, 10);

    const [agentRows, syncRows, mappingDefinitions] = await Promise.all([
      getAll<AgentUsageRow>(
        `cat_agentdetails?$select=cat_reportdate,cat_agentid,cat_agentname,cat_billedcredit,cat_nonbilledcredit,cat_feature,cat_product&$filter=cat_reportdate ge ${fromDate}&$orderby=cat_reportdate asc`,
        signal,
      ),
      getAll<SyncRow>(
        'cat_syncmetadatas?$select=cat_lastsyncstatus,cat_lastsyncmessage,cat_lastsyncedat&$orderby=modifiedon desc&$top=1',
        signal,
      ),
      getAll<EnvironmentVariableDefinitionRow>(
        `environmentvariabledefinitions?$select=environmentvariabledefinitionid,defaultvalue&$filter=schemaname eq '${encodeODataString('pue_CustomerIntentAgentResourceId')}'&$top=1`,
        signal,
      ),
    ]);

    const mappingDefinition = mappingDefinitions?.[0];
    const mappingValues = mappingDefinition
      ? await getAll<EnvironmentVariableValueRow>(
          `environmentvariablevalues?$select=value&$filter=_environmentvariabledefinitionid_value eq ${mappingDefinition.environmentvariabledefinitionid}&$orderby=createdon desc&$top=1`,
          signal,
        )
      : [];
    const mappedAgentId = normalizeResourceId(
      mappingValues?.[0]?.value ?? mappingDefinition?.defaultvalue,
    );

    let intentRows = await getAll<IntentUsageRow>(
        `pue_intentusagedailies?$select=pue_reportdate,pue_detectedintents,pue_engagedconversations,pue_intentname,pue_intentgroupname&$filter=pue_reportdate ge ${fromDate}&$orderby=pue_reportdate asc`,
        signal,
        true,
      );
    let intentMetricsError: string | undefined;
    let detectedIntentsAvailable = intentRows !== undefined;
    const engagedConversationsAvailable = intentRows !== undefined;

    if (intentRows === undefined) {
      try {
        const intentEntities =
          (await getAll<IntentEntityRow>(
            `msdyn_intententities?$select=createdon,msdyn_name,_msdyn_intentid_value,_msdyn_intentgroupid_value&$filter=createdon ge ${fromDate}T00:00:00Z and statecode eq 0&$orderby=createdon asc`,
            signal,
          )) ?? [];
        const aggregate = new Map<string, IntentUsageRow>();
        for (const row of intentEntities) {
          const date = row.createdon.slice(0, 10);
          const intentName =
            row['_msdyn_intentid_value@OData.Community.Display.V1.FormattedValue'] ??
            row.msdyn_name ??
            '—';
          const intentGroupName =
            row['_msdyn_intentgroupid_value@OData.Community.Display.V1.FormattedValue'] ??
            '—';
          const key = `${date}\u0000${intentGroupName}\u0000${intentName}`;
          const current = aggregate.get(key) ?? {
            pue_reportdate: date,
            pue_detectedintents: 0,
            pue_engagedconversations: 0,
            pue_intentname: intentName,
            pue_intentgroupname: intentGroupName,
          };
          current.pue_detectedintents = (current.pue_detectedintents ?? 0) + 1;
          aggregate.set(key, current);
        }
        intentRows = [...aggregate.values()];
        detectedIntentsAvailable = true;
      } catch (error) {
        intentRows = [];
        intentMetricsError = error instanceof Error ? error.message : String(error);
      }
    }

    const agentUsage: AgentUsageRecord[] = (agentRows ?? [])
      .filter((row): row is AgentUsageRow & { cat_agentid: string } => Boolean(row.cat_agentid))
      .map((row) => ({
        date: row.cat_reportdate,
        agentId: normalizeResourceId(row.cat_agentid)!,
        agentName: row.cat_agentname?.trim() || row.cat_agentid,
        billedCredits: toNumber(row.cat_billedcredit),
        nonBilledCredits: toNumber(row.cat_nonbilledcredit),
        feature: row.cat_feature,
        product: row.cat_product,
      }));

    const resources = [
      ...new Map(
        agentUsage.map((row) => [row.agentId, { id: row.agentId, name: row.agentName }]),
      ).values(),
    ].sort((left, right) => left.name.localeCompare(right.name));

    const intentUsage: IntentUsageRecord[] = (intentRows ?? []).map((row) => ({
      date: row.pue_reportdate,
      detectedIntents: row.pue_detectedintents ?? 0,
      engagedConversations: row.pue_engagedconversations ?? 0,
      intentName: row.pue_intentname,
      intentGroupName: row.pue_intentgroupname,
    }));

    const sync = syncRows?.[0];
    return {
      agentUsage,
      intentUsage,
      resources,
      mappedAgentId,
      sync: {
        state: mapSyncState(sync?.cat_lastsyncstatus),
        lastSyncedAt: sync?.cat_lastsyncedat,
        message: sync?.cat_lastsyncmessage,
      },
      capabilities: {
        detectedIntents: detectedIntentsAvailable,
        engagedConversations: engagedConversationsAvailable,
        resourceMapping: Boolean(mappedAgentId),
      },
      intentMetricsError,
    };
  }
}
