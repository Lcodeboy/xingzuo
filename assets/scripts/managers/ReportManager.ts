import { _decorator, Component, JsonAsset, resources } from 'cc';
import type { MatchData } from '../types/MatchTypes';
import type { ReportData } from '../types/ReportTypes';
import type { ZodiacData } from '../types/ZodiacTypes';
import { MatchManager } from './MatchManager';
import { ZodiacManager } from './ZodiacManager';

const { ccclass } = _decorator;

type ReportTemplateLevel = 'high' | 'medium' | 'low';

interface ReportLevelTemplate {
    summary: string[];
    advantages: string[];
    risks: string[];
    suggestions: string[];
}

interface ReportTypeTemplate {
    description: string;
}

interface MatchTextData {
    levels: Record<ReportTemplateLevel, ReportLevelTemplate>;
    types: Record<string, ReportTypeTemplate>;
}

/** 组合星座资料、匹配分数和文本模板，生成最终恋爱分析报告。 */
@ccclass('ReportManager')
export class ReportManager extends Component {
    private static _instance: ReportManager | null = null;

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

    /** 加载报告模板；匹配分数和星座资料由各自 Manager 独立加载。 */
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
                if (!this.isMatchTextData(rawData)) {
                    reject(new Error('match_text.json 数据格式无效。'));
                    return;
                }

                this.textData = rawData;
                resolve();
            });
        });

        return this.loadingPromise;
    }

    /** 根据双方星座生成包含等级、性格和相处建议的完整报告。 */
    public generateReport(maleId: string, femaleId: string): ReportData {
        if (this.textData === null) {
            throw new Error('报告模板尚未加载，请先等待 ReportManager.loadData()。');
        }

        const male: ZodiacData | null = ZodiacManager.instance.getZodiacById(maleId);
        const female: ZodiacData | null = ZodiacManager.instance.getZodiacById(femaleId);
        if (male === null || female === null) {
            throw new Error(`无法生成报告，星座 id 无效：${maleId} / ${femaleId}`);
        }

        const match: MatchData = MatchManager.instance.getMatchData(maleId, femaleId);
        const templateLevel: ReportTemplateLevel = this.getTemplateLevel(match.score);
        const levelTemplate: ReportLevelTemplate = this.textData.levels[templateLevel];
        const seed: number = this.createStableSeed(`${maleId}_${femaleId}`);
        const typeDescription: string = this.textData.types[match.type]?.description
            ?? '你们的关系拥有独特节奏，需要在真实相处中继续发现彼此。';

        const summary: string = `${this.pickText(levelTemplate.summary, seed)}${typeDescription}`;
        const advantages: string[] = [
            ...this.pickTexts(levelTemplate.advantages, seed, 2),
            `${male.name}的${male.strengths[0]}与${female.name}的${female.strengths[0]}能够形成支持`,
        ];
        const risks: string[] = [
            ...this.pickTexts(levelTemplate.risks, seed + 1, 2),
            `${male.weaknesses[0]}与${female.weaknesses[0]}可能在压力下互相放大`,
        ];
        const suggestions: string[] = this.pickTexts(levelTemplate.suggestions, seed + 2, 3);

        return {
            maleId,
            femaleId,
            score: match.score,
            level: this.getMatchLevel(match.score),
            type: match.type,
            summary,
            maleAnalysis: this.createZodiacAnalysis('男方', male),
            femaleAnalysis: this.createZodiacAnalysis('女方', female),
            advantages,
            risks,
            suggestions,
            dimensions: {
                attraction: match.attraction,
                communication: match.communication,
                emotion: match.emotion,
                life: match.life,
                future: match.future,
            },
        };
    }

    public isLoaded(): boolean {
        return this.textData !== null;
    }

    private getMatchLevel(score: number): string {
        if (score >= 90) {
            return '天生一对';
        }
        if (score >= 80) {
            return '很合拍';
        }
        if (score >= 70) {
            return '值得尝试';
        }
        if (score >= 60) {
            return '需要磨合';
        }
        return '挑战较大';
    }

    private getTemplateLevel(score: number): ReportTemplateLevel {
        if (score >= 80) {
            return 'high';
        }
        if (score >= 60) {
            return 'medium';
        }
        return 'low';
    }

    private createZodiacAnalysis(role: string, zodiac: ZodiacData): string {
        return `${role}${zodiac.symbol}${zodiac.name}：${zodiac.personality.join('、')}。${zodiac.loveStyle}${zodiac.communication}`;
    }

    private pickText(values: readonly string[], seed: number): string {
        return values[seed % values.length];
    }

    private pickTexts(values: readonly string[], seed: number, count: number): string[] {
        const result: string[] = [];
        const targetCount: number = Math.min(count, values.length);

        for (let index: number = 0; index < targetCount; index += 1) {
            result.push(values[(seed + index) % values.length]);
        }

        return result;
    }

    private createStableSeed(value: string): number {
        let seed: number = 0;
        for (let index: number = 0; index < value.length; index += 1) {
            seed = (seed * 31 + value.charCodeAt(index)) >>> 0;
        }
        return seed;
    }

    private isMatchTextData(value: unknown): value is MatchTextData {
        if (!this.isRecord(value) || !this.isRecord(value.levels) || !this.isRecord(value.types)) {
            return false;
        }

        return this.isReportLevelTemplate(value.levels.high)
            && this.isReportLevelTemplate(value.levels.medium)
            && this.isReportLevelTemplate(value.levels.low)
            && Object.values(value.types).every((typeTemplate) => this.isReportTypeTemplate(typeTemplate));
    }

    private isReportLevelTemplate(value: unknown): value is ReportLevelTemplate {
        if (!this.isRecord(value)) {
            return false;
        }

        return this.isNonEmptyStringArray(value.summary)
            && this.isNonEmptyStringArray(value.advantages)
            && this.isNonEmptyStringArray(value.risks)
            && this.isNonEmptyStringArray(value.suggestions);
    }

    private isReportTypeTemplate(value: unknown): value is ReportTypeTemplate {
        return this.isRecord(value) && typeof value.description === 'string';
    }

    private isNonEmptyStringArray(value: unknown): value is string[] {
        return Array.isArray(value)
            && value.length > 0
            && value.every((item) => typeof item === 'string');
    }

    private isRecord(value: unknown): value is Record<string, unknown> {
        return typeof value === 'object' && value !== null && !Array.isArray(value);
    }
}
