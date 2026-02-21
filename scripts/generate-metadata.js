import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Input and Output paths
const inputPath = path.join(__dirname, '../src/data/hololive-cards.json');
const outputPath = path.join(__dirname, '../public/images/cardlist/hololive/metadata.json');

function generateMetadata() {
    try {
        console.log(`Reading cards from: ${inputPath}`);
        const data = fs.readFileSync(inputPath, 'utf8');
        const cards = JSON.parse(data);

        const metadata = {};

        // Define order for tabs and items
        metadata["__order"] = {
            "色": ["白", "緑", "赤", "青", "紫", "黄", "無", "多色"],
            "タイプ": ["推しホロメン", "ホロメン", "Buzzホロメン", "サポート", "ファン", "マスコット", "ツール", "アイテム", "イベント", "スタッフ", "LIMITED", "エール"],
            "Bloom": ["Debut", "1st", "2nd", "Spot"]
        };

        const standardColors = ["白", "緑", "赤", "青", "紫", "黄", "無"];

        cards.forEach(card => {
            if (!card.imageUrl) return;

            const filename = path.basename(card.imageUrl);

            // 1. Process Type
            let types = [];
            if (card.cardType) {
                types = card.cardType.split('・').map(t => t.trim()).filter(Boolean);
            }

            // 2. Process Bloom
            let blooms = [];
            if (card.bloomLevel) {
                blooms = [card.bloomLevel];
            }

            // 3. Process Color
            let colors = [];
            const rawColor = card.color === "◇" ? "無" : (card.color || "");

            if (rawColor) {
                // Split multi-colors (e.g. "白緑" -> ["白", "緑"])
                standardColors.forEach(c => {
                    if (rawColor.includes(c)) {
                        colors.push(c);
                    }
                });

                // If it contains "multi" or specifically marked as multi in raw
                if (rawColor.includes("multi") || colors.length >= 2) {
                    if (!colors.includes("多色")) colors.push("多色");
                }

                // If it's empty after standard check but had rawColor, just push rawColor
                if (colors.length === 0 && rawColor) {
                    colors.push(rawColor);
                }
            }

            metadata[filename] = {
                "name": card.name,
                "タイプ": types,
                "Bloom": blooms,
                "色": colors,
                "yomi": card.kana || ""
            };
        });

        console.log(`Writing metadata to: ${outputPath}`);
        fs.writeFileSync(outputPath, JSON.stringify(metadata, null, 2), 'utf8');

        const count = Object.keys(metadata).length;
        console.log(`Successfully generated metadata for ${count} cards.`);

    } catch (error) {
        console.error('Error generating metadata:', error);
        process.exit(1);
    }
}

generateMetadata();
