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

interface StockChartsProps {
  stock: Stock;
}

export const StockCharts: React.FC<StockChartsProps> = ({ stock }) => {
  const [activeTab, setActiveTab] = useState<'price' | 'pe' | 'sales'>('price');

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

  return (
    <div className="w-full apple-glass rounded-3xl border border-white/[0.08] p-6 shadow-2xl mb-8">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.06] mb-6">
        <div>
          <h3 className="text-base font-semibold text-white dark:text-white light:text-slate-900 flex items-center gap-2">
            <LineChart className="w-4 h-4 text-[#2997ff]" />
            Historical Technical & Valuation Trends
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
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
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" stroke="#86868b" tick={{ fontSize: 11 }} />
              <YAxis stroke="#86868b" domain={['auto', 'auto']} tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0a0e17',
                  borderColor: 'rgba(255,255,255,0.12)',
                  borderRadius: '16px',
                  fontSize: '12px',
                  color: '#fff',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <Area type="monotone" dataKey="price" name="Share Price (₹)" stroke="#2997ff" fill="rgba(41, 151, 255, 0.12)" strokeWidth={2.5} />
              <Line type="monotone" dataKey="dma_50" name="50 DMA (₹)" stroke="#30d158" strokeWidth={1.8} dot={false} strokeDasharray="4 4" />
              <Line type="monotone" dataKey="dma_200" name="200 DMA (₹)" stroke="#ff9f0a" strokeWidth={1.8} dot={false} strokeDasharray="2 2" />
            </ComposedChart>
          </ResponsiveContainer>
        )}

        {activeTab === 'pe' && (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={peData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" stroke="#86868b" tick={{ fontSize: 11 }} />
              <YAxis stroke="#86868b" domain={['auto', 'auto']} tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0a0e17',
                  borderColor: 'rgba(255,255,255,0.12)',
                  borderRadius: '16px',
                  fontSize: '12px',
                  color: '#fff',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <Line type="monotone" dataKey="pe" name="P/E Ratio" stroke="#bf5af2" strokeWidth={2.5} dot={false} />
              <Line type="monotone" dataKey="median_pe" name="Current P/E" stroke="#86868b" strokeWidth={1.5} strokeDasharray="3 3" dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        )}

        {activeTab === 'sales' && (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={salesData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="year" stroke="#86868b" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="left" stroke="#86868b" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="right" orientation="right" stroke="#30d158" unit="%" domain={[0, 50]} tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0a0e17',
                  borderColor: 'rgba(255,255,255,0.12)',
                  borderRadius: '16px',
                  fontSize: '12px',
                  color: '#fff',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <Bar yAxisId="left" dataKey="sales" name="Sales (₹ Cr)" fill="#2997ff" radius={[6, 6, 0, 0]} />
              <Bar yAxisId="left" dataKey="net_profit" name="Net Profit (₹ Cr)" fill="#5e5ce6" radius={[6, 6, 0, 0]} />
              <Line yAxisId="right" type="monotone" dataKey="opm" name="OPM %" stroke="#30d158" strokeWidth={2.5} dot={{ r: 3 }} />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};
