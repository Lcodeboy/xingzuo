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

/** 完整报告弹层。 */
@ccclass('DetailPanel')
export class DetailPanel extends Component {
    @property({ type: RichText, tooltip: '双方心动来源' })
    public attractionStoryLabel: RichText | null = null;

    @property({ type: RichText, tooltip: '双方爱的表达与情绪需要' })
    public loveLanguageLabel: RichText | null = null;

    @property({ type: RichText, tooltip: '双方沟通与冲突循环' })
    public conflictPatternLabel: RichText | null = null;

    @property({ type: RichText, tooltip: '双方相处与约会方式' })
    public datingGuideLabel: RichText | null = null;

    @property({ type: RichText, tooltip: '长期发展条件与行动清单' })
    public longTermGuideLabel: RichText | null = null;

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
        this.setLabel(
            this.attractionStoryLabel,
            this.formatItem('01', '心动来源', report.detailAnalysis.attractionSource),
        );
        this.setLabel(
            this.loveLanguageLabel,
            this.formatItem('02', '爱的表达', report.detailAnalysis.loveExpression),
        );
        this.setLabel(
            this.conflictPatternLabel,
            this.formatItem('03', '沟通与冲突', report.detailAnalysis.communicationConflict),
        );
        this.setLabel(
            this.datingGuideLabel,
            this.formatItem('04', '相处与约会', report.detailAnalysis.datingRhythm),
        );
        this.setLabel(
            this.longTermGuideLabel,
            this.formatItem('05', '长期发展', report.detailAnalysis.longTermGrowth),
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
