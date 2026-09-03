import { Stock } from '../types/stock';

export interface ProsAndCons {
  pros: string[];
  cons: string[];
}

const has = (v: number | null | undefined): v is number => typeof v === 'number' && Number.isFinite(v);

/**
 * Observations drawn only from figures the company actually reported.
 *
 * Every test guards on the value being present. The previous version read the
 * columns the pipeline leaves empty, so a company with no five-year growth
 * data was told it had "delivered poor sales growth of 0.0% CAGR".
 */
export function generateProsAndCons(stock: Stock): ProsAndCons {
  const pros: string[] = [];
  const cons: string[] = [];

  // Leverage
  if (has(stock.debt_to_equity)) {
    if (stock.debt === 0 || stock.debt_to_equity <= 0.05) {
      pros.push('Company is virtually debt-free.');
    } else if (stock.debt_to_equity < 0.3) {
      pros.push(`Healthy balance sheet with conservative debt-to-equity of ${stock.debt_to_equity.toFixed(2)}x.`);
    } else if (stock.debt_to_equity > 1.5) {
      cons.push(`High financial leverage: debt-to-equity stands at ${stock.debt_to_equity.toFixed(2)}x.`);
    }
  }

  if (has(stock.interest_coverage)) {
    if (stock.interest_coverage < 2.5) {
      cons.push(`Subdued interest coverage ratio of ${stock.interest_coverage.toFixed(1)}x.`);
    } else if (stock.interest_coverage > 12) {
      pros.push(`Comfortable interest coverage ratio of ${stock.interest_coverage.toFixed(0)}x.`);
    }
  }

  // Growth: prefer the longest horizon that is actually reported.
  const profitGrowth = has(stock.profit_growth_5y)
    ? { years: 5, value: stock.profit_growth_5y }
    : has(stock.profit_growth_3y)
      ? { years: 3, value: stock.profit_growth_3y }
      : null;

  if (profitGrowth) {
    if (profitGrowth.value >= 15) {
      pros.push(`Strong earnings growth: PAT compounded at ${profitGrowth.value.toFixed(1)}% CAGR over ${profitGrowth.years} years.`);
    } else if (profitGrowth.value < 0) {
      cons.push(`Negative profit trajectory: PAT declined at ${Math.abs(profitGrowth.value).toFixed(1)}% CAGR over ${profitGrowth.years} years.`);
    } else if (profitGrowth.value < 5) {
      cons.push(`Subdued earnings expansion of ${profitGrowth.value.toFixed(1)}% CAGR over ${profitGrowth.years} years.`);
    }
  }

  const salesGrowth = has(stock.sales_growth_5y)
    ? { years: 5, value: stock.sales_growth_5y }
    : has(stock.sales_growth_3y)
      ? { years: 3, value: stock.sales_growth_3y }
      : null;

  if (salesGrowth) {
    if (salesGrowth.value >= 15) {
      pros.push(`Solid top-line expansion: revenue compounded at ${salesGrowth.value.toFixed(1)}% CAGR over ${salesGrowth.years} years.`);
    } else if (salesGrowth.value < 0) {
      cons.push(`Revenue contraction of ${Math.abs(salesGrowth.value).toFixed(1)}% CAGR over ${salesGrowth.years} years.`);
    }
  }

  // Returns
  if (has(stock.roce)) {
    if (stock.roce >= 22) pros.push(`High capital efficiency: Return on Capital Employed (ROCE) of ${stock.roce.toFixed(1)}%.`);
    else if (stock.roce < 8) cons.push(`Low capital efficiency: ROCE stands at ${stock.roce.toFixed(1)}%.`);
  }
  if (has(stock.roe)) {
    if (stock.roe >= 18) pros.push(`Strong shareholder returns: Return on Equity (ROE) of ${stock.roe.toFixed(1)}%.`);
    else if (stock.roe < 8) cons.push(`Subdued shareholder returns: ROE stands at ${stock.roe.toFixed(1)}%.`);
  }

  // Valuation
  if (has(stock.pe_ratio) && has(stock.industry_pe)) {
    if (stock.pe_ratio < stock.industry_pe * 0.8) {
      pros.push(
        `Attractive valuation: trades at ${stock.pe_ratio.toFixed(1)}x P/E vs sector median of ${stock.industry_pe.toFixed(1)}x.`
      );
    } else if (stock.pe_ratio > stock.industry_pe * 1.5) {
      cons.push(
        `Premium valuation: trades at ${stock.pe_ratio.toFixed(1)}x P/E vs sector median of ${stock.industry_pe.toFixed(1)}x.`
      );
    }
  }
  if (has(stock.pb_ratio)) {
    if (stock.pb_ratio >= 6) cons.push(`Valuation elevated at ${stock.pb_ratio.toFixed(1)}x book value (P/B).`);
    else if (stock.pb_ratio <= 1.2) pros.push(`Trading at a conservative valuation of ${stock.pb_ratio.toFixed(2)}x book value.`);
  }
  if (has(stock.graham_number) && stock.current_price < stock.graham_number) {
    pros.push(`Current market price sits below its estimated Graham Number (₹${stock.graham_number.toFixed(0)}).`);
  }

  // Income
  if (has(stock.dividend_yield) && stock.dividend_yield >= 2.5 && stock.dividend_yield <= 8) {
    pros.push(`Attractive dividend yield of ${stock.dividend_yield.toFixed(2)}%.`);
  }

  // Cash
  if (has(stock.fcf_yield)) {
    if (stock.fcf_yield > 4) pros.push(`Strong free cash flow yield of ${stock.fcf_yield.toFixed(1)}%.`);
    else if (stock.fcf_yield < 0) cons.push(`Negative free cash flow in the trailing financial period.`);
  }

  // Ownership and quality
  if (has(stock.pledged_percentage) && stock.pledged_percentage > 5) {
    cons.push(`Encumbrance notice: ${stock.pledged_percentage.toFixed(1)}% of promoter holding is pledged.`);
  }
  if (has(stock.promoter_holding) && stock.promoter_holding > 55) {
    pros.push(`High promoter ownership of ${stock.promoter_holding.toFixed(1)}% indicating alignment.`);
  }
  if (has(stock.piotroski_score)) {
    if (stock.piotroski_score >= 8) pros.push(`Strong financial health: Piotroski F-Score of ${stock.piotroski_score}/9.`);
    else if (stock.piotroski_score <= 3) cons.push(`Weak fundamental score: Piotroski F-Score of ${stock.piotroski_score}/9.`);
  }
  if (has(stock.altman_z_score) && stock.altman_z_score < 1.81) {
    cons.push(`Credit risk indicator: Altman Z-Score of ${stock.altman_z_score.toFixed(2)} in distress territory.`);
  }

  // Price behaviour
  if (has(stock.distance_52w_high) && stock.distance_52w_high < -40) {
    cons.push(`Significant price drawdown: trading ${Math.abs(stock.distance_52w_high).toFixed(0)}% off its 52-week high.`);
  }

  return { pros, cons };
}
