# 繝ｪ繝悶Λ繝ｳ繝・ぅ繝ｳ繧ｰ螳溯｣・ｨ育判譖ｸ: TCG Remote Overlay

## 1. 讎りｦ・
- **逶ｮ逧・*: 蝠・ｨ吶Μ繧ｹ繧ｯ・・emote Duel・峨・蝗樣∩縲√♀繧医・豎守畑逧・↑TCG謾ｯ謠ｴ繝・・繝ｫ縺ｨ縺励※縺ｮ繝ｪ繝悶Λ繝ｳ繝・ぅ繝ｳ繧ｰ縲・
- **譁ｰ蜷咲ｧｰ**: `TCG Remote Overlay`
- **譁ｰ邨・ｹ泌錐**: `TCGSupporterLab`
- **繝ｪ繝昴ず繝医Μ蜷・*: `tcg-remote-overlay`

## 2. 螟画峩蜀・ｮｹ

### A. 陦ｨ遉ｺ蜷咲ｧｰ縺ｮ螟画峩
- `Remote Duel Tool` -> `TCG Remote Overlay`
- `Remote Duel Overlay` -> `TCG Remote Overlay`

### B. 蜀・Κ隴伜挨蟄舌・螟画峩 (蜷梧悄繝ｻ菫晏ｭ・
蜷梧悄縺ｮ陦晉ｪ√ｒ驕ｿ縺代√け繝ｪ繝ｼ繝ｳ縺ｪ迺ｰ蠅・↓遘ｻ陦後☆繧九◆繧√∵磁鬆ｭ霎槭ｒ螟画峩縺吶ｋ縲・
- `remote_duel_sync` -> `tcg_remote_sync`
- `remote_duel_sync_yugioh` -> `tcg_remote_sync_yugioh`
- `remote_duel_*` (localStorage) -> `tcg_remote_*`
  - 窶ｻ 遘ｻ陦後ｒ繧ｹ繝繝ｼ繧ｺ縺ｫ縺吶ｋ縺溘ａ縲∝商縺・く繝ｼ縺後≠繧句ｴ蜷医・繝輔か繝ｼ繝ｫ繝舌ャ繧ｯ縺ｨ縺励※隱ｭ縺ｿ霎ｼ繧蜃ｦ逅・ｒ霑ｽ蜉縲・

### C. 繝励Ο繧ｸ繧ｧ繧ｯ繝郁ｨｭ螳壹・螟画峩
- `package.json`: `name` 繧・`tcg-remote-overlay` 縺ｫ螟画峩縲・
- `vite.config.ts`: `base` 繧・`/tcg-remote-overlay/` 縺ｫ螟画峩・・itHub Pages逕ｨ・峨・
- `index.html`: 繧ｿ繧､繝医Ν繧ｿ繧ｰ繧呈峩譁ｰ縲・

### D. 繝峨く繝･繝｡繝ｳ繝医・譖ｴ譁ｰ
- `README.md`: 繧ｿ繧､繝医Ν縲√け繝ｭ繝ｼ繝ｳ逕ｨURL縲∬ｪｬ譏取枚繧呈峩譁ｰ縲・
- `docs/system_specifications/`: 蜈ｨ菴薙・蜷咲ｧｰ繧呈峩譁ｰ縲・

## 3. 霑ｽ蜉菴懈･ｭ (繝ｦ繝ｼ繧ｶ繝ｼ蛛ｴ)
莉･荳九・謇矩・・GitHub荳翫〒縺ｮ謫堺ｽ懊′蠢・ｦ√↑縺溘ａ縲√Θ繝ｼ繧ｶ繝ｼ縺ｫ萓晞ｼ縺吶ｋ縲・
1. GitHub Organization 縺ｮ蜷咲ｧｰ螟画峩 (`RemoteDuelDev` -> `TCGSupporterLab`)
2. 繝ｪ繝昴ず繝医Μ蜷阪・螟画峩 (`tcg-remote-overlay` -> `tcg-remote-overlay`)
3. 繝ｭ繝ｼ繧ｫ繝ｫ縺ｮ `git remote` 縺ｮ譖ｴ譁ｰ:
   ```bash
   git remote set-url origin https://github.com/TCGSupporterLab/tcg-remote-overlay.git
   ```


