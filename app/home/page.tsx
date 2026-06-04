"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BrainCircuit, CreditCard, Inbox, MessageSquareText, RefreshCw, Sparkles } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Badge, Button, Card, SectionHeader, inputClass } from "@/components/ui";
import { useAppState } from "@/lib/store";

const shortcuts = [
  { href: "/prompt-debug", label: "提示词调试", icon: MessageSquareText, text: "调试当前记忆体的人设与系统提示词" },
  { href: "/memory", label: "记忆查看", icon: BrainCircuit, text: "查看只读记忆图谱与时间线" },
  { href: "/inbox", label: "收件箱", icon: Inbox, text: "查看官方小U和系统发送的通知" },
  { href: "/recharge", label: "充值", icon: CreditCard, text: "账号级余额与套餐管理" }
];

export default function HomePage() {
  const router = useRouter();
  const { user, memorySpaces, currentMemoryId, promptDrafts, setCurrentMemoryId, reviewSubmissions, shareCampaigns, updateNickname } =
    useAppState();
  const latestPendingPost = reviewSubmissions.find((item) => item.type === "post" && item.status === "pending");
  const activeShareCampaign = shareCampaigns.find((item) => item.memorySpaceId === currentMemoryId) ?? null;
  const activePromptDraft = promptDrafts.find((item) => item.memorySpaceId === currentMemoryId) ?? promptDrafts[0];
  const isOfficialXiaoU = activePromptDraft?.memoryName === "小U";
  const [editingNickname, setEditingNickname] = useState(false);
  const [nicknameDraft, setNicknameDraft] = useState(user.nickname);
  const [nicknameError, setNicknameError] = useState("");

  useEffect(() => {
    setNicknameDraft(user.nickname);
  }, [user.nickname]);

  function handleNicknameSave() {
    const trimmed = nicknameDraft.trim();
    if (!trimmed) {
      setNicknameError("昵称不能为空，请至少输入 1 个字符。");
      return;
    }
    updateNickname(trimmed);
    setNicknameError("");
    setEditingNickname(false);
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl space-y-6">
        <SectionHeader
          eyebrow="Union Soul Workspace"
          title="今日工作台"
          description="在暖白纸感面板里查看账号状态、切换记忆体，并进入提示词调试、记忆查看和充值等核心工作流。"
        />

        <div className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
          <Card className="p-5">
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-[20px] bg-clay text-xl font-semibold text-white">
                {user.avatar}
              </div>
              <div className="min-w-0">
                {editingNickname ? (
                  <div className="space-y-2">
                    <input
                      className={`${inputClass} min-h-10 max-w-[220px]`}
                      value={nicknameDraft}
                      onChange={(event) => setNicknameDraft(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") handleNicknameSave();
                        if (event.key === "Escape") {
                          setNicknameDraft(user.nickname);
                          setNicknameError("");
                          setEditingNickname(false);
                        }
                      }}
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <Button className="min-h-8 px-3 text-xs" onClick={handleNicknameSave}>
                        保存
                      </Button>
                      <Button
                        variant="secondary"
                        className="min-h-8 px-3 text-xs"
                        onClick={() => {
                          setNicknameDraft(user.nickname);
                          setNicknameError("");
                          setEditingNickname(false);
                        }}
                      >
                        取消
                      </Button>
                    </div>
                    {nicknameError ? <p className="text-xs text-red-500">{nicknameError}</p> : null}
                  </div>
                ) : (
                  <button
                    type="button"
                    className="text-left text-xl font-semibold text-ink transition hover:text-sage"
                    onClick={() => {
                      setNicknameDraft(user.nickname);
                      setNicknameError("");
                      setEditingNickname(true);
                    }}
                  >
                    {user.nickname}
                  </button>
                )}
                <p className="mt-1 truncate text-sm text-ink/56">{user.email}</p>
                <p className="mt-2 text-xs text-ink/48">账号 ID：{user.id}</p>
              </div>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-[18px] bg-mist p-4">
                <p className="text-xs text-ink/48">会员状态</p>
                <p className="mt-2 text-lg font-semibold text-ink">{user.membership}</p>
              </div>
              <div className="rounded-[18px] bg-mist p-4">
                <p className="text-xs text-ink/48">账号余额</p>
                <p className="font-editorial mt-2 text-[28px] leading-none text-ink">¥{user.balance.toFixed(2)}</p>
              </div>
            </div>
            <Link href="/recharge">
              <Button className="mt-5 w-full">
                <CreditCard className="h-4 w-4" />
                前往充值
              </Button>
            </Link>
            <div className="mt-4 rounded-[20px] border border-[#eadfe6] bg-[#fbf7fa] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs text-ink/46">当前智能体</p>
                  <h3 className="mt-2 text-lg font-semibold text-ink">{isOfficialXiaoU ? "小U" : "自定义"}</h3>
                  <p className="mt-2 text-sm leading-6 text-ink/58">
                    {isOfficialXiaoU
                      ? "当前记忆体正在使用官方陪伴智能体小U。"
                      : `当前记忆体使用的是「${activePromptDraft?.memoryName ?? "自定义智能体"}」这套自定义设定。`}
                  </p>
                </div>
                <Badge tone={isOfficialXiaoU ? "info" : "neutral"}>{isOfficialXiaoU ? "官方" : "自定义"}</Badge>
              </div>
              <Button className="mt-4 w-full" variant="secondary" onClick={() => router.push("/prompt-debug")}>
                <Sparkles className="h-4 w-4" />
                管理当前智能体
              </Button>
            </div>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
            {shortcuts.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href}>
                  <Card className="h-full p-5 transition hover:-translate-y-0.5 hover:border-sage/40 hover:shadow-[0_18px_36px_rgba(229,190,208,0.18)]">
                    <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-[16px] bg-mist text-sage">
                      <Icon className="h-5 w-5" />
                    </span>
                    <h3 className="font-semibold text-ink">{item.label}</h3>
                    <p className="mt-2 text-sm leading-6 text-ink/58">{item.text}</p>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>

        {latestPendingPost ? (
          <Card className="p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-[0.22em] text-ink/42">Review Queue</p>
                <h2 className="font-editorial mt-2 text-[28px] text-ink">审核中</h2>
                <p className="mt-3 text-sm leading-7 text-ink/62">
                  你提交的「{latestPendingPost.title}」内容已进入审核队列，当前状态为待审核。
                </p>
                <p className="mt-2 break-all text-xs text-ink/46">{latestPendingPost.link}</p>
              </div>
              <Badge tone="warning">审核中</Badge>
            </div>
          </Card>
        ) : null}

        <Card className="p-5">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-editorial text-[28px] text-ink">我的记忆体</h2>
              <p className="mt-1 text-sm text-ink/56">切换后会影响提示词调试与记忆查看页面。</p>
            </div>
            <Badge tone="info">当前：{memorySpaces.find((item) => item.id === currentMemoryId)?.name}</Badge>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            {memorySpaces.map((memory) => {
              const active = memory.id === currentMemoryId;
              return (
                <button
                  key={memory.id}
                  className={`rounded-[20px] border p-4 text-left transition ${
                    active ? "border-[#d7c9ea] bg-[#fbf7fc] shadow-[0_10px_28px_rgba(120,94,124,0.06)]" : "border-line bg-white hover:border-sage/50"
                  }`}
                  onClick={() => {
                    setCurrentMemoryId(memory.id);
                    router.push("/prompt-debug");
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-semibold text-ink">{memory.name}</h3>
                    {active ? <Badge tone="success">使用中</Badge> : <RefreshCw className="h-4 w-4 text-ink/35" />}
                  </div>
                  <p className="mt-3 text-sm leading-6 text-ink/60">{memory.description}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge tone="info">官设智能体：小U</Badge>
                    {active ? <Badge tone="success">点入后可查看完整提示词</Badge> : null}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2 text-xs text-ink/50">
                    <span>最近更新：{memory.lastUpdated}</span>
                    <span>语气：{memory.tone}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </Card>

        {activeShareCampaign ? (
          <Card className="p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-[0.22em] text-ink/42">Share Tracking</p>
                <h2 className="font-editorial mt-2 text-[28px] text-ink">创作分享码使用计数</h2>
                <p className="mt-3 text-sm leading-7 text-ink/62">当前记忆体的分享链接已启用，使用数据会自动同步到用户主页。</p>
              </div>
              <Badge tone="info">自动统计中</Badge>
            </div>
          </Card>
        ) : null}
      </div>
    </AppShell>
  );
}
