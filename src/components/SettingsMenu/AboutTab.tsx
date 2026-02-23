export const AboutTab = () => (
    <div className="space-y-[16px] text-center py-[8px]">
        <h1 className="text-2xl font-black mb-[4px] tracking-tighter">TCG Remote Overlay</h1>
        <p className="text-sm text-gray-400 mb-[16px] border-b border-white/10 pb-[12px]">
            Version 2.0 (Next-Gen)
        </p>

        <div className="text-xs text-gray-300 space-y-[8px] text-left p-[16px] bg-white/5 rounded-xl border border-white/10">
            <h4 className="font-bold text-base text-white mb-[4px]">免責事項</h4>
            <ul className="list-disc list-inside opacity-80 leading-relaxed">
                <li>非公式オーバーレイツールです。</li>
                <li>アセットはユーザーのローカルPCからのみ読み込まれます。</li>
                <li>開発者は一切の責任を負いません。</li>
            </ul>
        </div>

        <div className="pt-[16px]">
            <a
                href="https://www.amazon.jp/hz/wishlist/ls/2GICU7N55Z5Y7?ref_=wl_share"
                target="_blank"
                rel="noreferrer"
                className="inline-block bg-[#FF9900]/20 text-[#FF9900] border border-[#FF9900]/50 hover:bg-[#FF9900]/30 px-[16px] py-[8px] rounded-full font-bold text-base transition-all shadow-lg"
            >
                応援する (Amazon)
            </a>
        </div>
    </div>
);
