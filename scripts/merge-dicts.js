import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ANALYSIS_FILE = path.join(__dirname, 'keyword-analysis.json');
const DICT_FILE = path.join(__dirname, '../src/data/kana-dictionary.json');

const MANUAL_ADDITIONS = {
    // Generations
    "0期生": "ぜろきせい",
    "1期生": "いっきせい",
    "2期生": "にきせい",
    "3期生": "さんきせい",
    "4期生": "よんきせい",
    "5期生": "ごきせい",
    "6期生": "ろっきせい",
    "ID1期生": "あいでぃーいっきせい",
    "ID2期生": "あいでぃーにきせい",
    "ID3期生": "あいでぃーさんきせい",

    // Units/Groups
    "秘密結社holoX": "ひみつけっしゃほろっくす",
    "Advent": "あどべんと",
    "Justice": "じゃすてぃす",
    "ReGLOSS": "りぐろす",
    "FLOW GLOW": "ふろーぐろう",
    "Myth": "みす",
    "Promise": "ぷろみす",
    "SorAZ": "そらあず",
    "miComet": "みこめっと",
    "あやふぶみ": "あやふぶみ",
    "しらけん": "しらけん",
    "不知火建設": "しらぬいけんせつ",
    "兎田建設": "うさだけんせつ",
    "あくきん建設": "あくきんけんせつ",
    "泥棒建設": "どろぼうけんせつ",
    "湊建設": "みなとけんせつ",
    "かなた建設": "かなたけんせつ",
    "ホロ鳥": "ほろとり",
    "いろはにほへっと": "いろはにほへっと",
    "UMISEA": "うみしー",
    "バカタレ共": "ばかたれども",

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

    // Terms from Analysis
    "アヤカシヴァーミリオン": "あやかしゔぁーみりおん",
    "エントリーカップ": "えんとりーかっぷ",
    "エリートスパーク": "えりーとすぱーく",
    "キュリアスユニバース": "きゅりあすゆにばーす",
    "クインテットスペクトラム": "くいんてっとすぺくとらむ",
    "エンチャントレガリア": "えんちゃんとれがリア",
    "ブルーミングレディアンス": "ぶるーみんぐれでぃあんす",

    // Mascots/Fans
    "35P": "みこぴー",
    "Bloop": "ぶるーぷ",
    "Brats": "ぶらっつ",
    "Bubba": "ばば",
    "Chumbuds": "ちゅむばっど",
    "Dead Beats": "でっどびーつ",
    "Death-sensei": "ですせんせい",
    "Hoomans": "ふーまん",
    "Ioforia": "いおふぉりあ",
    "Jailbird": "じぇいるばーど",
    "Kotori": "ことり",
    "Kronies": "くろにー",
    "Melfriends": "めるふれんど",
    "Merakyat": "めらきゃっと",
    "Moonafic": "むーなふぃっく",
    "Novelites": "のゔぇらいと",
    "Pebbles": "ぺぶる",
    "Risuners": "りすなー",
    "Ruffians": "らふぃあんず",
    "RyStocrats": "りすとくらっつ",
    "SSRB": "えすえすあーるびー",
    "SSRBボム": "えすえすあーるびーぼむ",
    "Saplings": "さぷりんぐ",
    "Takodachi": "たこだち",
    "Teamates": "ちーめいてぃ",
    "Yorick": "よりっく",
    "Zecretary": "ぜくれたりー",
    "Zomrade": "ぞむれいど",
    "あくあクルー": "あくあくるー",
    "あん肝": "あんきも",
    "一味": "いちみ",
    "エルフレンド": "えるふれんど",
    "おにぎりゃー": "おにぎりゃー",
    "開拓者": "かいたくしゃ",
    "眷属": "けんぞく",
    "ころねすきー": "ころねすきー",
    "座員": "ざいん",
    "塩っ子": "しおっこ",
    "すこん部": "すこんぶ",
    "スバルドダック": "すばるどだっく",
    "だいふく": "だいふく",
    "だるま": "だるま",
    "野うさぎ": "のうさぎ",
    "一味": "いちみ",
    "百鬼組": "なきりぐみ",
    "星詠み": "ほしよみ",
    "ぽよ余": "ぽよよ",
    "金時": "きんとき",
    "雪民": "ゆきみん",
    "羅刹": "らせつ"
};

function mergeDictionaries() {
    let finalDict = { ...MANUAL_ADDITIONS };

    // Also look at everything we had in current dict
    if (fs.existsSync(DICT_FILE)) {
        const current = JSON.parse(fs.readFileSync(DICT_FILE, 'utf-8'));
        Object.assign(finalDict, current);
    }

    // Sort keys alphabetically for neatness
    const sortedDict = {};
    Object.keys(finalDict).sort().forEach(key => {
        sortedDict[key] = finalDict[key];
    });

    fs.writeFileSync(DICT_FILE, JSON.stringify(sortedDict, null, 2));
    console.log(`Merged dictionary created with ${Object.keys(sortedDict).length} entries.`);
}

mergeDictionaries();
