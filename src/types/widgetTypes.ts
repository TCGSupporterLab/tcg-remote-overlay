// ウィジェットの識別子。
// 新ウィジェット追加時は新しい文字列を割り当てるだけで自動的にグループ化対象になる。
export type WidgetId = string;

// グループ定義
export interface WidgetGroup {
    id: string;            // グループのUUID
    memberIds: WidgetId[]; // 所属ウィジェットのID一覧
    anchorId: WidgetId;    // 基準ウィジェット
    initialAnchorState?: WidgetState; // 結合時のアンカーの状態
    initialRelativeTransforms?: Record<WidgetId, RelativeTransform>; // 結合時の相対座標
    initialStates?: Record<WidgetId, WidgetState>; // 結合時の全メンバーの状態
    initialCenter?: { px: number; py: number };    // 結合時のグループ全体の中心座標
}

// グループ内での相対Transform（anchorからの差分）
export interface RelativeTransform {
    dx: number;
    dy: number;
    dRotation: number;
    dScale: number;
}

// グループ全体の永続化データ
export interface WidgetGroupData {
    groups: WidgetGroup[];
    relativeTransforms: Record<WidgetId, RelativeTransform>;
}

// WidgetState (OverlayWidget.tsx から型を共有)
export interface WidgetState {
    px: number;   // 画面中心からの相対X座標 (-0.5 ~ 0.5)
    py: number;   // 画面中心からの相対Y座標 (-0.5 ~ 0.5)
    scale: number;
    rotation: number;
}

// マイレイアウト定義
export interface MyLayout {
    id: string;
    name: string;
    // 保存対象のウィジェットIDとそれぞれの個別状態
    widgets: {
        id: WidgetId;
        state: WidgetState;
    }[];
    // 保存対象のウィジェット間で形成されていたグループ情報
    groups: WidgetGroup[];
    // 表示管理、順序、メタデータ
    visibility: Record<WidgetId, boolean>; // 対象ウィジェットの表示状態
    widgetOrder: WidgetId[];              // 対象ウィジェット間の相対的な重なり順
    viewSize: { w: number; h: number };   // 保存時のウィンドウサイズ
    createdAt: number;
    isDefault?: boolean;
}
