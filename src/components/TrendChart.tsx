import type { DailyMetric } from '../types';

interface TrendChartProps {
  rows: DailyMetric[];
  creditsLabel: string;
  intentsLabel: string;
  locale: string;
}

const WIDTH = 960;
const HEIGHT = 280;
const PADDING = { top: 24, right: 24, bottom: 42, left: 58 };

function points(values: number[], max: number): string {
  const drawableWidth = WIDTH - PADDING.left - PADDING.right;
  const drawableHeight = HEIGHT - PADDING.top - PADDING.bottom;
  return values
    .map((value, index) => {
      const x =
        PADDING.left + (values.length <= 1 ? 0 : (index / (values.length - 1)) * drawableWidth);
      const y = PADDING.top + drawableHeight - (value / Math.max(max, 1)) * drawableHeight;
      return `${x},${y}`;
    })
    .join(' ');
}

export function TrendChart({ rows, creditsLabel, intentsLabel, locale }: TrendChartProps) {
  if (rows.length === 0) {
    return <div className="chart-empty" />;
  }

  const billed = rows.map((row) => row.billedCredits);
  const intents = rows.map((row) => row.detectedIntents);
  const maxCredits = Math.max(...billed, 1);
  const maxIntents = Math.max(...intents, 1);
  const firstDate = new Date(`${rows[0].date}T00:00:00Z`).toLocaleDateString(locale);
  const lastDate = new Date(`${rows.at(-1)!.date}T00:00:00Z`).toLocaleDateString(locale);

  return (
    <div className="chart-wrapper">
      <div className="chart-legend" aria-hidden="true">
        <span>
          <i className="legend-swatch credits" /> {creditsLabel}
        </span>
        <span>
          <i className="legend-swatch intents" /> {intentsLabel}
        </span>
      </div>
      <svg
        className="trend-chart"
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label={`${creditsLabel}; ${intentsLabel}`}
      >
        {[0, 0.25, 0.5, 0.75, 1].map((fraction) => {
          const y =
            PADDING.top + (HEIGHT - PADDING.top - PADDING.bottom) * (1 - fraction);
          return (
            <g key={fraction}>
              <line
                x1={PADDING.left}
                y1={y}
                x2={WIDTH - PADDING.right}
                y2={y}
                className="grid-line"
              />
              <text x={PADDING.left - 10} y={y + 4} textAnchor="end" className="axis-label">
                {Math.round(maxCredits * fraction).toLocaleString(locale)}
              </text>
              <text
                x={WIDTH - PADDING.right + 10}
                y={y + 4}
                textAnchor="start"
                className="axis-label"
              >
                {Math.round(maxIntents * fraction).toLocaleString(locale)}
              </text>
            </g>
          );
        })}
        <polyline points={points(billed, maxCredits)} className="trend-line credits" />
        <polyline points={points(intents, maxIntents)} className="trend-line intents" />
        <text x={PADDING.left} y={HEIGHT - 12} className="axis-label">
          {firstDate}
        </text>
        <text
          x={WIDTH - PADDING.right}
          y={HEIGHT - 12}
          textAnchor="end"
          className="axis-label"
        >
          {lastDate}
        </text>
      </svg>
    </div>
  );
}
