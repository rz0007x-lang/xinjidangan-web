"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { BellRing, Inbox, Search, Ticket, Users } from "lucide-react";
import { Badge, Button, Card, SectionHeader, inputClass } from "@/components/ui";
import { inboxMessages } from "@/lib/mock-data";
import type { InboxMessage } from "@/lib/types";
import { useAppState } from "@/lib/store";

const categoryMeta = {
  invite: { label: "邀请码", icon: Users },
  coupon: { label: "优惠券", icon: Ticket },
  system: { label: "系统通知", icon: BellRing }
};

type InboxFilter = "all" | "unread" | "invite" | "coupon" | "system";

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
  const { reviewSubmissions, inboxReadMessageIds, markInboxMessageRead, markAllInboxMessagesRead } = useAppState();
  const [selectedMessageId, setSelectedMessageId] = useState("");
  const [filter, setFilter] = useState<InboxFilter>("all");
  const [search, setSearch] = useState("");

  const mergedMessages = useMemo<InboxMessage[]>(() => {
    const reviewMessages = reviewSubmissions
      .filter((item) => item.type === "post")
      .map((item) => {
        const id = `review-inbox-${item.id}`;
        return {
          id,
          from: "系统" as const,
          title: `${item.title}${item.status === "pending" ? "审核中" : item.status === "approved" ? "审核通过" : "审核未通过"}`,
          preview:
            item.status === "pending"
              ? "你提交的发帖链接已进入审核队列，结果会通过收件箱同步。"
              : item.status === "approved"
                ? "你提交的发帖链接已通过审核，奖励已经同步发放。"
                : "你提交的发帖链接未通过审核，请调整后重新提交。",
          content:
            item.status === "pending"
              ? `你提交的发帖链接已进入审核队列。\n\n链接：${item.link}\n\n审核完成后，结果会继续通过收件箱发送给你。`
              : item.status === "approved"
                ? `你提交的发帖链接已通过审核。\n\n链接：${item.link}\n\n对应奖励已经发放到你的账户，请前往邀请与分享或充值中心查看。`
                : `你提交的发帖链接未通过审核。\n\n链接：${item.link}\n\n建议调整内容后重新提交，如需申诉可联系人工客服。`,
          createdAt: formatMessageTime(item.submittedAt),
          category: "system" as const,
          unread: !inboxReadMessageIds.includes(id)
        };
      });

    const systemMessages = inboxMessages.map((item) => ({
      ...item,
      unread: item.unread ? !inboxReadMessageIds.includes(item.id) : false
    }));

    return [...reviewMessages, ...systemMessages].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }, [inboxReadMessageIds, reviewSubmissions]);

  const filteredMessages = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return mergedMessages.filter((message) => {
      if (filter === "unread" && !message.unread) return false;
      if (filter !== "all" && filter !== "unread" && message.category !== filter) return false;
      if (!keyword) return true;

      return [message.title, message.preview, message.content, message.from]
        .join(" ")
        .toLowerCase()
        .includes(keyword);
    });
  }, [filter, mergedMessages, search]);

  const unreadCount = mergedMessages.filter((item) => item.unread).length;
  const unreadMessageIds = mergedMessages.filter((item) => item.unread).map((item) => item.id);

  useEffect(() => {
    if (!filteredMessages.length) {
      setSelectedMessageId("");
      return;
    }

    const exists = filteredMessages.some((item) => item.id === selectedMessageId);
    if (!selectedMessageId || !exists) {
      setSelectedMessageId(filteredMessages[0].id);
    }
  }, [filteredMessages, selectedMessageId]);

  const selectedMessage = useMemo(
    () => filteredMessages.find((item) => item.id === selectedMessageId) ?? filteredMessages[0],
    [filteredMessages, selectedMessageId]
  );

  useEffect(() => {
    if (!selectedMessage?.unread) return;
    markInboxMessageRead(selectedMessage.id);
  }, [markInboxMessageRead, selectedMessage?.id, selectedMessage?.unread]);

  function handleSelectMessage(messageId: string) {
    setSelectedMessageId(messageId);
    markInboxMessageRead(messageId);
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <SectionHeader
        eyebrow="Inbox"
        title="收件箱"
        description="这里专门接收结果和通知；如果你需要处理问题，请直接进入客服页。"
      />

      <div className="grid gap-5 xl:grid-cols-[340px_minmax(0,1fr)]">
        <Card className="p-4">
          <div className="mb-4 border-b border-line/80 pb-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-semibold text-ink">
                  <Inbox className="h-5 w-5 text-sage" />
                  消息列表
                </h2>
                <p className="mt-1 text-sm text-ink/56">系统通知与结果回执</p>
              </div>
              <Badge tone="info">{unreadCount} 条未读</Badge>
            </div>

            <div className="mt-4 space-y-3">
              <label className="relative block">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/34" />
                <input
                  className={`${inputClass} min-h-11 pl-11 text-sm`}
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="搜索标题、内容或发件人"
                />
              </label>

              <div className="flex flex-wrap gap-2">
                {[
                  { id: "all", label: "全部" },
                  { id: "unread", label: "未读" },
                  { id: "invite", label: "邀请码" },
                  { id: "coupon", label: "优惠券" },
                  { id: "system", label: "系统通知" }
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`rounded-full px-4 py-2 text-sm transition ${
                      filter === item.id ? "bg-[#eadbe7] text-ink" : "bg-mist text-ink/58 hover:text-ink"
                    }`}
                    onClick={() => setFilter(item.id as InboxFilter)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <Button
                variant="secondary"
                className="w-full"
                onClick={() => markAllInboxMessagesRead(unreadMessageIds)}
                disabled={!unreadMessageIds.length}
              >
                全部标为已读
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            {filteredMessages.length ? (
              filteredMessages.map((message) => {
                const meta = categoryMeta[message.category];
                const Icon = meta.icon;
                const active = message.id === selectedMessage?.id;

                return (
                  <button
                    key={message.id}
                    type="button"
                    onClick={() => handleSelectMessage(message.id)}
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
                  </button>
                );
              })
            ) : (
              <div className="rounded-[20px] border border-dashed border-line px-4 py-8 text-center text-sm text-ink/46">
                当前筛选条件下暂无消息。
              </div>
            )}
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
                <p className="text-[18px] leading-9 whitespace-pre-line text-ink/72">{selectedMessage.content}</p>
              </div>

              <div className="border-t border-line/80 pt-5">
                <Link href="/support">
                  <Button>对此消息发起客服咨询</Button>
                </Link>
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center text-sm text-ink/48">暂无消息可查看。</div>
          )}
        </Card>
      </div>
    </div>
  );
}
