[Business Logic & Evaluator] Quest & Reward Tracking System
⚠️ CRITICAL INSTRUCTION FOR AI AGENT:
Read and deeply understand the following business logic and evaluator specifications. This is Page 3 of a 4-part PRD. Store this context in your memory. When you generate code, explain your architecture, or provide any feedback based on this document, YOU MUST RESPOND IN KOREAN. (코드를 작성하거나 피드백을 제공할 때는 반드시 한국어로 대답할 것.)

1. Quest Evaluator Design
The QuestEvaluator is a pure business logic module. Its primary responsibility is to determine if a quest has met its completion criteria and to calculate the final reward amount based on the quest's specific polymorphic type. It must be decoupled from UI and Database logic.

TypeScript
// Core Evaluator Interface
export class QuestEvaluator {
  
  /**
   * Evaluates the quest and returns the final calculated reward amount.
   * Throws an error if the quest has not met the completion conditions.
   */
  public static calculateFinalReward(quest: Quest): number {
    switch (quest.type) {
      case 'CHECKLIST':
        return this.evaluateChecklist(quest);
      case 'PROGRESS':
        return this.evaluateProgress(quest);
      case 'CONDITIONAL':
        return this.evaluateConditional(quest);
      case 'MILESTONE':
        return this.evaluateMilestone(quest);
      case 'RECORD':
        return this.evaluateRecord(quest);
      default:
        throw new Error(`Unknown quest type: ${(quest as any).type}`);
    }
  }

  // Type-specific logic:
  
  private static evaluateChecklist(quest: ChecklistQuest): number {
    if (!quest.config.isCompleted) {
      throw new Error("Checklist quest is not marked as completed.");
    }
    return quest.baseReward;
  }

  private static evaluateProgress(quest: ProgressQuest): number {
    if (quest.config.currentValue < quest.config.targetValue) {
      throw new Error("Progress quest has not reached the target value.");
    }
    return quest.baseReward;
  }

  private static evaluateConditional(quest: ConditionalQuest): number {
    const outcome = quest.config.selectedOutcome;
    if (!outcome || !quest.config.outcomeRewards[outcome]) {
      throw new Error("A valid outcome must be selected by the parent.");
    }
    return quest.config.outcomeRewards[outcome]; // e.g., win = 500, draw = 100
  }

  private static evaluateMilestone(quest: MilestoneQuest): number {
    if (quest.config.currentStep < quest.config.totalSteps) {
      throw new Error("All milestones must be reached for final completion.");
    }
    // Partial step rewards are handled during state transitions.
    // Upon final completion, return the baseReward + finalBonus.
    return quest.baseReward + quest.config.finalBonus;
  }

  private static evaluateRecord(quest: RecordQuest): number {
    if (quest.config.currentRecord === undefined) {
      throw new Error("Current record must be submitted.");
    }
    
    let isSuccess = false;
    if (quest.config.isLowerBetter) {
      // e.g., Running (lower time is better)
      isSuccess = quest.config.currentRecord <= quest.config.targetRecord;
    } else {
      // e.g., Hanging on a bar (higher time is better)
      isSuccess = quest.config.currentRecord >= quest.config.targetRecord;
    }

    return isSuccess ? (quest.baseReward + quest.config.successBonus) : quest.baseReward;
  }
}
2. State Transition Management
To prevent data corruption and unauthorized changes, quest state transitions must strictly follow this state machine pattern. This should be implemented as a service or a state machine hook (e.g., QuestStateMachine).

TypeScript
export class QuestStateMachine {
  
  // 1. Child accepts the quest
  public static startQuest(quest: Quest): Quest {
    if (quest.status !== 'pending') throw new Error("Can only start pending quests.");
    return { ...quest, status: 'in_progress', updatedAt: new Date().toISOString() };
  }

  // 2. Child submits for review
  public static requestApproval(quest: Quest): Quest {
    if (quest.status !== 'in_progress') throw new Error("Only in-progress quests can request approval.");
    return { ...quest, status: 'pending_approval', updatedAt: new Date().toISOString() };
  }

  // 3. Parent approves (Triggers Evaluator & Ledger)
  public static approveQuest(quest: Quest): { updatedQuest: Quest, rewardToIssue: number } {
    if (quest.status !== 'pending_approval') throw new Error("Only pending_approval quests can be approved.");
    
    // Validates and calculates reward based on the quest type
    const rewardToIssue = QuestEvaluator.calculateFinalReward(quest);
    
    const updatedQuest: Quest = {
      ...quest,
      status: 'completed',
      updatedAt: new Date().toISOString()
    };

    return { updatedQuest, rewardToIssue };
  }

  // 4. Parent rejects (Sends back to child)
  public static rejectQuest(quest: Quest, feedback: string): Quest {
    if (quest.status !== 'pending_approval') throw new Error("Can only reject pending_approval quests.");
    // Optionally log the feedback somewhere
    return { ...quest, status: 'in_progress', updatedAt: new Date().toISOString() };
  }
}
3. Transaction/Ledger Service
Once approveQuest calculates the rewardToIssue, the system must dispatch a transaction to the Ledger.

TypeScript
export class LedgerService {
  /**
   * Generates a transaction record. Do NOT just update a balance integer.
   * This ensures an immutable history of earnings.
   */
  public static issueRewardTransaction(quest: Quest, amount: number): RewardTransaction {
    return {
      transactionId: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: quest.assigneeId,
      questId: quest.id,
      amount: amount,
      type: 'EARN',
      description: `Quest Completed: ${quest.title}`,
      timestamp: new Date().toISOString()
    };
  }
}