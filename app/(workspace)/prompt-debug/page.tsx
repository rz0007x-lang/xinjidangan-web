"use client";

import { FormEvent, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { Bot, Save, Send, UserRound } from "lucide-react";
import { MemorySwitcher } from "@/components/MemorySwitcher";
import { Badge, Button, Card, SectionHeader, textareaClass } from "@/components/ui";
import { useAppState, useCurrentMemory } from "@/lib/store";
import type { PromptDraft } from "@/lib/types";

type ChatMessage = {
  role: "user" | "ai";
  content: string;
};

const baseModelOptions = ["DeepSeek", "Kimi", "Doubao", "Qwen", "GPT-4o"];

export default function PromptDebugPage() {
  return (
    <Suspense fallback={<PromptDebugFallback />}>
      <PromptDebugContent />
    </Suspense>
  );
}

function PromptDebugFallback() {
  return (
    <div className="mx-auto max-w-7xl">
      <Card className="p-6 text-sm text-ink/56">正在加载提示词调试页...</Card>
    </div>
  );
}

function PromptDebugContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const importedTemplateId = searchParams.get("template");
  const {
    currentMemoryId,
    memorySpaces,
    promptMemories,
    promptPersonas,
    templates,
    promptDrafts,
    savePromptDraft,
    importTemplateToMemory
  } = useAppState();
  const currentMemory = useCurrentMemory();
  const currentDraft = useMemo(
    () => promptDrafts.find((draft) => draft.memorySpaceId === currentMemoryId),
    [currentMemoryId, promptDrafts]
  );

  const [draft, setDraft] = useState<PromptDraft>(() => currentDraft ?? promptDrafts[0]);
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState<ChatMessage[]>([
    {
      role: "ai",
      content: "可以发送一条测试消息。我会基于当前记忆体设定返回 mock 回复。"
    }
  ]);
  const [saved, setSaved] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [fieldError, setFieldError] = useState("");
  const importedRef = useRef<string | null>(null);

  const availableMemories = useMemo(
    () => promptMemories.filter((item) => item.personaId === draft.personaId),
    [draft.personaId, promptMemories]
  );
  const linkedMemorySpace = useMemo(
    () => memorySpaces.find((item) => item.id === draft.linkedMemorySpaceId) ?? currentMemory,
    [currentMemory, draft.linkedMemorySpaceId, memorySpaces]
  );

  function updateDraft<K extends keyof PromptDraft>(key: K, value: PromptDraft[K], maxLength: number, label: string) {
    const normalized = typeof value === "string" ? value.slice(0, maxLength) : value;
    if (typeof value === "string" && value.length > maxLength) {
      setFieldError(`${label}最多支持 ${maxLength} 个字符，请精简后再保存。`);
    } else {
      setFieldError("");
    }

    setDraft((current) => ({ ...current, [key]: normalized }));
    setHasUnsavedChanges(true);
    setSaved(false);
  }

  useEffect(() => {
    const nextDraft = promptDrafts.find((item) => item.memorySpaceId === currentMemoryId);
    if (nextDraft) {
      setDraft({ ...nextDraft, memoryName: currentMemory.name });
      setSaved(false);
      setHasUnsavedChanges(false);
      setFieldError("");
      setChat([
        {
          role: "ai",
          content: `已切换到「${currentMemory.name}」。当前记忆体命名已同步为「${currentMemory.name}」。`
        }
      ]);
    }
  }, [currentMemory.id, currentMemory.name, currentMemoryId, promptDrafts]);

  useEffect(() => {
    if (importedTemplateId && importedRef.current !== importedTemplateId) {
      importedRef.current = importedTemplateId;
      importTemplateToMemory(importedTemplateId, currentMemoryId);
    }
  }, [currentMemoryId, importedTemplateId, importTemplateToMemory]);

  useEffect(() => {
    function handleBeforeUnload(event: BeforeUnloadEvent) {
      if (!hasUnsavedChanges) return;
      event.preventDefault();
      event.returnValue = "";
    }

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  function confirmLeave() {
    if (!hasUnsavedChanges) return true;
    return window.confirm("当前提示词还有未保存修改，确定要离开吗？");
  }

  function applyPersona(personaId: string) {
    const nextPersona = promptPersonas.find((item) => item.id === personaId);
    if (!nextPersona) return;
    const nextMemory =
      promptMemories.find((item) => item.personaId === personaId) ??
      promptMemories.find((item) => item.id === draft.promptMemoryId);

    if (!nextMemory) return;

    setDraft((current) => ({
      ...current,
      personaId: nextPersona.id,
      personaName: nextPersona.name,
      promptMemoryId: nextMemory.id,
      promptMemoryName: nextMemory.name,
      promptMemorySnippet: nextMemory.memorySnippet,
      tone: nextPersona.tone,
      personality: nextPersona.personality,
      persona: nextPersona.persona,
      archetype: nextPersona.archetype,
      backstory: nextPersona.backstory
    }));
    setHasUnsavedChanges(true);
    setSaved(false);
  }

  function applyPromptMemory(promptMemoryId: string) {
    const nextMemory = promptMemories.find((item) => item.id === promptMemoryId);
    if (!nextMemory) return;

    setDraft((current) => ({
      ...current,
      promptMemoryId: nextMemory.id,
      promptMemoryName: nextMemory.name,
      promptMemorySnippet: nextMemory.memorySnippet
    }));
    setHasUnsavedChanges(true);
    setSaved(false);
  }

  function applyLinkedMemorySpace(linkedMemorySpaceId: string) {
    const nextMemorySpace = memorySpaces.find((item) => item.id === linkedMemorySpaceId);
    if (!nextMemorySpace) return;

    setDraft((current) => ({
      ...current,
      linkedMemorySpaceId: nextMemorySpace.id
    }));
    setHasUnsavedChanges(true);
    setSaved(false);
  }

  function handleChat(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = message.trim();
    if (!trimmed) return;
    setMessage("");
    setChat((current) => [
      ...current,
      { role: "user", content: trimmed },
      {
        role: "ai",
        content: `现在是「${draft.personaName} + ${draft.promptMemoryName}」这组设定，并引用「${linkedMemorySpace.name}」的记忆体。我会用${draft.tone.slice(0, 12)}的语气回应，并参考这段记忆：${draft.promptMemorySnippet.slice(0, 34)}。就这条消息看，当前最该接住的是：${trimmed.slice(0, 36)}。`
      }
    ]);
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
        <SectionHeader
          eyebrow="Union Soul Workspace"
          title="提示词调试"
          description="这里按“人设 persona + 绑定记忆体”来调试角色；切换人设后，可继续挑选该人设对应的不同记忆体。"
          action={<MemorySwitcher compact onBeforeChange={() => confirmLeave()} />}
        />

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.08fr)_minmax(380px,0.92fr)] xl:items-stretch">
          <Card className="flex min-h-[760px] flex-col p-6">
            <div className="mb-6 flex flex-col gap-3 border-b border-line/80 pb-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h2 className="font-editorial text-[28px] text-ink">编辑区</h2>
                <p className="mt-1 text-sm leading-6 text-ink/56">当前记忆体：{currentMemory.name}</p>
              </div>
            </div>

            <div className="grid flex-1 content-start gap-5 md:grid-cols-2">
              <label className="md:col-span-2">
                <span className="mb-2 block text-sm font-medium text-ink/72">记忆体命名</span>
                <textarea
                  className={`${textareaClass} min-h-0 h-12 resize-none overflow-hidden`}
                  value={draft.memoryName}
                  readOnly
                />
                <p className="mt-2 text-xs text-ink/48">记忆体命名会自动跟随当前选中的记忆体。</p>
              </label>
              <label>
                <span className="mb-2 block text-sm font-medium text-ink/72">角色 / Persona</span>
                <select
                  className="min-h-12 w-full rounded-[14px] border border-line bg-white/72 px-3 py-2 text-sm text-ink outline-none transition focus:border-sage focus:ring-2 focus:ring-sage/15"
                  value={draft.personaId}
                  onChange={(event) => applyPersona(event.target.value)}
                >
                  {promptPersonas.map((persona) => (
                    <option key={persona.id} value={persona.id}>
                      {persona.name}
                    </option>
                  ))}
                </select>
                <p className="mt-2 text-xs leading-5 text-ink/48">
                  {promptPersonas.find((item) => item.id === draft.personaId)?.summary}
                </p>
              </label>
              <label>
                <span className="mb-2 block text-sm font-medium text-ink/72">绑定记忆体</span>
                <select
                  className="min-h-12 w-full rounded-[14px] border border-line bg-white/72 px-3 py-2 text-sm text-ink outline-none transition focus:border-sage focus:ring-2 focus:ring-sage/15"
                  value={draft.promptMemoryId}
                  onChange={(event) => applyPromptMemory(event.target.value)}
                >
                  {availableMemories.map((memory) => (
                    <option key={memory.id} value={memory.id}>
                      {memory.name}
                    </option>
                  ))}
                </select>
                <p className="mt-2 text-xs leading-5 text-ink/48">
                  {availableMemories.find((item) => item.id === draft.promptMemoryId)?.summary}
                </p>
              </label>
              <label>
                <span className="mb-2 block text-sm font-medium text-ink/72">语气</span>
                <textarea
                  className={`${textareaClass} min-h-32`}
                  value={draft.tone}
                  onChange={(event) => updateDraft("tone", event.target.value, 80, "语气")}
                />
              </label>
              <label>
                <span className="mb-2 block text-sm font-medium text-ink/72">性格</span>
                <textarea
                  className={`${textareaClass} min-h-32`}
                  value={draft.personality}
                  onChange={(event) => updateDraft("personality", event.target.value, 120, "性格")}
                />
              </label>
              <label>
                <span className="mb-2 block text-sm font-medium text-ink/72">人设</span>
                <textarea
                  className={`${textareaClass} min-h-36`}
                  value={draft.persona}
                  onChange={(event) => updateDraft("persona", event.target.value, 220, "人设")}
                />
              </label>
              <label>
                <span className="mb-2 block text-sm font-medium text-ink/72">基模</span>
                <select
                  className="min-h-12 w-full rounded-[14px] border border-line bg-white/72 px-3 py-2 text-sm text-ink outline-none transition focus:border-sage focus:ring-2 focus:ring-sage/15"
                  value={draft.archetype}
                  onChange={(event) => {
                    setDraft((current) => ({ ...current, archetype: event.target.value }));
                    setHasUnsavedChanges(true);
                    setSaved(false);
                  }}
                >
                  {baseModelOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
              <label className="md:col-span-2">
                <span className="mb-2 block text-sm font-medium text-ink/72">记忆体选择</span>
                <select
                  className="min-h-12 w-full rounded-[14px] border border-line bg-white/72 px-3 py-2 text-sm text-ink outline-none transition focus:border-sage focus:ring-2 focus:ring-sage/15"
                  value={draft.linkedMemorySpaceId}
                  onChange={(event) => applyLinkedMemorySpace(event.target.value)}
                >
                  {memorySpaces.map((memorySpace) => (
                    <option key={memorySpace.id} value={memorySpace.id}>
                      {memorySpace.name}
                    </option>
                  ))}
                </select>
                <p className="mt-2 text-xs leading-5 text-ink/48">
                  当前智能体设定会读取「{linkedMemorySpace.name}」这份记忆体。你可以切换成小U或其他智能体的记忆体。
                </p>
              </label>
              <label className="md:col-span-2">
                <span className="mb-2 block text-sm font-medium text-ink/72">系统提示词 / 背景设定</span>
                <textarea
                  className={`${textareaClass} min-h-40`}
                  value={draft.backstory}
                  onChange={(event) => updateDraft("backstory", event.target.value, 12000, "系统提示词")}
                />
              </label>
            </div>
            {fieldError ? <p className="mt-4 text-sm text-red-500">{fieldError}</p> : null}
            {hasUnsavedChanges ? <p className="mt-3 text-sm text-amber-600">当前有未保存修改，离开页面前建议先保存。</p> : null}

            <div className="mt-6 flex flex-col gap-3 border-t border-line/80 pt-5 sm:flex-row sm:items-center sm:justify-end">
              <Button
                variant="secondary"
                className="w-full sm:w-auto"
                onClick={() => {
                  if (confirmLeave()) {
                    router.push("/home");
                  }
                }}
              >
                返回工作台
              </Button>
              <Button
                className="w-full sm:w-auto"
                onClick={() => {
                  savePromptDraft({ ...draft, memorySpaceId: currentMemoryId, memoryName: currentMemory.name, linkedMemorySpaceId: draft.linkedMemorySpaceId });
                  setSaved(true);
                  setHasUnsavedChanges(false);
                }}
              >
                <Save className="h-4 w-4" />
                保存到当前记忆体
              </Button>
            </div>
            {saved ? <p className="mt-3 text-sm text-sage">已保存「{draft.personaName} + {draft.promptMemoryName}」到「{currentMemory.name}」。</p> : null}
          </Card>

          <Card className="flex min-h-[760px] flex-col overflow-hidden p-6">
            <div className="border-b border-line/80 pb-5">
              <h2 className="font-editorial text-[28px] text-ink">调试聊天</h2>
              <p className="mt-1 text-sm leading-6 text-ink/56">模拟对话会同时参考当前 persona 字段和所选记忆体内容。</p>
            </div>
            <div className="flex-1 space-y-4 overflow-y-auto py-5">
              {chat.map((item, index) => {
                const ai = item.role === "ai";
                return (
                  <div key={`${item.role}-${index}`} className={`flex gap-3 ${ai ? "" : "justify-end"}`}>
                    {ai ? (
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[14px] bg-sage text-white">
                        <Bot className="h-4 w-4" />
                      </span>
                    ) : null}
                    <div
                      className={`max-w-[82%] rounded-[18px] px-3 py-2 text-sm leading-6 ${
                        ai ? "bg-mist text-ink/76" : "bg-sage text-white"
                      }`}
                    >
                      {item.content}
                    </div>
                    {!ai ? (
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[14px] bg-clay text-white">
                        <UserRound className="h-4 w-4" />
                      </span>
                    ) : null}
                  </div>
                );
              })}
            </div>
            <form className="flex gap-2 border-t border-line/80 pt-5" onSubmit={handleChat}>
              <input
                className="min-h-10 flex-1 rounded-[18px] border border-line bg-white/94 px-3 text-sm outline-none focus:border-sage"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="输入测试消息"
              />
              <Button type="submit" className="px-3" aria-label="发送测试消息">
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </Card>
        </div>
    </div>
  );
}
