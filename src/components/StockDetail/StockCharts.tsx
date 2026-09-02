import React, { useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  Area
} from 'recharts';
import { Stock } from '../../types/stock';
import { LineChart } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface StockChartsProps {
  stock: Stock;
}

export const StockCharts: React.FC<StockChartsProps> = ({ stock }) => {
  const [activeTab, setActiveTab] = useState<'price' | 'pe' | 'sales'>('price');
  const { isDark } = useTheme();

  const priceData = stock.historical_prices || [];

  const salesData = (stock.annual_pnl || []).filter((p) => p.year !== 'TTM').map((p) => ({
    year: p.year,
    sales: p.sales,
    net_profit: p.net_profit,
    opm: p.opm_pct,
  }));

  const peData = priceData.map((d) => ({
    date: d.date.substring(0, 7),
    pe: d.pe,
    median_pe: stock.pe_ratio,
    price: d.price,
  }));

  const tooltipStyle = {
    backgroundColor: isDark ? '#161618' : '#ffffff',
    borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)',
    borderRadius: '14px',
    fontSize: '12px',
    color: isDark ? '#f5f5f7' : '#1d1d1f',
    boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.6)' : '0 4px 20px rgba(0,0,0,0.1)',
  };

  const axisColor = isDark ? '#8e8e93' : '#6e6e73';
  const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';

  return (
    <div className="w-full apple-card p-6 shadow-sm mb-8 border border-apple">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-apple-border-subtle mb-6">
        <div>
          <h3 className="text-base font-bold text-apple-primary flex items-center gap-2 font-display">
            <LineChart className="w-4 h-4 text-apple-blue" />
            Historical Technical & Valuation Trends
          </h3>
          <p className="text-xs text-apple-muted mt-0.5">
            50/200 Day Moving Averages, historical P/E multiples, and operating margin trends.
          </p>
        </div>

        {/* Apple Segmented Switcher */}
        <div className="flex items-center apple-segmented p-1">
          <button
            onClick={() => setActiveTab('price')}
            className={`apple-segmented-item ${activeTab === 'price' ? 'active' : ''}`}
          >
            Price & DMA
          </button>
          <button
            onClick={() => setActiveTab('pe')}
            className={`apple-segmented-item ${activeTab === 'pe' ? 'active' : ''}`}
          >
            PE Band
          </button>
          <button
            onClick={() => setActiveTab('sales')}
            className={`apple-segmented-item ${activeTab === 'sales' ? 'active' : ''}`}
          >
            Sales & Margin
          </button>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-72 sm:h-80 w-full">
        {activeTab === 'price' && (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={priceData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="date" stroke={axisColor} tick={{ fontSize: 11 }} />
              <YAxis stroke={axisColor} domain={['auto', 'auto']} tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <Area type="monotone" dataKey="price" name="Share Price (₹)" stroke={isDark ? '#2997ff' : '#0071e3'} fill={isDark ? 'rgba(41, 151, 255, 0.12)' : 'rgba(0, 113, 227, 0.08)'} strokeWidth={2.5} />
              <Line type="monotone" dataKey="dma_50" name="50 DMA (₹)" stroke={isDark ? '#30d158' : '#248a3d'} strokeWidth={1.8} dot={false} strokeDasharray="4 4" />
              <Line type="monotone" dataKey="dma_200" name="200 DMA (₹)" stroke={isDark ? '#ff9f0a' : '#b25000'} strokeWidth={1.8} dot={false} strokeDasharray="2 2" />
            </ComposedChart>
          </ResponsiveContainer>
        )}

        {activeTab === 'pe' && (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={peData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="date" stroke={axisColor} tick={{ fontSize: 11 }} />
              <YAxis stroke={axisColor} domain={['auto', 'auto']} tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <Line type="monotone" dataKey="pe" name="P/E Ratio" stroke={isDark ? '#bf5af2' : '#8944ab'} strokeWidth={2.5} dot={false} />
              <Line type="monotone" dataKey="median_pe" name="Current P/E" stroke={axisColor} strokeWidth={1.5} strokeDasharray="3 3" dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        )}

        {activeTab === 'sales' && (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={salesData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="year" stroke={axisColor} tick={{ fontSize: 11 }} />
              <YAxis yAxisId="left" stroke={axisColor} tick={{ fontSize: 11 }} />
              <YAxis yAxisId="right" orientation="right" stroke={isDark ? '#30d158' : '#248a3d'} unit="%" domain={[0, 50]} tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <Bar yAxisId="left" dataKey="sales" name="Sales (₹ Cr)" fill={isDark ? '#2997ff' : '#0071e3'} radius={[6, 6, 0, 0]} />
              <Bar yAxisId="left" dataKey="net_profit" name="Net Profit (₹ Cr)" fill={isDark ? '#5e5ce6' : '#5856d6'} radius={[6, 6, 0, 0]} />
              <Line yAxisId="right" type="monotone" dataKey="opm" name="OPM %" stroke={isDark ? '#30d158' : '#248a3d'} strokeWidth={2.5} dot={{ r: 3 }} />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};
