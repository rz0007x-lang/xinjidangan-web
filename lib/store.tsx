"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  demoAccounts as initialDemoAccounts,
  memorySpaces as initialMemorySpaces,
  mockUser,
  promptDrafts as initialPromptDrafts,
  promptTemplates as initialPromptTemplates
} from "./mock-data";
import type {
  AuditStatus,
  DemoAccount,
  MemorySpace,
  PromptDraft,
  PromptTemplate,
  ReviewSubmission,
  ShareCampaign,
  User
} from "./types";

type UploadTemplateInput = {
  name: string;
  description: string;
  tags: string[];
  systemPrompt: string;
  personaPrompt: string;
  defaultArchetype?: string;
  defaultPersonality?: string;
  starterGreeting?: string;
};

type AppState = {
  user: User;
  isAuthenticated: boolean;
  hasHydratedStorage: boolean;
  demoAccounts: DemoAccount[];
  currentMemoryId: string;
  memorySpaces: MemorySpace[];
  templates: PromptTemplate[];
  promptDrafts: PromptDraft[];
  reviewSubmissions: ReviewSubmission[];
  shareCampaigns: ShareCampaign[];
  inboxReadMessageIds: string[];
  login: (account: string, password: string) => { ok: boolean; reason?: "account_not_found" | "wrong_password" | "account_disabled" };
  registerDemoAccount: (account: string, password: string) => { ok: boolean; reason?: "account_exists" };
  resetDemoPassword: (account: string, password: string) => { ok: boolean; reason?: "account_not_found" };
  logout: () => void;
  setCurrentMemoryId: (id: string) => void;
  recharge: (amount: number, bonus: number) => void;
  savePromptDraft: (draft: PromptDraft) => void;
  uploadTemplate: (template: UploadTemplateInput) => PromptTemplate;
  updateTemplateStatus: (id: string, status: AuditStatus) => void;
  importTemplateToMemory: (templateId: string, memoryId: string) => void;
  submitReviewLink: (input: { type: "post"; title: string; link: string }) => void;
  updateNickname: (nickname: string) => void;
  ensureShareCampaign: (memoryId: string, templateId: string) => ShareCampaign;
  recordShareVisit: (code: string) => string;
  recordShareActivation: (code: string, visitorId: string) => void;
  recordShareEffectiveUse: (code: string, visitorId: string) => void;
  markInboxMessageRead: (messageId: string) => void;
  markAllInboxMessagesRead: (messageIds: string[]) => void;
};

const STORAGE_KEY = "companion-platform-state-v1";

const AppContext = createContext<AppState | null>(null);

type PersistedState = {
  user: User;
  isAuthenticated: boolean;
  demoAccounts: DemoAccount[];
  currentMemoryId: string;
  templates: PromptTemplate[];
  promptDrafts: PromptDraft[];
  reviewSubmissions: ReviewSubmission[];
  shareCampaigns: ShareCampaign[];
  inboxReadMessageIds: string[];
};

const defaultState: PersistedState = {
  user: mockUser,
  isAuthenticated: false,
  demoAccounts: initialDemoAccounts,
  currentMemoryId: initialMemorySpaces[0].id,
  templates: initialPromptTemplates,
  promptDrafts: initialPromptDrafts,
  reviewSubmissions: [],
  shareCampaigns: [],
  inboxReadMessageIds: []
};

function createShareCode(memoryId: string, templateId: string) {
  const memorySuffix = memoryId.replace("memory-", "").slice(0, 4).toUpperCase();
  const templateSuffix = templateId.replace("tpl-", "").replace("official-", "").slice(0, 4).toUpperCase();
  return `SOUL-${memorySuffix}-${templateSuffix}-${new Date().getFullYear()}`;
}

function normalizeAccount(account: string) {
  return account.trim().toLowerCase();
}

function buildShareCampaign(memoryId: string, templateId: string): ShareCampaign {
  const memory = initialMemorySpaces.find((item) => item.id === memoryId) ?? initialMemorySpaces[0];
  const template = initialPromptTemplates.find((item) => item.id === templateId) ?? initialPromptTemplates[0];
  return {
    code: createShareCode(memory.id, template.id),
    memorySpaceId: memory.id,
    templateId: template.id,
    templateName: template.name,
    title: `${template.name}分享链接`,
    summary: `${template.name} · ${template.description}`,
    visits: 0,
    activatedVisitorIds: [],
    effectiveVisitorIds: []
  };
}

function hydrateShareCampaigns(campaigns: ShareCampaign[]) {
  if (campaigns.length > 0) {
    return campaigns;
  }

  return initialMemorySpaces.map((memory) => buildShareCampaign(memory.id, initialPromptTemplates[0].id));
}

function normalizePromptDrafts(drafts: PromptDraft[]) {
  return drafts.map((draft) => {
    const fallback = initialPromptDrafts.find((item) => item.memorySpaceId === draft.memorySpaceId);
    return {
      ...fallback,
      ...draft
    } as PromptDraft;
  });
}

function buildInitialState() {
  return {
    ...defaultState,
    shareCampaigns: hydrateShareCampaigns(defaultState.shareCampaigns)
  };
}

function mergePersistedState(parsed: PersistedState) {
  return {
    ...defaultState,
    ...parsed,
    user: { ...defaultState.user, ...parsed.user },
    promptDrafts: normalizePromptDrafts(parsed.promptDrafts ?? defaultState.promptDrafts),
    shareCampaigns: hydrateShareCampaigns(parsed.shareCampaigns ?? defaultState.shareCampaigns)
  };
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<PersistedState>(buildInitialState);
  const [hasHydratedStorage, setHasHydratedStorage] = useState(false);

  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      setHasHydratedStorage(true);
      return;
    }

    try {
      const parsed = JSON.parse(raw) as PersistedState;
      setState(mergePersistedState(parsed));
    } catch {
      // Ignore malformed local state and fall back to defaults.
    } finally {
      setHasHydratedStorage(true);
    }
  }, []);

  useEffect(() => {
    if (!hasHydratedStorage) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [hasHydratedStorage, state]);

  const value = useMemo<AppState>(
    () => ({
      user: state.user,
      isAuthenticated: state.isAuthenticated,
      hasHydratedStorage,
      demoAccounts: state.demoAccounts,
      currentMemoryId: state.currentMemoryId,
      memorySpaces: initialMemorySpaces,
      templates: state.templates,
      promptDrafts: state.promptDrafts,
      reviewSubmissions: state.reviewSubmissions,
      shareCampaigns: state.shareCampaigns,
      inboxReadMessageIds: state.inboxReadMessageIds,
      login: (account: string, password: string) => {
        const normalizedAccount = normalizeAccount(account);
        const normalizedPassword = password.trim();
        const existingAccount = state.demoAccounts.find((item) => normalizeAccount(item.account) === normalizedAccount);

        if (!existingAccount) {
          return { ok: false as const, reason: "account_not_found" as const };
        }

        if (existingAccount.disabled) {
          return { ok: false as const, reason: "account_disabled" as const };
        }

        if (existingAccount.password !== normalizedPassword) {
          return { ok: false as const, reason: "wrong_password" as const };
        }

        setState((current) => ({
          ...current,
          isAuthenticated: true,
          user: {
            ...current.user,
            email: existingAccount.account
          }
        }));

        return { ok: true as const };
      },
      registerDemoAccount: (account: string, password: string) => {
        const normalizedAccount = normalizeAccount(account);
        const exists = state.demoAccounts.some((item) => normalizeAccount(item.account) === normalizedAccount);

        if (exists) {
          return { ok: false as const, reason: "account_exists" as const };
        }

        setState((current) => ({
          ...current,
          demoAccounts: [
            {
              account: account.trim(),
              password: password.trim(),
              createdAt: new Date().toISOString()
            },
            ...current.demoAccounts
          ]
        }));

        return { ok: true as const };
      },
      resetDemoPassword: (account: string, password: string) => {
        const normalizedAccount = normalizeAccount(account);
        const exists = state.demoAccounts.some((item) => normalizeAccount(item.account) === normalizedAccount);

        if (!exists) {
          return { ok: false as const, reason: "account_not_found" as const };
        }

        setState((current) => ({
          ...current,
          demoAccounts: current.demoAccounts.map((item) =>
            normalizeAccount(item.account) === normalizedAccount
              ? {
                  ...item,
                  password: password.trim()
                }
              : item
          )
        }));

        return { ok: true as const };
      },
      logout: () => {
        setState((current) => ({ ...current, isAuthenticated: false }));
      },
      setCurrentMemoryId: (id: string) => {
        setState((current) => ({ ...current, currentMemoryId: id }));
      },
      recharge: (amount: number, bonus: number) => {
        setState((current) => ({
          ...current,
          user: {
            ...current.user,
            balance: Number((current.user.balance + amount + bonus).toFixed(2))
          }
        }));
      },
      savePromptDraft: (draft: PromptDraft) => {
        setState((current) => ({
          ...current,
          promptDrafts: [
            ...current.promptDrafts.filter((item) => item.memorySpaceId !== draft.memorySpaceId),
            draft
          ]
        }));
      },
      uploadTemplate: (input: UploadTemplateInput) => {
        const template: PromptTemplate = {
          id: `tpl-local-${Date.now()}`,
          name: input.name,
          author: state.user.nickname,
          description: input.description,
          tags: input.tags,
          usageCount: 0,
          auditStatus: "pending",
          systemPrompt: input.systemPrompt,
          personaPrompt: input.personaPrompt,
          source: "user",
          defaultArchetype: input.defaultArchetype,
          defaultPersonality: input.defaultPersonality,
          starterGreeting: input.starterGreeting,
          createdAt: new Date().toISOString().slice(0, 10)
        };

        setState((current) => ({
          ...current,
          templates: [template, ...current.templates]
        }));
        return template;
      },
      updateTemplateStatus: (id: string, status: AuditStatus) => {
        setState((current) => ({
          ...current,
          templates: current.templates.map((template) =>
            template.id === id ? { ...template, auditStatus: status } : template
          )
        }));
      },
      importTemplateToMemory: (templateId: string, memoryId: string) => {
        const template = state.templates.find((item) => item.id === templateId);
        if (!template) return;

        const draft: PromptDraft = {
          memorySpaceId: memoryId,
          memoryName: template.name,
          tone: template.personaPrompt,
          personality: template.defaultPersonality ?? "稳定、克制，能根据上下文保持连续表达。",
          persona: template.description,
          archetype: template.defaultArchetype ?? "DeepSeek",
          backstory: template.systemPrompt
        };

        setState((current) => ({
          ...current,
          currentMemoryId: memoryId,
          templates: current.templates.map((item) =>
            item.id === templateId ? { ...item, usageCount: item.usageCount + 1 } : item
          ),
          promptDrafts: [
            ...current.promptDrafts.filter((item) => item.memorySpaceId !== memoryId),
            draft
          ]
        }));
      },
      submitReviewLink: ({ type, title, link }) => {
        const submission: ReviewSubmission = {
          id: `review-${Date.now()}`,
          type,
          title,
          link,
          submittedAt: new Date().toISOString(),
          status: "pending"
        };

        setState((current) => ({
          ...current,
          reviewSubmissions: [submission, ...current.reviewSubmissions]
        }));
      },
      updateNickname: (nickname: string) => {
        setState((current) => ({
          ...current,
          user: {
            ...current.user,
            nickname
          }
        }));
      },
      ensureShareCampaign: (memoryId: string, templateId: string) => {
        const existing =
          state.shareCampaigns.find((item) => item.memorySpaceId === memoryId && item.templateId === templateId) ??
          state.shareCampaigns.find((item) => item.code === createShareCode(memoryId, templateId));
        if (existing) {
          return existing;
        }

        const nextCampaign = buildShareCampaign(memoryId, templateId);
        setState((current) => ({
          ...current,
          shareCampaigns: [nextCampaign, ...current.shareCampaigns]
        }));
        return nextCampaign;
      },
      recordShareVisit: (code: string) => {
        const currentCampaign = state.shareCampaigns.find((item) => item.code === code);
        const expectedCampaign = initialMemorySpaces.flatMap((memory) =>
          state.templates.map((template) => ({
            memoryId: memory.id,
            templateId: template.id,
            code: createShareCode(memory.id, template.id)
          }))
        ).find((item) => item.code === code);

        if (!currentCampaign && !expectedCampaign) {
          return "";
        }

        const visitorId = `visitor-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const storageKey = `share-visit-${code}`;
        const nowIso = new Date().toISOString();

        if (typeof window !== "undefined" && window.sessionStorage.getItem(storageKey)) {
          return visitorId;
        }

        if (!currentCampaign && expectedCampaign) {
          const nextCampaign = {
            ...buildShareCampaign(expectedCampaign.memoryId, expectedCampaign.templateId),
            code,
            visits: 1,
            lastVisitedAt: nowIso
          };

          setState((current) => ({
            ...current,
            shareCampaigns: [nextCampaign, ...current.shareCampaigns]
          }));
          if (typeof window !== "undefined") {
            window.sessionStorage.setItem(storageKey, nowIso);
          }
          return visitorId;
        }

        setState((current) => ({
          ...current,
          shareCampaigns: current.shareCampaigns.map((item) =>
            item.code === code
              ? {
                  ...item,
                  visits: item.visits + 1,
                  lastVisitedAt: nowIso
                }
              : item
          )
        }));
        if (typeof window !== "undefined") {
          window.sessionStorage.setItem(storageKey, nowIso);
        }
        return visitorId;
      },
      recordShareActivation: (code: string, visitorId: string) => {
        setState((current) => ({
          ...current,
          shareCampaigns: current.shareCampaigns.map((item) =>
            item.code === code && !item.activatedVisitorIds.includes(visitorId)
              ? {
                  ...item,
                  activatedVisitorIds: [...item.activatedVisitorIds, visitorId],
                  lastActivatedAt: new Date().toISOString()
                }
              : item
          )
        }));
      },
      recordShareEffectiveUse: (code: string, visitorId: string) => {
        setState((current) => ({
          ...current,
          shareCampaigns: current.shareCampaigns.map((item) =>
            item.code === code && !item.effectiveVisitorIds.includes(visitorId)
              ? {
                  ...item,
                  effectiveVisitorIds: [...item.effectiveVisitorIds, visitorId],
                  lastEffectiveAt: new Date().toISOString()
                }
              : item
          )
        }));
      },
      markInboxMessageRead: (messageId: string) => {
        setState((current) =>
          current.inboxReadMessageIds.includes(messageId)
            ? current
            : {
                ...current,
                inboxReadMessageIds: [...current.inboxReadMessageIds, messageId]
              }
        );
      },
      markAllInboxMessagesRead: (messageIds: string[]) => {
        setState((current) => ({
          ...current,
          inboxReadMessageIds: Array.from(new Set([...current.inboxReadMessageIds, ...messageIds]))
        }));
      }
    }),
    [state]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppState() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppState must be used inside AppProvider");
  }
  return context;
}

export function useCurrentMemory() {
  const { currentMemoryId, memorySpaces } = useAppState();
  return memorySpaces.find((memory) => memory.id === currentMemoryId) ?? memorySpaces[0];
}
