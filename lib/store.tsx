"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  memorySpaces as initialMemorySpaces,
  mockUser,
  promptDrafts as initialPromptDrafts,
  promptTemplates as initialPromptTemplates
} from "./mock-data";
import type {
  AuditStatus,
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
};

type AppState = {
  user: User;
  isAuthenticated: boolean;
  currentMemoryId: string;
  memorySpaces: MemorySpace[];
  templates: PromptTemplate[];
  promptDrafts: PromptDraft[];
  reviewSubmissions: ReviewSubmission[];
  shareCampaigns: ShareCampaign[];
  login: (account: string) => void;
  logout: () => void;
  setCurrentMemoryId: (id: string) => void;
  recharge: (amount: number, bonus: number) => void;
  savePromptDraft: (draft: PromptDraft) => void;
  uploadTemplate: (template: UploadTemplateInput) => PromptTemplate;
  updateTemplateStatus: (id: string, status: AuditStatus) => void;
  importTemplateToMemory: (templateId: string, memoryId: string) => void;
  submitReviewLink: (input: { type: "post"; title: string; link: string }) => void;
  updateNickname: (nickname: string) => void;
  ensureShareCampaign: (memoryId: string) => ShareCampaign;
  recordShareVisit: (code: string) => string;
  recordShareActivation: (code: string, visitorId: string) => void;
  recordShareEffectiveUse: (code: string, visitorId: string) => void;
};

const STORAGE_KEY = "companion-platform-state-v1";

const AppContext = createContext<AppState | null>(null);

type PersistedState = {
  user: User;
  isAuthenticated: boolean;
  currentMemoryId: string;
  templates: PromptTemplate[];
  promptDrafts: PromptDraft[];
  reviewSubmissions: ReviewSubmission[];
  shareCampaigns: ShareCampaign[];
};

const defaultState: PersistedState = {
  user: mockUser,
  isAuthenticated: false,
  currentMemoryId: initialMemorySpaces[0].id,
  templates: initialPromptTemplates,
  promptDrafts: initialPromptDrafts,
  reviewSubmissions: [],
  shareCampaigns: []
};

function createShareCode(memoryId: string) {
  const suffix = memoryId.replace("memory-", "").slice(0, 4).toUpperCase();
  return `SOUL-${suffix}-${new Date().getFullYear()}`;
}

function buildShareCampaign(memoryId: string): ShareCampaign {
  const memory = initialMemorySpaces.find((item) => item.id === memoryId) ?? initialMemorySpaces[0];
  return {
    code: createShareCode(memory.id),
    memorySpaceId: memory.id,
    title: `${memory.name}分享链接`,
    summary: `${memory.name} · ${memory.description}`,
    visits: 0,
    activatedVisitorIds: [],
    effectiveVisitorIds: []
  };
}

function hydrateShareCampaigns(campaigns: ShareCampaign[]) {
  if (campaigns.length > 0) {
    return campaigns;
  }

  return initialMemorySpaces.map((memory) => buildShareCampaign(memory.id));
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
      currentMemoryId: state.currentMemoryId,
      memorySpaces: initialMemorySpaces,
      templates: state.templates,
      promptDrafts: state.promptDrafts,
      reviewSubmissions: state.reviewSubmissions,
      shareCampaigns: state.shareCampaigns,
      login: (account: string) => {
        setState((current) => ({
          ...current,
          isAuthenticated: true,
          user: {
            ...current.user,
            email: account || current.user.email
          }
        }));
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
          personality: "稳定、克制，能根据上下文保持连续表达。",
          persona: template.description,
          archetype: "DeepSeek",
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
      ensureShareCampaign: (memoryId: string) => {
        const existing =
          state.shareCampaigns.find((item) => item.memorySpaceId === memoryId) ??
          state.shareCampaigns.find((item) => item.code === createShareCode(memoryId));
        if (existing) {
          return existing;
        }

        const nextCampaign = buildShareCampaign(memoryId);
        setState((current) => ({
          ...current,
          shareCampaigns: [nextCampaign, ...current.shareCampaigns]
        }));
        return nextCampaign;
      },
      recordShareVisit: (code: string) => {
        const currentCampaign = state.shareCampaigns.find((item) => item.code === code);
        const visitorId = `visitor-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

        if (!currentCampaign) {
          const memory =
            initialMemorySpaces.find((item) => createShareCode(item.id) === code) ?? initialMemorySpaces[0];
          const nextCampaign = {
            ...buildShareCampaign(memory.id),
            code,
            visits: 1,
            lastVisitedAt: new Date().toISOString()
          };

          setState((current) => ({
            ...current,
            shareCampaigns: [nextCampaign, ...current.shareCampaigns]
          }));
          return visitorId;
        }

        setState((current) => ({
          ...current,
          shareCampaigns: current.shareCampaigns.map((item) =>
            item.code === code
              ? {
                  ...item,
                  visits: item.visits + 1,
                  lastVisitedAt: new Date().toISOString()
                }
              : item
          )
        }));
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
