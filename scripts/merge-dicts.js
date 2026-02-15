import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DICT_FILE = path.join(__dirname, '../src/data/kana-dictionary.json');

const MANUAL_ADDITIONS = {
    // Talents (Kanji/English)
    "星街すいせい": "ほしまちすいせい",
    "赤井はあと": "あかいはあと",
    "湊あくあ": "みなとあくあ",
    "紫咲シオン": "むらさきしおん",
    "百鬼あやめ": "なきりあやめ",
    "癒月ちょこ": "ゆづきちょこ",
    "大神ミオ": "おおかみみお",
    "不知火フレア": "しらぬいふれあ",
    "白銀ノエル": "しろがねのえる",
    "宝鐘マリン": "ほうしょうまりん",
    "天音かなた": "あまねかなた",
    "角巻わため": "つのまきわため",
    "常闇トワ": "とこやみトワ",
    "姫森ルーナ": "ひめもりるーな",
    "雪花ラミィ": "ゆきはならみぃ",
    "桃鈴ねね": "ももすずねね",
    "獅白ぼたん": "ししろぼたん",
    "沙花叉クロヱ": "さかまたくろえ",
    "風真いろは": "かざまいろは",
    "火威青": "ひおどしあお",
    "音乃瀬奏": "おとのせかなで",
    "一条莉々華": "いちじょうりりか",
    "轟はじめ": "とどろきはじめ",
    "儒烏風亭らでん": "じゅうふうていらでん",
    "響咲リオナ": "いさきりおな",
    "虎金妃笑虎": "こがねいにこ",
    "水宮枢": "みずみやすう",
    "輪堂千速": "りんどうちはや",
    "綺々羅々ヴィヴィ": "ききららゔぃゔぃ",
    "Ayunda Risu": "あゆんだりす",
    "Moona Hoshinova": "むーなほしのゔぁ",
    "Airani Iofifteen": "あいらにいおふぃふてぃーん",
    "Kureiji Ollie": "くれいじーおりー",
    "Anya Melfissa": "あーにゃめるふぃっさ",
    "Pavolia Reine": "ぱゔぉりあれいね",
    "Vestia Zeta": "ゔぇすてぃあぜーた",
    "Kaela Kovalskia": "かえらこゔぁるすきあ",
    "Kobo Kanaeru": "こぼかなえる",
    "Mori Calliope": "もりかりおぺ",
    "Takanashi Kiara": "たかなしきあら",
    "Ninomae Ina'nis": "にのまえいなにす",
    "Gawr Gura": "がうるぐら",
    "Watson Amelia": "わとそんあめりあ",
    "IRyS": "あいりす",
    "Ceres Fauna": "せれすふぁうな",
    "Ouro Kronii": "おーろくろにー",
    "Nanashi Mumei": "ななしむめい",
    "Hakos Baelz": "はこすべーるず",
    "Shiori Novella": "しおりのゔぇら",
    "Koseki Bijou": "こせきびじゅー",
    "Nerissa Ravencroft": "ねりっさらゔぇんくろふと",
    "Fuwawa Abyssgard": "ふわわあびすがーど",
    "Mococo Abyssgard": "もここあびすがーど",
    "FUWAMOCO": "ふわもこ",
    "Elizabeth Rose Bloodflame": "えりざべすろーずぶらっどふれいむ",
    "Gigi Murin": "じじむりん",
    "Cecilia Immergreen": "せしりあいまーぐりーん",
    "Raora Panthera": "らおーらぱんてーら",

    // Specific Proper Nouns / Mascots (often in card names)
    "あん肝": "あんきも",
    "金時": "きんとき",
    "羅刹": "らせつ",
    "泥棒建設": "どろぼうけんせつ",
    "不知火建設": "しらぬいけんせつ",
    "兎田建設": "うさだけんせつ",
    "あくきん建設": "あくきんけんせつ",
    "湊建設": "みなとけんせつ",
    "かなた建設": "かなたけんせつ",
    "作業用パソコン": "さぎょうようぱそこん",
    "古代武器": "こだいぶき",
    "鍛冶ハンマー": "かじはんまー",
    "鬼神刀": "きしんとう",
    "爆発の魔法": "ばくはつのまほう",
    "石の斧": "いしのおの"
};

function mergeDictionaries() {
    // We overwrite with manual additions to ensure they are the clean source of truth
    const sortedDict = {};
    Object.keys(MANUAL_ADDITIONS).sort().forEach(key => {
        sortedDict[key] = MANUAL_ADDITIONS[key];
    });

    fs.writeFileSync(DICT_FILE, JSON.stringify(sortedDict, null, 2));
    console.log(`Clean dictionary created with ${Object.keys(sortedDict).length} entries.`);
}

mergeDictionaries();
