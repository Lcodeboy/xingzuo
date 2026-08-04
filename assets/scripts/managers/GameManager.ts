import { _decorator, Component } from 'cc';
import { GameState, PANEL_NAME_BY_STATE } from '../types/GameTypes';
import { UIManager } from './UIManager';

const { ccclass } = _decorator;

/** 全局游戏流程状态管理器。 */
@ccclass('GameManager')
export class GameManager extends Component {
    private static _instance: GameManager | null = null;
    private currentState: GameState = GameState.START;

    public static get instance(): GameManager {
        if (GameManager._instance === null) {
            throw new Error('GameManager 尚未初始化，请确认脚本已挂载到 Canvas。');
        }

        return GameManager._instance;
    }

    protected onLoad(): void {
        if (GameManager._instance !== null && GameManager._instance !== this) {
            console.warn('场景中存在重复的 GameManager，后加载的实例将被禁用。');
            this.enabled = false;
            return;
        }

        GameManager._instance = this;
    }

    protected start(): void {
        // 场景启动时统一校正页面状态，确保只有 StartPanel 可见。
        this.switchState(GameState.START);
    }

    protected onDestroy(): void {
        if (GameManager._instance === this) {
            GameManager._instance = null;
        }
    }

    /** 切换游戏状态，并同步显示对应 Panel。 */
    public switchState(state: GameState): void {
        this.currentState = state;
        UIManager.instance.showPanel(PANEL_NAME_BY_STATE[state]);
    }

    public getState(): GameState {
        return this.currentState;
    }
}
