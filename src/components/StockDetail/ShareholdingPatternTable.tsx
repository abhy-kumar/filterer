import React from 'react';
import { AlertTriangle, FileCheck } from 'lucide-react';
import type { Stock, ShareholdingPeriod } from '../../types/stock';
import { StatementTable, StatementRow } from './StatementTable';
import { isReported, pct } from '../../lib/format';
import { holdingSeriesLooksSynthetic, hasFiledShareholding } from '../../engine/dataQuality';

export const ShareholdingPatternTable: React.FC<{ stock: Stock }> = ({ stock }) => {
  const history = stock.shareholding_history || [];
  if (!history.length) return null;

  const filed = hasFiledShareholding(stock);
  const synthetic = holdingSeriesLooksSynthetic(stock);

  // Only show a row if at least one period discloses it. NSE's filing gives
  // the public holding as a single figure, so rendering empty FII and DII
  // rows for every quarter would be noise.
  const disclosed = (key: keyof ShareholdingPeriod) =>
    history.some((h) => isReported(h[key] as number | null));

  const total = (h: ShareholdingPeriod) => {
    if (isReported(h.total)) return h.total;
    const parts = [h.promoter, h.fii, h.dii, h.public, h.others].filter(isReported);
    return parts.length ? parts.reduce((a, b) => a + b, 0) : null;
  };

  const rows: StatementRow<ShareholdingPeriod>[] = [
    { label: 'Promoters', value: (h) => (isReported(h.promoter) ? pct(h.promoter, 2) : null), emphasis: 'total' },
    ...(disclosed('fii')
      ? [{ label: 'Foreign institutions', value: (h: ShareholdingPeriod) => (isReported(h.fii) ? pct(h.fii, 2) : null) }]
      : []),
    ...(disclosed('dii')
      ? [{ label: 'Domestic institutions', value: (h: ShareholdingPeriod) => (isReported(h.dii) ? pct(h.dii, 2) : null) }]
      : []),
    { label: 'Public', value: (h) => (isReported(h.public) ? pct(h.public, 2) : null) },
    ...(disclosed('others')
      ? [{ label: 'Employee trusts', value: (h: ShareholdingPeriod) => (isReported(h.others) ? pct(h.others, 2) : null) }]
      : []),
    { label: 'Total', value: (h) => pct(total(h), 2), emphasis: 'total' },
    ...(disclosed('pledged')
      ? [{ label: 'Promoter shares pledged', value: (h: ShareholdingPeriod) => (isReported(h.pledged) ? pct(h.pledged, 2) : null) }]
      : []),
  ];

  return (
    <StatementTable
      title="Shareholding"
      subtitle="Ownership split by quarter"
      periods={history}
      columnLabel={(h) => h.period}
      rows={rows}
      aside={
        filed ? (
          <span className="apple-tag" style={{ color: 'var(--apple-green)' }}>
            <FileCheck className="w-3 h-3" />
            {stock.shareholding_source}
          </span>
        ) : synthetic ? (
          <span className="apple-tag" style={{ color: 'var(--apple-amber)' }}>
            <AlertTriangle className="w-3 h-3" />
            Placeholder series
          </span>
        ) : undefined
      }
      footnote={
        filed ? (
          <>
            Taken from the company&rsquo;s quarterly shareholding pattern filed with NSE. That filing reports
            the public holding as one figure, so the split between foreign and domestic institutions, and the
            promoter pledge, are not shown rather than estimated.
          </>
        ) : synthetic ? (
          <span className="text-apple-amber">
            Every company in this dataset shows the identical quarterly drift, which means the series was
            generated rather than read from exchange filings. Do not read the trend. The quarter-on-quarter
            change metrics have been withdrawn from the screener for the same reason.
          </span>
        ) : undefined
      }
    />
  );
};
