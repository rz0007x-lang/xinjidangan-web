export type AuditStatus = "pending" | "approved" | "rejected";

export type User = {
  id: string;
  nickname: string;
  avatar: string;
  membership: "Free" | "Plus" | "Pro";
  balance: number;
  email: string;
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
  createdAt: string;
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
  templateName: string;
  systemPrompt: string;
  personaPrompt: string;
  temperature: number;
  maxTokens: number;
};
