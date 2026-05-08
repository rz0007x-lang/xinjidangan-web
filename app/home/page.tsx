"use client";

import Link from "next/link";
import { BrainCircuit, CreditCard, MessageSquareText, RefreshCw, UsersRound } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Badge, Button, Card, SectionHeader } from "@/components/ui";
import { useAppState } from "@/lib/store";

const shortcuts = [
  { href: "/prompt-debug", label: "提示词调试", icon: MessageSquareText, text: "调试当前记忆体的人设与系统提示词" },
  { href: "/memory", label: "记忆查看", icon: BrainCircuit, text: "查看只读记忆图谱与时间线" },
  { href: "/community", label: "社区", icon: UsersRound, text: "导入或上传智能体模板" },
  { href: "/recharge", label: "充值", icon: CreditCard, text: "账号级余额与套餐管理" }
];

export default function HomePage() {
  const { user, memorySpaces, currentMemoryId, setCurrentMemoryId } = useAppState();

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl space-y-6">
        <SectionHeader
          eyebrow="Workspace"
          title="用户主页"
          description="查看账号状态、切换当前记忆体，并进入提示词调试、社区和充值等核心工作流。"
        />

        <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
          <Card className="p-5">
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-clay text-xl font-semibold text-white">
                {user.avatar}
              </div>
              <div className="min-w-0">
                <h2 className="text-xl font-semibold text-ink">{user.nickname}</h2>
                <p className="mt-1 truncate text-sm text-ink/56">{user.email}</p>
                <p className="mt-2 text-xs text-ink/48">账号 ID：{user.id}</p>
              </div>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-mist p-4">
                <p className="text-xs text-ink/48">会员状态</p>
                <p className="mt-2 text-lg font-semibold text-ink">{user.membership}</p>
              </div>
              <div className="rounded-lg bg-mist p-4">
                <p className="text-xs text-ink/48">账号余额</p>
                <p className="mt-2 text-lg font-semibold text-ink">¥{user.balance.toFixed(2)}</p>
              </div>
            </div>
            <Link href="/recharge">
              <Button className="mt-5 w-full">
                <CreditCard className="h-4 w-4" />
                前往充值
              </Button>
            </Link>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {shortcuts.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href}>
                  <Card className="h-full p-5 transition hover:-translate-y-0.5 hover:border-sage/40">
                    <Icon className="mb-4 h-6 w-6 text-sage" />
                    <h3 className="font-semibold text-ink">{item.label}</h3>
                    <p className="mt-2 text-sm leading-6 text-ink/58">{item.text}</p>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>

        <Card className="p-5">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-ink">我的记忆体</h2>
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
                  className={`rounded-lg border p-4 text-left transition ${
                    active ? "border-sage bg-sage/8" : "border-line bg-white hover:border-sage/50"
                  }`}
                  onClick={() => setCurrentMemoryId(memory.id)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-semibold text-ink">{memory.name}</h3>
                    {active ? <Badge tone="success">使用中</Badge> : <RefreshCw className="h-4 w-4 text-ink/35" />}
                  </div>
                  <p className="mt-3 text-sm leading-6 text-ink/60">{memory.description}</p>
                  <div className="mt-4 flex flex-wrap gap-2 text-xs text-ink/50">
                    <span>最近更新：{memory.lastUpdated}</span>
                    <span>语气：{memory.tone}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
