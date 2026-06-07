"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button, Card } from "@/components/ui";
import { useAppState } from "@/lib/store";

export default function ShareLandingPage() {
  const params = useParams<{ code: string }>();
  const code = Array.isArray(params?.code) ? params.code[0] : params?.code ?? "";
  const { shareCampaigns, memorySpaces, templates, recordShareVisit, recordShareActivation, recordShareEffectiveUse } = useAppState();
  const [visitorId, setVisitorId] = useState("");
  const [started, setStarted] = useState(false);
  const [messageCount, setMessageCount] = useState(0);
  const [effectiveRecorded, setEffectiveRecorded] = useState(false);

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

  function handleStart() {
    if (!visitorId) return;
    recordShareActivation(code, visitorId);
    setStarted(true);
  }

  function handleSendMessage() {
    if (!visitorId || effectiveRecorded) return;
    const nextCount = messageCount + 1;
    setMessageCount(nextCount);
    if (nextCount >= 3) {
      recordShareEffectiveUse(code, visitorId);
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
          <p className="mt-4 text-base leading-7 text-ink/62">你正在通过专属分享链接体验一位被创作出来的智能体。</p>
        </div>

        <Card className="mx-auto max-w-3xl p-8 text-center">
          <p className="text-sm text-ink/46">当前分享智能体</p>
          <h2 className="font-editorial mt-3 text-[34px] text-ink">{template.name}</h2>
          <p className="mt-4 text-base leading-8 text-ink/64">{template.description}</p>
          <p className="mt-4 text-sm text-ink/48">所属记忆体：{memory.name}</p>
          <p className="mt-2 text-sm text-ink/48">语气：{template.personaPrompt}</p>
          <p className="mt-6 text-xs tracking-[0.18em] text-ink/36">分享码 {code}</p>

          {!started ? (
            <div className="mt-8">
              <Button className="px-8" onClick={handleStart}>
                开始体验这个智能体
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

              <div className="flex flex-wrap items-center gap-3">
                <Button onClick={handleSendMessage} disabled={effectiveRecorded}>
                  {effectiveRecorded ? "已完成有效体验" : "发送一条消息"}
                </Button>
                <span className="text-sm text-ink/54">当前已发送 {messageCount} / 3 条</span>
              </div>

              <p className="text-sm leading-7 text-ink/58">
                当你发送满 3 条消息后，系统会自动把这次体验计入创作者的“有效使用人数”。
              </p>
              {effectiveRecorded ? <p className="text-sm text-sage">本次体验已完成计数，重复点击不会再次累加。</p> : null}
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
