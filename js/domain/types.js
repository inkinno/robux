/**
 * @typedef {'pending' | 'in_progress' | 'pending_approval' | 'completed' | 'failed'} QuestStatus
 * @typedef {'CHECKLIST' | 'PROGRESS' | 'CONDITIONAL' | 'MILESTONE' | 'RECORD'} QuestType
 * 
 * @typedef {Object} BaseQuest
 * @property {string} id
 * @property {string} [presetId]
 * @property {string} title
 * @property {string} description
 * @property {QuestType} type
 * @property {QuestStatus} status
 * @property {number} baseReward
 * @property {string} createdAt
 * @property {string} updatedAt
 * 
 * @typedef {Object} ChecklistConfig
 * @property {boolean} isCompleted
 * 
 * @typedef {Object} ProgressConfig
 * @property {number} targetValue
 * @property {number} currentValue
 * @property {string} unit
 * 
 * @typedef {Object} ConditionalConfig
 * @property {Record<string, number>} outcomeRewards
 * @property {string|null} selectedOutcome
 * 
 * @typedef {Object} MilestoneConfig
 * @property {number} totalSteps
 * @property {number} currentStep
 * @property {string[]} [stepTitles]
 * @property {number[]} stepRewards
 * @property {number} finalBonus
 * 
 * @typedef {Object} RecordConfig
 * @property {number} targetRecord
 * @property {number|null} currentRecord
 * @property {string} unit
 * @property {number} successBonus
 * @property {boolean} isLowerBetter
 * 
 * @typedef {BaseQuest & { config: ChecklistConfig | ProgressConfig | ConditionalConfig | MilestoneConfig | RecordConfig }} Quest
 * 
 * @typedef {'EARN' | 'SPEND' | 'PENALTY'} TransactionType
 * 
 * @typedef {Object} RewardTransaction
 * @property {string} transactionId
 * @property {string} questId
 * @property {number} amount
 * @property {TransactionType} type
 * @property {string} description
 * @property {string} timestamp
 */

export {};
