"use client";

import { FormEvent, useMemo, useState } from "react";
import { Bot, Send, UserRound } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button, Card, SectionHeader } from "@/components/ui";
import { inboxMessages } from "@/lib/mock-data";
import { useAppState } from "@/lib/store";

type SupportMessage = {
  role: "assistant" | "user";
  content: string;
  time?: string;
};

export default function SupportPage() {
  const { user } = useAppState();
  const initialMessages = useMemo<SupportMessage[]>(
    () =>
      inboxMessages
        .filter((item) => item.from === "小U")
        .map((item) => ({
          role: "assistant",
          content: item.content,
          time: item.createdAt
        })),
    []
  );

  const [messages, setMessages] = useState<SupportMessage[]>(initialMessages);
  const [input, setInput] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;

    setMessages((current) => [
      ...current,
      { role: "user", content: trimmed },
      {
        role: "assistant",
        content: "小U 已收到你的问题，我们会优先帮你处理邀请码、发帖征集、奖励发放或账号相关问题。"
      }
    ]);
    setInput("");
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl space-y-6">
        <SectionHeader
          eyebrow="Support"
          title="和小U对话"
          description="这里是客服对话页，可以直接联系小U处理邀请码、审核进度、奖励发放和账号问题。"
        />

        <Card className="flex min-h-[760px] flex-col p-6">
          <div className="border-b border-line/80 pb-5">
            <h2 className="font-editorial text-[28px] text-ink">客服会话</h2>
            <p className="mt-1 text-sm leading-6 text-ink/56">当前接待：小U · {user.nickname}</p>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto py-5">
            {messages.map((message, index) => {
              const assistant = message.role === "assistant";
              return (
                <div key={`${message.role}-${index}`} className={`flex gap-3 ${assistant ? "" : "justify-end"}`}>
                  {assistant ? (
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[14px] bg-sage text-white">
                      <Bot className="h-4 w-4" />
                    </span>
                  ) : null}
                  <div className={`max-w-[82%] rounded-[18px] px-4 py-3 text-sm leading-7 ${assistant ? "bg-mist text-ink/76" : "bg-[#eadbe7] text-ink"}`}>
                    {message.time ? <p className="mb-2 text-[11px] uppercase tracking-[0.14em] text-ink/38">{message.time}</p> : null}
                    <p>{message.content}</p>
                  </div>
                  {!assistant ? (
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[14px] bg-clay text-white">
                      <UserRound className="h-4 w-4" />
                    </span>
                  ) : null}
                </div>
              );
            })}
          </div>

          <form className="flex gap-3 border-t border-line/80 pt-5" onSubmit={handleSubmit}>
            <input
              className="min-h-12 flex-1 rounded-[18px] border border-line bg-white/94 px-4 text-sm outline-none focus:border-sage"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="输入你想咨询的问题"
            />
            <Button type="submit" className="px-5">
              <Send className="h-4 w-4" />
              发送
            </Button>
          </form>
        </Card>
      </div>
    </AppShell>
  );
}
