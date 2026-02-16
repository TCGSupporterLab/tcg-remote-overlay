---
description: Synchronize kana readings by merging dictionaries, filtering entries, and enriching card data, then pushing to Git.
---

// turbo-all

1. Merge manual dictionary additions into the main dictionary.
```
node scripts/merge-dicts.js
```

2. Filter the dictionary to remove plain kana entries.
```
node scripts/filter-dict.js
```

3. Enrich the card data JSON with the latest kana readings.
```
node scripts/enrich-cards.js
```

4. Audit the results to ensure no missing readings for non-kana names.
```
node scripts/audit-missing-kana.js
```

5. Add changes to Git.
```
git add src/data/kana-dictionary.json src/data/hololive-cards.json scripts/merge-dicts.js
```

6. Commit and push the changes.
```
git commit -m "chore: sync and audit kana readings"
git push origin master
```
