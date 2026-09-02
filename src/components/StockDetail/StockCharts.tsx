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
import { BarChart3, LineChart, TrendingUp } from 'lucide-react';

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
    <div className="w-full bg-[#0c1017] dark:bg-[#0c1017] light:bg-white rounded-2xl border border-white/10 dark:border-white/10 light:border-slate-200 p-6 shadow-xl mb-8">
      {/* Chart Header Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5 dark:border-white/5 light:border-slate-100 mb-6">
        <div>
          <h3 className="text-base font-bold text-white dark:text-white light:text-slate-900 flex items-center gap-2">
            <LineChart className="w-4 h-4 text-sky-400" />
            Interactive Historical Charts
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Technical moving averages, valuation bands, and operational margin trends.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 bg-slate-900 dark:bg-slate-900 light:bg-slate-100 p-1 rounded-xl border border-white/5">
          <button
            onClick={() => setActiveTab('price')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'price'
                ? 'bg-sky-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Price & DMA
          </button>
          <button
            onClick={() => setActiveTab('pe')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'pe'
                ? 'bg-sky-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            PE Band
          </button>
          <button
            onClick={() => setActiveTab('sales')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'sales'
                ? 'bg-sky-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Sales & Margin
          </button>
        </div>
      </div>

      {/* Chart Content */}
      <div className="h-72 sm:h-80 w-full">
        {activeTab === 'price' && (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={priceData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 11 }} />
              <YAxis stroke="#64748b" domain={['auto', 'auto']} tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#070a0f',
                  borderColor: 'rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  fontSize: '12px',
                  color: '#fff',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <Area type="monotone" dataKey="price" name="Share Price (₹)" stroke="#38bdf8" fill="rgba(56, 189, 248, 0.1)" strokeWidth={2.5} />
              <Line type="monotone" dataKey="dma_50" name="50 DMA (₹)" stroke="#34d399" strokeWidth={1.8} dot={false} strokeDasharray="4 4" />
              <Line type="monotone" dataKey="dma_200" name="200 DMA (₹)" stroke="#f59e0b" strokeWidth={1.8} dot={false} strokeDasharray="2 2" />
            </ComposedChart>
          </ResponsiveContainer>
        )}

        {activeTab === 'pe' && (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={peData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 11 }} />
              <YAxis stroke="#64748b" domain={['auto', 'auto']} tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#070a0f',
                  borderColor: 'rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  fontSize: '12px',
                  color: '#fff',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <Line type="monotone" dataKey="pe" name="P/E Ratio" stroke="#a855f7" strokeWidth={2.5} dot={false} />
              <Line type="monotone" dataKey="median_pe" name="Current P/E" stroke="#64748b" strokeWidth={1.5} strokeDasharray="3 3" dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        )}

        {activeTab === 'sales' && (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={salesData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="year" stroke="#64748b" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="left" stroke="#64748b" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="right" orientation="right" stroke="#34d399" unit="%" domain={[0, 50]} tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#070a0f',
                  borderColor: 'rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  fontSize: '12px',
                  color: '#fff',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <Bar yAxisId="left" dataKey="sales" name="Sales (₹ Cr)" fill="#38bdf8" radius={[4, 4, 0, 0]} />
              <Bar yAxisId="left" dataKey="net_profit" name="Net Profit (₹ Cr)" fill="#818cf8" radius={[4, 4, 0, 0]} />
              <Line yAxisId="right" type="monotone" dataKey="opm" name="OPM %" stroke="#34d399" strokeWidth={2.5} dot={{ r: 3 }} />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};
