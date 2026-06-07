"use client";

import { useEffect, useState } from "react";
import { RefreshCw, Settings2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Badge, Button, Card, SectionHeader, inputClass } from "@/components/ui";
import { useAppState } from "@/lib/store";

export default function HomePage() {
  const router = useRouter();
  const { user, memorySpaces, currentMemoryId, setCurrentMemoryId, updateNickname, deleteMemorySpace } = useAppState();
  const [editingNickname, setEditingNickname] = useState(false);
  const [nicknameDraft, setNicknameDraft] = useState(user.nickname);
  const [nicknameError, setNicknameError] = useState("");
  const [memoryActionError, setMemoryActionError] = useState("");

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

  function handleDeleteMemorySpace(memoryId: string, memoryName: string) {
    const confirmed = window.confirm(`确定删除记忆体「${memoryName}」吗？删除后该记忆体下的当前设定与分享数据也会一起移除。`);
    if (!confirmed) return;

    const result = deleteMemorySpace(memoryId);
    if (!result.ok) {
      setMemoryActionError(result.reason === "last_memory" ? "至少要保留一个记忆体，当前这条不能删除。" : "删除失败，请稍后再试。");
      return;
    }

    setMemoryActionError("");
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <SectionHeader
        eyebrow="Profile"
        title="个人中心"
        description="这里只展示账户信息详情与我的记忆体。你可以查看账户状态，并切换当前使用的记忆体。"
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
              <p className="text-xs text-ink/48">现金账户</p>
              <p className="font-editorial mt-2 text-[28px] leading-none text-ink">¥{user.cashBalance.toFixed(2)}</p>
            </div>
          </div>

          <div className="mt-3 rounded-[18px] bg-mist p-4">
            <p className="text-xs text-ink/48">Token 账户</p>
            <p className="font-editorial mt-2 text-[28px] leading-none text-ink">{user.tokenBalance.toLocaleString()}</p>
            <p className="mt-2 text-xs text-ink/46">可消费额度，充值与赠送都会累计到这里。</p>
          </div>
        </Card>

        <Card className="p-5">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-editorial text-[28px] text-ink">我的记忆体</h2>
              <p className="mt-1 text-sm text-ink/56">记忆体记录的是用户记忆信息，不同智能体设定可以切换不同记忆体，也可以共享同一个记忆体。</p>
            </div>
            <Badge tone="info">当前：{memorySpaces.find((item) => item.id === currentMemoryId)?.name}</Badge>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {memorySpaces.map((memory) => {
              const active = memory.id === currentMemoryId;

              return (
                <div
                  key={memory.id}
                  className={`rounded-[20px] border p-4 text-left transition ${
                    active ? "border-[#d7c9ea] bg-[#fbf7fc] shadow-[0_10px_28px_rgba(120,94,124,0.06)]" : "border-line bg-white hover:border-sage/50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-ink">{memory.name}</h3>
                      {active ? <Badge tone="success">使用中</Badge> : <RefreshCw className="h-4 w-4 text-ink/35" />}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="secondary"
                        className="min-h-8 px-3 text-xs"
                        onClick={() => {
                          setCurrentMemoryId(memory.id);
                          router.push("/prompt-debug");
                        }}
                      >
                        <Settings2 className="h-3.5 w-3.5" />
                        管理
                      </Button>
                      <Button
                        variant="ghost"
                        className="min-h-8 px-3 text-xs text-[#b86474]"
                        onClick={() => handleDeleteMemorySpace(memory.id, memory.name)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        删除
                      </Button>
                    </div>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-ink/60">{memory.description}</p>
                  <div className="mt-4 flex flex-wrap gap-2 text-xs text-ink/50">
                    <span>最近更新：{memory.lastUpdated}</span>
                    <span>默认语气：{memory.tone}</span>
                  </div>
                </div>
              );
            })}
          </div>
          {memoryActionError ? <p className="mt-4 text-sm text-red-500">{memoryActionError}</p> : null}
        </Card>
      </div>
    </div>
  );
}
