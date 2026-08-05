import { _decorator, Component, JsonAsset, resources } from 'cc';
import type { ReportData } from '../types/ReportTypes';
import type { ZodiacData } from '../types/ZodiacTypes';
import { MatchManager } from './MatchManager';
import {
    ReportComposer,
    isMatchTextData,
    type MatchTextData,
} from './ReportComposer';
import { ZodiacManager } from './ZodiacManager';

const { ccclass } = _decorator;

/** 加载文案素材，并生成由双方特质与五维分数共同驱动的恋爱报告。 */
@ccclass('ReportManager')
export class ReportManager extends Component {
    private static _instance: ReportManager | null = null;

    private readonly composer: ReportComposer = new ReportComposer();
    private textData: MatchTextData | null = null;
    private loadingPromise: Promise<void> | null = null;

    public static get instance(): ReportManager {
        if (ReportManager._instance === null) {
            throw new Error('ReportManager 尚未初始化，请确认脚本已挂载到 Canvas。');
        }

        return ReportManager._instance;
    }

    protected onLoad(): void {
        if (ReportManager._instance !== null && ReportManager._instance !== this) {
            console.warn('场景中存在重复的 ReportManager，后加载的实例将被禁用。');
            this.enabled = false;
            return;
        }

        ReportManager._instance = this;
    }

    protected onDestroy(): void {
        if (ReportManager._instance === this) {
            ReportManager._instance = null;
        }
    }

    /** 加载关系等级、类型和元素互动文案。 */
    public loadData(): Promise<void> {
        if (this.textData !== null) {
            return Promise.resolve();
        }

        if (this.loadingPromise !== null) {
            return this.loadingPromise;
        }

        this.loadingPromise = new Promise<void>((resolve, reject) => {
            resources.load('json/match_text', JsonAsset, (
                error: Error | null | undefined,
                asset: JsonAsset | null | undefined,
            ): void => {
                this.loadingPromise = null;

                if (error !== null && error !== undefined) {
                    reject(new Error(`加载 match_text.json 失败：${error.message}`));
                    return;
                }

                if (asset === null || asset === undefined) {
                    reject(new Error('加载 match_text.json 失败：Creator 未返回 JsonAsset。'));
                    return;
                }

                const rawData: unknown = asset.json;
                if (!isMatchTextData(rawData)) {
                    reject(new Error('match_text.json 数据格式无效。'));
                    return;
                }

                this.textData = rawData;
                resolve();
            });
        });

        return this.loadingPromise;
    }

    /** 根据双方星座生成快速结论与五段完整关系报告。 */
    public generateReport(maleId: string, femaleId: string): ReportData {
        if (this.textData === null) {
            throw new Error('报告模板尚未加载，请先等待 ReportManager.loadData()。');
        }

        const male: ZodiacData | null = ZodiacManager.instance.getZodiacById(maleId);
        const female: ZodiacData | null = ZodiacManager.instance.getZodiacById(femaleId);
        if (male === null || female === null) {
            throw new Error(`无法生成报告，星座 id 无效：${maleId} / ${femaleId}`);
        }

        return this.composer.compose(
            male,
            female,
            MatchManager.instance.getMatchData(maleId, femaleId),
            this.textData,
        );
    }

    public isLoaded(): boolean {
        return this.textData !== null;
    }
}
