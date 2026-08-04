/** 游戏页面状态。 */
export enum GameState {
    START,
    SELECT,
    ANALYZE,
    RESULT,
}

/** 当前项目中由 UIManager 管理的页面名称。 */
export type PanelName = 'StartPanel' | 'SelectPanel' | 'AnalyzePanel' | 'ResultPanel';

/** UIManager 内部使用的页面节点引用。 */
export interface PanelReference {
    readonly name: PanelName;
    readonly node: import('cc').Node | null;
}

/** 一次星座配对所需的选择数据。 */
export interface ZodiacSelection {
    maleZodiacId: string;
    femaleZodiacId: string;
}

/** 后续匹配算法可以直接填充的基础结果结构。 */
export interface MatchResult {
    score: number;
    summary: string;
}

/** 游戏状态与页面名称的一一映射。 */
export const PANEL_NAME_BY_STATE: Readonly<Record<GameState, PanelName>> = {
    [GameState.START]: 'StartPanel',
    [GameState.SELECT]: 'SelectPanel',
    [GameState.ANALYZE]: 'AnalyzePanel',
    [GameState.RESULT]: 'ResultPanel',
};
