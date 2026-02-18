# Task: Extract and Display Baton Touch Data

- [x] Create Implementation Plan and get approval
- [x] Update `fetch-hololive-data.js` to extract `batonTouch` data
    - [x] Update `parseCardsFromPage` logic
    - [x] Update AJAX response parsing logic
- [x] Verify data extraction in DEV mode
    - [x] Run `DEV=true node scripts/fetch-hololive-data.js`
    - [x] Check `hololive-cards.json` for new `batonTouch` field
- [x] Update `HololiveTools.tsx` to display Baton Touch icon/text
    - [x] Fix TypeScript lint errors by updating `Card` interface in `useCardSearch.ts`
    - [x] Ensure Baton Touch is shown for Holomen/Buzz even if value is empty
- [x] Adjust dice positioning to be at the edge of the card frame
- [x] Create walkthrough documentation
