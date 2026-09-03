/**
 * Split the dataset into the two tiers the architecture assumes.
 *
 * Everything used to live in src/data/stocksData.ts, which meant the entry
 * bundle carried 2.5 MB of ten-year statements and daily price history so that
 * the front page could sort a table on market cap. Price history alone was
 * 2 MB of it.
 *
 *   screening tier  src/data/stocksData.ts    ~0.14 MB, bundled
 *   detail tier     public/data/stocks/*.json  fetched when a page is opened
 *
 * Run with:  node scripts/split_dataset.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA_FILE = path.join(ROOT, 'src', 'data', 'stocksData.ts');
const DETAIL_DIR = path.join(ROOT, 'public', 'data', 'stocks');

/** Fields the screener never reads, moved out of the bundle. */
const DETAIL_FIELDS = [
  // Prose and links only the company page renders. `about` alone was 23% of
  // the screening tier: 243 KB shipped on first paint so a table could sort
  // on market cap.
  'about',
  'website',
  'quarterly_results',
  'annual_pnl',
  'balance_sheet',
  'cash_flow',
  'shareholding_history',
  'shareholding_source',
  'ratios_history',
  'historical_prices',
  'peers',
];

/**
 * A filesystem- and URL-safe name. Symbols like M&M cannot be used raw: the
 * old code fetched /data/stocks/M&M.json against a file named M%26M.json, so
 * that company's statements never loaded at all.
 */
export function detailSlug(symbol) {
  return symbol.toUpperCase().replace(/[^A-Z0-9]+/g, '_');
}

const source = fs.readFileSync(DATA_FILE, 'utf8');
const header = source.slice(0, source.indexOf('export const STOCKS_DATA'));
const universe = JSON.parse(
  source.replace(/^[\s\S]*?export const STOCKS_DATA: Stock\[\] = /, '').replace(/;\s*$/, '')
);

fs.mkdirSync(DETAIL_DIR, { recursive: true });

// Clear out the previous generation, including any stale %-encoded names.
for (const file of fs.readdirSync(DETAIL_DIR)) {
  if (file.endsWith('.json')) {
    try {
      fs.unlinkSync(path.join(DETAIL_DIR, file));
    } catch {
      // Ignore if file is momentarily locked on Windows; it will be overwritten below
    }
  }
}

const lean = [];
let detailBytes = 0;

for (const stock of universe) {
  const detail = { symbol: stock.symbol };
  const screening = { ...stock };

  for (const field of DETAIL_FIELDS) {
    if (stock[field] !== undefined) detail[field] = stock[field];
    delete screening[field];
  }

  const json = JSON.stringify(detail);
  detailBytes += json.length;
  fs.writeFileSync(path.join(DETAIL_DIR, `${detailSlug(stock.symbol)}.json`), json, 'utf8');

  lean.push(screening);
}

const leanJson = JSON.stringify(lean, null, 2);
fs.writeFileSync(DATA_FILE, `${header}export const STOCKS_DATA: Stock[] = ${leanJson};\n`, 'utf8');

const mb = (n) => `${(n / 1e6).toFixed(2)} MB`;
console.log(`Companies:      ${universe.length}`);
console.log(`Screening tier: ${mb(leanJson.length)}  (bundled)`);
console.log(`Detail tier:    ${mb(detailBytes)}  across ${universe.length} files in public/data/stocks/`);
