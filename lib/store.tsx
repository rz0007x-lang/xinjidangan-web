"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  memorySpaces as initialMemorySpaces,
  mockUser,
  promptDrafts as initialPromptDrafts,
  promptTemplates as initialPromptTemplates
} from "./mock-data";
import type { AuditStatus, MemorySpace, PromptDraft, PromptTemplate, User } from "./types";

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
  login: (account: string) => void;
  logout: () => void;
  setCurrentMemoryId: (id: string) => void;
  recharge: (amount: number, bonus: number) => void;
  savePromptDraft: (draft: PromptDraft) => void;
  uploadTemplate: (template: UploadTemplateInput) => PromptTemplate;
  updateTemplateStatus: (id: string, status: AuditStatus) => void;
  importTemplateToMemory: (templateId: string, memoryId: string) => void;
};

const STORAGE_KEY = "companion-platform-state-v1";

const AppContext = createContext<AppState | null>(null);

type PersistedState = {
  user: User;
  isAuthenticated: boolean;
  currentMemoryId: string;
  templates: PromptTemplate[];
  promptDrafts: PromptDraft[];
};

const defaultState: PersistedState = {
  user: mockUser,
  isAuthenticated: false,
  currentMemoryId: initialMemorySpaces[0].id,
  templates: initialPromptTemplates,
  promptDrafts: initialPromptDrafts
};

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<PersistedState>(defaultState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as PersistedState;
        setState({
          ...defaultState,
          ...parsed,
          user: { ...defaultState.user, ...parsed.user }
        });
      } catch {
        setState(defaultState);
      }
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  }, [hydrated, state]);

  const value = useMemo<AppState>(
    () => ({
      user: state.user,
      isAuthenticated: state.isAuthenticated,
      currentMemoryId: state.currentMemoryId,
      memorySpaces: initialMemorySpaces,
      templates: state.templates,
      promptDrafts: state.promptDrafts,
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
          templateName: template.name,
          systemPrompt: template.systemPrompt,
          personaPrompt: template.personaPrompt,
          temperature: 0.62,
          maxTokens: 900
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
