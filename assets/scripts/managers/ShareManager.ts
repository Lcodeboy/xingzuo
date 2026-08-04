import { _decorator, Component } from 'cc';
import type { ReportData } from '../types/ReportTypes';

const { ccclass } = _decorator;

/** 分享能力封装；后续可在此接入抖音小游戏分享海报接口。 */
@ccclass('ShareManager')
export class ShareManager extends Component {
    private static _instance: ShareManager | null = null;

    public static get instance(): ShareManager {
        if (ShareManager._instance === null) {
            throw new Error('ShareManager 尚未初始化，请确认脚本已挂载到 Canvas。');
        }
        return ShareManager._instance;
    }

    protected onLoad(): void {
        if (ShareManager._instance !== null && ShareManager._instance !== this) {
            console.warn('场景中存在重复的 ShareManager，后加载的实例将被禁用。');
            this.enabled = false;
            return;
        }
        ShareManager._instance = this;
    }

    protected onDestroy(): void {
        if (ShareManager._instance === this) {
            ShareManager._instance = null;
        }
    }

    public shareReport(report: ReportData): void {
        // TODO: 接入 tt.shareAppMessage 或海报生成服务。
        console.log('生成分享海报');
        console.log(`分享内容：${report.score}% · ${report.level} · ${report.type}`);
    }
}
