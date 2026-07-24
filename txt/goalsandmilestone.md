⚠️ CRITICAL INSTRUCTION FOR AI AGENT: MASTER GUIDELINE
You are the lead developer and UI/UX designer for the "Family Quest & Reward Tracking System." This document is the ultimate synthesis of all previous PRDs (Pages 1~5).
Digest this master guideline to understand the final goal, design language, and execution roadmap. Always respond and explain your implementation steps in KOREAN.

🚀 [Master Guideline] Family Quest & Reward Tracking System
1. Final Goal & Core Philosophy (최종 목표 및 핵심 철학)
본 프로젝트의 최종 목표는 "결과(승리)에만 집착하지 않고, 아이들이 스스로 계획을 세우고 실천하는 과정(성장)에 즐겁게 몰입할 수 있도록 돕는 게이미피케이션(Gamification) 보상 플랫폼"을 구축하는 것입니다.

Process over Result: 단순히 '체스에서 이겼는가?'가 아니라 '목표 시간을 버텼는가?', '기록이 단축되었는가?'를 측정할 수 있도록 5가지 다형성 퀘스트 타입(Checklist, Progress, Conditional, Milestone, Record)을 완벽하게 지원해야 합니다.

Zero "Blank Canvas" Anxiety: 부모가 고민할 필요 없이, 아이의 5대 성향(탐구형, 활동형, 창의형, 표현형, 규칙형)에 맞춘 프리셋(Preset)을 원클릭으로 불러올 수 있어야 합니다.

Extensible Architecture: 현재는 Vanilla HTML/JS로 구현하지만, 비즈니스 로직(Evaluator)과 UI(Factory)가 완벽히 분리되어 있어 향후 React, Flutter 및 오프라인 로컬 앱으로 쉽게 포팅(Porting)될 수 있어야 합니다.

2. Design System & UI/UX Guidelines (디자인 및 UX 명세)
단순한 텍스트 리스트가 아닌, 아이들의 눈높이에 맞춘 '보드게임'이나 'RPG 게임의 퀘스트 창' 같은 느낌을 주어야 합니다.

2.1 Color Palette & Typography
Background & Surface: 전체 배경은 부드러운 웜 화이트(Warm White)나 옅은 베이지톤으로 구성하여 눈의 피로를 줄입니다. 퀘스트 카드는 확실한 그림자(Drop-shadow)를 주어 둥글고 입체적인 형태(Border-radius: 12px~16px)로 렌더링합니다.

Type-Specific Theming (성향별 컬러 코드):

♟️ 탐구형 (Thinker): Blue (지성, 논리)

🏃‍♂️ 활동형 (Mover): Orange/Red (에너지, 열정)

🧱 창의형 (Creator): Purple (상상력, 창의력)

🎤 표현형 (Speaker): Yellow (밝음, 자신감)

📚 규칙형 (Achiever): Green (성장, 안정감)

Typography: 폰트는 둥글고 친근한 고딕 계열(예: Noto Sans KR, 넥슨 고딕 등)을 사용하여 가독성을 높입니다.

2.2 Interactive UI Elements (동적 컴포넌트)
Quest Card Factory: 각 퀘스트 카드는 상태(pending, in_progress, completed)에 따라 시각적 피드백이 달라져야 합니다. (예: 완료된 카드는 약간 투명해지거나 체크마크 스탬프 애니메이션 효과 적용)

Progress Indicators:

Progress 타입: 부드럽게 채워지는 프로그레스 바(Progress Bar).

Milestone 타입: 보드게임의 칸을 이동하는 듯한 스테퍼(Stepper) UI.

Ledger Animation: 부모가 승인하여 로벅스(R$) 보상이 지급될 때, 화면 우측 상단의 '보유 로벅스' 숫자가 카운트업(Count-up) 되는 애니메이션을 넣어 성취감을 극대화합니다.

3. Architecture Strict Rules (아키텍처 엄수 규칙)
AI 에이전트는 다음의 3-Layer 구조를 절대 위반해서는 안 됩니다.

[Layer 1] Domain (Business Logic): QuestEvaluator 클래스는 절대 DOM API(document.getElementById 등)에 접근해서는 안 됩니다. 오직 순수 JSON 데이터만 입력받아 계산 결과를 반환합니다.

[Layer 2] Application (State & Ledger): 상태 관리자(store.js)는 QuestStateMachine을 통해 퀘스트의 상태 전이 절차를 통제하며, 상태가 업데이트될 때마다 Event를 발생시켜 UI가 다시 그려지도록(Re-render) 유도합니다.

[Layer 3] Presentation (UI Factory): QuestCardFactory는 오직 type 값에 의존하여 렌더링을 분기합니다. 새로운 퀘스트 타입이 추가되더라도 기존 HTML 코드를 수정하는 것이 아니라 Factory 분기만 추가하는 구조(OCP 준수)를 유지합니다.

4. Implementation Roadmap (구현 마일스톤)
AI 에이전트는 이 문서를 읽은 후 다음 순서대로 코드를 작성하고 보고하십시오.

Phase 1 (Scaffolding): Page 5에서 제시한 디렉토리 구조(index.html, js/domain/, js/application/, js/presentation/)를 생성하고 보일러플레이트 코드를 배치합니다.

Phase 2 (Core Logic & State): evaluators.js와 types.js를 완성하고, 인메모리로 동작하는 store.js(상태 및 트랜잭션 관리)를 구현합니다.

Phase 3 (UI Components & Styling): CSS를 작성하여 디자인 가이드라인을 반영하고, components.js에 5가지 퀘스트 타입별 렌더링 함수를 완성합니다.

Phase 4 (Integration): main.js에서 프리셋 데이터를 화면에 뿌리고, 유저(부모/아이)의 클릭 이벤트가 Store를 거쳐 UI 업데이트로 이어지도록 시스템을 연동합니다.


_________
phase1~4내용
1. 전체 문서 분류 및 기획안 (총 4페이지)
📄 페이지 1: 시스템 개요 및 코어 아키텍처 명세서 (PRD & Architecture)

목적: AI에게 프로젝트의 의도, 대상(부모와 아이), 전체 기술 스택 및 디렉토리 구조를 각인시킵니다.

내용:

기획 의도 및 핵심 기능 요약

3-Layer 아키텍처 (평가 모듈, 상태 관리, UI 팩토리) 구조도

데이터 플로우 (퀘스트 생성 -> 진행 -> 완료 -> 보상 지급)

📄 페이지 2: 데이터 모델 및 타입 정의서 (Data Models & Typings)

목적: AI가 가장 헷갈려하는 '타입(Type)'을 완벽하게 고정합니다. (가장 중요)

내용:

공통 퀘스트 인터페이스 (Base Quest Schema)

5가지 퀘스트 타입별 확장 스키마 (Checklist, Progress, Conditional, Milestone, Record)

상태값(Status) 및 보상 내역(Reward Ledger) 데이터 구조 (JSON/TypeScript/Dart 타입 형태)

📄 페이지 3: 비즈니스 로직 및 평가 모듈 (Business Logic & Evaluator)

목적: UI와 독립된 순수 비즈니스 로직(검증 및 보상 계산)을 설계하게 합니다.

내용:

QuestEvaluator 클래스 설계 (타입별 완료 조건 검증 로직)

상태 전이(State Transition) 로직 (pending -> in_progress -> pending_approval -> completed)

재화(로벅스) 트랜잭션 처리 로직

📄 페이지 4: UI 컴포넌트 팩토리 및 프리셋 DB 데이터 (UI Factory & Preset DB)

목적: 동적 렌더링 구조와 초기 유저를 위한 템플릿 데이터를 제공합니다.

내용:

타입별 동적 렌더링 팩토리 패턴(QuestCardFactory) 설계 지시

아이들 성향 5가지에 맞춘 초기 프리셋 JSON 데이터 덤프 (시스템에 바로 삽입 가능한 형태)