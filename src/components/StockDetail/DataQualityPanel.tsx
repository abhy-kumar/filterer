import React, { useMemo, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { Stock } from '../../types/stock';
import { assessStock } from '../../engine/dataQuality';

/**
 * What this page could not verify.
 *
 * The upstream QC report grades this universe at 100% health while shipping
 * statements that do not foot and a generated shareholding series. Surfacing
 * the specific problems is more useful than a green tick that means nothing.
 */
export const DataQualityPanel: React.FC<{ stock: Stock }> = ({ stock }) => {
  const findings = useMemo(() => assessStock(stock), [stock]);
  const [expanded, setExpanded] = useState(false);

  if (!findings.length) return null;

  const warnings = findings.filter((f) => f.severity === 'warning');

  const summary = warnings.length
    ? `${warnings.length} thing${warnings.length === 1 ? '' : 's'} to check in this company's figures`
    : `${findings.length} note${findings.length === 1 ? '' : 's'} on this company's figures`;

  return (
    <div
      className="apple-card overflow-hidden"
      style={{ borderColor: warnings.length ? 'var(--apple-amber)' : undefined }}
    >
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full px-4 py-2.5 flex items-center gap-2.5 text-left hover:bg-apple-surface-hover transition-colors"
        aria-expanded={expanded}
      >
        <span className="text-caption1 font-semibold text-apple-primary">{summary}</span>
        <ChevronDown
          className={`w-4 h-4 ml-auto shrink-0 text-apple-faint transition-transform ${expanded ? 'rotate-180' : ''}`}
        />
      </button>

      {expanded && (
        <ul className="px-4 pb-4 pt-1 space-y-3 border-t border-apple-border-subtle">
          {findings.map((finding) => (
            <li key={finding.id} className="flex items-start gap-2.5">
              <span
                className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${
                  finding.severity === 'warning' ? 'bg-apple-amber' : 'bg-apple-border-strong'
                }`}
                style={{
                  background:
                    finding.severity === 'warning' ? 'var(--apple-amber)' : 'var(--apple-border-strong)',
                }}
              />
              <div>
                <p className="text-caption1 font-semibold text-apple-primary">{finding.title}</p>
                <p className="text-caption1 text-apple-secondary mt-0.5 leading-relaxed">{finding.detail}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
