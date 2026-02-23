import { Layers, Monitor } from 'lucide-react';

type GameMode = 'yugioh' | 'hololive' | 'none';
type ObsMode = 'normal' | 'green';

interface GeneralTabProps {
    gameMode: GameMode;
    onGameModeChange: (mode: GameMode) => void;
    obsMode: ObsMode;
    onObsModeChange: (mode: ObsMode) => void;
}

export const GeneralTab = ({
    gameMode,
    onGameModeChange,
    obsMode,
    onObsModeChange
}: GeneralTabProps) => (
    <div className="space-y-[24px]">
        <section className="space-y-[8px]">
            <h3 className="text-lg font-bold mb-[8px] flex items-center gap-[6px] border-b border-white/10 pb-[8px]">
                <Layers size={18} className="text-secondary" />
                ゲームモード
            </h3>
            <div className="flex gap-[8px]">
                <button
                    className={`flex-1 py-[8px] px-[12px] rounded-lg font-bold transition-all text-sm ${gameMode === 'none'
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'bg-white/5 text-gray-400 hover:bg-white/10'
                        }`}
                    onClick={() => onGameModeChange('none')}
                >
                    なし
                </button>
                <button
                    className={`flex-1 py-[8px] px-[12px] rounded-lg font-bold transition-all text-sm ${gameMode === 'yugioh'
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'bg-white/5 text-gray-400 hover:bg-white/10'
                        }`}
                    onClick={() => onGameModeChange('yugioh')}
                >
                    遊戯王
                </button>
                <button
                    className={`flex-1 py-[8px] px-[12px] rounded-lg font-bold transition-all text-sm ${gameMode === 'hololive'
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'bg-white/5 text-gray-400 hover:bg-white/10'
                        }`}
                    onClick={() => onGameModeChange('hololive')}
                >
                    ホロカ
                </button>
            </div>
        </section>

        <section className="space-y-[8px]">
            <h3 className="text-lg font-bold mb-[8px] flex items-center gap-[6px] border-b border-white/10 pb-[8px]">
                <Monitor size={18} className="text-secondary" />
                背景色
            </h3>
            <div className="flex gap-[8px]">
                <button
                    className={`flex-1 py-[8px] px-[12px] rounded-lg font-bold transition-all text-sm ${obsMode === 'normal'
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'bg-white/5 text-gray-400 hover:bg-white/10'
                        }`}
                    onClick={() => onObsModeChange('normal')}
                >
                    透過なし
                </button>
                <button
                    className={`flex-1 py-[8px] px-[12px] rounded-lg font-bold transition-all text-sm ${obsMode === 'green'
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'bg-white/5 text-gray-400 hover:bg-white/10'
                        }`}
                    onClick={() => onObsModeChange('green')}
                >
                    グリーンバック
                </button>
            </div>
        </section>
    </div>
);
