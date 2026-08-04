import { _decorator, Button, Component } from 'cc';
import { GameManager } from '../managers/GameManager';
import { GameState } from '../types/GameTypes';

const { ccclass, property } = _decorator;

/** 开始页交互。 */
@ccclass('StartPanel')
export class StartPanel extends Component {
    @property({ type: Button, tooltip: '开始匹配按钮' })
    public startButton: Button | null = null;

    protected onEnable(): void {
        this.startButton?.node.on(Button.EventType.CLICK, this.onStartButtonClick, this);
    }

    protected onDisable(): void {
        this.startButton?.node.off(Button.EventType.CLICK, this.onStartButtonClick, this);
    }

    private onStartButtonClick(): void {
        console.log('进入星座选择页面');
        GameManager.instance.switchState(GameState.SELECT);
    }
}
