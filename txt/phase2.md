[Data Models & Typings] Quest & Reward Tracking System
⚠️ CRITICAL INSTRUCTION FOR AI AGENT:
Read and deeply understand the following data models and typings. This is Page 2 of a 4-part PRD. Store this context in your memory. When you generate code, explain your architecture, or provide any feedback based on this document, YOU MUST RESPOND IN KOREAN. (코드를 작성하거나 피드백을 제공할 때는 반드시 한국어로 대답할 것.)

1. Enums and Literal Types
To ensure strict type safety across the polymorphic quest system, we define the following literal types for Quest Types and Statuses.

TypeScript
// Represents the current lifecycle state of a quest
export type QuestStatus = 
  | 'pending'           // Created, but not yet started by the child
  | 'in_progress'       // Accepted and currently being worked on
  | 'pending_approval'  // Child claims completion, awaiting parent approval
  | 'completed'         // Approved and reward distributed
  | 'failed';           // Failed to meet the criteria or expired

// Represents the polymorphic category of the quest
export type QuestType = 
  | 'CHECKLIST'    // Simple boolean completion (e.g., Do chores)
  | 'PROGRESS'     // Accumulative target (e.g., Read for 30 mins)
  | 'CONDITIONAL'  // Outcome-based reward (e.g., Chess: win/draw/lose)
  | 'MILESTONE'    // Step-by-step checkpoints (e.g., Big block building)
  | 'RECORD';      // Beating a specific metric (e.g., Running faster than X secs)
2. Base Interfaces
All quests share a common set of metadata. This base interface will be extended by specific quest types.

TypeScript
export interface BaseQuest {
  id: string;               // Unique identifier for the quest instance
  presetId?: string;        // ID of the template used to create this quest (if any)
  assigneeId: string;       // ID of the child
  creatorId: string;        // ID of the parent/creator
  title: string;            // Display title
  description: string;      // Detailed instructions
  type: QuestType;          // Discriminator for the union type
  status: QuestStatus;      // Current state
  baseReward: number;       // Guaranteed reward upon minimal completion
  createdAt: string;        // ISO 8601 date string
  updatedAt: string;        // ISO 8601 date string
}
3. Polymorphic Quest Configurations
Each quest type requires different arguments to track progress and evaluate rewards.

TypeScript
// 1. Checklist Type: Simple true/false completion
export interface ChecklistQuest extends BaseQuest {
  type: 'CHECKLIST';
  config: {
    isCompleted: boolean;
  };
}

// 2. Progress Type: Needs to reach a specific numeric target
export interface ProgressQuest extends BaseQuest {
  type: 'PROGRESS';
  config: {
    targetValue: number;
    currentValue: number;
    unit: string;           // e.g., 'minutes', 'pages'
  };
}

// 3. Conditional Type: Reward depends on the final outcome
export interface ConditionalQuest extends BaseQuest {
  type: 'CONDITIONAL';
  config: {
    // e.g., { win: 500, draw: 100, lose: 50 }
    outcomeRewards: Record<string, number>; 
    selectedOutcome?: string; // Set by parent during approval
  };
}

// 4. Milestone Type: Checkpoints with partial rewards
export interface MilestoneQuest extends BaseQuest {
  type: 'MILESTONE';
  config: {
    totalSteps: number;
    currentStep: number;
    stepTitles?: string[];    // Optional labels for each step
    stepRewards: number[];    // Reward amount for reaching each step index
    finalBonus: number;       // Extra reward for completing all steps
  };
}

// 5. Record Type: Beating a past record or reaching a metric threshold
export interface RecordQuest extends BaseQuest {
  type: 'RECORD';
  config: {
    targetRecord: number;
    currentRecord?: number;
    unit: string;             // e.g., 'seconds', 'laps'
    successBonus: number;     // Additional reward if target is beaten
    isLowerBetter: boolean;   // true for time(seconds), false for count(laps)
  };
}

// Discriminated Union for frontend UI Factory and Backend Evaluator
export type Quest = 
  | ChecklistQuest 
  | ProgressQuest 
  | ConditionalQuest 
  | MilestoneQuest 
  | RecordQuest;
4. Reward Ledger System
Do not simply overwrite a user.balance field. Use a ledger system to track the history of earned and spent rewards, which provides better motivation for the child and auditing for the parent.

TypeScript
export type TransactionType = 'EARN' | 'SPEND' | 'PENALTY';

export interface RewardTransaction {
  transactionId: string;
  userId: string;           // The child who earned/spent
  questId?: string;         // The quest associated with this transaction (if applicable)
  amount: number;           // Positive or negative number
  type: TransactionType;
  description: string;      // e.g., "Chess win bonus", "Bought a Roblox skin"
  timestamp: string;        // ISO 8601 date string
}

// The user's current balance should be a computed property derived from:
// SELECT SUM(amount) FROM RewardTransaction WHERE userId = '...'
페이지 2 출력이 완료되었습니다.