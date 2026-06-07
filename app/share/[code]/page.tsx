"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button, Card, inputClass } from "@/components/ui";
import { useAppState } from "@/lib/store";

export default function ShareLandingPage() {
  const params = useParams<{ code: string }>();
  const code = Array.isArray(params?.code) ? params.code[0] : params?.code ?? "";
  const { shareCampaigns, memorySpaces, templates, recordShareVisit, recordShareActivation, recordShareEffectiveUse } = useAppState();
  const [visitorId, setVisitorId] = useState("");
  const [started, setStarted] = useState(false);
  const [messageCount, setMessageCount] = useState(0);
  const [effectiveRecorded, setEffectiveRecorded] = useState(false);
  const [input, setInput] = useState("");
  const [stayedLongEnough, setStayedLongEnough] = useState(false);
  const [assistantReplied, setAssistantReplied] = useState(false);
  const [chat, setChat] = useState<string[]>([]);

  const campaign = useMemo(() => shareCampaigns.find((item) => item.code === code) ?? null, [code, shareCampaigns]);
  const memory = useMemo(() => {
    if (!campaign) return null;
    return memorySpaces.find((item) => item.id === campaign.memorySpaceId) ?? null;
  }, [campaign, memorySpaces]);
  const template = useMemo(() => {
    if (!campaign) return null;
    return templates.find((item) => item.id === campaign.templateId) ?? null;
  }, [campaign, templates]);

  useEffect(() => {
    if (!code || visitorId) return;
    const nextVisitorId = recordShareVisit(code);
    if (!nextVisitorId) return;
    setVisitorId(nextVisitorId);
  }, [code, recordShareVisit, visitorId]);

  useEffect(() => {
    if (!started) return;
    const timer = window.setTimeout(() => {
      setStayedLongEnough(true);
    }, 12000);

    return () => window.clearTimeout(timer);
  }, [started]);

  function handleStart() {
    if (!visitorId) return;
    recordShareActivation(code, visitorId);
    setStarted(true);
  }

  function handleSendMessage() {
    const trimmed = input.trim();
    if (!visitorId || !trimmed || effectiveRecorded) return;

    const nextCount = messageCount + 1;
    setMessageCount(nextCount);
    setChat((current) => [
      ...current,
      `你：${trimmed}`,
      `${template?.name ?? "当前智能体"}：我收到你这句话了，会先顺着你的情绪和语境接住你，再慢慢回应。`
    ]);
    setAssistantReplied(true);
    setInput("");

    if (nextCount >= 1 && stayedLongEnough) {
      recordShareEffectiveUse(code, visitorId, { stayedLongEnough: true, repliedToAgent: true });
      setEffectiveRecorded(true);
    }
  }

  if (!campaign || !memory || !template) {
    return (
      <main className="min-h-screen bg-linen px-6 py-10">
        <div className="mx-auto max-w-3xl">
          <Card className="p-8 text-center">
            <p className="text-sm uppercase tracking-[0.22em] text-ink/40">Union Soul Share</p>
            <h1 className="font-editorial mt-4 text-[36px] text-ink">分享码无效</h1>
            <p className="mt-4 text-base leading-8 text-ink/62">
              这个分享链接不存在、已失效，或已经被回收。请联系创作者重新获取有效链接。
            </p>
            <div className="mt-8">
              <Link href="/">
                <Button variant="secondary">返回首页</Button>
              </Link>
            </div>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-linen px-6 py-10">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="text-center">
          <p className="text-sm uppercase tracking-[0.22em] text-ink/40">Union Soul Share</p>
          <h1 className="font-editorial mt-4 text-[42px] text-ink">心迹档案</h1>
          <p className="mt-4 text-base leading-7 text-ink/62">你正在通过专属分享链接体验一套可导入的智能体设定方案。</p>
        </div>

        <Card className="mx-auto max-w-3xl p-8 text-center">
          <p className="text-sm text-ink/46">当前分享模板</p>
          <h2 className="font-editorial mt-3 text-[34px] text-ink">{template.name}</h2>
          <p className="mt-4 text-base leading-8 text-ink/64">{template.description}</p>
          <p className="mt-4 text-sm text-ink/48">所属记忆体：{memory.name}</p>
          <p className="mt-2 text-sm text-ink/48">智能体设定语气：{template.personaPrompt}</p>
          <p className="mt-6 text-xs tracking-[0.18em] text-ink/36">分享码 {code}</p>

          {!started ? (
            <div className="mt-8">
              <Button className="px-8" onClick={handleStart}>
                开始体验这个模板
              </Button>
              <p className="mt-4 text-sm text-ink/52">点击开始体验后，会为创作者记录一位新的体验用户。</p>
            </div>
          ) : (
            <div className="mt-8 space-y-5 text-left">
              <div className="rounded-[22px] bg-[#fcf6f8] p-5">
                <p className="text-sm leading-7 text-ink/70">
                  {template.starterGreeting ?? "你好，我是一个被分享给你的智能体。你可以先随便和我说说今天的心情、最近在想的事情，或者只是来打个招呼。"}
                </p>
              </div>

              <div className="space-y-3">
                {chat.map((message, index) => (
                  <div key={`${message}-${index}`} className="rounded-[18px] bg-white px-4 py-3 text-sm leading-7 text-ink/68">
                    {message}
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <input
                  className={`${inputClass} min-h-12 flex-1 rounded-[18px] px-4`}
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder="发送一条真实输入"
                />
                <Button onClick={handleSendMessage} disabled={effectiveRecorded}>
                  {effectiveRecorded ? "已完成有效体验" : "发送"}
                </Button>
              </div>

              <div className="rounded-[18px] border border-dashed border-line bg-white px-4 py-4 text-sm leading-7 text-ink/58">
                <p>有效体验口径：</p>
                <p>1. 已完成真实输入：{messageCount >= 1 ? "是" : "否"}</p>
                <p>2. 停留时长达标：{stayedLongEnough ? "是" : "否"}</p>
                <p>3. 已触发实际对话返回：{assistantReplied ? "是" : "否"}</p>
              </div>

              {effectiveRecorded ? <p className="text-sm text-sage">本次体验已满足有效计数条件，不会重复累加。</p> : null}
            </div>
          )}
        </Card>

        <div className="text-center">
          <Link href="/">
            <Button variant="secondary">返回首页</Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
