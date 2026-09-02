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
      pros.push('Carries essentially no debt.');
    } else if (stock.debt_to_equity < 0.3) {
      pros.push(`Lightly levered, with debt at ${stock.debt_to_equity.toFixed(2)}x equity.`);
    } else if (stock.debt_to_equity > 1.5) {
      cons.push(`Heavily levered, with debt at ${stock.debt_to_equity.toFixed(2)}x equity.`);
    }
  }

  if (has(stock.interest_coverage)) {
    if (stock.interest_coverage < 2.5) {
      cons.push(`Operating profit covers interest only ${stock.interest_coverage.toFixed(1)}x.`);
    } else if (stock.interest_coverage > 12) {
      pros.push(`Interest is covered ${stock.interest_coverage.toFixed(0)}x by operating profit.`);
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
      pros.push(`Profit has compounded at ${profitGrowth.value.toFixed(1)}% a year over ${profitGrowth.years} years.`);
    } else if (profitGrowth.value < 0) {
      cons.push(`Profit has shrunk ${Math.abs(profitGrowth.value).toFixed(1)}% a year over ${profitGrowth.years} years.`);
    } else if (profitGrowth.value < 5) {
      cons.push(`Profit growth has been slow at ${profitGrowth.value.toFixed(1)}% a year over ${profitGrowth.years} years.`);
    }
  }

  const salesGrowth = has(stock.sales_growth_5y)
    ? { years: 5, value: stock.sales_growth_5y }
    : has(stock.sales_growth_3y)
      ? { years: 3, value: stock.sales_growth_3y }
      : null;

  if (salesGrowth) {
    if (salesGrowth.value >= 15) {
      pros.push(`Sales have grown ${salesGrowth.value.toFixed(1)}% a year over ${salesGrowth.years} years.`);
    } else if (salesGrowth.value < 0) {
      cons.push(`Sales have contracted ${Math.abs(salesGrowth.value).toFixed(1)}% a year over ${salesGrowth.years} years.`);
    }
  }

  // Returns
  if (has(stock.roce)) {
    if (stock.roce >= 22) pros.push(`Earns ${stock.roce.toFixed(1)}% on the capital it employs.`);
    else if (stock.roce < 8) cons.push(`Returns only ${stock.roce.toFixed(1)}% on capital employed.`);
  }
  if (has(stock.roe)) {
    if (stock.roe >= 18) pros.push(`Return on equity of ${stock.roe.toFixed(1)}%.`);
    else if (stock.roe < 8) cons.push(`Return on equity is low at ${stock.roe.toFixed(1)}%.`);
  }

  // Valuation
  if (has(stock.pe_ratio) && has(stock.industry_pe)) {
    if (stock.pe_ratio < stock.industry_pe * 0.8) {
      pros.push(
        `Trades at ${stock.pe_ratio.toFixed(1)}x earnings against a sector median of ${stock.industry_pe.toFixed(1)}x.`
      );
    } else if (stock.pe_ratio > stock.industry_pe * 1.5) {
      cons.push(
        `Trades at ${stock.pe_ratio.toFixed(1)}x earnings, well above the ${stock.industry_pe.toFixed(1)}x sector median.`
      );
    }
  }
  if (has(stock.pb_ratio)) {
    if (stock.pb_ratio >= 6) cons.push(`Priced at ${stock.pb_ratio.toFixed(1)}x book value.`);
    else if (stock.pb_ratio <= 1.2) pros.push(`Available at ${stock.pb_ratio.toFixed(2)}x book value.`);
  }
  if (has(stock.graham_number) && stock.current_price < stock.graham_number) {
    pros.push(`Price sits below the Graham number of ₹${stock.graham_number.toFixed(0)}.`);
  }

  // Income
  if (has(stock.dividend_yield) && stock.dividend_yield >= 2.5 && stock.dividend_yield <= 8) {
    pros.push(`Pays a ${stock.dividend_yield.toFixed(2)}% dividend yield.`);
  }

  // Cash
  if (has(stock.fcf_yield)) {
    if (stock.fcf_yield > 4) pros.push(`Free cash flow yield of ${stock.fcf_yield.toFixed(1)}%.`);
    else if (stock.fcf_yield < 0) cons.push(`Free cash flow is negative at the current market value.`);
  }

  // Ownership and quality
  if (has(stock.pledged_percentage) && stock.pledged_percentage > 5) {
    cons.push(`${stock.pledged_percentage.toFixed(1)}% of the promoter holding is pledged.`);
  }
  if (has(stock.promoter_holding) && stock.promoter_holding > 55) {
    pros.push(`Promoters hold ${stock.promoter_holding.toFixed(1)}%.`);
  }
  if (has(stock.piotroski_score)) {
    if (stock.piotroski_score >= 8) pros.push(`Passes ${stock.piotroski_score} of the 9 Piotroski tests.`);
    else if (stock.piotroski_score <= 3) cons.push(`Passes only ${stock.piotroski_score} of the 9 Piotroski tests.`);
  }
  if (has(stock.altman_z_score) && stock.altman_z_score < 1.81) {
    cons.push(`Altman Z-score of ${stock.altman_z_score.toFixed(2)} is in the distress range.`);
  }

  // Price behaviour
  if (has(stock.distance_52w_high) && stock.distance_52w_high < -40) {
    cons.push(`Trading ${Math.abs(stock.distance_52w_high).toFixed(0)}% below its 52-week high.`);
  }

  return { pros, cons };
}
