# Task: Enhance Hololive Card Data Scraping

- [x] Create Implementation Plan and get approval
- [x] Update `fetch-hololive-data.js` to include detailed text scraping logic
    - [x] Add `cleanText` helper for newline unification
    - [x] Update `parseCardsFromPage` to extract `oshiSkills`
    - [x] Update `parseCardsFromPage` to extract `arts` (including costs, damage, tokkou)
    - [x] Update `parseCardsFromPage` to extract `keywords` (Gift/Bloom/Collab)
    - [x] Update `parseCardsFromPage` to extract `abilityText` and `limited` status
    - [x] Update `parseCardsFromPage` to extract `extra` text
- [x] Verify the updated scraper in development mode
    - [x] Run `DEV=true node scripts/fetch-hololive-data.js`
    - [x] Compare `hololive-cards.json` with expected structure (1,777 cards)
- [x] Verify the updated scraper in production mode (DEV=false)
    - [x] Run `node scripts/fetch-hololive-data.js`
    - [x] Compare data with developer-mode results
- [x] Create walkthrough documentation

## Overlay Card Text Display Implementation
- [x] Planning & UI Design
- [x] Extend `useCardSearch.ts` with display mode state
- [x] Create `DisplayModeBadge.tsx` component
- [x] Update `CardSearchContainer.tsx` with new badge
- [x] Implement text renderer in `HololiveTools.tsx`
- [x] Verification on overlay screen

