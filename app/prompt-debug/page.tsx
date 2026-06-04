"use client";

import { FormEvent, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { Bot, CheckCircle2, Save, Send, Sparkles, UserRound } from "lucide-react";
import { AppShell } from "@/components/AppShell";
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
    <AppShell>
      <div className="mx-auto max-w-7xl">
        <Card className="p-6 text-sm text-ink/56">正在加载提示词调试页...</Card>
      </div>
    </AppShell>
  );
}

function PromptDebugContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const importedTemplateId = searchParams.get("template");
  const {
    currentMemoryId,
    templates,
    promptDrafts,
    savePromptDraft,
    uploadTemplate,
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
  const [templateNotice, setTemplateNotice] = useState("");
  const [templateError, setTemplateError] = useState("");
  const importedRef = useRef<string | null>(null);
  const officialXiaoU = useMemo(() => templates.find((item) => item.id === "tpl-official-xiaou") ?? null, [templates]);
  const userTemplates = useMemo(() => templates.filter((item) => item.source === "user"), [templates]);
  const activeTemplate = useMemo(
    () => templates.find((item) => item.name === draft.memoryName && item.systemPrompt === draft.backstory) ?? null,
    [draft.backstory, draft.memoryName, templates]
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
      setDraft(nextDraft);
      setSaved(false);
      setHasUnsavedChanges(false);
      setFieldError("");
      setChat([
        {
          role: "ai",
          content: `已切换到「${currentMemory.name}」。当前记忆体命名为「${nextDraft.memoryName}」。`
        }
      ]);
    }
  }, [currentMemory.id, currentMemory.name, currentMemoryId, promptDrafts]);

  useEffect(() => {
    setTemplateNotice("");
    setTemplateError("");
  }, [currentMemoryId]);

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
        content: `基于「${draft.memoryName}」这套设定，我会用${draft.tone.slice(0, 12)}的语气回应，并保持${draft.personality.slice(0, 14)}的性格表达。就这条消息看，可以先记住一个关键事实：${trimmed.slice(0, 42)}。`
      }
    ]);
  }

  function handleSaveAsMyAgent() {
    const nextName = draft.memoryName.trim();
    if (!nextName) {
      setTemplateError("请先给当前智能体起一个名字，再保存到我的智能体。");
      return;
    }

    const exists = userTemplates.some((item) => item.name === nextName);
    if (exists) {
      setTemplateError("我的智能体里已经有同名版本了，建议先改个名字。");
      return;
    }

    const template = uploadTemplate({
      name: nextName,
      description: draft.persona.trim() || `${currentMemory.name}下保存的自定义智能体`,
      tags: [currentMemory.name, "自定义智能体", draft.archetype],
      systemPrompt: draft.backstory,
      personaPrompt: draft.tone,
      defaultArchetype: draft.archetype,
      defaultPersonality: draft.personality,
      starterGreeting: `你好，我是${nextName}。你可以先告诉我你现在更想被陪着、被整理思路，还是只是想轻轻说几句。`
    });

    setTemplateNotice(`已保存为我的智能体「${template.name}」，现在可以随时重新启用它。`);
    setTemplateError("");
  }
  return (
    <AppShell>
      <div className="mx-auto max-w-7xl space-y-6">
        <SectionHeader
          eyebrow="Union Soul Workspace"
          title="提示词调试"
          description="这里编辑当前记忆体的人物设定字段；切换记忆体后会加载对应命名、语气、性格、人设、基模和背景故事。"
          action={<MemorySwitcher compact onBeforeChange={() => confirmLeave()} />}
        />

        <Card className="p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.22em] text-ink/42">Agent Status</p>
              <h2 className="font-editorial mt-2 text-[28px] text-ink">当前智能体</h2>
              <p className="mt-3 text-sm leading-7 text-ink/62">
                当前记忆体「{currentMemory.name}」正在使用
                <span className="font-medium text-ink">「{draft.memoryName}」</span>
                ，你可以继续编辑、另存为我的智能体，或切换到官方预置版本。
              </p>
            </div>
            <div className="grid w-full max-w-[340px] gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <div className="rounded-[20px] border border-[#eadfe6] bg-[#fbf7fa] px-4 py-4">
                <p className="text-xs text-ink/46">当前来源</p>
                <p className="mt-2 text-lg font-semibold text-ink">
                  {activeTemplate?.source === "official" ? "官方智能体" : activeTemplate?.source === "user" ? "我的智能体" : "自定义编辑中"}
                </p>
              </div>
              <Button variant="secondary" onClick={handleSaveAsMyAgent}>
                <Save className="h-4 w-4" />
                保存为我的智能体
              </Button>
            </div>
          </div>
          {templateNotice ? (
            <div className="mt-4 flex items-start gap-2 rounded-[18px] bg-mist px-4 py-3 text-sm text-sage">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              <p>{templateNotice}</p>
            </div>
          ) : null}
          {templateError ? <p className="mt-4 text-sm text-red-500">{templateError}</p> : null}
        </Card>

        {officialXiaoU ? (
          <Card className="p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-3xl">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="info">官方智能体</Badge>
                  <Badge tone="success">小U</Badge>
                  <Badge tone="neutral">可直接启用</Badge>
                </div>
                <h2 className="font-editorial mt-3 text-[28px] text-ink">官设智能体：小U</h2>
                <p className="mt-3 text-sm leading-7 text-ink/62">
                  {officialXiaoU.description}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {officialXiaoU.tags.map((tag) => (
                    <Badge key={tag} tone="neutral">
                      {tag}
                    </Badge>
                  ))}
                </div>
                <div className="mt-5 grid gap-3 md:grid-cols-3">
                  <div className="rounded-[18px] bg-mist px-4 py-4">
                    <p className="text-xs text-ink/46">整体气质</p>
                    <p className="mt-2 text-sm leading-6 text-ink/72">温柔、稳定、细腻，有轻微主见，不盲目迎合。</p>
                  </div>
                  <div className="rounded-[18px] bg-mist px-4 py-4">
                    <p className="text-xs text-ink/46">陪伴方式</p>
                    <p className="mt-2 text-sm leading-6 text-ink/72">先轻轻接住情绪，再顺着聊一句，不默认每轮都给方案。</p>
                  </div>
                  <div className="rounded-[18px] bg-mist px-4 py-4">
                    <p className="text-xs text-ink/46">边界原则</p>
                    <p className="mt-2 text-sm leading-6 text-ink/72">亲近但不过界，不制造依赖，不假装拥有现实身体或线下行动。</p>
                  </div>
                </div>
                <div className="mt-4 rounded-[20px] border border-line bg-white/74 px-4 py-4">
                  <p className="text-xs text-ink/46">默认开场</p>
                  <p className="mt-2 text-sm leading-7 text-ink/70">{officialXiaoU.starterGreeting}</p>
                </div>
              </div>

              <div className="w-full max-w-[280px] shrink-0 rounded-[22px] border border-[#eadfe6] bg-[#fbf7fa] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-ink/42">当前状态</p>
                <h3 className="mt-3 text-lg font-semibold text-ink">{draft.memoryName === officialXiaoU.name ? "正在使用小U" : "未启用小U"}</h3>
                <p className="mt-2 text-sm leading-6 text-ink/58">
                  你可以把小U一键启用到当前记忆体，也可以继续使用你自己的智能体设定。
                </p>
                <Button
                  className="mt-5 w-full"
                  onClick={() => {
                    importTemplateToMemory(officialXiaoU.id, currentMemoryId);
                    setTemplateNotice(`已把官设智能体「小U」启用到当前记忆体「${currentMemory.name}」。`);
                  }}
                >
                  <Sparkles className="h-4 w-4" />
                  启用到当前记忆体
                </Button>
                <p className="mt-3 text-xs leading-6 text-ink/48">
                  启用后会自动带入小U的人设、语气、基模和背景提示词。
                </p>
              </div>
            </div>
          </Card>
        ) : null}

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
                  onChange={(event) => updateDraft("memoryName", event.target.value, 20, "记忆体命名")}
                />
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
                  savePromptDraft({ ...draft, memorySpaceId: currentMemoryId });
                  setSaved(true);
                  setHasUnsavedChanges(false);
                }}
              >
                <Save className="h-4 w-4" />
                保存到当前记忆体
              </Button>
            </div>
            {saved ? <p className="mt-3 text-sm text-sage">已保存当前提示词到「{currentMemory.name}」。</p> : null}
          </Card>

          <Card className="flex min-h-[760px] flex-col overflow-hidden p-6">
            <div className="border-b border-line/80 pb-5">
              <h2 className="font-editorial text-[28px] text-ink">调试聊天</h2>
              <p className="mt-1 text-sm leading-6 text-ink/56">模拟对话会参考当前记忆体的人设字段和表达方式。</p>
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
    </AppShell>
  );
}
