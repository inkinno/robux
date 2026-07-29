/**
 * [Presentation] 파티클 시각 효과 서비스
 * 클릭 위치 및 최고기록, 최종완료 시 다채롭고 dynamic한 Canvas/DOM 파티클을 생성합니다.
 */

export class ParticleService {
    constructor() {
        this.container = document.createElement('div');
        this.container.id = 'particle-container';
        this.container.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;pointer-events:none;z-index:9999;overflow:hidden;';
        document.body.appendChild(this.container);
    }

    /**
     * 일반 체크 파티클 (클릭 지점 주변 소형 버스트)
     */
    triggerCheckParticles(x, y) {
        const count = 16;
        const colors = ['#4f46e5', '#10b981', '#f59e0b', '#ec4899', '#3b82f6'];

        for (let i = 0; i < count; i++) {
            const particle = document.createElement('div');
            const color = colors[Math.floor(Math.random() * colors.length)];
            const size = Math.random() * 8 + 6;

            particle.style.cssText = `
                position: absolute;
                left: ${x}px;
                top: ${y}px;
                width: ${size}px;
                height: ${size}px;
                background: ${color};
                border-radius: 50%;
                pointer-events: none;
                transform: translate(-50%, -50%);
                will-change: transform, opacity;
            `;

            this.container.appendChild(particle);

            const angle = (Math.PI * 2 * i) / count;
            const velocity = Math.random() * 80 + 40;
            const targetX = x + Math.cos(angle) * velocity;
            const targetY = y + Math.sin(angle) * velocity;

            particle.animate([
                { transform: 'translate(-50%, -50%) scale(1)', opacity: 1 },
                { transform: `translate(${targetX - x}px, ${targetY - y}px) scale(0)`, opacity: 0 }
            ], {
                duration: 600 + Math.random() * 200,
                easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
                fill: 'forwards'
            }).onfinish = () => particle.remove();
        }
    }

    /**
     * 최고 기록 경신 파티클 (대형 폭발 + Star/Sparkle 이펙트)
     */
    triggerBestRecordParticles(x, y) {
        const count = 40;
        const colors = ['#f59e0b', '#fbbf24', '#ef4444', '#8b5cf6', '#10b981', '#ffffff'];

        for (let i = 0; i < count; i++) {
            const particle = document.createElement('div');
            const color = colors[Math.floor(Math.random() * colors.length)];
            const size = Math.random() * 14 + 8;
            const isStar = Math.random() > 0.5;

            particle.style.cssText = `
                position: absolute;
                left: ${x}px;
                top: ${y}px;
                width: ${size}px;
                height: ${size}px;
                background: ${color};
                border-radius: ${isStar ? '2px' : '50%'};
                box-shadow: 0 0 10px ${color};
                pointer-events: none;
                transform: translate(-50%, -50%) rotate(${Math.random() * 360}deg);
                will-change: transform, opacity;
            `;

            this.container.appendChild(particle);

            const angle = Math.random() * Math.PI * 2;
            const velocity = Math.random() * 220 + 80;
            const targetX = x + Math.cos(angle) * velocity;
            const targetY = y + Math.sin(angle) * velocity;

            particle.animate([
                { transform: 'translate(-50%, -50%) scale(0.5) rotate(0deg)', opacity: 1 },
                { transform: `translate(${targetX - x}px, ${targetY - y}px) scale(1.8) rotate(720deg)`, opacity: 0 }
            ], {
                duration: 1000 + Math.random() * 400,
                easing: 'cubic-bezier(0.1, 0.9, 0.2, 1)',
                fill: 'forwards'
            }).onfinish = () => particle.remove();
        }
    }

    /**
     * 최종 완료 팡파르 (전체 화면 콘페티 폭발)
     */
    triggerFinalCompletionParticles() {
        const count = 120;
        const colors = ['#ff4b4b', '#26d0ce', '#1a2a6c', '#b92b27', '#159957', '#f5af19', '#e1eec3'];

        for (let i = 0; i < count; i++) {
            const particle = document.createElement('div');
            const color = colors[Math.floor(Math.random() * colors.length)];
            const startX = Math.random() * window.innerWidth;
            const startY = -20;
            const size = Math.random() * 12 + 6;

            particle.style.cssText = `
                position: absolute;
                left: ${startX}px;
                top: ${startY}px;
                width: ${size}px;
                height: ${size * (Math.random() * 1.5 + 0.8)}px;
                background: ${color};
                border-radius: ${Math.random() > 0.5 ? '50%' : '2px'};
                pointer-events: none;
                will-change: transform, opacity;
            `;

            this.container.appendChild(particle);

            const endX = startX + (Math.random() - 0.5) * 300;
            const endY = window.innerHeight + 50;
            const rotation = Math.random() * 1080;

            particle.animate([
                { transform: `translate(0, 0) rotate(0deg)`, opacity: 1 },
                { transform: `translate(${endX - startX}px, ${endY}px) rotate(${rotation}deg)`, opacity: 0.2 }
            ], {
                duration: 2500 + Math.random() * 2000,
                easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                fill: 'forwards'
            }).onfinish = () => particle.remove();
        }
    }
}
