import { Stock } from '../types/stock';

export interface ProsAndCons {
  pros: string[];
  cons: string[];
}

export function generateProsAndCons(stock: Stock): ProsAndCons {
  const pros: string[] = [];
  const cons: string[] = [];

  // Debt & Balance Sheet Strength
  if (stock.debt === 0 || stock.debt_to_equity <= 0.05) {
    pros.push('Company is virtually debt-free.');
  } else if (stock.debt_to_equity < 0.3) {
    pros.push(`Company has low debt with Debt to Equity of ${stock.debt_to_equity.toFixed(2)}.`);
  } else if (stock.debt_to_equity > 1.5) {
    cons.push(`Company has high debt burden with Debt to Equity of ${stock.debt_to_equity.toFixed(2)}.`);
  }

  // Profit Growth
  if (stock.profit_growth_5y >= 15) {
    pros.push(`Company has delivered good profit growth of ${stock.profit_growth_5y.toFixed(1)}% CAGR over the last 5 years.`);
  } else if (stock.profit_growth_3y >= 20) {
    pros.push(`Company has shown accelerated 3-year profit CAGR of ${stock.profit_growth_3y.toFixed(1)}%.`);
  } else if (stock.profit_growth_5y <= 5 && stock.profit_growth_5y > -50) {
    cons.push(`Company has delivered subdued profit growth of ${stock.profit_growth_5y.toFixed(1)}% CAGR over the last 5 years.`);
  }

  // ROE & ROCE Track Record
  if (stock.roe_3y >= 18) {
    pros.push(`Company has an exceptional return on equity (ROE) track record: 3 Years ROE ${stock.roe_3y.toFixed(1)}%.`);
  } else if (stock.roe_3y < 10 && stock.roe_3y > 0) {
    cons.push(`Company has a low return on equity (ROE) of ${stock.roe_3y.toFixed(1)}% over the last 3 years.`);
  }

  if (stock.roce >= 22) {
    pros.push(`High Return on Capital Employed (ROCE) of ${stock.roce.toFixed(1)}%.`);
  }

  // Dividend Yield
  if (stock.dividend_yield >= 2.5) {
    pros.push(`Stock is providing a healthy dividend yield of ${stock.dividend_yield.toFixed(2)}%.`);
  }

  // Valuation
  if (stock.pb_ratio >= 4.5) {
    cons.push(`Stock is trading at ${stock.pb_ratio.toFixed(2)}x its book value.`);
  } else if (stock.pb_ratio <= 1.2 && stock.pb_ratio > 0) {
    pros.push(`Stock is trading near or below its book value (P/B of ${stock.pb_ratio.toFixed(2)}x).`);
  }

  if (stock.pe_ratio > 45 && stock.industry_pe && stock.pe_ratio > stock.industry_pe * 1.5) {
    cons.push(`Stock is trading at a significant premium to industry P/E (${stock.pe_ratio.toFixed(1)} vs Industry ${stock.industry_pe.toFixed(1)}).`);
  } else if (stock.pe_ratio > 0 && stock.industry_pe && stock.pe_ratio < stock.industry_pe * 0.8) {
    pros.push(`Stock is trading at a discount relative to industry P/E (${stock.pe_ratio.toFixed(1)} vs Industry ${stock.industry_pe.toFixed(1)}).`);
  }

  // Sales Growth
  if (stock.sales_growth_5y >= 15) {
    pros.push(`Strong 5-year sales growth CAGR of ${stock.sales_growth_5y.toFixed(1)}%.`);
  } else if (stock.sales_growth_5y < 8 && stock.sales_growth_5y > -100) {
    cons.push(`Company has delivered poor sales growth of ${stock.sales_growth_5y.toFixed(1)}% CAGR over the last 5 years.`);
  }

  // Promoter Pledge & Holding
  if (stock.pledged_percentage > 5) {
    cons.push(`Promoter encumbrance/pledge is elevated at ${stock.pledged_percentage.toFixed(1)}% of holding.`);
  } else if (stock.promoter_holding > 50 && stock.pledged_percentage === 0) {
    pros.push(`Strong promoter holding of ${stock.promoter_holding.toFixed(1)}% with zero pledge.`);
  }

  // Institutional Ownership
  if (stock.change_in_fii_holding_quarter > 1.0) {
    pros.push(`FIIs increased their stake by +${stock.change_in_fii_holding_quarter.toFixed(2)}% in the latest quarter.`);
  }

  // Working Capital & Cash Flows
  if (stock.debtor_days > 85) {
    cons.push(`Debtor days are elevated at ${stock.debtor_days} days.`);
  }
  if (stock.fcf_latest > 0 && stock.fcf_yield > 4) {
    pros.push(`Robust free cash flow yield of ${stock.fcf_yield.toFixed(1)}%.`);
  }

  // Piotroski & Quality
  if (stock.piotroski_score >= 8) {
    pros.push(`High financial strength score (Piotroski F-Score: ${stock.piotroski_score}/9).`);
  } else if (stock.piotroski_score <= 3 && stock.piotroski_score > 0) {
    cons.push(`Weak operational and financial score (Piotroski F-Score: ${stock.piotroski_score}/9).`);
  }

  // Fallbacks if lists are sparse
  if (pros.length === 0) {
    pros.push('Company has maintained active market operations with positive equity reserves.');
  }
  if (cons.length === 0) {
    cons.push('Monitor quarterly earnings consistency and macro sector headwinds.');
  }

  return { pros, cons };
}
