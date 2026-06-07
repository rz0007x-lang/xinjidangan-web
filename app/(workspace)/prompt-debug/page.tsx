"use client";

import { FormEvent, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { Bot, Download, Save, Send, Sparkles, UserRound } from "lucide-react";
import { MemorySwitcher } from "@/components/MemorySwitcher";
import { Badge, Button, Card, SectionHeader, textareaClass } from "@/components/ui";
import { useAppState, useCurrentMemory } from "@/lib/store";
import type { PromptDraft } from "@/lib/types";

type ChatMessage = {
  role: "user" | "ai";
  content: string;
};

type AssistantMessage = {
  role: "user" | "assistant";
  content: string;
};

const baseModelOptions = ["DeepSeek", "Kimi", "Doubao", "Qwen", "GPT-4o"];

function buildAssistantReply(question: string, draft: PromptDraft, linkedMemoryName: string) {
  const lowerQuestion = question.toLowerCase();
  const focus =
    lowerQuestion.includes("语气") || lowerQuestion.includes("tone")
      ? "语气"
      : lowerQuestion.includes("性格")
        ? "性格"
        : lowerQuestion.includes("人设") || lowerQuestion.includes("persona")
          ? "人设"
          : lowerQuestion.includes("系统") || lowerQuestion.includes("背景")
            ? "系统提示词"
            : "整体设定";

  const suggestions = [
    `现在这套设定的核心是「${draft.personaName} + ${draft.promptMemoryName}」，并且会读取「${linkedMemoryName}」这份记忆体，所以先确保 ${focus} 和这三个锚点说的是同一个人。`,
    `如果你想让回复更稳一点，可以把语气从「${draft.tone.slice(0, 18)}」改成更具体的行为约束，例如“默认 2 到 4 句，先接情绪，再给半步建议”。`,
    `你的人设里已经有「${draft.persona.slice(0, 26)}」，下一步建议补“会怎么回应”而不是只写“是什么样的人”，这样模型更容易稳定执行。`,
    `系统提示词建议只保留边界、优先级和禁忌，不要和人设字段重复太多；重复内容越多，后面越容易显得啰嗦。`
  ];

  if (focus === "系统提示词") {
    suggestions[1] = `系统提示词里优先写清三件事：身份边界、回复流程、不能做什么。像现在这样的大段背景设定，可以继续保留，但最好再补一句最关键的执行原则。`;
  }

  if (focus === "语气") {
    suggestions[2] = `语气字段不要只写抽象词，最好补一句句式约束。比如“少反问、少感叹号、少模板安慰，默认短句分段”，这样小U更容易帮你收敛输出。`;
  }

  return `我是提示词助手小U。你这个问题更适合从「${focus}」下手。\n\n1. ${suggestions[0]}\n2. ${suggestions[1]}\n3. ${suggestions[2]}\n4. ${suggestions[3]}`;
}

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
  const importMode = searchParams.get("mode") === "import-doc";
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
  const [assistantQuestion, setAssistantQuestion] = useState("");
  const [selectedImportName, setSelectedImportName] = useState("");
  const [chat, setChat] = useState<ChatMessage[]>([
    {
      role: "ai",
      content: "可以发送一条测试消息。我会基于当前记忆体设定返回 mock 回复。"
    }
  ]);
  const [assistantChat, setAssistantChat] = useState<AssistantMessage[]>([
    {
      role: "assistant",
      content: "我是提示词助手小U。你可以直接问我：这套人设怎么更稳定、语气怎么更像真人、系统提示词怎么精简。"
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
      setAssistantChat([
        {
          role: "assistant",
          content: `已切换到「${currentMemory.name}」这组草稿。我可以继续帮你优化「${nextDraft.personaName} + ${nextDraft.promptMemoryName}」的提示词写法。`
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
        content: `现在是「${draft.personaName} + ${draft.promptMemoryName}」这组设定。我会用${draft.tone.slice(0, 12)}的语气回应，并参考这段记忆：${draft.promptMemorySnippet.slice(0, 34)}。就这条消息看，当前最该接住的是：${trimmed.slice(0, 36)}。`
      }
    ]);
  }

  function handleAssistantAsk(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = assistantQuestion.trim();
    if (!trimmed) return;

    setAssistantQuestion("");
    setAssistantChat((current) => [
      ...current,
      { role: "user", content: trimmed },
      {
        role: "assistant",
        content: buildAssistantReply(trimmed, draft, currentMemory.name)
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

        {importMode ? (
          <Card className="p-4 sm:p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-[0.22em] text-ink/42">Import</p>
                <h2 className="font-editorial mt-2 text-[26px] text-ink sm:text-[30px]">上传文档导入人设</h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-ink/58">
                  支持上传 Word、PDF 等文档来整理出智能体设定。当前为演示导入流程，上传后会保留文件名，并引导你继续补全提示词。
                </p>
              </div>
              <Button variant="secondary" className="sm:w-auto" onClick={() => router.push("/prompt-debug")}>
                返回调试页
              </Button>
            </div>

            <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1fr)_260px]">
              <label className="flex min-h-[220px] cursor-pointer flex-col items-center justify-center rounded-[24px] border border-dashed border-[#e7cad8] bg-[#fffafc] px-6 py-8 text-center transition hover:border-sage/40 hover:bg-white">
                <input
                  type="file"
                  className="hidden"
                  accept=".doc,.docx,.pdf,.txt,.md"
                  onChange={(event) => {
                    const nextFile = event.target.files?.[0];
                    setSelectedImportName(nextFile?.name ?? "");
                  }}
                />
                <Download className="h-8 w-8 text-sage" />
                <p className="mt-4 text-base font-semibold text-ink">点击上传人设文档</p>
                <p className="mt-2 text-sm leading-6 text-ink/56">支持 Word（.doc / .docx）、PDF、TXT、Markdown</p>
                <p className="mt-1 text-xs text-ink/46">适合导入角色设定、人设小传、关系背景和对话风格说明</p>
              </label>

              <div className="rounded-[24px] bg-mist p-4 sm:p-5">
                <h3 className="text-sm font-semibold text-ink/76">导入说明</h3>
                <ul className="mt-3 space-y-2 text-sm leading-6 text-ink/58">
                  <li>上传文档后，会先提取人设、语气、背景设定等核心字段。</li>
                  <li>复杂内容建议优先用 Word 或 PDF，结构会更稳定。</li>
                  <li>导入完成后，仍建议在下方手动检查并微调提示词。</li>
                </ul>
                <div className="mt-4 rounded-[18px] bg-white px-4 py-3 text-sm text-ink/64">
                  {selectedImportName ? `已选择文件：${selectedImportName}` : "当前还没有选择文件。"}
                </div>
              </div>
            </div>
          </Card>
        ) : null}

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.08fr)_minmax(380px,0.92fr)] xl:items-stretch">
          <Card className="flex flex-col p-4 sm:p-6 xl:min-h-[760px]">
            <div className="mb-6 flex flex-col gap-3 border-b border-line/80 pb-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h2 className="font-editorial text-[24px] text-ink sm:text-[28px]">编辑区</h2>
                <p className="mt-1 text-sm leading-6 text-ink/56">当前记忆体：{currentMemory.name}</p>
              </div>
            </div>

            <div className="mb-5 rounded-[24px] border border-[#eed7e3] bg-white/70 p-4 sm:p-5">
              <div className="border-b border-line/80 pb-4">
                <h3 className="font-editorial text-[22px] text-ink sm:text-[26px]">小U 助手</h3>
                <p className="mt-1 text-sm leading-6 text-ink/56">先和小U问答，获取提示词优化建议；它会直接围绕当前这套 prompt 草稿给你建议。</p>
              </div>
              <div className="space-y-4 py-4">
                <div className="max-h-[28vh] space-y-4 overflow-y-auto pr-1">
                  {assistantChat.map((item, index) => {
                    const assistant = item.role === "assistant";
                    return (
                      <div key={`${item.role}-${index}`} className={`flex gap-3 ${assistant ? "" : "justify-end"}`}>
                        {assistant ? (
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[14px] bg-[#eadbe7] text-ink">
                            <Sparkles className="h-4 w-4" />
                          </span>
                        ) : null}
                        <div
                          className={`max-w-[88%] whitespace-pre-line rounded-[18px] px-3 py-2 text-sm leading-6 sm:max-w-[82%] ${
                            assistant ? "bg-[#fbf4f8] text-ink/76" : "bg-[#eadbe7] text-ink"
                          }`}
                        >
                          {item.content}
                        </div>
                        {!assistant ? (
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[14px] bg-clay text-white">
                            <UserRound className="h-4 w-4" />
                          </span>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
                <form className="flex flex-col gap-2 sm:flex-row" onSubmit={handleAssistantAsk}>
                  <input
                    className="min-h-10 flex-1 rounded-[18px] border border-[#e7a8c2] bg-white px-3 text-sm outline-none focus:border-sage"
                    value={assistantQuestion}
                    onChange={(event) => setAssistantQuestion(event.target.value)}
                    placeholder="问小U：这段人设太空泛，怎么改得更稳？"
                  />
                  <Button type="submit" className="sm:px-4">
                    <Sparkles className="h-4 w-4" />
                    询问小U
                  </Button>
                </form>
              </div>
            </div>

            <div className="grid flex-1 content-start gap-4 sm:gap-5 md:grid-cols-2">
              <label className="md:col-span-2">
                <span className="mb-2 block text-sm font-medium text-ink/72">记忆体命名</span>
                <textarea
                  className={`${textareaClass} min-h-0 h-12 resize-none overflow-hidden`}
                  value={draft.memoryName}
                  readOnly
                />
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
              </label>
              <label>
                <span className="mb-2 block text-sm font-medium text-ink/72">语气</span>
                <textarea
                  className={`${textareaClass} min-h-28 sm:min-h-32`}
                  value={draft.tone}
                  onChange={(event) => updateDraft("tone", event.target.value, 80, "语气")}
                />
              </label>
              <label>
                <span className="mb-2 block text-sm font-medium text-ink/72">性格</span>
                <textarea
                  className={`${textareaClass} min-h-28 sm:min-h-32`}
                  value={draft.personality}
                  onChange={(event) => updateDraft("personality", event.target.value, 120, "性格")}
                />
              </label>
              <label>
                <span className="mb-2 block text-sm font-medium text-ink/72">人设</span>
                <textarea
                  className={`${textareaClass} min-h-32 sm:min-h-36`}
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
                  className={`${textareaClass} min-h-36 sm:min-h-40`}
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

          <Card className="flex flex-col overflow-hidden p-4 sm:p-6 xl:min-h-[760px]">
            <div className="border-b border-line/80 pb-5">
              <h2 className="font-editorial text-[24px] text-ink sm:text-[28px]">调试聊天</h2>
              <p className="mt-1 text-sm leading-6 text-ink/56">模拟对话会同时参考当前 persona 字段和所选记忆体内容。</p>
            </div>
            <div className="max-h-[50vh] flex-1 space-y-4 overflow-y-auto py-5 xl:max-h-none">
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
                      className={`max-w-[88%] rounded-[18px] px-3 py-2 text-sm leading-6 sm:max-w-[82%] ${
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
