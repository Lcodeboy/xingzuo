import { _decorator, Component, Label, ProgressBar } from 'cc';

const { ccclass, property } = _decorator;

/** 负责结果页分数和进度条的一秒增长动画。 */
@ccclass('ScoreAnimator')
export class ScoreAnimator extends Component {
    private static readonly DURATION_SECONDS: number = 1;

    @property({ type: Label, tooltip: '动态显示的分数字段' })
    public scoreNumber: Label | null = null;

    @property({ type: ProgressBar, tooltip: '与分数同步增长的进度条' })
    public scoreProgress: ProgressBar | null = null;

    private targetScore: number = 0;
    private elapsedSeconds: number = 0;
    private playing: boolean = false;

    /** 从 0 播放至指定分数，持续一秒。 */
    public play(score: number): void {
        this.targetScore = Math.round(Math.min(100, Math.max(0, score)));
        this.elapsedSeconds = 0;
        this.playing = true;
        this.updateDisplay(0);
    }

    protected update(deltaTime: number): void {
        if (!this.playing) {
            return;
        }

        this.elapsedSeconds += deltaTime;
        const progress: number = Math.min(1, this.elapsedSeconds / ScoreAnimator.DURATION_SECONDS);
        const easedProgress: number = 1 - Math.pow(1 - progress, 3);
        this.updateDisplay(easedProgress);

        if (progress >= 1) {
            this.playing = false;
            this.updateDisplay(1);
        }
    }

    protected onDisable(): void {
        this.playing = false;
    }

    private updateDisplay(progress: number): void {
        const currentScore: number = Math.round(this.targetScore * progress);

        if (this.scoreNumber !== null) {
            this.scoreNumber.string = `${currentScore}`;
        }

        if (this.scoreProgress !== null) {
            this.scoreProgress.progress = currentScore / 100;
        }
    }
}
