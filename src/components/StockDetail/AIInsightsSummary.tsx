import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Building,
  DollarSign,
  MessageSquare,
  Quote,
  CheckCircle2,
  Calendar,
  Layers,
  FileText
} from 'lucide-react';
import { Stock } from '../../types/stock';
import { generateStockConcallInsights, StockConcallInsights, ConcallQuarterData } from '../../engine/concallInsightsGenerator';

interface AIInsightsSummaryProps {
  stock: Stock;
}

export const AIInsightsSummary: React.FC<AIInsightsSummaryProps> = ({ stock }) => {
  const concallData = useMemo<StockConcallInsights>(() => {
    return generateStockConcallInsights(stock);
  }, [stock]);

  const [selectedQuarterName, setSelectedQuarterName] = useState<string>(
    concallData.quarters[0]?.quarter || 'Q3 FY25'
  );

  const activeQuarter = useMemo<ConcallQuarterData | undefined>(() => {
    return concallData.quarters.find((q) => q.quarter === selectedQuarterName) || concallData.quarters[0];
  }, [concallData, selectedQuarterName]);

  if (!activeQuarter) return null;

  const sentimentColor =
    activeQuarter.sentimentScore >= 80
      ? 'text-emerald-500'
      : activeQuarter.sentimentScore >= 65
        ? 'text-blue-500'
        : 'text-amber-500';

  return (
    <div className="apple-card p-5 sm:p-6 space-y-6">
      {/* Header and Quarter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-apple-border pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-apple-blue" />
            <h2 className="text-lg font-bold text-apple-primary font-display">
              Concall & Earnings Analysis
            </h2>
            <span className="apple-tag text-[10px] font-semibold text-apple-blue bg-apple-blue/10 border-apple-blue/25">
              Transcript Highlights
            </span>
          </div>
          <p className="text-xs text-apple-muted">
            Management commentary, capex pipeline, industry tailwinds, and earnings call Q&A.
          </p>
        </div>

        {/* Quarter Selector */}
        <div className="flex items-center apple-segmented self-start sm:self-auto">
          {concallData.quarters.map((q) => (
            <button
              key={q.quarter}
              type="button"
              onClick={() => setSelectedQuarterName(q.quarter)}
              className={`apple-segmented-item text-xs ${
                selectedQuarterName === q.quarter ? 'active' : ''
              }`}
            >
              {q.quarter}
            </button>
          ))}
        </div>
      </div>

      {/* Tone & Executive Summary Card */}
      <div className="apple-well p-4 sm:p-5 rounded-xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-apple-border/50 pb-3">
          <div className="flex items-center gap-3">
            <div className="text-3xl font-bold font-mono text-apple-primary leading-none">
              <span className={sentimentColor}>{activeQuarter.sentimentScore}</span>
              <span className="text-sm font-normal text-apple-muted font-sans">/100</span>
            </div>
            <div>
              <div className="text-xs font-bold text-apple-primary">
                Management Tone: {activeQuarter.sentimentLabel}
              </div>
              <div className="text-[10.5px] text-apple-muted">
                Analyzed from {activeQuarter.date} earnings conference call
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-apple-muted">
            <Calendar className="w-3.5 h-3.5" />
            <span>Filing: {activeQuarter.date}</span>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-apple-secondary leading-relaxed">
          {activeQuarter.summaryParagraph}
        </p>
      </div>

      {/* Capex & Capacity Guidance Card */}
      <div className="apple-card p-4 border border-apple-border/80 space-y-2.5 bg-apple-surface/30">
        <div className="flex items-center gap-2 text-xs font-bold text-apple-primary uppercase tracking-wider">
          <Building className="w-4 h-4 text-apple-blue" />
          <span>Capex & Capacity Guidance</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div>
            <div className="text-[10.5px] text-apple-muted">Budgeted Outlay</div>
            <div className="font-mono font-bold text-apple-primary text-sm mt-0.5">
              {activeQuarter.capexGuidance.amountCr}
            </div>
            <div className="text-[10.5px] text-apple-faint mt-0.5">
              Timeline: {activeQuarter.capexGuidance.timeline}
            </div>
          </div>

          <div>
            <div className="text-[10.5px] text-apple-muted">Key Focus Facilities</div>
            <ul className="list-disc list-inside text-apple-secondary mt-0.5 space-y-0.5 text-[11px]">
              {activeQuarter.capexGuidance.focusAreas.map((area, i) => (
                <li key={i} className="truncate">{area}</li>
              ))}
            </ul>
          </div>

          <div>
            <div className="text-[10.5px] text-apple-muted">Funding & Leverage</div>
            <div className="text-apple-secondary text-[11px] mt-0.5 leading-relaxed">
              {activeQuarter.capexGuidance.fundingSource}
            </div>
          </div>
        </div>
      </div>

      {/* Tailwinds (Catalysts) vs Headwinds (Risks) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Tailwinds */}
        <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
            <TrendingUp className="w-4 h-4" />
            <span>Growth Drivers & Tailwinds</span>
          </div>
          <ul className="space-y-2 text-xs text-apple-secondary">
            {activeQuarter.tailwinds.map((t, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Headwinds */}
        <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/5 space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-bold text-rose-600 dark:text-rose-400">
            <AlertTriangle className="w-4 h-4" />
            <span>Operational Headwinds & Risks</span>
          </div>
          <ul className="space-y-2 text-xs text-apple-secondary">
            {activeQuarter.headwinds.map((h, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                <span>{h}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Executive Management Direct Commentary */}
      {activeQuarter.managementQuotes.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-apple-primary uppercase tracking-wider">
            <Quote className="w-3.5 h-3.5 text-apple-blue" />
            <span>Key Executive Commentary</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {activeQuarter.managementQuotes.map((q, idx) => (
              <div
                key={idx}
                className="apple-card p-4 border border-apple-border/70 space-y-2 bg-apple-surface/20"
              >
                <div className="text-[10.5px] uppercase font-semibold text-apple-blue tracking-wider">
                  {q.topic}
                </div>
                <p className="text-xs text-apple-primary italic leading-relaxed">
                  "{q.quote}"
                </p>
                <div className="text-[11px] font-medium text-apple-muted pt-1 border-t border-apple-border/40">
                  <span className="font-semibold text-apple-secondary">{q.speaker}</span>, {q.designation}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Institutional Analyst Q&A Highlights */}
      {activeQuarter.analystQA.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-apple-primary uppercase tracking-wider">
            <MessageSquare className="w-3.5 h-3.5 text-apple-blue" />
            <span>Key Analyst Q&A Nuggets</span>
          </div>

          <div className="space-y-3">
            {activeQuarter.analystQA.map((qa, idx) => (
              <div
                key={idx}
                className="apple-well p-4 rounded-xl space-y-2 text-xs"
              >
                <div className="flex items-center justify-between text-[11px] font-medium text-apple-muted">
                  <span className="font-semibold text-apple-secondary">{qa.analystName}</span>
                  <span className="apple-tag text-[10px]">{qa.firm}</span>
                </div>
                <div className="text-apple-primary font-medium">
                  <span className="text-apple-blue font-bold mr-1.5">Q:</span>
                  {qa.question}
                </div>
                <div className="text-apple-secondary leading-relaxed pt-1.5 border-t border-apple-border/50">
                  <span className="text-emerald-500 font-bold mr-1.5">Management:</span>
                  {qa.answer}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AIInsightsSummary;
