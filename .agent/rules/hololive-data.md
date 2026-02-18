# Hololive Data Development Rule

## Context
When modifying scripts or logic that affect `hololive-cards.json`, it is crucial to minimize requests to the official website and ensure data integrity.

## Rule
- ALWAYS use Development Mode (`DEV=true`) when testing modifications to data extraction logic.
- Utilize local HTML caches located in `scripts/cache/hololive/` to verify parsing results.
- Do not perform full official site fetches until the logic is confirmed to produce the expected JSON structure (correct count, order, and fields).

## Commands
- **PowerShell**: `$env:DEV="true"; node scripts/fetch-hololive-data.js`
- **CMD**: `set DEV=true&& node scripts/fetch-hololive-data.js`
