import React from 'react';
import type { Stock, CashFlow } from '../../types/stock';
import { StatementTable, StatementRow } from './StatementTable';
import { statement } from '../../lib/format';

export const CashFlowTable: React.FC<{ stock: Stock }> = ({ stock }) => {
  const flows = stock.cash_flow || [];
  if (!flows.length) return null;

  const rows: StatementRow<CashFlow>[] = [
    { label: 'Operating activity', value: (c) => statement(c.operating_cf), emphasis: 'subtotal' },
    { label: 'Investing activity', value: (c) => statement(c.investing_cf) },
    { label: 'Financing activity', value: (c) => statement(c.financing_cf) },
    { label: 'Net cash flow', value: (c) => statement(c.net_cf), emphasis: 'total' },
    { label: 'Free cash flow', value: (c) => statement(c.free_cf), emphasis: 'total', hint: 'operating cash less capex' },
  ];

  return (
    <StatementTable
      title="Cash flow"
      subtitle="₹ crore, outflows in brackets"
      periods={flows}
      columnLabel={(c) => c.year}
      rows={rows}
    />
  );
};
