export const AboutTab = () => (
    <div className="space-y-[16px] text-center py-[8px]">
        <h1 className="text-2xl font-black mb-[16px] tracking-tighter border-b border-white/10 pb-[12px]">TCG Remote Overlay</h1>

        <div className="text-xs text-gray-300 space-y-[8px] text-left p-[16px] bg-white/5 rounded-xl border border-white/10">
            <h4 className="font-bold text-base text-white mb-[4px]">免責事項</h4>
            <ul className="list-disc list-inside opacity-80 leading-relaxed">
                <li>本ツールは非公式のファンコンテンツであり、著作権者とは一切関係ありません。</li>
                <li>TCGの対戦動画・配信における演出補助を目的としています。</li>
                <li>画像等のアセットはユーザー自身のローカルPCからのみ読み込まれ、サーバーへのアップロード等は行われません。</li>
                <li>本ツールの使用によって生じた損害、トラブル等について、開発者は一切の責任を負いません。</li>
                <li>仕様は予告なく変更される場合があります。</li>
            </ul>
        </div>

        <div className="pt-[16px]">
            <a
                href="https://www.amazon.jp/hz/wishlist/ls/1LZ0P92DUY9ZU?ref_=wl_share"
                target="_blank"
                rel="noreferrer"
                className="inline-block bg-[#FF9900]/20 text-[#FF9900] border border-[#FF9900]/50 hover:bg-[#FF9900]/30 px-[16px] py-[8px] rounded-full font-bold text-base transition-all shadow-lg"
            >
                応援する (Amazon)
            </a>
        </div>
    </div>
);
