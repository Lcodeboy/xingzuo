import {
    _decorator,
    Component,
    Node,
    Sprite,
} from 'cc';
import type { PanelName, PanelReference } from '../types/GameTypes';

const { ccclass, property } = _decorator;

/**
 * 负责单场景内 Panel 的显隐切换。
 * 所有页面节点均通过 Inspector 引用，不依赖运行时路径查找。
 */
@ccclass('UIManager')
export class UIManager extends Component {
    private static _instance: UIManager | null = null;

    @property({ type: Sprite, tooltip: 'Canvas/Background 的全屏背景 Sprite' })
    public backgroundSprite: Sprite | null = null;

    @property({ type: Node, tooltip: '开始页节点' })
    public startPanel: Node | null = null;

    @property({ type: Node, tooltip: '星座选择页节点' })
    public selectPanel: Node | null = null;

    @property({ type: Node, tooltip: '分析等待页节点' })
    public analyzePanel: Node | null = null;

    @property({ type: Node, tooltip: '结果页节点' })
    public resultPanel: Node | null = null;

    public static get instance(): UIManager {
        if (UIManager._instance === null) {
            throw new Error('UIManager 尚未初始化，请确认脚本已挂载到 Canvas。');
        }

        return UIManager._instance;
    }

    protected onLoad(): void {
        if (UIManager._instance !== null && UIManager._instance !== this) {
            console.warn('场景中存在重复的 UIManager，后加载的实例将被禁用。');
            this.enabled = false;
            return;
        }

        UIManager._instance = this;
    }

    protected onDestroy(): void {
        if (UIManager._instance === this) {
            UIManager._instance = null;
        }
    }

    /** 显示指定页面，并隐藏其余受管理页面。 */
    public showPanel(panelName: string): void {
        const panels = this.getPanelReferences();
        const target = panels.find((panel) => panel.name === panelName);

        if (target === undefined || target.node === null) {
            console.warn(`未找到或未绑定 Panel：${panelName}`);
            return;
        }

        this.hideAllPanels();
        target.node.active = true;
    }

    /** 隐藏全部页面；PopupLayer 不受此方法影响。 */
    public hideAllPanels(): void {
        for (const panel of this.getPanelReferences()) {
            if (panel.node !== null) {
                panel.node.active = false;
            }
        }
    }

    private getPanelReferences(): readonly PanelReference[] {
        return [
            { name: 'StartPanel' satisfies PanelName, node: this.startPanel },
            { name: 'SelectPanel' satisfies PanelName, node: this.selectPanel },
            { name: 'AnalyzePanel' satisfies PanelName, node: this.analyzePanel },
            { name: 'ResultPanel' satisfies PanelName, node: this.resultPanel },
        ];
    }

}
