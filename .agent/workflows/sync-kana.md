---
description: Synchronize kana readings by merging dictionaries, filtering entries, and enriching card data, then pushing to Git.
---

// turbo-all

1. Merge manual dictionary additions into the main dictionary.
```
node tools/merge-dicts.js
```

2. Filter the dictionary to remove plain kana entries (cleaning up).
```
node tools/filter-dict.js
```

3. Enrich the card data JSON from script scraping with the latest kana readings.
```
node tools/enrich-cards.js
```

4. Audit the results to see if any Kanji/English names are still missing readings.
```
node tools/find-missing-kana.js
```

5. Regenerate the final metadata for the app.
```
node tools/generate-metadata.js
```

6. Commit changes to the local backup branch.
```
git checkout local-dev-tools
git add tools/cache/ working-cards.json tools/cache/kana-dictionary.json tools/merge-dicts.js
git commit -m "chore: sync and audit kana readings (local update)"
git checkout master
```
