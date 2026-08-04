import {
    _decorator,
    Button,
    Component,
    Label,
    Node,
    resources,
    RichText,
    Sprite,
    SpriteFrame,
    tween,
    Tween,
    Vec3,
} from 'cc';
import { AdManager } from '../managers/AdManager';
import { GameManager } from '../managers/GameManager';
import { ShareManager } from '../managers/ShareManager';
import { ZodiacManager } from '../managers/ZodiacManager';
import { GameState } from '../types/GameTypes';
import type { ReportData } from '../types/ReportTypes';
import type { ZodiacData } from '../types/ZodiacTypes';
import { DetailPanel } from './DetailPanel';
import { ScoreAnimator } from './ScoreAnimator';

const { ccclass, property } = _decorator;

/** 产品化结果页：负责报告展示、图片占位、分享和详情解锁入口。 */
@ccclass('ResultPanel')
export class ResultPanel extends Component {
    @property({ type: Sprite, tooltip: '男方星座图标' })
    public maleIcon: Sprite | null = null;

    @property({ type: Sprite, tooltip: '女方星座图标' })
    public femaleIcon: Sprite | null = null;

    @property({ type: Label, tooltip: '男方图片未接入时显示的星座符号' })
    public maleIconPlaceholderLabel: Label | null = null;

    @property({ type: Label, tooltip: '女方图片未接入时显示的星座符号' })
    public femaleIconPlaceholderLabel: Label | null = null;

    @property({ type: Label, tooltip: '男方星座中文名称' })
    public maleNameLabel: Label | null = null;

    @property({ type: Label, tooltip: '女方星座中文名称' })
    public femaleNameLabel: Label | null = null;

    @property({ type: Node, tooltip: '双方头像中间的爱心特效节点' })
    public heartEffect: Node | null = null;

    @property({ type: SpriteFrame, tooltip: '外部星座图片未接入前使用的占位 SpriteFrame' })
    public placeholderIcon: SpriteFrame | null = null;

    @property({ type: ScoreAnimator, tooltip: '分数和进度条动画组件' })
    public scoreAnimator: ScoreAnimator | null = null;

    @property({ type: Label, tooltip: '匹配等级' })
    public levelLabel: Label | null = null;

    @property({ type: Label, tooltip: '匹配摘要文字' })
    public summaryLabel: Label | null = null;

    @property({ type: Label, tooltip: 'CP 类型文字' })
    public typeLabel: Label | null = null;

    @property({ type: RichText, tooltip: '吸引力评分' })
    public attractionScore: RichText | null = null;

    @property({ type: RichText, tooltip: '沟通默契评分' })
    public communicationScore: RichText | null = null;

    @property({ type: RichText, tooltip: '情绪契合评分' })
    public emotionScore: RichText | null = null;

    @property({ type: RichText, tooltip: '生活匹配评分' })
    public lifeScore: RichText | null = null;

    @property({ type: RichText, tooltip: '长期发展评分' })
    public futureScore: RichText | null = null;

    @property({ type: Label, tooltip: '关系优势列表' })
    public advantageLabel: Label | null = null;

    @property({ type: Label, tooltip: '相处风险列表' })
    public riskLabel: Label | null = null;

    @property({ type: Label, tooltip: '恋爱建议列表' })
    public suggestionLabel: Label | null = null;

    @property({ type: Button, tooltip: '分享结果按钮' })
    public shareButton: Button | null = null;

    @property({ type: Button, tooltip: '查看完整报告按钮' })
    public detailButton: Button | null = null;

    @property({ type: Button, tooltip: '重新测试按钮' })
    public retryButton: Button | null = null;

    @property({ type: DetailPanel, tooltip: '激励广告解锁后的完整报告面板' })
    public detailPanel: DetailPanel | null = null;

    private currentReport: ReportData | null = null;
    private iconRequestId: number = 0;

    protected onEnable(): void {
        this.shareButton?.node.on(Button.EventType.CLICK, this.onShareButtonClick, this);
        this.detailButton?.node.on(Button.EventType.CLICK, this.onDetailButtonClick, this);
        this.retryButton?.node.on(Button.EventType.CLICK, this.onRetryButtonClick, this);
        this.startHeartPulse();

        if (this.currentReport !== null) {
            this.scoreAnimator?.play(this.currentReport.score);
        }
    }

    protected onDisable(): void {
        this.shareButton?.node.off(Button.EventType.CLICK, this.onShareButtonClick, this);
        this.detailButton?.node.off(Button.EventType.CLICK, this.onDetailButtonClick, this);
        this.retryButton?.node.off(Button.EventType.CLICK, this.onRetryButtonClick, this);
        this.iconRequestId += 1;
        this.detailPanel?.hide();
        this.stopHeartPulse();
    }

    protected onDestroy(): void {
        this.stopHeartPulse();
    }

    /** 将完整报告写入结果页各展示区域。 */
    public showReport(report: ReportData): void {
        this.currentReport = report;

        if (this.summaryLabel !== null) {
            this.summaryLabel.string = report.summary;
        }

        if (this.levelLabel !== null) {
            this.levelLabel.string = report.level;
        }

        if (this.typeLabel !== null) {
            this.typeLabel.string = report.type;
        }

        const maleZodiac: ZodiacData | null = ZodiacManager.instance.getZodiacById(report.maleId);
        const femaleZodiac: ZodiacData | null = ZodiacManager.instance.getZodiacById(report.femaleId);
        this.setLabel(this.maleNameLabel, maleZodiac?.name ?? '—');
        this.setLabel(this.femaleNameLabel, femaleZodiac?.name ?? '—');

        const dimensions: ReportData['dimensions'] = report.dimensions;
        this.setDimension(this.attractionScore, '吸引力', dimensions.attraction);
        this.setDimension(this.communicationScore, '沟通', dimensions.communication);
        this.setDimension(this.emotionScore, '情绪', dimensions.emotion);
        this.setDimension(this.lifeScore, '生活', dimensions.life);
        this.setDimension(this.futureScore, '未来', dimensions.future);

        if (this.advantageLabel !== null) {
            this.advantageLabel.string = this.formatList(report.advantages);
        }

        if (this.riskLabel !== null) {
            this.riskLabel.string = this.formatList(report.risks);
        }

        if (this.suggestionLabel !== null) {
            this.suggestionLabel.string = this.formatList(report.suggestions);
        }

        this.resetIconPlaceholder(report.maleId, this.maleIcon, this.maleIconPlaceholderLabel);
        this.resetIconPlaceholder(report.femaleId, this.femaleIcon, this.femaleIconPlaceholderLabel);
        void this.loadZodiacIcons(report);

        if (this.node.activeInHierarchy) {
            this.scoreAnimator?.play(report.score);
        }
    }

    private onShareButtonClick(): void {
        if (this.currentReport === null) {
            console.warn('当前没有可分享的匹配报告。');
            return;
        }
        ShareManager.instance.shareReport(this.currentReport);
    }

    private onDetailButtonClick(): void {
        if (this.currentReport === null || this.detailPanel === null) {
            console.warn('完整报告或 DetailPanel 尚未准备完成。');
            return;
        }

        const report: ReportData = this.currentReport;
        AdManager.instance.showRewardAd((): void => {
            if (this.node.activeInHierarchy) {
                this.detailPanel?.show(report);
            }
        });
    }

    private onRetryButtonClick(): void {
        GameManager.instance.switchState(GameState.START);
    }

    private formatList(items: readonly string[]): string {
        return items.map((item) => `• ${item}`).join('\n');
    }

    private setLabel(label: Label | null, value: string): void {
        if (label !== null) {
            label.string = value;
        }
    }

    private setDimension(label: RichText | null, name: string, value: number): void {
        if (label !== null) {
            label.string = `<color=#4B3B68><size=25>${name}</size></color>`
                + `\n<color=#C39142><size=30><b>${value}</b></size></color>`;
        }
    }

    private startHeartPulse(): void {
        if (this.heartEffect === null) {
            return;
        }

        this.stopHeartPulse();
        this.heartEffect.setScale(1, 1, 1);
        const pulse = tween<Node>()
            .to(0.6, { scale: new Vec3(1.08, 1.08, 1) }, { easing: 'sineInOut' })
            .to(0.6, { scale: new Vec3(1, 1, 1) }, { easing: 'sineInOut' });
        tween(this.heartEffect).repeatForever(pulse).start();
    }

    private stopHeartPulse(): void {
        if (this.heartEffect !== null) {
            Tween.stopAllByTarget(this.heartEffect);
            this.heartEffect.setScale(1, 1, 1);
        }
    }

    private resetIconPlaceholder(id: string, sprite: Sprite | null, placeholderLabel: Label | null): void {
        if (sprite !== null) {
            sprite.spriteFrame = this.placeholderIcon;
        }

        const zodiac: ZodiacData | null = ZodiacManager.instance.getZodiacById(id);
        if (placeholderLabel !== null) {
            placeholderLabel.string = zodiac?.symbol ?? '☆';
            placeholderLabel.node.active = true;
        }
    }

    private async loadZodiacIcons(report: ReportData): Promise<void> {
        const requestId: number = ++this.iconRequestId;
        await Promise.all([
            this.loadZodiacIcon(report.maleId, this.maleIcon, this.maleIconPlaceholderLabel, requestId),
            this.loadZodiacIcon(report.femaleId, this.femaleIcon, this.femaleIconPlaceholderLabel, requestId),
        ]);
    }

    private loadZodiacIcon(
        id: string,
        sprite: Sprite | null,
        placeholderLabel: Label | null,
        requestId: number,
    ): Promise<void> {
        if (sprite === null) {
            return Promise.resolve();
        }

        const iconPath: string = ZodiacManager.instance.getIconPath(id);
        return new Promise<void>((resolve) => {
            resources.load(iconPath, SpriteFrame, (
                error: Error | null | undefined,
                spriteFrame: SpriteFrame | null | undefined,
            ): void => {
                if (error !== null && error !== undefined) {
                    console.info(`星座图片尚未接入，继续使用占位资源：${iconPath}`);
                    resolve();
                    return;
                }

                if (spriteFrame === null || spriteFrame === undefined) {
                    console.info(`星座图片加载结果为空，继续使用占位资源：${iconPath}`);
                    resolve();
                    return;
                }

                if (requestId === this.iconRequestId) {
                    sprite.spriteFrame = spriteFrame;
                    if (placeholderLabel !== null) {
                        placeholderLabel.node.active = false;
                    }
                }
                resolve();
            });
        });
    }
}
