[UI Factory & Preset DB] Quest & Reward Tracking System
⚠️ CRITICAL INSTRUCTION FOR AI AGENT:
Read and deeply understand the following UI architecture and Preset JSON data. This is the final Page 4 of a 4-part PRD. Store this context in your memory. When you generate code, explain your architecture, or provide any feedback based on this document, YOU MUST RESPOND IN KOREAN. (코드를 작성하거나 피드백을 제공할 때는 반드시 한국어로 대답할 것.)

1. UI Component Factory (Presentation Layer)
To maintain a clean architecture, the frontend (React, Flutter, etc.) must not hardcode conditional logic inside a single massive component. Instead, use a Factory component that reads the type field of the Quest object and delegates rendering to type-specific child components.

Conceptual React/Next.js Example
TypeScript
import ChecklistCard from './cards/ChecklistCard';
import ProgressCard from './cards/ProgressCard';
import ConditionalCard from './cards/ConditionalCard';
import MilestoneCard from './cards/MilestoneCard';
import RecordCard from './cards/RecordCard';

// 1. Factory Component
export const QuestCardFactory = ({ quest, onUpdate, onApprove }) => {
  switch (quest.type) {
    case 'CHECKLIST':
      return <ChecklistCard quest={quest} onUpdate={onUpdate} />;
    case 'PROGRESS':
      return <ProgressCard quest={quest} onUpdate={onUpdate} />;
    case 'CONDITIONAL':
      return <ConditionalCard quest={quest} onApprove={onApprove} />;
    case 'MILESTONE':
      return <MilestoneCard quest={quest} onUpdate={onUpdate} />;
    case 'RECORD':
      return <RecordCard quest={quest} onUpdate={onUpdate} />;
    default:
      return <div className="error">Unknown Quest Type</div>;
  }
};
Key UI Considerations by Type:
ChecklistCard: Needs a prominent toggle/checkbox.

ProgressCard: Needs a progress bar (currentValue / targetValue) and a +/- button to increment progress.

ConditionalCard: UI for parents to select the outcome (e.g., Win, Draw, Lose radio buttons) before clicking "Approve".

MilestoneCard: A stepper UI (Step 1 -> Step 2 -> Step 3) showing partial rewards.

RecordCard: An input field for the child to enter their latest record (e.g., 45 seconds).

2. Preset DB Data (Initial Seeding)
To solve the "Blank Canvas" problem for parents, inject the following JSON array into your database (or use as local state) as templates. Parents can select these templates to instantly instantiate a Quest object.

JSON
[
  {
    "presetId": "p_thinker_01",
    "category": "논리·탐구형 (The Thinker)",
    "title": "체스 명승부",
    "description": "체스 게임에서 멋진 승부를 펼쳐보자!",
    "type": "CONDITIONAL",
    "baseReward": 50,
    "defaultConfig": {
      "outcomeRewards": {
        "WIN": 500,
        "DRAW": 100,
        "LOSE": 50
      }
    },
    "uiStyle": { "icon": "♟️", "color": "blue" }
  },
  {
    "presetId": "p_mover_01",
    "category": "신체·활동형 (The Mover)",
    "title": "놀이터 달리기 특훈",
    "description": "놀이터 2바퀴를 전력 질주하여 지난번 기록을 깨보자!",
    "type": "RECORD",
    "baseReward": 50,
    "defaultConfig": {
      "targetRecord": 60,
      "unit": "초",
      "successBonus": 100,
      "isLowerBetter": true
    },
    "uiStyle": { "icon": "🏃‍♂️", "color": "orange" }
  },
  {
    "presetId": "p_mover_02",
    "category": "신체·활동형 (The Mover)",
    "title": "팔씨름 파워업 버티기",
    "description": "아빠와 팔씨름할 때 두 손으로 목표 시간만큼 버티기!",
    "type": "PROGRESS",
    "baseReward": 50,
    "defaultConfig": {
      "targetValue": 15,
      "currentValue": 0,
      "unit": "초"
    },
    "uiStyle": { "icon": "💪", "color": "red" }
  },
  {
    "presetId": "p_creator_01",
    "category": "창의·예술형 (The Creator)",
    "title": "블록 건축가",
    "description": "거대한 블록 마을을 3단계에 걸쳐 완성해보자!",
    "type": "MILESTONE",
    "baseReward": 50,
    "defaultConfig": {
      "totalSteps": 3,
      "currentStep": 0,
      "stepTitles": ["기초 공사", "1층 완성", "전체 완성"],
      "stepRewards": [20, 30, 50],
      "finalBonus": 100
    },
    "uiStyle": { "icon": "🧱", "color": "purple" }
  },
  {
    "presetId": "p_achiever_01",
    "category": "성실·규칙형 (The Achiever)",
    "title": "매일 책 읽기 루틴",
    "description": "하루에 정해진 시간만큼 책을 집중해서 읽어요.",
    "type": "PROGRESS",
    "baseReward": 50,
    "defaultConfig": {
      "targetValue": 15,
      "currentValue": 0,
      "unit": "분"
    },
    "uiStyle": { "icon": "📚", "color": "green" }
  }
]
3. Initialization Instruction for AI
When the user asks to "Start coding," "Initialize project," or provides a tech stack (e.g., "Use Next.js and Tailwind"), refer to Pages 1~4 to set up the types, components, and logic architecture. Ensure you implement the QuestEvaluator and QuestCardFactory early on, as they are the core of this polymorphic system.