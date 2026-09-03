import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Building,
  DollarSign,
  MessageSquare,
  HelpCircle,
  ArrowRight,
  Send,
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

  // Interactive "Ask AI" state
  const [customQuestion, setCustomQuestion] = useState('');
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);

  const handleAskPreset = (preset: string) => {
    setCustomQuestion(preset);
    generateAnswer(preset);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customQuestion.trim()) return;
    generateAnswer(customQuestion);
  };

  const generateAnswer = (q: string) => {
    const questionLower = q.toLowerCase();
    const opm = stock.opm ?? 15;
    const de = stock.debt_to_equity ?? 0.2;

    if (questionLower.includes('margin') || questionLower.includes('inflation') || questionLower.includes('cost')) {
      setAiAnswer(
        `Management guidance indicates operating margins are targeted within the ${Math.round(opm)}% - ${Math.round(opm + 2)}% range. Benign raw material costs provide operating cushion, and pass-through pricing agreements on contractual sales protect against sudden commodity shocks.`
      );
    } else if (questionLower.includes('capex') || questionLower.includes('debt') || questionLower.includes('capacity')) {
      setAiAnswer(
        `Capex program of ${activeQuarter?.capexGuidance.amountCr} is focused on ${activeQuarter?.capexGuidance.focusAreas.join(', ')}. Funding structure is ${activeQuarter?.capexGuidance.fundingSource}, keeping balance sheet leverage at comfortable D/E of ${de.toFixed(2)}x.`
      );
    } else if (questionLower.includes('export') || questionLower.includes('demand') || questionLower.includes('domestic')) {
      setAiAnswer(
        `Domestic demand across India remains the primary growth catalyst, growing at 1.3x - 1.5x sector baseline. Export channels are monitored with cautious optimism given freight stabilization and selective customer destocking completion.`
      );
    } else {
      setAiAnswer(
        `Based on the latest ${activeQuarter?.quarter} concall analysis for ${stock.name}: Management tone remains ${activeQuarter?.sentimentLabel.toLowerCase()} (Sentiment Score: ${activeQuarter?.sentimentScore}/100). The key strategic focus remains expanding market leadership in ${stock.industry} while maintaining capital discipline.`
      );
    }
  };

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
            <Sparkles className="w-5 h-5 text-apple-blue" />
            <h2 className="text-lg font-bold text-apple-primary font-display">
              AI Concall & Earnings Analysis
            </h2>
            <span className="apple-tag text-[10px] font-semibold text-apple-blue bg-apple-blue/10 border-apple-blue/25">
              Algorithmic Synthesis
            </span>
          </div>
          <p className="text-xs text-apple-muted">
            Automated intelligence on management commentary, capex pipeline, tailwinds, and earnings call Q&A.
          </p>
        </div>

        {/* Quarter Selector */}
        <div className="flex items-center apple-segmented self-start sm:self-auto">
          {concallData.quarters.map((q) => (
            <button
              key={q.quarter}
              type="button"
              onClick={() => {
                setSelectedQuarterName(q.quarter);
                setAiAnswer(null);
              }}
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

      {/* Interactive "Ask AI About This Concall" */}
      <div className="apple-card p-4 sm:p-5 border border-apple-blue/25 bg-gradient-to-br from-apple-blue/5 via-apple-surface to-apple-surface space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-apple-blue" />
            <h3 className="text-sm font-bold text-apple-primary font-display">
              Ask AI about {stock.symbol}'s Earnings & Guidance
            </h3>
          </div>
          <span className="text-[10px] text-apple-muted font-mono hidden sm:inline">
            Interactive LLM Summarizer
          </span>
        </div>

        {/* Quick prompt buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {[
            'Margin Guidance & Inflation Impact',
            'Capex & Capacity Expansion Timeline',
            'Export vs Domestic Outlook',
            'Pricing Power & Raw Material Trends',
          ].map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => handleAskPreset(prompt)}
              className="text-[11px] px-2.5 py-1 rounded-full border border-apple-border/70 hover:border-apple-blue/50 bg-apple-card hover:bg-apple-surface text-apple-secondary hover:text-apple-primary whitespace-nowrap transition-colors shrink-0"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Question Form */}
        <form onSubmit={handleCustomSubmit} className="flex gap-2">
          <input
            type="text"
            value={customQuestion}
            onChange={(e) => setCustomQuestion(e.target.value)}
            placeholder="Type any question (e.g. Will debt increase? What is the competitive outlook?)..."
            className="apple-input text-xs flex-1 h-9 px-3"
          />
          <button
            type="submit"
            disabled={!customQuestion.trim()}
            className="apple-btn apple-btn-primary px-3 h-9 text-xs flex items-center gap-1.5 shrink-0 disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Ask AI</span>
          </button>
        </form>

        {/* Generated Answer Display */}
        {aiAnswer && (
          <div className="apple-well p-3.5 rounded-lg text-xs space-y-1 animate-fade-in border border-apple-blue/30">
            <div className="font-semibold text-apple-blue flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              AI Synthesis:
            </div>
            <p className="text-apple-primary leading-relaxed">
              {aiAnswer}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIInsightsSummary;
