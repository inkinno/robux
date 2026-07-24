[PRD & Architecture] Quest & Reward Tracking System
1. Project Overview
본 프로젝트는 부모와 아이가 함께 목표(퀘스트)를 설정하고, 아이의 실천 과정 및 결과에 따라 재화(예: 로벅스)를 보상으로 지급하는 동기부여 트래킹 시스템입니다. 단순한 '완료/미완료'를 넘어, 아이의 성향과 퀘스트 성격에 따라 다양한 타입의 목표를 모듈화하여 관리할 수 있는 확장성 높은 플랫폼을 구축하는 것이 목표입니다.

1.1 Core Objectives
유연한 퀘스트 설계: 결과 중심(승리)과 과정 중심(노력, 기록 향상)의 퀘스트를 모두 수용할 수 있는 다형성(Polymorphism) 구조 설계.

템플릿 기반 생성: 백지상태가 아닌, 아이의 5가지 성향별 프리셋(Preset) 데이터를 제공하여 부모가 손쉽게 퀘스트를 발행할 수 있는 UX 제공.

로직과 UI의 완전한 분리: 향후 Vibe Coding을 통한 AI 자동화 연동 및 다양한 프론트엔드 환경(Web, App)으로의 확장을 위해 비즈니스 로직(평가, 보상 계산)과 렌더링 계층을 철저히 분리.

2. System Architecture (3-Layer Design)
시스템은 높은 응집도와 낮은 결합도를 유지하기 위해 다음 3개의 독립적인 계층으로 설계됩니다. 모든 퀘스트 데이터는 표준화된 JSON Schema를 기반으로 계층 간 이동합니다.

2.1 Layer 1: Quest Evaluator (Business Logic)
퀘스트의 달성 여부를 판별하고 최종 지급될 보상을 계산하는 순수 로직 계층입니다.

Input: 현재 퀘스트의 상태 데이터 (진행도, 달성 결과, 시간 등)

Process: 퀘스트 type 필드를 검사하여, 해당 타입에 맞는 검증기(Validator)를 호출. 조건 충족 여부 및 보너스 조건(Streak 등)을 포함한 최종 보상량(Amount) 산출.

Output: 보상 트랜잭션 객체 및 변경될 상태값.

2.2 Layer 2: State Manager (Store & Ledger)
부모와 아이 간의 비동기적 상호작용(요청-승인) 상태를 관리하고, 재화의 흐름을 기록하는 계층입니다.

Quest State: pending (대기) -> in_progress (진행 중) -> pending_approval (부모 승인 대기) -> completed / failed (종료).

Reward Ledger: 유저의 현재 잔액(Balance)을 단순 업데이트하지 않고, 획득 및 차감 내역을 기록하는 장부(Ledger) 형태로 트랜잭션 관리.

2.3 Layer 3: UI Component Factory (Presentation)
상태 관리자로부터 전달받은 JSON 데이터를 바탕으로 동적인 UI를 렌더링하는 계층입니다.

Factory Pattern을 적용하여 퀘스트 type에 따라 적절한 위젯/컴포넌트(ChecklistCard, ProgressCard, MilestoneCard 등)를 반환.

3. Recommended Directory Structure
프로젝트 확장을 고려한 도메인 주도(DDD) 관점의 폴더 구조 명세입니다. (적용 프레임워크에 맞게 변형 가능)

src/

domain/ (핵심 비즈니스 로직 및 타입 정의)

models/ (Quest, User, Ledger 타입 인터페이스)

evaluators/ (타입별 보상 계산 로직)

constants/ (퀘스트 타입 Enum, 상태값 Enum)

application/ (상태 관리 및 서비스 플로우)

store/ (전역 상태 관리 - Redux, Zustand, Riverpod 등)

services/ (데이터 페칭, 프리셋 로드, 트랜잭션 처리)

presentation/ (UI 렌더링 계층)

components/

quest-cards/ (타입별 개별 UI 컴포넌트)

QuestCardFactory (렌더링 분기 컴포넌트)

pages/ (대시보드, 퀘스트 생성 뷰 등)

infrastructure/ (외부 종속성)

db/ (로컬 DB 혹은 API 클라이언트)

presets/ (초기 템플릿 JSON 데이터)

4. Quest Data Flow & Lifecycle
Creation (생성): 부모가 Preset DB에서 아이 성향에 맞는 템플릿을 로드. 인자(보상량, 목표치)를 수정하여 퀘스트 인스턴스(JSON) 생성. 상태는 pending으로 초기화.

Execution (수행): 아이가 퀘스트를 수락하면 상태가 in_progress로 변경. 진행 상황(체크포인트 도달, 기록 갱신 등)이 config 필드에 업데이트됨.

Verification (검증 요청): 아이가 목표를 달성했다고 체크하면 상태가 pending_approval로 변경.

Evaluation & Reward (평가 및 보상): 부모가 승인하면 Quest Evaluator가 최종 보상을 계산. Reward Ledger에 내역이 기록되고 상태는 completed로 전환.

페이지 1 출력이 완료되었습니다.