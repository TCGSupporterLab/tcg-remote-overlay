import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_FILE = path.join(__dirname, '../src/data/hololive-cards.json');
const DICT_FILE = path.join(__dirname, '../src/data/kana-dictionary.json');

// 1. Load Data
const cards = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
let dict = JSON.parse(fs.readFileSync(DICT_FILE, 'utf-8'));

// 2. Identify all possible keywords that aren't in the dict yet
const allWords = new Set();
cards.forEach(card => {
    const text = [card.name, card.tags, card.expansion, card.cardType].filter(Boolean).join(' ');
    // Split by common delimiters
    const words = text.split(/[\s/#［］【】()（）「」『』!！?？:：&＆・,、。.]+/);
    words.forEach(w => {
        const clean = w.trim();
        if (clean.length > 1) allWords.add(clean);
    });
});

// 3. Find missing keywords (especially Kanji/English/Number ones)
const isKanaOnly = (str) => /^[\u3040-\u309F\u30A0-\u30FFー・\s0-9]+$/.test(str);
const missingKeywords = [...allWords].filter(w => !dict[w] && !isKanaOnly(w));

console.log(`Total unique words found in cards: ${allWords.size}`);
console.log(`Keywords already in dict: ${Object.keys(dict).length}`);
console.log(`Potentially missing keywords (non-kana): ${missingKeywords.length}`);

// 4. Manual Map of highly frequent or obvious missing ones spotted in previous steps
const extraMap = {
    "1st Anniversary Celebration Set": "ふぁーすとあにばーさりーせれぶれーしょんせっと",
    "オフィシャルホロカコレクション-PCセット-": "おふぃしゃるほろかこれくしょんぴーしーせっと",
    "イベント物販／hololive": "いべんとぶっぱんほろらいぶ",
    "SHOP限定商品": "しょっぷげんていしょうひん",
    "SorAZセレブレーション": "そらあずせれぶれーしょん",
    "ホロライブ4期生": "ほろらいぶよんきせい",
    "ホロライブ0期生": "ほろらいぶぜろきせい",
    "ホロライブ1期生": "ほろらいぶいっきせい",
    "ホロライブ2期生": "ほろらいぶにきせい",
    "爆発の魔法": "ばくはつのまほう",
    "鬼神刀": "きしんとう",
    "鍛冶ハンマー": "かじはんまー",
    "古代武器": "こだいぶき",
    "作業用パソコン": "さぎょうようぱそこん",
    "雪民": "ゆきみん",
    "SSRB": "えすえすあーるびー",
    "SSRBボム": "えすえすあーるびーぼむ",
    "ホロライブ言えるかな": "ほろらいぶいえるかな",
    "晩酌配信": "ばんしゃくはいしん",
    "限界飯": "げんかいめし",
    "牛丼": "ぎゅうどん",
    "阿修羅": "あしゅら",
    "凸待ち": "とつまち",
    "じゃあ敵だね": "じゃあてきだね",
    "石の斧": "いしのおの",
    "座員": "ざいん",
    "み俺恥": "みおれはじ",
    "山田ルイ54世": "やまだるいごじゅうよんせい",
    "2人あわせてラムダック": "ふたりあわせてらむだっく",
    "AIこより": "あいこより",
    "愛情いっぱい召し上がれ♪": "あいじょういっぱいめしあがれ",
    "緑の試験管": "みどりのしけんかん",
    "赤エール": "あかえーる",
    "青エール": "あおえーる",
    "白エール": "しろえーる",
    "緑エール": "みどりえーる",
    "紫エール": "むらさきえーる",
    "黄エール": "きえーる",
    "無色エール": "むしょくえーる",
    "ホロライブプロダクション": "ほろらいぶぷろだくしょん",
    "hololive production": "ほろらいぶぷろだくしょん"
};

// Merge everything
Object.assign(dict, extraMap);

// Re-sort
const sorted = {};
Object.keys(dict).sort().forEach(k => sorted[k] = dict[k]);

fs.writeFileSync(DICT_FILE, JSON.stringify(sorted, null, 2));
console.log('✅ Dictionary restored and expanded.');
