import { _decorator, Component, JsonAsset, resources } from 'cc';
import type { MatchData } from '../types/MatchTypes';

const { ccclass } = _decorator;

/** 负责加载、缓存并查询 12 × 12 星座匹配数据。 */
@ccclass('MatchManager')
export class MatchManager extends Component {
    private static readonly EXPECTED_MATCH_COUNT: number = 144;
    private static readonly DEFAULT_MATCH_DATA: Readonly<MatchData> = {
        score: 60,
        type: '磨合成长型',
        attraction: 60,
        communication: 60,
        emotion: 60,
        life: 60,
        future: 60,
    };

    private static _instance: MatchManager | null = null;

    private matchDataMap: Record<string, MatchData> = {};
    private loaded: boolean = false;
    private loadingPromise: Promise<void> | null = null;

    public static get instance(): MatchManager {
        if (MatchManager._instance === null) {
            throw new Error('MatchManager 尚未初始化，请确认脚本已挂载到 Canvas。');
        }

        return MatchManager._instance;
    }

    protected onLoad(): void {
        if (MatchManager._instance !== null && MatchManager._instance !== this) {
            console.warn('场景中存在重复的 MatchManager，后加载的实例将被禁用。');
            this.enabled = false;
            return;
        }

        MatchManager._instance = this;
    }

    protected onDestroy(): void {
        if (MatchManager._instance === this) {
            MatchManager._instance = null;
        }
    }

    /** 使用 resources.load 初始化匹配数据，重复调用会复用同一个加载任务。 */
    public loadData(): Promise<void> {
        if (this.loaded) {
            return Promise.resolve();
        }

        if (this.loadingPromise !== null) {
            return this.loadingPromise;
        }

        this.loadingPromise = new Promise<void>((resolve, reject) => {
            resources.load('json/match_scores', JsonAsset, (
                error: Error | null | undefined,
                asset: JsonAsset | null | undefined,
            ): void => {
                this.loadingPromise = null;

                if (error !== null && error !== undefined) {
                    reject(new Error(`加载 match_scores.json 失败：${error.message}`));
                    return;
                }

                if (asset === null || asset === undefined) {
                    reject(new Error('加载 match_scores.json 失败：Creator 未返回 JsonAsset。'));
                    return;
                }

                const rawData: unknown = asset.json;
                if (!this.isMatchDataMap(rawData)) {
                    reject(new Error('match_scores.json 数据格式无效。'));
                    return;
                }

                if (Object.keys(rawData).length !== MatchManager.EXPECTED_MATCH_COUNT) {
                    reject(new Error('match_scores.json 必须包含 144 条星座组合。'));
                    return;
                }

                this.matchDataMap = { ...rawData };
                this.loaded = true;
                resolve();
            });
        });

        return this.loadingPromise;
    }

    /**
     * 优先读取 male_female；不存在时自动尝试 female_male；
     * 两个方向都不存在时返回一份安全的默认数据。
     */
    public getMatchData(maleId: string, femaleId: string): MatchData {
        const directKey: string = `${maleId}_${femaleId}`;
        const reverseKey: string = `${femaleId}_${maleId}`;
        const matchData: MatchData | undefined = this.matchDataMap[directKey] ?? this.matchDataMap[reverseKey];

        return matchData === undefined
            ? { ...MatchManager.DEFAULT_MATCH_DATA }
            : { ...matchData };
    }

    public isLoaded(): boolean {
        return this.loaded;
    }

    private isMatchDataMap(value: unknown): value is Record<string, MatchData> {
        if (!this.isRecord(value)) {
            return false;
        }

        return Object.entries(value).every(([key, matchData]) => {
            return key.includes('_') && this.isMatchData(matchData);
        });
    }

    private isMatchData(value: unknown): value is MatchData {
        if (!this.isRecord(value)) {
            return false;
        }

        return this.isScore(value.score)
            && typeof value.type === 'string'
            && this.isScore(value.attraction)
            && this.isScore(value.communication)
            && this.isScore(value.emotion)
            && this.isScore(value.life)
            && this.isScore(value.future);
    }

    private isScore(value: unknown): value is number {
        return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 100;
    }

    private isRecord(value: unknown): value is Record<string, unknown> {
        return typeof value === 'object' && value !== null && !Array.isArray(value);
    }
}
