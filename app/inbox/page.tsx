"use client";

import { useMemo, useState } from "react";
import { BellRing, Inbox, Ticket, Users } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Badge, Card, SectionHeader } from "@/components/ui";
import { inboxMessages } from "@/lib/mock-data";
import { useAppState } from "@/lib/store";

const categoryMeta = {
  invite: { label: "邀请码", icon: Users },
  coupon: { label: "优惠券", icon: Ticket },
  system: { label: "系统通知", icon: BellRing }
};

function formatMessageTime(value: string) {
  const isoCandidate = value.includes("T") ? value : value.replace(" ", "T");
  const parsed = new Date(isoCandidate);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  const hours = String(parsed.getHours()).padStart(2, "0");
  const minutes = String(parsed.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

export default function InboxPage() {
  const { reviewSubmissions } = useAppState();
  const mergedMessages = useMemo(() => {
    const reviewMessages = reviewSubmissions
      .filter((item) => item.type === "post")
      .map((item) => ({
        id: `review-inbox-${item.id}`,
        from: "小U" as const,
        title: `${item.title}审核${item.status === "pending" ? "中" : item.status === "approved" ? "通过" : "未通过"}`,
        preview:
          item.status === "pending"
            ? "你提交的帖子链接已进入审核队列，审核完成后会自动发放奖励。"
            : item.status === "approved"
              ? "你提交的帖子链接已通过审核，奖励已经同步发放。"
              : "你提交的帖子链接未通过审核，请调整后重新提交。",
        content:
          item.status === "pending"
            ? `你提交的帖子链接已进入审核队列。\n\n链接：${item.link}\n\n审核通过后，奖励会自动发放到账号余额或对话轮次中，请耐心等待。`
            : item.status === "approved"
              ? `你提交的帖子链接已通过审核。\n\n链接：${item.link}\n\n对应奖励已经发放到你的账号，请前往主页或充值页查看。`
              : `你提交的帖子链接未通过审核。\n\n链接：${item.link}\n\n建议调整内容后重新提交，我们会再次处理。`,
        createdAt: formatMessageTime(item.submittedAt),
        category: "system" as const,
        unread: item.status === "pending"
      }));

    return [...reviewMessages, ...inboxMessages].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }, [reviewSubmissions]);

  const unreadCount = mergedMessages.filter((item) => item.unread).length;
  const [selectedMessageId, setSelectedMessageId] = useState(mergedMessages[0]?.id ?? "");

  const selectedMessage = useMemo(
    () => mergedMessages.find((item) => item.id === selectedMessageId) ?? mergedMessages[0],
    [mergedMessages, selectedMessageId]
  );

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl space-y-6">
        <SectionHeader
          eyebrow="Inbox"
          title="收件箱"
          description="这里会收到官方小U和系统发来的通知，例如邀请码、优惠券、奖励进度和系统提醒。"
        />

        <div className="grid gap-5 xl:grid-cols-[340px_minmax(0,1fr)]">
          <Card className="p-4">
            <div className="mb-4 flex items-center justify-between gap-3 border-b border-line/80 pb-4">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-semibold text-ink">
                  <Inbox className="h-5 w-5 text-sage" />
                  消息列表
                </h2>
                <p className="mt-1 text-sm text-ink/56">官方小U与系统通知</p>
              </div>
              <Badge tone="info">{unreadCount} 条未读</Badge>
            </div>

            <div className="space-y-3">
              {mergedMessages.map((message) => {
                const meta = categoryMeta[message.category];
                const Icon = meta.icon;
                const active = message.id === selectedMessage?.id;

                return (
                  <button
                    key={message.id}
                    type="button"
                    onClick={() => setSelectedMessageId(message.id)}
                    className={`w-full rounded-[20px] border p-4 text-left transition ${
                      active
                        ? "border-[#d5b7c8] bg-[#f7edf3] shadow-[0_12px_26px_rgba(126,110,135,0.12)]"
                        : "border-line bg-white hover:border-[#dcc7d3] hover:bg-[#fcf8fa]"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-sm font-medium text-ink">
                        <Icon className="h-4 w-4 text-sage" />
                        {message.from}
                      </div>
                      <span className="text-xs text-ink/40">{message.createdAt}</span>
                    </div>
                    <h3 className="mt-3 text-sm font-semibold text-ink">{message.title}</h3>
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-ink/58">{message.preview}</p>
                    <div className="mt-3 flex items-center gap-2">
                      <Badge tone="info">{meta.label}</Badge>
                      <Badge tone={message.unread ? "warning" : "neutral"}>{message.unread ? "未读" : "已读"}</Badge>
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>

          <Card className="flex min-h-[760px] flex-col p-6">
            {selectedMessage ? (
              <>
                <div className="border-b border-line/80 pb-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone="info">{categoryMeta[selectedMessage.category].label}</Badge>
                    <Badge tone={selectedMessage.unread ? "warning" : "neutral"}>
                      {selectedMessage.unread ? "未读消息" : "已读消息"}
                    </Badge>
                    <span className="text-xs text-ink/42">{selectedMessage.createdAt}</span>
                  </div>
                  <h2 className="mt-4 font-editorial text-[30px] leading-tight text-ink">{selectedMessage.title}</h2>
                  <p className="mt-3 text-sm leading-7 text-ink/56">发件人：{selectedMessage.from}</p>
                </div>

                <div className="flex-1 py-6">
                  <p className="text-[18px] leading-9 text-ink/72 whitespace-pre-line">{selectedMessage.content}</p>
                </div>
              </>
            ) : (
              <div className="flex flex-1 items-center justify-center text-sm text-ink/48">暂无消息可查看。</div>
            )}
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
