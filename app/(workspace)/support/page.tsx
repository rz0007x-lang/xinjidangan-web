"use client";

import { FormEvent, useState } from "react";
import { Bot, Send, UserRound } from "lucide-react";
import { Button, Card, SectionHeader } from "@/components/ui";
import { useAppState } from "@/lib/store";

type SupportMessage = {
  role: "assistant" | "user";
  content: string;
  time?: string;
};

const defaultMessages: SupportMessage[] = [
  {
    role: "assistant",
    content: "你好，这里是客服处理页。你可以在这里咨询邀请码、发帖活动、奖励发放、支付订单或账号相关问题。",
    time: "现在"
  }
];

export default function SupportPage() {
  const { user } = useAppState();
  const [messages, setMessages] = useState<SupportMessage[]>(defaultMessages);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<"online" | "queue" | "closed">("online");
  const [sendError, setSendError] = useState("");
  const [feedback, setFeedback] = useState<"" | "helpful" | "neutral" | "unhelpful">("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || status === "closed") return;

    if (trimmed.includes("网络")) {
      setSendError("网络波动，消息暂未发出，请稍后重试。");
      return;
    }

    setMessages((current) => [
      ...current,
      { role: "user", content: trimmed },
      {
        role: "assistant",
        content:
          status === "queue"
            ? "客服已收到你的问题，当前人工席位较忙，你已进入排队队列。我们会优先处理邀请码、发帖活动、奖励发放、订单与账号问题。"
            : "客服已收到你的问题。我们会优先帮你处理邀请码、发帖活动、奖励发放、订单与账号问题。"
      }
    ]);
    setInput("");
    setSendError("");
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <SectionHeader
        eyebrow="Support"
        title="联系客服"
        description="这里是问题处理页；收件箱只负责接收通知和结果，客服页专门用于发起咨询。"
      />

      <Card className="flex min-h-[760px] flex-col p-6">
        <div className="border-b border-line/80 pb-5">
          <h2 className="font-editorial text-[28px] text-ink">客服会话</h2>
          <p className="mt-1 text-sm leading-6 text-ink/56">当前接待：客服小U · {user.nickname}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant={status === "online" ? "primary" : "secondary"} className="min-h-8 px-4 text-xs" onClick={() => setStatus("online")}>
              在线接待
            </Button>
            <Button variant={status === "queue" ? "primary" : "secondary"} className="min-h-8 px-4 text-xs" onClick={() => setStatus("queue")}>
              排队中
            </Button>
            <Button variant={status === "closed" ? "danger" : "secondary"} className="min-h-8 px-4 text-xs" onClick={() => setStatus("closed")}>
              会话关闭
            </Button>
          </div>
          <p className="mt-3 text-xs text-ink/48">
            {status === "online" ? "当前状态：可正常发送消息。" : status === "queue" ? "当前状态：消息可发送，但会先进入排队。" : "当前状态：会话已关闭，请先重新开启。"}
          </p>
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
            disabled={status === "closed"}
          />
          <Button type="submit" className="px-5" disabled={status === "closed"}>
            <Send className="h-4 w-4" />
            发送
          </Button>
        </form>
        {sendError ? <p className="mt-3 text-sm text-red-500">{sendError}</p> : null}

        <div className="mt-4 border-t border-line/70 pt-4">
          <p className="text-sm text-ink/56">本次客服体验是否有帮助？</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {[
              { id: "helpful", label: "有帮助" },
              { id: "neutral", label: "一般" },
              { id: "unhelpful", label: "没解决" }
            ].map((item) => (
              <Button
                key={item.id}
                variant={feedback === item.id ? "primary" : "secondary"}
                className="min-h-8 px-4 text-xs"
                onClick={() => setFeedback(item.id as typeof feedback)}
              >
                {item.label}
              </Button>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
