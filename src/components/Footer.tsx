import React from 'react';
import { Filter, Heart, Shield, Code2, Database } from 'lucide-react';
import { GithubLogo } from '@phosphor-icons/react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-white/10 dark:border-white/10 light:border-slate-200 bg-[#06090e] dark:bg-[#06090e] light:bg-slate-50 py-12 mt-16 text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 pb-8 border-b border-white/5">
          {/* Col 1: Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-sky-500 flex items-center justify-center text-white font-bold text-xs">
                <Filter className="w-4 h-4" />
              </div>
              <span className="font-bold text-base text-white dark:text-white light:text-slate-900 font-mono tracking-tight">
                FILTERER
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm mb-4">
              A high-performance, open-source, and free alternative to Screener.in for Indian Equities. Designed for value investors, quant traders, and equity researchers.
            </p>
            <div className="flex items-center gap-3 text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <Code2 className="w-3.5 h-3.5 text-sky-400" />
                Next-Gen TypeScript Engine
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-emerald-400" />
                Vercel Ready
              </span>
            </div>
          </div>

          {/* Col 2: Screener Queries */}
          <div>
            <h4 className="text-xs font-bold text-white dark:text-white light:text-slate-900 uppercase tracking-wider mb-3">
              Popular Screens
            </h4>
            <ul className="space-y-2 text-xs">
              <li><a href="#" className="hover:text-sky-400 transition-colors">Magic Formula</a></li>
              <li><a href="#" className="hover:text-sky-400 transition-colors">Debt Free Compounders</a></li>
              <li><a href="#" className="hover:text-sky-400 transition-colors">Graham Undervalued</a></li>
              <li><a href="#" className="hover:text-sky-400 transition-colors">High Piotroski F-Score</a></li>
              <li><a href="#" className="hover:text-sky-400 transition-colors">Institutional Buying</a></li>
            </ul>
          </div>

          {/* Col 3: Resources & Links */}
          <div>
            <h4 className="text-xs font-bold text-white dark:text-white light:text-slate-900 uppercase tracking-wider mb-3">
              Developer & Source
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a
                  href="https://github.com/abhy-kumar/filterer"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 hover:text-white transition-colors"
                >
                  <GithubLogo className="w-4 h-4" />
                  GitHub Repository
                </a>
              </li>
              <li><a href="#" className="hover:text-sky-400 transition-colors">API Documentation</a></li>
              <li><a href="#" className="hover:text-sky-400 transition-colors">Formula Dictionary</a></li>
              <li><a href="#" className="hover:text-sky-400 transition-colors">Python Pipeline</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom Disclaimer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>
            Disclaimer: All data and analytical tools are provided for informational and educational purposes only. Not financial or investment advice.
          </p>
          <div className="flex items-center gap-1 shrink-0">
            <span>Built with precision for Indian Equities</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
