import {
    _decorator,
    Button,
    Component,
    instantiate,
    Node,
    Prefab,
    tween,
    Tween,
    UIOpacity,
    Vec3,
} from 'cc';
import { GameManager } from '../managers/GameManager';
import { ZodiacManager } from '../managers/ZodiacManager';
import { GameState } from '../types/GameTypes';
import type { ZodiacSelection } from '../types/GameTypes';
import type { ZodiacData, ZodiacItemClickHandler } from '../types/ZodiacTypes';
import { AnalyzePanel } from './AnalyzePanel';
import { ZodiacItem } from './ZodiacItem';

const { ccclass, property } = _decorator;

/** 星座选择页的基础数据与交互入口。 */
@ccclass('SelectPanel')
export class SelectPanel extends Component implements ZodiacSelection {
    @property({ type: Node, tooltip: '男方分区标题节点' })
    public maleTitle: Node | null = null;

    @property({ type: Node, tooltip: '男方星座选项容器' })
    public maleGrid: Node | null = null;

    @property({ type: Node, tooltip: '女方分区标题节点' })
    public femaleTitle: Node | null = null;

    @property({ type: Node, tooltip: '女方星座选项容器' })
    public femaleGrid: Node | null = null;

    @property({ type: Prefab, tooltip: '星座选项预制体' })
    public zodiacItemPrefab: Prefab | null = null;

    @property({ type: Button, tooltip: '开始匹配按钮' })
    public matchButton: Button | null = null;

    @property({ type: AnalyzePanel, tooltip: '分析页面组件' })
    public analyzePanel: AnalyzePanel | null = null;

    public maleZodiacId: string = '';
    public femaleZodiacId: string = '';

    private readonly maleItems: Map<string, ZodiacItem> = new Map<string, ZodiacItem>();
    private readonly femaleItems: Map<string, ZodiacItem> = new Map<string, ZodiacItem>();
    private itemsCreated: boolean = false;

    protected onEnable(): void {
        this.matchButton?.node.on(Button.EventType.CLICK, this.onMatchButtonClick, this);
        this.resetSelection();
        this.startTitleGuide(this.maleTitle);
        void this.initializeZodiacItems();
    }

    protected onDisable(): void {
        this.matchButton?.node.off(Button.EventType.CLICK, this.onMatchButtonClick, this);
        this.stopAllGuideTweens();
    }

    protected onDestroy(): void {
        this.stopAllGuideTweens();
    }

    /** 供其他页面逻辑按 id 设置男方星座。 */
    public setMaleZodiac(zodiacId: string): void {
        const zodiac: ZodiacData | null = ZodiacManager.instance.getZodiacById(zodiacId);
        if (zodiac === null) {
            console.warn(`不存在男方星座 id：${zodiacId}`);
            return;
        }

        this.applyMaleSelection(zodiac);
    }

    /** 供其他页面逻辑按 id 设置女方星座。 */
    public setFemaleZodiac(zodiacId: string): void {
        const zodiac: ZodiacData | null = ZodiacManager.instance.getZodiacById(zodiacId);
        if (zodiac === null) {
            console.warn(`不存在女方星座 id：${zodiacId}`);
            return;
        }

        this.applyFemaleSelection(zodiac);
    }

    public resetSelection(): void {
        this.maleZodiacId = '';
        this.femaleZodiacId = '';

        this.setItemsSelected(this.maleItems, '');
        this.setItemsSelected(this.femaleItems, '');
        this.restoreTitle(this.maleTitle);
        this.restoreTitle(this.femaleTitle);
        this.restoreMatchButton();
    }

    private onMatchButtonClick(): void {
        if (!this.isSelectionComplete()) {
            console.log('请选择两个星座');
            return;
        }

        if (this.analyzePanel === null) {
            console.warn('AnalyzePanel 尚未绑定，无法开始分析。');
            return;
        }

        GameManager.instance.switchState(GameState.ANALYZE);
        this.analyzePanel.startAnalyze();
    }

    private isSelectionComplete(): boolean {
        return this.maleZodiacId.length > 0 && this.femaleZodiacId.length > 0;
    }

    private async initializeZodiacItems(): Promise<void> {
        try {
            await ZodiacManager.instance.loadData();

            if (!this.node.activeInHierarchy) {
                return;
            }

            if (this.itemsCreated) {
                this.playItemsEntrance();
                return;
            }

            if (this.maleGrid === null || this.femaleGrid === null || this.zodiacItemPrefab === null) {
                console.warn('SelectPanel 的 Grid 或 ZodiacItemPrefab 尚未绑定。');
                return;
            }

            const zodiacs: readonly ZodiacData[] = ZodiacManager.instance.getAllZodiacs();
            for (const zodiac of zodiacs) {
                const maleItem: ZodiacItem | null = this.createZodiacItem(
                    this.maleGrid,
                    zodiac,
                    this.handleMaleZodiacSelected,
                );
                if (maleItem !== null) {
                    this.maleItems.set(zodiac.id, maleItem);
                }

                const femaleItem: ZodiacItem | null = this.createZodiacItem(
                    this.femaleGrid,
                    zodiac,
                    this.handleFemaleZodiacSelected,
                );
                if (femaleItem !== null) {
                    this.femaleItems.set(zodiac.id, femaleItem);
                }
            }

            this.itemsCreated = this.maleItems.size === 12 && this.femaleItems.size === 12;
            this.playItemsEntrance();
        } catch (error: unknown) {
            console.error('初始化星座选择列表失败：', error);
        }
    }

    private createZodiacItem(
        parent: Node,
        data: ZodiacData,
        clickHandler: ZodiacItemClickHandler,
    ): ZodiacItem | null {
        if (this.zodiacItemPrefab === null) {
            return null;
        }

        const itemNode: Node = instantiate(this.zodiacItemPrefab);
        parent.addChild(itemNode);

        const item: ZodiacItem | null = itemNode.getComponent(ZodiacItem);
        if (item === null) {
            console.warn('ZodiacItem.prefab 未挂载 ZodiacItem 脚本。');
            itemNode.destroy();
            return null;
        }

        item.setData(data);
        item.setSelected(false);
        item.setClickHandler(clickHandler);
        return item;
    }

    private readonly handleMaleZodiacSelected: ZodiacItemClickHandler = (data: ZodiacData): void => {
        this.applyMaleSelection(data);
    };

    private readonly handleFemaleZodiacSelected: ZodiacItemClickHandler = (data: ZodiacData): void => {
        this.applyFemaleSelection(data);
    };

    private applyMaleSelection(data: ZodiacData): void {
        const selectionWasComplete: boolean = this.isSelectionComplete();
        this.maleZodiacId = data.id;
        this.setItemsSelected(this.maleItems, data.id);
        this.stopTitleGuide(this.maleTitle);

        if (this.femaleZodiacId.length === 0) {
            this.startTitleGuide(this.femaleTitle);
        } else {
            this.stopTitleGuide(this.femaleTitle);
            if (!selectionWasComplete) {
                this.playMatchButtonHint();
            }
        }
    }

    private applyFemaleSelection(data: ZodiacData): void {
        const selectionWasComplete: boolean = this.isSelectionComplete();
        this.femaleZodiacId = data.id;
        this.setItemsSelected(this.femaleItems, data.id);
        if (this.maleZodiacId.length > 0) {
            this.stopTitleGuide(this.femaleTitle);
            if (!selectionWasComplete) {
                this.playMatchButtonHint();
            }
        }
    }

    /** 两组星座卡片同时错峰弹出，总时长控制在半秒左右。 */
    private playItemsEntrance(): void {
        let index: number = 0;
        for (const item of this.maleItems.values()) {
            item.playEntrance(0.03 + index * 0.025);
            index += 1;
        }

        index = 0;
        for (const item of this.femaleItems.values()) {
            item.playEntrance(0.1 + index * 0.025);
            index += 1;
        }
    }

    /** 标题仅使用缩放和透明度呼吸，完整周期 1.6 秒。 */
    private startTitleGuide(title: Node | null): void {
        if (title === null) {
            return;
        }

        const opacity: UIOpacity | null = title.getComponent(UIOpacity);
        this.stopTitleGuide(title);
        title.setScale(1, 1, 1);
        if (opacity !== null) {
            opacity.opacity = 235;
        }

        tween(title)
            .repeatForever(
                tween<Node>()
                    .to(0.8, { scale: new Vec3(1.025, 1.025, 1) }, { easing: 'sineInOut' })
                    .to(0.8, { scale: new Vec3(1, 1, 1) }, { easing: 'sineInOut' }),
            )
            .start();

        if (opacity !== null) {
            tween(opacity)
                .repeatForever(
                    tween<UIOpacity>()
                        .to(0.8, { opacity: 255 }, { easing: 'sineInOut' })
                        .to(0.8, { opacity: 235 }, { easing: 'sineInOut' }),
                )
                .start();
        }
    }

    private stopTitleGuide(title: Node | null): void {
        if (title === null) {
            return;
        }

        Tween.stopAllByTarget(title);
        const opacity: UIOpacity | null = title.getComponent(UIOpacity);
        if (opacity !== null) {
            Tween.stopAllByTarget(opacity);
        }
        this.restoreTitle(title);
    }

    private restoreTitle(title: Node | null): void {
        if (title === null || !title.isValid) {
            return;
        }

        title.setScale(1, 1, 1);
        const opacity: UIOpacity | null = title.getComponent(UIOpacity);
        if (opacity !== null) {
            opacity.opacity = 255;
        }
    }

    private playMatchButtonHint(): void {
        const buttonNode: Node | null = this.matchButton?.node ?? null;
        if (buttonNode === null) {
            return;
        }

        Tween.stopAllByTarget(buttonNode);
        buttonNode.setScale(1, 1, 1);
        tween(buttonNode)
            .to(0.2, { scale: new Vec3(1.04, 1.04, 1) }, { easing: 'quadOut' })
            .to(0.25, { scale: new Vec3(1, 1, 1) }, { easing: 'quadOut' })
            .start();
    }

    private restoreMatchButton(): void {
        const buttonNode: Node | null = this.matchButton?.node ?? null;
        if (buttonNode !== null && buttonNode.isValid) {
            Tween.stopAllByTarget(buttonNode);
            buttonNode.setScale(1, 1, 1);
        }
    }

    private stopAllGuideTweens(): void {
        this.stopTitleGuide(this.maleTitle);
        this.stopTitleGuide(this.femaleTitle);
        this.restoreMatchButton();
    }

    private setItemsSelected(items: ReadonlyMap<string, ZodiacItem>, selectedId: string): void {
        for (const [zodiacId, item] of items) {
            item.setSelected(zodiacId === selectedId);
        }
    }
}
