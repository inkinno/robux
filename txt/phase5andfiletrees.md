⚠️ CRITICAL INSTRUCTION FOR AI AGENT:
You are a senior frontend developer. We are building the "Quest & Reward Tracking System" using Vanilla HTML, CSS, and ES6 JavaScript Modules.
Based on the previous PRD (Pages 1~4), create the project directly using the file tree and boilerplate code below.
Respond and explain your actions in KOREAN.

1. Project File Tree
다음 디렉토리 구조에 맞춰 파일을 생성해 주세요.

Plaintext
/quest-tracking-app
├── index.html                   # 메인 UI 레이아웃 뼈대
├── css/
│   └── styles.css               # 전역 스타일 및 카드 UI 스타일링
├── js/
│   ├── main.js                  # 앱 초기화 및 이벤트 리스너 바인딩
│   ├── domain/
│   │   ├── evaluators.js        # [Layer 1] QuestEvaluator 비즈니스 로직
│   │   └── types.js             # JSDoc 기반의 타입 정의 주석 (참고용)
│   ├── application/
│   │   ├── store.js             # [Layer 2] 상태 관리 및 QuestStateMachine
│   │   └── ledger.js            # [Layer 2] 보상 트랜잭션 기록 로직
│   ├── presentation/
│   │   ├── uiFactory.js         # [Layer 3] 타입별 QuestCardFactory 동적 렌더링
│   │   └── components.js        # [Layer 3] 체크리스트, 프로그레스 등 개별 UI 함수
│   └── infrastructure/
│       └── presets.js           # 프리셋 JSON 데이터 (p_thinker_01 등)
2. Core Files Implementation Guide
다음 코드를 바탕으로 각 파일의 내부를 구현해 주세요.

📄 index.html
레이아웃 뼈대입니다. 모듈 스크립트를 불러옵니다.

HTML
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>아이들 퀘스트 보드</title>
    <link rel="stylesheet" href="css/styles.css">
</head>
<body>
    <header>
        <h1>🏆 우리가족 퀘스트 보드</h1>
        <div id="balance-display">보유 로벅스: <span id="current-balance">0</span> R$</div>
    </header>
    
    <main>
        <section id="preset-section">
            <h2>새 퀘스트 만들기</h2>
            <div id="preset-list" class="grid-container"></div>
        </section>

        <section id="active-quests-section">
            <h2>진행 중인 퀘스트</h2>
            <div id="quest-board" class="quest-container"></div>
        </section>
    </main>

    <script type="module" src="js/main.js"></script>
</body>
</html>
📄 js/domain/evaluators.js (Page 3 기반 비즈니스 로직)
DOM 조작 없이 순수 계산만 담당합니다.

JavaScript
export class QuestEvaluator {
    static calculateFinalReward(quest) {
        switch (quest.type) {
            case 'CHECKLIST':
                if (!quest.config.isCompleted) throw new Error("미완료 상태입니다.");
                return quest.baseReward;
            case 'PROGRESS':
                if (quest.config.currentValue < quest.config.targetValue) throw new Error("목표치에 도달하지 못했습니다.");
                return quest.baseReward;
            case 'CONDITIONAL':
                const outcome = quest.config.selectedOutcome;
                if (!outcome) throw new Error("결과가 선택되지 않았습니다.");
                return quest.config.outcomeRewards[outcome];
            case 'MILESTONE':
                if (quest.config.currentStep < quest.config.totalSteps) throw new Error("모든 단계를 완료해야 합니다.");
                return quest.baseReward + quest.config.finalBonus;
            case 'RECORD':
                const isSuccess = quest.config.isLowerBetter 
                    ? quest.config.currentRecord <= quest.config.targetRecord
                    : quest.config.currentRecord >= quest.config.targetRecord;
                return isSuccess ? (quest.baseReward + quest.config.successBonus) : quest.baseReward;
            default:
                throw new Error("알 수 없는 퀘스트 타입입니다.");
        }
    }
}
📄 js/presentation/uiFactory.js (Page 4 기반 팩토리 로직)
components.js에서 작성된 UI 함수들을 타입에 맞게 분기하여 렌더링합니다.

JavaScript
import { renderChecklist, renderProgress, renderConditional, renderMilestone, renderRecord } from './components.js';

export class QuestCardFactory {
    /**
     * @param {Object} quest - 퀘스트 JSON 객체
     * @returns {HTMLElement} 동적으로 생성된 카드 DOM 엘리먼트
     */
    static createCard(quest) {
        const card = document.createElement('div');
        card.className = `quest-card ${quest.status}`;
        card.id = quest.id;

        // 공통 헤더
        card.innerHTML = `
            <div class="card-header">
                <h3>${quest.title}</h3>
                <span class="badge ${quest.type.toLowerCase()}">${quest.type}</span>
            </div>
            <p class="description">${quest.description}</p>
            <div class="card-body"></div>
            <div class="card-footer">
                <span>기본 보상: ${quest.baseReward} R$</span>
            </div>
        `;

        const cardBody = card.querySelector('.card-body');

        // 타입별 다형성 렌더링
        switch (quest.type) {
            case 'CHECKLIST':
                cardBody.appendChild(renderChecklist(quest));
                break;
            case 'PROGRESS':
                cardBody.appendChild(renderProgress(quest));
                break;
            case 'CONDITIONAL':
                cardBody.appendChild(renderConditional(quest));
                break;
            case 'MILESTONE':
                cardBody.appendChild(renderMilestone(quest));
                break;
            case 'RECORD':
                cardBody.appendChild(renderRecord(quest));
                break;
        }

        return card;
    }
}
📄 js/infrastructure/presets.js
DB 역할을 할 초기 템플릿 데이터입니다.

JavaScript
export const PRESETS = [
    {
        presetId: "p_thinker_01",
        category: "논리·탐구형",
        title: "체스 명승부",
        description: "체스 게임에서 멋진 승부를 펼쳐보자!",
        type: "CONDITIONAL",
        baseReward: 50,
        config: {
            outcomeRewards: { "WIN": 500, "DRAW": 100, "LOSE": 50 },
            selectedOutcome: null
        }
    },
    {
        presetId: "p_mover_01",
        category: "신체·활동형",
        title: "놀이터 달리기 특훈",
        description: "놀이터 2바퀴를 전력 질주하여 지난번 기록을 깨보자!",
        type: "RECORD",
        baseReward: 50,
        config: {
            targetRecord: 60,
            currentRecord: null,
            unit: "초",
            successBonus: 100,
            isLowerBetter: true
        }
    },
    {
        presetId: "p_achiever_01",
        category: "성실·규칙형",
        title: "매일 책 읽기 루틴",
        description: "하루에 정해진 시간만큼 책을 집중해서 읽어요.",
        type: "PROGRESS",
        baseReward: 50,
        config: {
            targetValue: 15,
            currentValue: 0,
            unit: "분"
        }
    }
];
3. Action Items for AI
위 파일 트리에 맞춰 폴더와 빈 파일들을 생성하세요.

제시된 코드를 각 파일에 입력하세요.

누락된 store.js (상태 관리 로직), components.js (세부 UI 렌더링 로직), main.js (초기화 로직) 및 styles.css (카드 디자인)의 내용을 PRD (Page 1~4)의 맥락에 맞춰 직접 완성하세요.

작업 완료 후 한국어로 현재 구현 상태와 실행 방법에 대해 보고하세요.