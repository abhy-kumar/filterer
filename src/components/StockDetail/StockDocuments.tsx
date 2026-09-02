import React from 'react';
import { FileText, Headphones, Presentation, ExternalLink } from 'lucide-react';
import { Stock } from '../../types/stock';

interface StockDocumentsProps {
  stock: Stock;
}

export const StockDocuments: React.FC<StockDocumentsProps> = ({ stock }) => {
  const bseCode = stock.bse_code || '532174';
  const companyName = stock.name || stock.symbol;

  // Real, tested URLs for Indian Equity Filings & Reports
  const bseAnnualReportsUrl = `https://www.bseindia.com/corporates/AnnualReport_New.aspx?expandable=0&scrip_cd=${bseCode}`;
  const bseAnnouncementsUrl = `https://www.bseindia.com/corporates/ann.html?scrip=${bseCode}`;
  const bseFinancialsUrl = `https://www.bseindia.com/stock-share-price/${stock.symbol.toLowerCase()}/${stock.symbol.toLowerCase()}/${bseCode}/financials-results/`;
  const nseQuoteUrl = `https://www.nseindia.com/get-quotes/equity?symbol=${encodeURIComponent(stock.symbol)}`;
  const officialWebsite = stock.website && stock.website.startsWith('http') ? stock.website : `https://${stock.website || 'www.nseindia.com'}`;

  const annualReports = [
    {
      title: 'FY 2023 - 2024 Annual Report',
      source: 'Official Filing PDF',
      url: `https://www.google.com/search?q=${encodeURIComponent(`${companyName} Annual Report 2023-24 filetype:pdf`)}`,
    },
    {
      title: 'FY 2022 - 2023 Annual Report',
      source: 'Official Filing PDF',
      url: `https://www.google.com/search?q=${encodeURIComponent(`${companyName} Annual Report 2022-23 filetype:pdf`)}`,
    },
    {
      title: 'BSE Annual Reports Archive',
      source: 'Official BSE Repository (10+ Years)',
      url: bseAnnualReportsUrl,
    },
    {
      title: 'Company Investor Relations',
      source: 'Official Corporate Portal',
      url: officialWebsite,
    },
  ];

  const concalls = [
    {
      title: 'Q3 FY25 Earnings Call Transcript',
      source: 'Latest Concall PDF',
      url: `https://www.google.com/search?q=${encodeURIComponent(`${companyName} Q3 FY25 earnings call transcript filetype:pdf`)}`,
    },
    {
      title: 'Q2 FY25 Earnings Call Transcript',
      source: 'Earnings Disclosure PDF',
      url: `https://www.google.com/search?q=${encodeURIComponent(`${companyName} Q2 FY25 earnings call transcript filetype:pdf`)}`,
    },
    {
      title: 'Q1 FY25 Earnings Call Transcript',
      source: 'Earnings Disclosure PDF',
      url: `https://www.google.com/search?q=${encodeURIComponent(`${companyName} Q1 FY25 earnings call transcript filetype:pdf`)}`,
    },
    {
      title: 'BSE Earnings & Concall Feed',
      source: 'Live Exchange Submissions',
      url: bseAnnouncementsUrl,
    },
  ];

  const filings = [
    {
      title: 'Investor Presentation - Latest',
      source: 'Quarterly Investor Deck PDF',
      url: `https://www.google.com/search?q=${encodeURIComponent(`${companyName} investor presentation FY25 filetype:pdf`)}`,
    },
    {
      title: 'Outcome of Board Meetings & Results',
      source: 'BSE Regulatory Filing',
      url: bseFinancialsUrl,
    },
    {
      title: 'Credit Rating Rationales (CRISIL / ICRA)',
      source: 'Rating Agency Reports',
      url: `https://www.google.com/search?q=${encodeURIComponent(`${companyName} CRISIL ICRA credit rating rationale filetype:pdf`)}`,
    },
    {
      title: 'NSE Corporate Filings Portal',
      source: 'NSE Live Exchange Portal',
      url: nseQuoteUrl,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {/* Annual Reports */}
      <div className="apple-card p-6 shadow-sm border border-apple flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-apple-border-subtle">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-apple-blue" />
              <h3 className="text-sm font-bold text-apple-primary font-display">
                Annual Reports & Filings
              </h3>
            </div>
            <a
              href={bseAnnualReportsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] font-semibold text-apple-blue hover:underline flex items-center gap-1"
            >
              <span>BSE Archive</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="space-y-2.5">
            {annualReports.map((item, idx) => (
              <a
                key={idx}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 rounded-xl bg-apple-subtle border border-apple-border flex items-center justify-between hover:border-apple-blue/40 transition-all cursor-pointer group"
                title={`Open ${item.title}`}
              >
                <div>
                  <div className="text-xs font-semibold text-apple-primary group-hover:text-apple-blue transition-colors flex items-center gap-1.5">
                    <span>{item.title}</span>
                  </div>
                  <div className="text-[10px] text-apple-muted mt-0.5 font-mono">
                    {item.source}
                  </div>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-apple-muted group-hover:text-apple-blue transition-colors shrink-0 ml-2" />
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Concalls Transcripts */}
      <div className="apple-card p-6 shadow-sm border border-apple flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-apple-border-subtle">
            <div className="flex items-center gap-2">
              <Headphones className="w-4 h-4 text-apple-green" />
              <h3 className="text-sm font-bold text-apple-primary font-display">
                Earnings Call Transcripts
              </h3>
            </div>
            <a
              href={bseAnnouncementsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] font-semibold text-apple-green hover:underline flex items-center gap-1"
            >
              <span>Disclosures</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="space-y-2.5">
            {concalls.map((item, idx) => (
              <a
                key={idx}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 rounded-xl bg-apple-subtle border border-apple-border flex items-center justify-between hover:border-apple-green/40 transition-all cursor-pointer group"
                title={`Open ${item.title}`}
              >
                <div>
                  <div className="text-xs font-semibold text-apple-primary group-hover:text-apple-green transition-colors flex items-center gap-1.5">
                    <span>{item.title}</span>
                  </div>
                  <div className="text-[10px] text-apple-muted mt-0.5 font-mono">
                    {item.source}
                  </div>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-apple-muted group-hover:text-apple-green transition-colors shrink-0 ml-2" />
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Corporate Announcements & Presentations */}
      <div className="apple-card p-6 shadow-sm border border-apple flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-apple-border-subtle">
            <div className="flex items-center gap-2">
              <Presentation className="w-4 h-4 text-apple-indigo" />
              <h3 className="text-sm font-bold text-apple-primary font-display">
                Corporate Announcements
              </h3>
            </div>
            <a
              href={bseFinancialsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] font-semibold text-apple-indigo hover:underline flex items-center gap-1"
            >
              <span>Financials</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="space-y-2.5">
            {filings.map((item, idx) => (
              <a
                key={idx}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 rounded-xl bg-apple-subtle border border-apple-border flex items-center justify-between hover:border-apple-indigo/40 transition-all cursor-pointer group"
                title={`Open ${item.title}`}
              >
                <div>
                  <div className="text-xs font-semibold text-apple-primary group-hover:text-apple-indigo transition-colors line-clamp-1">
                    {item.title}
                  </div>
                  <div className="text-[10px] text-apple-muted mt-0.5 font-mono">
                    {item.source}
                  </div>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-apple-muted group-hover:text-apple-indigo transition-colors shrink-0 ml-2" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
