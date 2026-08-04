import {
    _decorator,
    Button,
    Color,
    Component,
    Label,
    resources,
    Sprite,
    SpriteFrame,
    tween,
    Tween,
    Vec3,
} from 'cc';
import { ZodiacManager } from '../managers/ZodiacManager';
import type { ZodiacData, ZodiacItemClickHandler } from '../types/ZodiacTypes';

const { ccclass, property } = _decorator;

/** 可复用的星座选择按钮。 */
@ccclass('ZodiacItem')
export class ZodiacItem extends Component {
    private static readonly NORMAL_NAME_COLOR: Color = new Color(255, 247, 255, 255);
    private static readonly SELECTED_NAME_COLOR: Color = new Color(255, 236, 181, 255);

    @property({ type: Sprite, tooltip: '选项背景，用于显示选中状态' })
    public background: Sprite | null = null;

    @property({ type: SpriteFrame, tooltip: '未选中状态九宫格背景' })
    public normalBackground: SpriteFrame | null = null;

    @property({ type: SpriteFrame, tooltip: '已选中状态九宫格背景' })
    public selectedBackground: SpriteFrame | null = null;

    @property({ type: Sprite, tooltip: '通过 resources.load 加载的星座图标' })
    public iconSprite: Sprite | null = null;

    @property({ type: Label, tooltip: '星座中文名' })
    public nameLabel: Label | null = null;

    @property({ type: Button, tooltip: '选项点击按钮' })
    public button: Button | null = null;

    @property({ tooltip: '未选中时卡片背景透明度，0 表示完全透明', range: [0, 255], slide: true })
    public normalBackgroundAlpha: number = 0;

    @property({ tooltip: '选中时高亮背景透明度', range: [0, 255], slide: true })
    public selectedBackgroundAlpha: number = 235;

    private zodiacData: ZodiacData | null = null;
    private clickHandler: ZodiacItemClickHandler | null = null;
    private iconRequestId: number = 0;
    private selected: boolean = false;

    protected onEnable(): void {
        this.button?.node.on(Button.EventType.CLICK, this.onItemClick, this);
    }

    protected onDisable(): void {
        this.button?.node.off(Button.EventType.CLICK, this.onItemClick, this);
        Tween.stopAllByTarget(this.node);
    }

    protected onDestroy(): void {
        // 让销毁前尚未完成的异步加载回调失效。
        this.iconRequestId += 1;
        Tween.stopAllByTarget(this.node);
    }

    /** 写入名称，并根据 zodiac.json 中的 icon 字段加载 SpriteFrame。 */
    public setData(data: ZodiacData): void {
        this.zodiacData = data;

        if (this.nameLabel !== null) {
            this.nameLabel.string = data.name;
        }

        this.loadIcon(data.id);
    }

    /** 切换九宫格背景，并用轻量弹性缩放反馈当前选中状态。 */
    public setSelected(value: boolean): void {
        const selectionChanged: boolean = this.selected !== value;
        this.selected = value;

        if (this.background !== null) {
            const targetFrame: SpriteFrame | null = value
                ? this.selectedBackground
                : this.normalBackground;
            if (targetFrame !== null) {
                this.background.spriteFrame = targetFrame;
            }

            const alpha: number = value
                ? this.selectedBackgroundAlpha
                : this.normalBackgroundAlpha;
            this.background.color = new Color(255, 255, 255, alpha);
        }

        if (this.nameLabel !== null) {
            this.nameLabel.color = value
                ? ZodiacItem.SELECTED_NAME_COLOR
                : ZodiacItem.NORMAL_NAME_COLOR;
        }

        const targetScale: number = value ? 1.03 : 1;
        if (!selectionChanged) {
            this.node.setScale(targetScale, targetScale, 1);
            return;
        }

        Tween.stopAllByTarget(this.node);
        if (value) {
            tween(this.node)
                .to(0.08, { scale: new Vec3(1.08, 1.08, 1) }, { easing: 'quadOut' })
                .to(0.12, { scale: new Vec3(targetScale, targetScale, 1) }, { easing: 'quadOut' })
                .start();
        } else {
            tween(this.node)
                .to(0.12, { scale: new Vec3(1, 1, 1) }, { easing: 'quadOut' })
                .start();
        }
    }

    /** 选择页出现时的错峰弹入动画。 */
    public playEntrance(delaySeconds: number): void {
        Tween.stopAllByTarget(this.node);
        this.node.setScale(0.78, 0.78, 1);
        tween(this.node)
            .delay(Math.max(0, delaySeconds))
            .to(0.24, { scale: new Vec3(1, 1, 1) }, { easing: 'backOut' })
            .start();
    }

    public setClickHandler(handler: ZodiacItemClickHandler | null): void {
        this.clickHandler = handler;
    }

    private loadIcon(zodiacId: string): void {
        const requestId: number = ++this.iconRequestId;
        const iconPath: string = ZodiacManager.instance.getIconPath(zodiacId);

        if (this.iconSprite !== null) {
            this.iconSprite.spriteFrame = null;
        }

        resources.load(iconPath, SpriteFrame, (
            error: Error | null | undefined,
            spriteFrame: SpriteFrame | null | undefined,
        ): void => {
            if (error !== null && error !== undefined) {
                console.warn(`加载星座图标失败：${iconPath}`, error);
                return;
            }

            if (
                spriteFrame === null
                || spriteFrame === undefined
                || requestId !== this.iconRequestId
                || this.iconSprite === null
            ) {
                return;
            }

            this.iconSprite.spriteFrame = spriteFrame;
        });
    }

    private onItemClick(): void {
        if (this.zodiacData !== null && this.clickHandler !== null) {
            this.clickHandler(this.zodiacData);
        }
    }
}
