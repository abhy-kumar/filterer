import React from 'react';
import { AlertTriangle } from 'lucide-react';
import type { Stock, ShareholdingPeriod } from '../../types/stock';
import { StatementTable, StatementRow } from './StatementTable';
import { isReported, pct } from '../../lib/format';
import { holdingSeriesLooksSynthetic } from '../../engine/dataQuality';

export const ShareholdingPatternTable: React.FC<{ stock: Stock }> = ({ stock }) => {
  const history = stock.shareholding_history || [];
  if (!history.length) return null;

  const synthetic = holdingSeriesLooksSynthetic(stock);

  const rows: StatementRow<ShareholdingPeriod>[] = [
    { label: 'Promoters', value: (h) => pct(h.promoter, 2), emphasis: 'total' },
    { label: 'Foreign institutions', value: (h) => pct(h.fii, 2) },
    { label: 'Domestic institutions', value: (h) => pct(h.dii, 2) },
    { label: 'Public', value: (h) => pct(h.public, 2) },
    { label: 'Others', value: (h) => pct(h.others, 2) },
    {
      label: 'Total',
      value: (h) => pct(h.promoter + h.fii + h.dii + h.public + h.others, 2),
      emphasis: 'total',
    },
    { label: 'Promoter shares pledged', value: (h) => (isReported(h.pledged) ? pct(h.pledged, 2) : null) },
  ];

  return (
    <StatementTable
      title="Shareholding"
      subtitle="Ownership split by quarter"
      periods={history}
      columnLabel={(h) => h.period}
      rows={rows}
      aside={
        synthetic ? (
          <span className="apple-tag text-apple-amber" style={{ color: 'var(--apple-amber)' }}>
            <AlertTriangle className="w-3 h-3" />
            Placeholder series
          </span>
        ) : undefined
      }
      footnote={
        synthetic ? (
          <span className="text-apple-amber">
            Every company in this dataset shows the identical quarterly drift — promoters down 0.02, foreign
            institutions up 0.03, domestic up 0.02 — which means the series was generated rather than read from
            exchange filings. Treat only the broad split as indicative, and do not read the trend at all. The
            quarter-on-quarter change metrics have been withdrawn from the screener for the same reason.
          </span>
        ) : undefined
      }
    />
  );
};
