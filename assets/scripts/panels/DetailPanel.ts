import {
    _decorator,
    Button,
    Color,
    Component,
    Graphics,
    Node,
    RichText,
    ScrollView,
    UITransform,
} from 'cc';
import type { ReportData } from '../types/ReportTypes';

const { ccclass, property } = _decorator;

/** 激励广告解锁后的完整报告弹层。 */
@ccclass('DetailPanel')
export class DetailPanel extends Component {
    @property({ type: RichText, tooltip: '心动指数详情' })
    public heartIndexLabel: RichText | null = null;

    @property({ type: RichText, tooltip: '沟通模式详情' })
    public communicationLabel: RichText | null = null;

    @property({ type: RichText, tooltip: '适合约会方式' })
    public dateStyleLabel: RichText | null = null;

    @property({ type: RichText, tooltip: '感情升温建议' })
    public warmingSuggestionLabel: RichText | null = null;

    @property({ type: RichText, tooltip: '长期相处提醒' })
    public longTermReminderLabel: RichText | null = null;

    @property({ type: Button, tooltip: '关闭完整报告按钮' })
    public closeButton: Button | null = null;

    @property({ type: ScrollView, tooltip: '完整报告纵向滚动区域' })
    public scrollView: ScrollView | null = null;

    @property({ type: Node, tooltip: '弹窗下方的全屏遮罩节点' })
    public dimMask: Node | null = null;

    protected onLoad(): void {
        this.drawDimMask();
    }

    protected onEnable(): void {
        this.closeButton?.node.on(Button.EventType.CLICK, this.hide, this);
        this.dimMask?.on(Node.EventType.SIZE_CHANGED, this.drawDimMask, this);
        this.drawDimMask();
    }

    protected onDisable(): void {
        this.closeButton?.node.off(Button.EventType.CLICK, this.hide, this);
        this.dimMask?.off(Node.EventType.SIZE_CHANGED, this.drawDimMask, this);
        this.unscheduleAllCallbacks();
        this.scrollView?.stopAutoScroll();
    }

    public show(report: ReportData): void {
        const dimensions: ReportData['dimensions'] = report.dimensions;

        this.setLabel(
            this.heartIndexLabel,
            this.formatItem(
                '01',
                `心动指数 ${dimensions.attraction}%`,
                dimensions.attraction >= 85
                    ? '彼此容易快速产生吸引，适合主动表达欣赏。'
                    : '心动需要在真实陪伴中逐步累积。',
            ),
        );
        this.setLabel(
            this.communicationLabel,
            this.formatItem(
                '02',
                `沟通模式 ${dimensions.communication}%`,
                dimensions.communication >= 80
                    ? '表达较容易同频，仍要记得确认对方的真实需求。'
                    : '建议少用猜测，多用具体问题确认彼此想法。',
            ),
        );
        this.setLabel(
            this.dateStyleLabel,
            this.formatItem('03', '最适合约会方式', this.getDateStyle(report)),
        );
        this.setLabel(
            this.warmingSuggestionLabel,
            this.formatItem('04', '感情升温建议', `${report.suggestions.slice(0, 2).join('；')}。`),
        );
        this.setLabel(
            this.longTermReminderLabel,
            this.formatItem(
                '05',
                `长期相处提醒 ${dimensions.future}%`,
                dimensions.future >= 80
                    ? '共同规划未来，并持续为彼此保留高质量相处时间。'
                    : '先建立稳定边界，再逐步讨论承诺与长期计划。',
            ),
        );

        if (this.dimMask !== null) {
            this.dimMask.active = true;
        }
        this.node.active = true;
        this.scheduleOnce((): void => {
            if (this.node.activeInHierarchy) {
                this.drawDimMask();
                this.scrollView?.scrollToTop(0);
            }
        });
    }

    public hide(): void {
        this.unscheduleAllCallbacks();
        this.scrollView?.stopAutoScroll();
        this.node.active = false;
        if (this.dimMask !== null) {
            this.dimMask.active = false;
        }
    }

    private getDateStyle(report: ReportData): string {
        const dimensions: ReportData['dimensions'] = report.dimensions;
        if (dimensions.attraction >= dimensions.life && dimensions.attraction >= dimensions.communication) {
            return '适合有仪式感的新鲜体验，例如主题展览、夜景散步或双人挑战。';
        }
        if (dimensions.life >= dimensions.communication) {
            return '适合轻松生活型约会，例如一起做饭、逛市集或短途旅行。';
        }
        return '适合能够深入交流的约会，例如安静咖啡馆、书店或共同兴趣活动。';
    }

    private formatItem(index: string, title: string, body: string): string {
        return `<outline color=#E4D6F0 width=1><color=#3A285F><b>${index}  ${title}</b></color></outline>`
            + `\n<color=#54436F>${body}</color>`;
    }

    private drawDimMask(): void {
        const graphics: Graphics | null = this.dimMask?.getComponent(Graphics) ?? null;
        if (graphics === null) {
            return;
        }

        const transform: UITransform | null = this.dimMask?.getComponent(UITransform) ?? null;
        const width: number = transform?.contentSize.width ?? 1080;
        const height: number = transform?.contentSize.height ?? 1920;
        graphics.clear();
        graphics.fillColor = new Color(0, 0, 0, 142);
        graphics.rect(-width * 0.5, -height * 0.5, width, height);
        graphics.fill();
    }

    private setLabel(label: RichText | null, value: string): void {
        if (label !== null) {
            label.string = value;
        }
    }
}
