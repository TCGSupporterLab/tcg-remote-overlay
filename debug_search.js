const normalizeText = (text) => text.normalize('NFKC').toLowerCase().replace(/[ぁ-ん]/g, s => String.fromCharCode(s.charCodeAt(0) + 0x60)).trim();
const toHiragana = (text) => text.replace(/[ァ-ン]/g, s => String.fromCharCode(s.charCodeAt(0) - 0x60));

const stripSymbols = (text) => text.replace(/[・ー\s\-\!\?]/g, '');

function test(name, keyword) {
    const normName = normalizeText(name);
    const hiraName = toHiragana(normName);
    const normKeyword = normalizeText(keyword);
    const hiraKeyword = toHiragana(normKeyword);

    const sName = stripSymbols(normName);
    const sHiraName = stripSymbols(hiraName);
    const sKeyword = stripSymbols(normKeyword);

    const matchRaw = normName.includes(normKeyword) || hiraName.includes(hiraKeyword);
    const matchStripped = sName.includes(sKeyword) || sHiraName.includes(sKeyword);

    console.log(`Search "${keyword}" in "${name}":`);
    console.log(`  Raw match: ${matchRaw}`);
    console.log(`  Stripped match: ${matchStripped} (Name: ${sName}, Keyword: ${sKeyword})`);
}

test('ジジ・ムリン', 'じむ');
test('エリザベス・ローズ・ブラッドフレイム', 'すろ');
test('エリザベス・ローズ・ブラッドフレイム', 'ずぶ');
