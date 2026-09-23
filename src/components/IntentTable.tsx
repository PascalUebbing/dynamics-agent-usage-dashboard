import { Table, TableBody, TableCell, TableHeader, TableHeaderCell, TableRow } from '@fluentui/react-components';
import type { IntentBreakdown } from '../types';

interface IntentTableProps {
  rows: IntentBreakdown[];
  labels: {
    intent: string;
    intentGroup: string;
    detectedIntents: string;
    engagedConversations: string;
    empty: string;
  };
  locale: string;
}

export function IntentTable({ rows, labels, locale }: IntentTableProps) {
  if (rows.length === 0) {
    return <p className="empty-state">{labels.empty}</p>;
  }

  return (
    <div className="table-scroll">
      <Table aria-label={labels.intent}>
        <TableHeader>
          <TableRow>
            <TableHeaderCell>{labels.intentGroup}</TableHeaderCell>
            <TableHeaderCell>{labels.intent}</TableHeaderCell>
            <TableHeaderCell>{labels.detectedIntents}</TableHeaderCell>
            <TableHeaderCell>{labels.engagedConversations}</TableHeaderCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.key}>
              <TableCell>{row.intentGroupName}</TableCell>
              <TableCell>{row.intentName}</TableCell>
              <TableCell>{row.detectedIntents.toLocaleString(locale)}</TableCell>
              <TableCell>{row.engagedConversations.toLocaleString(locale)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
