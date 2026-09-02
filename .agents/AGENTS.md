# Workspace Rules for AI Agents

## Database Split/Join Handling
Due to GitHub's 50MB file size limit for repositories, the main SQLite database (data/screener.db) is NOT tracked directly in Git. Instead, it is chunked into 40MB parts (data/screener.db.part_*).

**CRITICAL INSTRUCTIONS FOR AI:**
1. If you need to run scanner.py or any backend Python script that requires the database locally, YOU MUST first run:
   `ash
   python db_split_join.py join
   `
2. If you modify the database structure or generate new data, and you plan to commit the changes, YOU MUST first run:
   `ash
   python db_split_join.py split
   `
3. NEVER commit data/screener.db directly. It should remain in .gitignore. Commit the data/screener.db.part_* files instead.

## Project Description
Filterer is a high-performance, open-source, free alternative to screener.in for Indian Equities (NSE/BSE).
It provides:
- Screener.in natural query syntax parser and formula evaluator (Market Cap > 500 AND ROCE > 15 AND Debt to equity < 1)
- 100+ fundamental, financial, growth, quality, and technical indicators
- Full company analysis pages (Quarterly, Annual P&L, Balance Sheet, Cash Flows, Shareholding, Peer Comparison, Interactive Charts, Algorithmic Pros & Cons)
- Instant client-side search/filter engine + Vercel Serverless API
- Python data pipelines and SQLite storage
