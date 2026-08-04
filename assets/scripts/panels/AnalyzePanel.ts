import { _decorator, Component, Label } from 'cc';
import { GameManager } from '../managers/GameManager';
import { MatchManager } from '../managers/MatchManager';
import { ReportManager } from '../managers/ReportManager';
import { ZodiacManager } from '../managers/ZodiacManager';
import { GameState } from '../types/GameTypes';
import type { ReportData } from '../types/ReportTypes';
import { ResultPanel } from './ResultPanel';
import type { SelectPanel } from './SelectPanel';

const { ccclass, property } = _decorator;

/** 分析等待页：展示提示一秒后进入结果页。 */
@ccclass('AnalyzePanel')
export class AnalyzePanel extends Component {
    private static readonly ANALYZE_DURATION_SECONDS = 1;

    @property({ type: Label, tooltip: '分析状态文字' })
    public analyzeLabel: Label | null = null;

    // 使用 Component 作为序列化类型，避免 SelectPanel 与 AnalyzePanel 产生运行时循环依赖。
    @property({ type: Component, tooltip: '读取双方已选星座的 SelectPanel 组件' })
    public selectPanel: SelectPanel | null = null;

    @property({ type: ResultPanel, tooltip: '接收并展示生成的报告' })
    public resultPanel: ResultPanel | null = null;

    private pendingReport: Promise<ReportData> | null = null;
    private scheduledCompletion: (() => void) | null = null;
    private analyzeRequestId: number = 0;

    /** 由 SelectPanel 在两颗星座均选择完成后调用。 */
    public startAnalyze(): void {
        this.cancelScheduledCompletion();
        const requestId: number = ++this.analyzeRequestId;

        const message = '正在分析星座匹配...';
        if (this.analyzeLabel !== null) {
            this.analyzeLabel.string = message;
        }
        console.log(message);

        // 数据加载和一秒展示动画并行进行，避免重复等待。
        this.pendingReport = this.prepareReport();
        this.scheduledCompletion = (): void => {
            this.scheduledCompletion = null;
            void this.completeAnalysis(requestId);
        };
        this.scheduleOnce(this.scheduledCompletion, AnalyzePanel.ANALYZE_DURATION_SECONDS);
    }

    protected onDisable(): void {
        this.analyzeRequestId += 1;
        this.cancelScheduledCompletion();
        this.pendingReport = null;
    }

    private async prepareReport(): Promise<ReportData> {
        if (this.selectPanel === null) {
            throw new Error('AnalyzePanel 尚未绑定 SelectPanel。');
        }

        const maleId: string = this.selectPanel.maleZodiacId;
        const femaleId: string = this.selectPanel.femaleZodiacId;
        if (maleId.length === 0 || femaleId.length === 0) {
            throw new Error('双方星座选择不完整，无法生成报告。');
        }

        await Promise.all([
            ZodiacManager.instance.loadData(),
            MatchManager.instance.loadData(),
            ReportManager.instance.loadData(),
        ]);

        return ReportManager.instance.generateReport(maleId, femaleId);
    }

    private async completeAnalysis(requestId: number): Promise<void> {
        const reportTask: Promise<ReportData> | null = this.pendingReport;
        if (reportTask === null) {
            return;
        }

        try {
            const report: ReportData = await reportTask;
            if (requestId !== this.analyzeRequestId || !this.node.activeInHierarchy) {
                return;
            }

            if (this.resultPanel === null) {
                throw new Error('AnalyzePanel 尚未绑定 ResultPanel。');
            }

            this.resultPanel.showReport(report);
            GameManager.instance.switchState(GameState.RESULT);
        } catch (error: unknown) {
            console.error('生成星座匹配报告失败：', error);
            if (requestId === this.analyzeRequestId && this.analyzeLabel !== null) {
                this.analyzeLabel.string = '分析失败，请稍后重试';
            }
        }
    }

    private cancelScheduledCompletion(): void {
        if (this.scheduledCompletion !== null) {
            this.unschedule(this.scheduledCompletion);
            this.scheduledCompletion = null;
        }
    }
}
