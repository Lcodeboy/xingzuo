import { _decorator, Component } from 'cc';

const { ccclass } = _decorator;

export type RewardAdCallback = () => void;

/** 激励广告能力封装；当前用三秒等待模拟完整播放。 */
@ccclass('AdManager')
export class AdManager extends Component {
    private static readonly MOCK_DURATION_SECONDS: number = 3;
    private static _instance: AdManager | null = null;

    private rewardCallback: RewardAdCallback | null = null;
    private rewardPlaying: boolean = false;

    public static get instance(): AdManager {
        if (AdManager._instance === null) {
            throw new Error('AdManager 尚未初始化，请确认脚本已挂载到 Canvas。');
        }
        return AdManager._instance;
    }

    protected onLoad(): void {
        if (AdManager._instance !== null && AdManager._instance !== this) {
            console.warn('场景中存在重复的 AdManager，后加载的实例将被禁用。');
            this.enabled = false;
            return;
        }
        AdManager._instance = this;
    }

    protected onDestroy(): void {
        this.unschedule(this.completeRewardAd);
        this.rewardCallback = null;
        this.rewardPlaying = false;

        if (AdManager._instance === this) {
            AdManager._instance = null;
        }
    }

    public showRewardAd(callback: RewardAdCallback): void {
        if (this.rewardPlaying) {
            console.warn('激励广告正在播放，请勿重复调用。');
            return;
        }

        this.rewardPlaying = true;
        this.rewardCallback = callback;
        this.scheduleOnce(this.completeRewardAd, AdManager.MOCK_DURATION_SECONDS);
    }

    public isRewardPlaying(): boolean {
        return this.rewardPlaying;
    }

    private completeRewardAd(): void {
        const callback: RewardAdCallback | null = this.rewardCallback;
        this.rewardCallback = null;
        this.rewardPlaying = false;
        console.log('广告播放完成');
        callback?.();
    }
}
