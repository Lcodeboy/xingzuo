import { _decorator, Component, JsonAsset, resources } from 'cc';
import type { ZodiacData, ZodiacRelationshipProfile } from '../types/ZodiacTypes';

const { ccclass } = _decorator;

/** 负责加载、缓存和查询星座基础数据。 */
@ccclass('ZodiacManager')
export class ZodiacManager extends Component {
    private static _instance: ZodiacManager | null = null;

    private zodiacList: ZodiacData[] = [];
    private loaded: boolean = false;
    private loadingPromise: Promise<void> | null = null;

    public static get instance(): ZodiacManager {
        if (ZodiacManager._instance === null) {
            throw new Error('ZodiacManager 尚未初始化，请确认脚本已挂载到 Canvas。');
        }

        return ZodiacManager._instance;
    }

    protected onLoad(): void {
        if (ZodiacManager._instance !== null && ZodiacManager._instance !== this) {
            console.warn('场景中存在重复的 ZodiacManager，后加载的实例将被禁用。');
            this.enabled = false;
            return;
        }

        ZodiacManager._instance = this;
    }

    protected onDestroy(): void {
        if (ZodiacManager._instance === this) {
            ZodiacManager._instance = null;
        }
    }

    /** 使用 resources.load 初始化 zodiac.json；重复调用只会发起一次加载。 */
    public loadData(): Promise<void> {
        if (this.loaded) {
            return Promise.resolve();
        }

        if (this.loadingPromise !== null) {
            return this.loadingPromise;
        }

        this.loadingPromise = new Promise<void>((resolve, reject) => {
            resources.load('json/zodiac', JsonAsset, (
                error: Error | null | undefined,
                asset: JsonAsset | null | undefined,
            ): void => {
                this.loadingPromise = null;

                if (error !== null && error !== undefined) {
                    reject(new Error(`加载 zodiac.json 失败：${error.message}`));
                    return;
                }

                if (asset === null || asset === undefined) {
                    reject(new Error('加载 zodiac.json 失败：Creator 未返回 JsonAsset。'));
                    return;
                }

                const rawData: unknown = asset.json;
                if (!this.isZodiacDataList(rawData) || rawData.length !== 12) {
                    reject(new Error('zodiac.json 数据格式无效，必须包含 12 个完整星座对象。'));
                    return;
                }

                const uniqueIds: Set<string> = new Set(rawData.map((zodiac) => zodiac.id));
                if (uniqueIds.size !== rawData.length) {
                    reject(new Error('zodiac.json 中存在重复的星座 id。'));
                    return;
                }

                this.zodiacList = [...rawData];
                this.loaded = true;
                resolve();
            });
        });

        return this.loadingPromise;
    }

    /** 返回只读星座列表，调用前应先等待 loadData。 */
    public getAllZodiacs(): readonly ZodiacData[] {
        return this.zodiacList;
    }

    /** 根据英文 id 查询星座，未找到时返回 null。 */
    public getZodiacById(id: string): ZodiacData | null {
        return this.zodiacList.find((zodiac) => zodiac.id === id) ?? null;
    }

    /**
     * 返回 SpriteFrame 的 resources.load 路径。
     * 约定源文件名为 assets/resources/textures/zodiac/zodiac_{id}.png。
     */
    public getIconPath(id: string): string {
        const zodiac: ZodiacData | null = this.getZodiacById(id);
        const iconName: string = zodiac?.icon ?? `zodiac_${id}`;
        return `textures/zodiac/${iconName}/spriteFrame`;
    }

    public isLoaded(): boolean {
        return this.loaded;
    }

    private isZodiacDataList(value: unknown): value is ZodiacData[] {
        return Array.isArray(value) && value.every((item) => this.isZodiacData(item));
    }

    private isZodiacData(value: unknown): value is ZodiacData {
        if (!this.isRecord(value)) {
            return false;
        }

        return typeof value.id === 'string'
            && typeof value.name === 'string'
            && typeof value.symbol === 'string'
            && typeof value.element === 'string'
            && this.isStringArray(value.personality)
            && typeof value.loveStyle === 'string'
            && typeof value.communication === 'string'
            && this.isStringArray(value.strengths)
            && this.isStringArray(value.weaknesses)
            && this.isRelationshipProfile(value.relationship)
            && typeof value.icon === 'string';
    }

    private isRelationshipProfile(value: unknown): value is ZodiacRelationshipProfile {
        if (!this.isRecord(value)) {
            return false;
        }

        return this.isNonEmptyString(value.gift)
            && this.isNonEmptyString(value.emotionalNeed)
            && this.isNonEmptyString(value.pressureResponse)
            && this.isNonEmptyString(value.repair)
            && this.isNonEmptyString(value.dateStyle)
            && this.isNonEmptyString(value.dateIdea);
    }

    private isRecord(value: unknown): value is Record<string, unknown> {
        return typeof value === 'object' && value !== null;
    }

    private isStringArray(value: unknown): value is string[] {
        return Array.isArray(value) && value.every((item) => typeof item === 'string');
    }

    private isNonEmptyString(value: unknown): value is string {
        return typeof value === 'string' && value.trim().length > 0;
    }
}
