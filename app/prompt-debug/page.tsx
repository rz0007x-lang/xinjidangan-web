"use client";

import { FormEvent, Suspense, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Bot, Download, Save, Send, SlidersHorizontal, UserRound } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { MemorySwitcher } from "@/components/MemorySwitcher";
import { Badge, Button, Card, SectionHeader, textareaClass } from "@/components/ui";
import { useAppState, useCurrentMemory } from "@/lib/store";
import type { PromptDraft } from "@/lib/types";

type ChatMessage = {
  role: "user" | "ai";
  content: string;
};

export default function PromptDebugPage() {
  return (
    <Suspense fallback={<PromptDebugFallback />}>
      <PromptDebugContent />
    </Suspense>
  );
}

function PromptDebugFallback() {
  return (
    <AppShell>
      <div className="mx-auto max-w-7xl">
        <Card className="p-6 text-sm text-ink/56">正在加载提示词调试页...</Card>
      </div>
    </AppShell>
  );
}

function PromptDebugContent() {
  const searchParams = useSearchParams();
  const importedTemplateId = searchParams.get("template");
  const {
    currentMemoryId,
    templates,
    promptDrafts,
    savePromptDraft,
    importTemplateToMemory
  } = useAppState();
  const currentMemory = useCurrentMemory();
  const approvedTemplates = templates.filter((template) => template.auditStatus === "approved");
  const currentDraft = useMemo(
    () => promptDrafts.find((draft) => draft.memorySpaceId === currentMemoryId),
    [currentMemoryId, promptDrafts]
  );

  const [draft, setDraft] = useState<PromptDraft>(() => currentDraft ?? promptDrafts[0]);
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState<ChatMessage[]>([
    {
      role: "ai",
      content: "可以发送一条测试消息。我会基于当前记忆体、模板和模型参数返回 mock 回复。"
    }
  ]);
  const [saved, setSaved] = useState(false);
  const importedRef = useRef<string | null>(null);

  useEffect(() => {
    const nextDraft = promptDrafts.find((item) => item.memorySpaceId === currentMemoryId);
    if (nextDraft) {
      setDraft(nextDraft);
      setSaved(false);
      setChat([
        {
          role: "ai",
          content: `已切换到「${currentMemory.name}」。当前模板为「${nextDraft.templateName}」。`
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

  function handleTemplateSelect(templateId: string) {
    if (!templateId) return;
    importTemplateToMemory(templateId, currentMemoryId);
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
        content: `基于「${currentMemory.name}」和「${draft.templateName}」，我会先确认你想要的是陪伴、分析还是行动建议。就这条消息看，可以先保留一个关键事实：${trimmed.slice(0, 42)}。`
      }
    ]);
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl space-y-6">
        <SectionHeader
          eyebrow="Prompt Lab"
          title="提示词调试"
          description="提示词草稿绑定当前记忆体；切换记忆体后会加载对应系统提示词、人设提示词和调试上下文。"
          action={<MemorySwitcher compact />}
        />

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
          <Card className="p-5">
            <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-ink">编辑区</h2>
                <p className="mt-1 text-sm text-ink/56">当前记忆体：{currentMemory.name}</p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <select
                  className="min-h-10 rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-sage"
                  defaultValue=""
                  onChange={(event) => handleTemplateSelect(event.target.value)}
                >
                  <option value="">从社区模板导入</option>
                  {approvedTemplates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </select>
                <Link href="/community">
                  <Button variant="secondary" className="w-full sm:w-auto">
                    <Download className="h-4 w-4" />
                    去社区
                  </Button>
                </Link>
              </div>
            </div>

            <div className="grid gap-4">
              <label>
                <span className="mb-2 block text-sm font-medium text-ink/72">系统提示词</span>
                <textarea
                  className={`${textareaClass} min-h-40`}
                  value={draft.systemPrompt}
                  onChange={(event) => setDraft((current) => ({ ...current, systemPrompt: event.target.value }))}
                />
              </label>
              <label>
                <span className="mb-2 block text-sm font-medium text-ink/72">人设提示词</span>
                <textarea
                  className={`${textareaClass} min-h-32`}
                  value={draft.personaPrompt}
                  onChange={(event) => setDraft((current) => ({ ...current, personaPrompt: event.target.value }))}
                />
              </label>
            </div>

            <div className="mt-5 grid gap-4 rounded-lg bg-mist p-4 md:grid-cols-3">
              <label>
                <span className="mb-2 block text-xs font-medium text-ink/54">模板名称</span>
                <input
                  className="min-h-10 w-full rounded-lg border border-line bg-white px-3 text-sm outline-none focus:border-sage"
                  value={draft.templateName}
                  onChange={(event) => setDraft((current) => ({ ...current, templateName: event.target.value }))}
                />
              </label>
              <label>
                <span className="mb-2 block text-xs font-medium text-ink/54">Temperature</span>
                <input
                  className="w-full accent-sage"
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={draft.temperature}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, temperature: Number(event.target.value) }))
                  }
                />
                <span className="text-xs text-ink/48">{draft.temperature.toFixed(2)}</span>
              </label>
              <label>
                <span className="mb-2 block text-xs font-medium text-ink/54">Max tokens</span>
                <input
                  className="min-h-10 w-full rounded-lg border border-line bg-white px-3 text-sm outline-none focus:border-sage"
                  type="number"
                  min="100"
                  max="4000"
                  value={draft.maxTokens}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, maxTokens: Number(event.target.value) }))
                  }
                />
              </label>
            </div>

            <div className="mt-5 flex items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                <Badge tone="success">{currentMemory.name}</Badge>
                <Badge>{draft.templateName}</Badge>
                <Badge tone="info">
                  <SlidersHorizontal className="mr-1 h-3 w-3" />
                  T {draft.temperature.toFixed(2)} / {draft.maxTokens}
                </Badge>
              </div>
              <Button
                onClick={() => {
                  savePromptDraft({ ...draft, memorySpaceId: currentMemoryId });
                  setSaved(true);
                }}
              >
                <Save className="h-4 w-4" />
                保存到当前记忆体
              </Button>
            </div>
            {saved ? <p className="mt-3 text-sm text-sage">已保存当前提示词到「{currentMemory.name}」。</p> : null}
          </Card>

          <Card className="flex min-h-[620px] flex-col p-5">
            <div className="border-b border-line pb-4">
              <h2 className="text-lg font-semibold text-ink">调试聊天</h2>
              <p className="mt-1 text-sm text-ink/56">mock 回复会显示当前模板与记忆体绑定关系。</p>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto py-4">
              {chat.map((item, index) => {
                const ai = item.role === "ai";
                return (
                  <div key={`${item.role}-${index}`} className={`flex gap-3 ${ai ? "" : "justify-end"}`}>
                    {ai ? (
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sage text-white">
                        <Bot className="h-4 w-4" />
                      </span>
                    ) : null}
                    <div
                      className={`max-w-[82%] rounded-lg px-3 py-2 text-sm leading-6 ${
                        ai ? "bg-mist text-ink/76" : "bg-ink text-white"
                      }`}
                    >
                      {item.content}
                    </div>
                    {!ai ? (
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-clay text-white">
                        <UserRound className="h-4 w-4" />
                      </span>
                    ) : null}
                  </div>
                );
              })}
            </div>
            <form className="flex gap-2 border-t border-line pt-4" onSubmit={handleChat}>
              <input
                className="min-h-10 flex-1 rounded-lg border border-line bg-white px-3 text-sm outline-none focus:border-sage"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="输入测试消息"
              />
              <Button type="submit" className="px-3">
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
