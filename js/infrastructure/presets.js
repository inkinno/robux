/**
 * [Infrastructure] Presets Seed Data
 * 아이들의 5가지 성향별 초기 퀘스트 템플릿 데이터베이스 역할
 */
export const PRESETS = [
    {
        presetId: "p_thinker_01",
        category: "논리·탐구형",
        title: "♟️ 체스 명승부 버티기",
        description: "체스 게임에서 결과(승/무/패)에 상관없이 정정당당하게 버텨보자!",
        type: "CONDITIONAL",
        baseReward: 50,
        config: {
            outcomeRewards: { "WIN": 500, "DRAW": 100, "LOSE": 50 },
            selectedOutcome: null
        },
        uiStyle: { icon: "♟️", categoryClass: "category-thinker" }
    },
    {
        presetId: "p_mover_01",
        category: "신체·활동형",
        title: "🏃‍♂️ 놀이터 달리기 특훈",
        description: "놀이터 2바퀴를 전력 질주하여 목표 기록(60초) 이하를 달성해보자!",
        type: "RECORD",
        baseReward: 50,
        config: {
            targetRecord: 60,
            currentRecord: null,
            unit: "초",
            successBonus: 100,
            isLowerBetter: true
        },
        uiStyle: { icon: "🏃‍♂️", categoryClass: "category-mover" }
    },
    {
        presetId: "p_mover_02",
        category: "신체·활동형",
        title: "💪 팔씨름 파워업 버티기",
        description: "아빠와 팔씨름할 때 두 손으로 목표 시간(15초) 이상 버티기!",
        type: "PROGRESS",
        baseReward: 50,
        config: {
            targetValue: 15,
            currentValue: 0,
            unit: "초"
        },
        uiStyle: { icon: "💪", categoryClass: "category-mover" }
    },
    {
        presetId: "p_creator_01",
        category: "창의·예술형",
        title: "🧱 블록 건축가 3단계 프로젝트",
        description: "거대한 블록 마을을 3단계 체크포인트에 걸쳐 완성해보자!",
        type: "MILESTONE",
        baseReward: 50,
        config: {
            totalSteps: 3,
            currentStep: 0,
            stepTitles: ["기초 지반 공사", "1층 및 벽면 완성", "지붕 및 전체 완성"],
            stepRewards: [20, 30, 50],
            finalBonus: 100
        },
        uiStyle: { icon: "🧱", categoryClass: "category-creator" }
    },
    {
        presetId: "p_speaker_01",
        category: "표현·소통형",
        title: "🎤 오늘의 느낌 스피커",
        description: "가족들 앞에서 오늘 있었던 가장 기쁜 일을 자신있게 이야기해요.",
        type: "CHECKLIST",
        baseReward: 80,
        config: {
            isCompleted: false
        },
        uiStyle: { icon: "🎤", categoryClass: "category-speaker" }
    },
    {
        presetId: "p_achiever_01",
        category: "성실·규칙형",
        title: "📚 매일 독서 30분 루틴",
        description: "하루에 정해진 목표 독서 시간(30분)만큼 집중해서 책을 읽어요.",
        type: "PROGRESS",
        baseReward: 50,
        config: {
            targetValue: 30,
            currentValue: 0,
            unit: "분"
        },
        uiStyle: { icon: "📚", categoryClass: "category-achiever" }
    }
];
