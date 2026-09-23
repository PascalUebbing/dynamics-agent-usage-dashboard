import {
  Badge,
  Button,
  Card,
  FluentProvider,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
  Spinner,
  Text,
  webLightTheme,
} from '@fluentui/react-components';
import { ArrowClockwise20Regular } from '@fluentui/react-icons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { IntentTable } from './components/IntentTable';
import { MetricCard } from './components/MetricCard';
import { TrendChart } from './components/TrendChart';
import { createDashboardProvider, isDynamicsHost } from './data/provider';
import {
  buildDailyMetrics,
  buildIntentBreakdown,
  filterAgentUsage,
  filterIntentUsage,
  startDateForDays,
  summarize,
} from './domain/metrics';
import { createTranslator, detectLocale } from './i18n';
import type { DashboardData } from './types';

const provider = createDashboardProvider();
const PERIODS = [7, 30, 90] as const;

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}

export default function App() {
  const locale = useMemo(() => detectLocale(), []);
  const languageTag = locale === 'de' ? 'de-DE' : 'en-US';
  const t = useMemo(() => createTranslator(locale), [locale]);
  const [data, setData] = useState<DashboardData>();
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<(typeof PERIODS)[number]>(30);
  const [selectedAgentId, setSelectedAgentId] = useState<string>();
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    provider
      .load(controller.signal)
      .then((loaded) => {
        setData(loaded);
        setSelectedAgentId((current) => current ?? loaded.mappedAgentId);
      })
      .catch((reason: unknown) => {
        if (!isAbortError(reason)) {
          setError(reason instanceof Error ? reason.message : String(reason));
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [reloadToken]);

  const refresh = useCallback(() => {
    setLoading(true);
    setError(undefined);
    setReloadToken((value) => value + 1);
  }, []);
  const startDate = useMemo(() => startDateForDays(period), [period]);
  const selectedAgentRows = useMemo(
    () => filterAgentUsage(data?.agentUsage ?? [], selectedAgentId, startDate),
    [data?.agentUsage, selectedAgentId, startDate],
  );
  const selectedIntentRows = useMemo(
    () => filterIntentUsage(data?.intentUsage ?? [], startDate),
    [data?.intentUsage, startDate],
  );
  const dailyMetrics = useMemo(
    () => buildDailyMetrics(selectedAgentRows, selectedIntentRows),
    [selectedAgentRows, selectedIntentRows],
  );
  const summary = useMemo(() => summarize(dailyMetrics), [dailyMetrics]);
  const breakdown = useMemo(() => buildIntentBreakdown(selectedIntentRows), [selectedIntentRows]);
  const number = useMemo(
    () => new Intl.NumberFormat(languageTag, { maximumFractionDigits: 1 }),
    [languageTag],
  );

  const syncLabel =
    data?.sync.state === 'success'
      ? t('syncSuccess')
      : data?.sync.state === 'failed'
        ? t('syncFailed')
        : data?.sync.state === 'running'
          ? t('syncRunning')
          : t('syncUnknown');
  const syncColor =
    data?.sync.state === 'success'
      ? 'success'
      : data?.sync.state === 'failed'
        ? 'danger'
        : data?.sync.state === 'running'
          ? 'informative'
          : 'subtle';

  return (
    <FluentProvider theme={webLightTheme}>
      <main className="app-shell">
        <header className="app-header">
          <div>
            <div className="title-row">
              <Text as="h1" size={800} weight="semibold">
                {t('title')}
              </Text>
              {!isDynamicsHost() ? <Badge appearance="tint">{t('demoMode')}</Badge> : null}
            </div>
            <Text className="subtitle">{t('subtitle')}</Text>
          </div>
          <Button
            appearance="secondary"
            icon={<ArrowClockwise20Regular />}
            onClick={refresh}
            disabled={loading}
          >
            {t('refresh')}
          </Button>
        </header>

        {loading && !data ? (
          <div className="center-state">
            <Spinner size="large" label={t('loading')} />
          </div>
        ) : null}

        {error ? (
          <MessageBar intent="error">
            <MessageBarBody>
              <MessageBarTitle>{t('loadFailed')}</MessageBarTitle>
              <p>{error}</p>
              <Button onClick={refresh}>{t('retry')}</Button>
            </MessageBarBody>
          </MessageBar>
        ) : null}

        {data ? (
          <>
            <section className="toolbar-panel" aria-label={t('period')}>
              <label>
                <span>{t('period')}</span>
                <select
                  value={period}
                  onChange={(event) => setPeriod(Number(event.target.value) as 7 | 30 | 90)}
                >
                  {PERIODS.map((days) => (
                    <option key={days} value={days}>
                      {t(days === 7 ? 'last7Days' : days === 30 ? 'last30Days' : 'last90Days')}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>{t('agent')}</span>
                <select
                  value={selectedAgentId ?? ''}
                  onChange={(event) => setSelectedAgentId(event.target.value || undefined)}
                >
                  <option value="">{t('unknownAgent')}</option>
                  {data.resources.map((resource) => (
                    <option key={resource.id} value={resource.id}>
                      {resource.name}
                    </option>
                  ))}
                </select>
              </label>
              <div className="sync-status">
                <Badge color={syncColor} appearance="tint">
                  {syncLabel}
                </Badge>
                {data.sync.lastSyncedAt ? (
                  <Text size={200}>
                    {new Date(data.sync.lastSyncedAt).toLocaleString(languageTag)}
                  </Text>
                ) : null}
                {data.sync.sourceAsOf ? (
                  <Text size={200}>
                    {t('sourceAsOf')}:{' '}
                    {new Date(`${data.sync.sourceAsOf.slice(0, 10)}T00:00:00Z`).toLocaleDateString(
                      languageTag,
                    )}
                  </Text>
                ) : null}
                {data.sync.message ? <Text size={200}>{data.sync.message}</Text> : null}
              </div>
            </section>

            {!data.capabilities.resourceMapping ? (
              <MessageBar intent="warning">
                <MessageBarBody>
                  <MessageBarTitle>{t('mappingMissingTitle')}</MessageBarTitle>
                  {t('mappingMissing')}
                </MessageBarBody>
              </MessageBar>
            ) : null}

            {!data.capabilities.engagedConversations ? (
              <MessageBar intent="warning">
                <MessageBarBody>
                  <MessageBarTitle>{t('intentCapabilityMissingTitle')}</MessageBarTitle>
                  {t('intentCapabilityMissing')}
                  {data.intentMetricsError ? <p>{data.intentMetricsError}</p> : null}
                </MessageBarBody>
              </MessageBar>
            ) : null}

            <section className="metric-grid">
              <MetricCard label={t('billedCredits')} value={number.format(summary.billedCredits)} />
              <MetricCard
                label={t('nonBilledCredits')}
                value={number.format(summary.nonBilledCredits)}
              />
              <MetricCard
                label={t('detectedIntents')}
                value={
                  data.capabilities.detectedIntents
                    ? number.format(summary.detectedIntents)
                    : '—'
                }
              />
              <MetricCard
                label={t('engagedConversations')}
                value={
                  data.capabilities.engagedConversations
                    ? number.format(summary.engagedConversations)
                    : '—'
                }
              />
              <MetricCard
                label={t('creditsPerIntent')}
                value={summary.creditsPerIntent === undefined ? '—' : number.format(summary.creditsPerIntent)}
              />
              <MetricCard
                label={t('creditsPerConversation')}
                value={
                  !data.capabilities.engagedConversations ||
                  summary.creditsPerConversation === undefined
                    ? '—'
                    : number.format(summary.creditsPerConversation)
                }
              />
            </section>

            {selectedAgentId && selectedAgentRows.length === 0 ? (
              <MessageBar>
                <MessageBarBody>{t('noAgentData')}</MessageBarBody>
              </MessageBar>
            ) : null}

            <Card className="content-card" appearance="outline">
              <Text as="h2" size={500} weight="semibold">
                {t('trend')}
              </Text>
              <Text className="section-description">{t('trendDescription')}</Text>
              <TrendChart
                rows={dailyMetrics}
                creditsLabel={t('chartCredits')}
                intentsLabel={t('chartIntents')}
                locale={languageTag}
              />
            </Card>

            <Card className="content-card" appearance="outline">
              <Text as="h2" size={500} weight="semibold">
                {t('breakdown')}
              </Text>
              <IntentTable
                rows={breakdown}
                locale={languageTag}
                labels={{
                  intent: t('intent'),
                  intentGroup: t('intentGroup'),
                  detectedIntents: t('detectedIntents'),
                  engagedConversations: t('engagedConversations'),
                  empty: t('noIntentData'),
                }}
              />
            </Card>
          </>
        ) : null}
      </main>
    </FluentProvider>
  );
}
