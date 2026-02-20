# Walkthrough: 繝ｪ繝悶Λ繝ｳ繝・ぅ繝ｳ繧ｰ (TCG Remote Overlay)

## 螳滓命縺輔ｌ縺溷､画峩

### 1. 繧ｳ繝ｼ繝峨・繝ｼ繧ｹ縺ｮ鄂ｮ謠・
- `App.tsx`: 繝峨く繝･繝｡繝ｳ繝医ち繧､繝医Ν縲√・繝・ム繝ｼ縲〕ocalStorage繧ｭ繝ｼ縲。roadcastChannel蜷阪ｒ譖ｴ譁ｰ縲・
- `useSharedState.ts`, `useCardSearch.ts`, `YugiohTools.tsx`, `OverlayWidget.tsx`: 蜷梧悄逕ｨ繝√Ε繝ｳ繝阪Ν蜷阪ｒ荳蠕・`tcg_remote_sync(_yugioh)` 縺ｫ螟画峩縲・
- `localStorage` 縺ｮ繝槭う繧ｰ繝ｬ繝ｼ繧ｷ繝ｧ繝ｳ: 譁ｰ縺励＞繧ｭ繝ｼ (`tcg_remote_`) 縺後↑縺・ｴ蜷医〒繧ゅ∽ｻ･蜑阪・繧ｭ繝ｼ (`remote_duel_`) 縺九ｉ繝・・繧ｿ繧貞ｼ輔″邯吶￡繧九ｈ縺・ヵ繧ｩ繝ｼ繝ｫ繝舌ャ繧ｯ蜃ｦ逅・ｒ螳溯｣・＠縺ｾ縺励◆縲・

### 2. 繝励Ο繧ｸ繧ｧ繧ｯ繝郁ｨｭ螳壹・譖ｴ譁ｰ
- `package.json`: 蜷榊燕縺ｫ `tcg-remote-overlay` 繧定ｨｭ螳壹・
- `vite.config.ts`: GitHub Pages逕ｨ縺ｮ繝吶・繧ｹ繝代せ繧・`/tcg-remote-overlay/` 縺ｫ譖ｴ譁ｰ縲・
- `index.html`: 蛻晄悄隱ｭ縺ｿ霎ｼ縺ｿ譎ゅ・繧ｿ繧､繝医Ν繧剃ｿｮ豁｣縲・

### 3. 繝峨く繝･繝｡繝ｳ繝医・謨ｴ蛯・
- `README.md`: 譁ｰ繝ｪ繝昴ず繝医ΜURL縺ｨ蜷咲ｧｰ繧貞渚譏縲・
- 莉墓ｧ俶嶌 (`docs/system_specifications/`): 縺吶∋縺ｦ縺ｮ縲軍emoteDuelTool縲阪→縺・≧蜻ｼ遘ｰ繧偵卦CG Remote Overlay縲阪∈邨ｱ荳縲・

## 谺｡縺ｮ繧ｹ繝・ャ繝・(GitHub謫堺ｽ・

繧ｳ繝ｼ繝牙・縺ｮ貅門ｙ縺ｯ螳御ｺ・＠縺ｾ縺励◆縲ゆｻ･荳九・鬆・ｺ上〒GitHub蛛ｴ縺ｮ險ｭ螳壼､画峩繧偵♀鬘倥＞縺励∪縺吶・

1. **GitHub邨・ｹ泌錐縺ｮ螟画峩**:
   - `github.com/RemoteDuelDev` 縺ｫ繧｢繧ｯ繧ｻ繧ｹ -> Settings -> Organization Name 繧・`TCGSupporterLab` 縺ｫ螟画峩縲・
2. **繝ｪ繝昴ず繝医Μ蜷阪・螟画峩**:
   - 繝ｪ繝昴ず繝医Μ縺ｮ Settings -> Repository Name 繧・`tcg-remote-overlay` 縺ｫ螟画峩縲・
3. **繝ｭ繝ｼ繧ｫ繝ｫ縺ｸ縺ｮ蜿肴丐**:
   - 莉･荳九・繧ｳ繝槭Φ繝峨ｒ螳溯｡後＠縺ｦ縲√Ο繝ｼ繧ｫ繝ｫ縺ｮGit縺梧眠URL繧貞髄縺上ｈ縺・↓縺励※縺上□縺輔＞縲・
     ```bash
     git remote set-url origin https://github.com/TCGSupporterLab/tcg-remote-overlay.git
     ```

縺薙ｌ縺ｫ繧医ｊ縲∝膚讓吝撫鬘後ｒ蝗樣∩縺励▽縺､縲√ｈ繧雁ｺ・＞豢ｻ蜍輔′縺ｧ縺阪ｋ迺ｰ蠅・′謨ｴ縺・∪縺吶・

