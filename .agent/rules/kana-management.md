# Kana Dictionary Management Rule

## Context
The project uses `src/data/kana-dictionary.json` to generate searchable hiragana readings for cards. This dictionary is managed via a synchronization script.

## Rule
- DO NOT edit `src/data/kana-dictionary.json` directly.
- TO ADD NEW READINGS:
  1. Add the entries to the `MANUAL_ADDITIONS` constant in `scripts/merge-dicts.js`.
  2. Run the sync command: `node scripts/merge-dicts.js`.
- AFTER UPDATING DICTIONARY:
  1. Always run `node scripts/enrich-cards.js` to apply changes to `hololive-cards.json`.
  2. Verify that the search functionality (hiragana search) works as expected.

## Related Command
Use the slash command `/sync-kana` if available (defined in workflows).
