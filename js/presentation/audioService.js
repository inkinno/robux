/**
 * [Presentation] 오디오 효과음 서비스
 * Web Audio API를 활용하여 외부 mp3 파일 없이도 즉각적이고 생생한 효과음을 합성 재생합니다.
 */

export class AudioService {
    constructor() {
        this.ctx = null;
    }

    initContext() {
        if (!this.ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                this.ctx = new AudioContext();
            }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    /**
     * 일반 퀘스트 체크 클릭음 (상쾌한 팝 소리)
     */
    playCheckSound() {
        this.initContext();
        if (!this.ctx) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, this.ctx.currentTime); // A4
        osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.1); // A5

        gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.1);
    }

    /**
     * 최고 기록 경신 사운드 (상승 화음 체임)
     */
    playBestRecordSound() {
        this.initContext();
        if (!this.ctx) return;

        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        notes.forEach((freq, index) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, this.ctx.currentTime + index * 0.08);

            gain.gain.setValueAtTime(0.3, this.ctx.currentTime + index * 0.08);
            gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + index * 0.08 + 0.25);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(this.ctx.currentTime + index * 0.08);
            osc.stop(this.ctx.currentTime + index * 0.08 + 0.25);
        });
    }

    /**
     * 최종 완료 팡파르 사운드 (화려한 챔피언 사운드)
     */
    playFanfareSound() {
        this.initContext();
        if (!this.ctx) return;

        const sequence = [
            { freq: 523.25, time: 0, duration: 0.15 },
            { freq: 659.25, time: 0.15, duration: 0.15 },
            { freq: 783.99, time: 0.30, duration: 0.15 },
            { freq: 1046.50, time: 0.45, duration: 0.40 }
        ];

        sequence.forEach(item => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(item.freq, this.ctx.currentTime + item.time);

            gain.gain.setValueAtTime(0.4, this.ctx.currentTime + item.time);
            gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + item.time + item.duration);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(this.ctx.currentTime + item.time);
            osc.stop(this.ctx.currentTime + item.time + item.duration);
        });
    }
}
