import React from 'react';
import { FileText, Headphones, Presentation, Radio, Download, ExternalLink } from 'lucide-react';
import { Stock } from '../../types/stock';

interface StockDocumentsProps {
  stock: Stock;
}

export const StockDocuments: React.FC<StockDocumentsProps> = ({ stock }) => {
  const annualReports = [
    { year: 'Financial Year 2023 - 2024', size: '14.2 MB', url: '#' },
    { year: 'Financial Year 2022 - 2023', size: '12.8 MB', url: '#' },
    { year: 'Financial Year 2021 - 2022', size: '11.5 MB', url: '#' },
    { year: 'Financial Year 2020 - 2021', size: '10.9 MB', url: '#' },
  ];

  const concalls = [
    { period: 'Q3 FY25 Earnings Call Transcript', date: 'Jan 2025' },
    { period: 'Q2 FY25 Earnings Call Transcript', date: 'Oct 2024' },
    { period: 'Q1 FY25 Earnings Call Transcript', date: 'Jul 2024' },
    { period: 'Q4 FY24 Earnings Call Transcript', date: 'Apr 2024' },
  ];

  const filings = [
    { title: 'Investor Presentation - Q3 FY25 Updates', type: 'Presentation' },
    { title: 'Outcome of Board Meeting & Dividend Declaration', type: 'Announcement' },
    { title: 'CRISIL Credit Rating Reaffirmation AAA/Stable', type: 'Credit Rating' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {/* Annual Reports */}
      <div className="bg-[#0c1017] dark:bg-[#0c1017] light:bg-white rounded-2xl border border-white/10 dark:border-white/10 light:border-slate-200 p-6 shadow-xl">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/5">
          <FileText className="w-4 h-4 text-sky-400" />
          <h3 className="text-sm font-bold text-white dark:text-white light:text-slate-900">
            Annual Reports
          </h3>
        </div>
        <div className="space-y-2.5">
          {annualReports.map((item, idx) => (
            <div
              key={idx}
              className="p-3 rounded-xl bg-slate-950/60 dark:bg-slate-950/60 light:bg-slate-50 border border-white/5 flex items-center justify-between hover:border-sky-500/30 transition-all cursor-pointer group"
            >
              <div>
                <div className="text-xs font-semibold text-slate-200 dark:text-slate-200 light:text-slate-800 group-hover:text-sky-400">
                  {item.year}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5 font-mono">{item.size} PDF</div>
              </div>
              <Download className="w-4 h-4 text-slate-500 group-hover:text-sky-400 transition-colors" />
            </div>
          ))}
        </div>
      </div>

      {/* Concalls Transcripts */}
      <div className="bg-[#0c1017] dark:bg-[#0c1017] light:bg-white rounded-2xl border border-white/10 dark:border-white/10 light:border-slate-200 p-6 shadow-xl">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/5">
          <Headphones className="w-4 h-4 text-indigo-400" />
          <h3 className="text-sm font-bold text-white dark:text-white light:text-slate-900">
            Concall Transcripts
          </h3>
        </div>
        <div className="space-y-2.5">
          {concalls.map((item, idx) => (
            <div
              key={idx}
              className="p-3 rounded-xl bg-slate-950/60 dark:bg-slate-950/60 light:bg-slate-50 border border-white/5 flex items-center justify-between hover:border-indigo-500/30 transition-all cursor-pointer group"
            >
              <div>
                <div className="text-xs font-semibold text-slate-200 dark:text-slate-200 light:text-slate-800 group-hover:text-indigo-400">
                  {item.period}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5 font-mono">{item.date}</div>
              </div>
              <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition-colors" />
            </div>
          ))}
        </div>
      </div>

      {/* Presentations & Filings */}
      <div className="bg-[#0c1017] dark:bg-[#0c1017] light:bg-white rounded-2xl border border-white/10 dark:border-white/10 light:border-slate-200 p-6 shadow-xl">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/5">
          <Presentation className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-bold text-white dark:text-white light:text-slate-900">
            Investor Presentations
          </h3>
        </div>
        <div className="space-y-2.5">
          {filings.map((item, idx) => (
            <div
              key={idx}
              className="p-3 rounded-xl bg-slate-950/60 dark:bg-slate-950/60 light:bg-slate-50 border border-white/5 flex items-center justify-between hover:border-emerald-500/30 transition-all cursor-pointer group"
            >
              <div>
                <div className="text-xs font-semibold text-slate-200 dark:text-slate-200 light:text-slate-800 group-hover:text-emerald-400">
                  {item.title}
                </div>
                <div className="text-[10px] text-emerald-400/80 mt-0.5 font-mono">{item.type}</div>
              </div>
              <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition-colors" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
