export type AuditStatus = "pending" | "approved" | "rejected";

export type User = {
  id: string;
  nickname: string;
  avatar: string;
  membership: "Free" | "Plus" | "Pro";
  cashBalance: number;
  tokenBalance: number;
  email: string;
};

export type DemoAccount = {
  account: string;
  password: string;
  createdAt: string;
  disabled?: boolean;
};

export type ReviewSubmissionStatus = "pending" | "approved" | "rejected";

export type ReviewSubmission = {
  id: string;
  type: "post" | "invite";
  title: string;
  link: string;
  submittedAt: string;
  status: ReviewSubmissionStatus;
};

export type ShareCampaign = {
  code: string;
  memorySpaceId: string;
  templateId: string;
  templateName: string;
  title: string;
  summary: string;
  visits: number;
  activatedVisitorIds: string[];
  effectiveVisitorIds: string[];
  lastVisitedAt?: string;
  lastActivatedAt?: string;
  lastEffectiveAt?: string;
};

export type MemorySpace = {
  id: string;
  name: string;
  description: string;
  lastUpdated: string;
  tone: string;
};

export type PromptTemplate = {
  id: string;
  name: string;
  author: string;
  description: string;
  tags: string[];
  usageCount: number;
  auditStatus: AuditStatus;
  systemPrompt: string;
  personaPrompt: string;
  source?: "official" | "community" | "user";
  defaultArchetype?: string;
  defaultPersonality?: string;
  starterGreeting?: string;
  createdAt: string;
};

export type PromptPersonaPreset = {
  id: string;
  name: string;
  summary: string;
  tone: string;
  personality: string;
  persona: string;
  archetype: string;
  backstory: string;
};

export type PromptMemoryPreset = {
  id: string;
  personaId: string;
  name: string;
  summary: string;
  memorySnippet: string;
  lastUpdated: string;
};

export type MemoryItem = {
  id: string;
  memorySpaceId: string;
  date: string;
  title: string;
  summary: string;
  emotion: "calm" | "warm" | "conflict" | "growth";
  connections: string[];
};

export type MemoryAssistantDraft = {
  date: string;
  summary: string;
};

export type RechargePlan = {
  id: string;
  name: string;
  amount: number;
  bonus: number;
  description: string;
  badge?: string;
};

export type PromptDraft = {
  memorySpaceId: string;
  memoryName: string;
  linkedMemorySpaceId: string;
  personaId: string;
  personaName: string;
  promptMemoryId: string;
  promptMemoryName: string;
  promptMemorySnippet: string;
  tone: string;
  personality: string;
  persona: string;
  archetype: string;
  backstory: string;
};
