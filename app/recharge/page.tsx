"use client";

import { CheckCircle2, CreditCard, WalletCards, X } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { Button, Card, inputClass } from "@/components/ui";
import { rechargePlans } from "@/lib/mock-data";
import { useAppState } from "@/lib/store";

const paymentMethods = [
  { id: "wechat", label: "微信支付", hint: "推荐使用微信扫码完成付款" },
  { id: "alipay", label: "支付宝", hint: "适合使用支付宝余额或花呗" },
  { id: "bank", label: "银行卡", hint: "支持储蓄卡与信用卡支付" }
] as const;

export default function RechargePage() {
  const { user, recharge, submitReviewLink, currentMemoryId, memorySpaces, shareCampaigns } = useAppState();
  const [selectedPlanId, setSelectedPlanId] = useState(rechargePlans[1].id);
  const [paidPlanId, setPaidPlanId] = useState<string | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [activeNotice, setActiveNotice] = useState<"post" | "invite" | "share" | null>(null);
  const [postLink, setPostLink] = useState("");
  const [postSubmitted, setPostSubmitted] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<(typeof paymentMethods)[number]["id"]>("wechat");
  const [shareCopied, setShareCopied] = useState(false);
  const [inviteCopied, setInviteCopied] = useState(false);
  const selectedPlan = rechargePlans.find((plan) => plan.id === selectedPlanId) ?? rechargePlans[0];
  const currentMemory = memorySpaces.find((item) => item.id === currentMemoryId) ?? memorySpaces[0];
  const shareCampaign = shareCampaigns.find((item) => item.memorySpaceId === currentMemory.id) ?? shareCampaigns[0];
  const tokenBalance = Math.round(user.balance * 1000);
  const inviteCode = "US-2026-12";
  const shareCode = shareCampaign.code;
  const shareLink = `http://localhost:3000/share/${shareCode}`;
  const usage = [
    { label: "提示词调试", value: 48, color: "bg-[#d7a9c2]" },
    { label: "聊天模拟", value: 32, color: "bg-[#cfe4e8]" },
    { label: "记忆整理", value: 20, color: "bg-[#d8caed]" }
  ];
  const rechargeAmount = customAmount ? Number(customAmount) || 0 : selectedPlan.amount;
  const rechargeBonus = customAmount ? 0 : selectedPlan.bonus;
  const paymentTotal = rechargeAmount + rechargeBonus;
  const notices = [
    {
      id: "post" as const,
      title: "发帖征集",
      summary: "小红书 / 抖音发帖，带上 #心迹档案 和 #心迹档案陪伴 标签即可参与。",
      details: [
        "发帖即送 50 轮对话",
        "每月点赞数大于 100 的作品，按点赞数统计前 10 名赠送 189 元 tokens",
        "当月第一名若点赞破万，再额外赠送 999 元 tokens"
      ],
      footer: "输入帖子链接",
      actionLabel: "查看发帖详情"
    },
    {
      id: "invite" as const,
      title: "邀请码",
      summary: "邀请新用户使用心迹档案即可获得官方token奖励。",
      details: [
        "相互填写邀请码即送 tokens，双方各送 50 轮对话",
        "邀请新用户即送 tokens，双方各送 200 轮对话"
      ],
      footer: "已邀请用户人数 10人",
      actionLabel: "查看邀请码详情"
    },
    {
      id: "share" as const,
      title: "创作分享码",
      summary: "分享你创作的人设，点赞收藏量达标后赢官方token奖励。",
      details: [
        "别人必须通过你的专属分享链接进入，系统才会计入使用数据",
        "进入分享页会自动记录浏览量，点击开始体验会记录体验人数",
        "当对方产生有效对话后，系统会自动计入有效使用人数并同步奖励进度"
      ],
      actionLabel: "查看分享码详情"
    }
  ];
  const activeNoticeData = notices.find((notice) => notice.id === activeNotice) ?? null;

  async function handleCopyInviteCode() {
    try {
      await navigator.clipboard.writeText(inviteCode);
      setInviteCopied(true);
    } catch {
      // no-op for now
    }
  }

  async function handleCopyShareCode() {
    try {
      await navigator.clipboard.writeText(shareLink);
      setShareCopied(true);
    } catch {
      // no-op for now
    }
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
          <Card className="p-6">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="font-editorial text-[30px] text-ink">余额</p>
                <p className="mt-2 text-sm text-ink/54">当前会员状态：{user.membership}</p>
              </div>
              <div className="text-right">
                <p className="font-editorial text-[44px] leading-none text-ink">{tokenBalance.toLocaleString()}</p>
                <p className="mt-2 text-sm font-medium uppercase tracking-[0.14em] text-ink/48">tokens</p>
              </div>
            </div>

            <div className="mt-7">
              <div className="h-9 overflow-hidden rounded-full bg-[#f1ece8]">
                {usage.map((item) => (
                  <div
                    key={item.label}
                    className={`h-full ${item.color} first:rounded-l-full last:rounded-r-full`}
                    style={{ width: `${item.value}%`, float: "left" }}
                  />
                ))}
              </div>
              <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium text-ink/76">
                {usage.map((item) => (
                  <span key={item.label} className="inline-flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${item.color}`} />
                    {item.label} {item.value}%
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-10">
              <h2 className="font-editorial text-[28px] text-ink">充值包</h2>
              <div className="mt-5 flex flex-wrap gap-4">
                {rechargePlans.map((plan) => {
                  const selected = !customAmount && plan.id === selectedPlanId;
                  return (
                    <button
                      key={plan.id}
                      className={`rounded-full border px-7 py-3 text-[18px] font-semibold transition ${
                        selected
                          ? "border-[#d8caed] bg-[#f5eef8] text-ink shadow-[0_8px_22px_rgba(126,110,135,0.08)]"
                          : "border-line bg-white text-ink hover:border-[#d8caed]"
                      }`}
                      onClick={() => {
                        setSelectedPlanId(plan.id);
                        setCustomAmount("");
                      }}
                    >
                      ¥{plan.amount}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-10">
              <h2 className="font-editorial text-[28px] text-ink">自定义</h2>
              <div className="mt-5">
                <input
                  className={`${inputClass} min-h-14 rounded-[20px] px-6 text-base`}
                  inputMode="numeric"
                  placeholder="输入数量"
                  value={customAmount}
                  onChange={(event) => setCustomAmount(event.target.value.replace(/[^\d]/g, ""))}
                />
              </div>
            </div>

            <Button
              className="mt-8 min-h-16 w-full text-lg font-semibold"
              onClick={() => {
                if (!rechargeAmount) return;
                setPaymentOpen(true);
              }}
            >
              <CreditCard className="h-5 w-5" />
              确认充值
            </Button>

            {paidPlanId ? (
              <div className="mt-4 flex items-center gap-2 rounded-[18px] bg-white p-3 text-sm text-sage">
                <CheckCircle2 className="h-4 w-4" />
                支付成功，余额已更新。
              </div>
            ) : null}
          </Card>

          <Card className="flex min-h-[760px] flex-col p-6">
            <div>
              <h2 className="font-editorial text-[30px] text-ink">通知公告</h2>
            </div>
            <div className="mt-6 space-y-4">
              {notices.map((notice) => {
                const selected = activeNotice === notice.id;
                return (
                  <button
                    key={notice.id}
                    type="button"
                    className={`w-full rounded-[24px] border p-5 text-left transition ${
                      selected
                        ? "border-[#efe2ea] bg-[#fcf4f8] shadow-[0_10px_24px_rgba(126,110,135,0.08)]"
                        : "border-[#efe2ea] bg-[#fcf4f8] hover:border-[#e7d8e2] hover:bg-[#fdf7fa]"
                    }`}
                    onClick={() => setActiveNotice(notice.id)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-[20px] font-semibold text-ink">{notice.title}</h3>
                        <p className="mt-2 text-[15px] leading-7 text-ink/62">{notice.summary}</p>
                      </div>
                      <span className="shrink-0 rounded-full bg-white/72 px-4 py-2 text-sm font-medium text-ink/58">
                        {selected ? "当前详情" : notice.actionLabel}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {activeNoticeData ? (
              <div className="mt-6 bg-transparent p-1">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-[28px] font-semibold text-ink">{activeNoticeData.title}</h3>
                    <p className="mt-3 text-base leading-7 text-ink/66">{activeNoticeData.summary}</p>
                  </div>
                </div>
                <div className="mt-5 rounded-[20px] bg-white/88 p-5">
                  <ul className="space-y-3 text-base leading-7 text-ink/68">
                    {activeNoticeData.details.map((item) => (
                      <li key={item} className="flex gap-3">
                        <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-[#d7a9c2]" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  {activeNotice === "post" ? (
                    <div className="mt-5 flex gap-3">
                      <input
                        className={`${inputClass} min-h-14 flex-1 rounded-[18px] px-5 text-base`}
                        placeholder="输入帖子链接"
                        value={postLink}
                        onChange={(event) => {
                          setPostLink(event.target.value);
                          setPostSubmitted(false);
                        }}
                      />
                      <Button
                        className="min-h-14 px-6 text-base font-semibold"
                        onClick={() => {
                          if (!postLink.trim()) return;
                          submitReviewLink({
                            type: "post",
                            title: "发帖征集",
                            link: postLink.trim()
                          });
                          setPostSubmitted(true);
                          setPostLink("");
                        }}
                      >
                        提交
                      </Button>
                    </div>
                  ) : null}
                  {activeNotice === "post" && postSubmitted ? (
                    <p className="mt-3 text-sm text-sage">帖子链接已提交，审核通过后会发放对应奖励。</p>
                  ) : null}
                  {activeNotice === "share" ? (
                    <div className="mt-5 space-y-4">
                      <div className="rounded-[18px] bg-[#fbf7f8] px-5 py-4 text-base font-medium text-ink/72">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-sm text-ink/58">当前智能体</p>
                            <p className="mt-1 text-lg font-semibold text-ink">{currentMemory.name}</p>
                            <span className="mt-3 inline-flex rounded-full bg-[#eadbe7] px-4 py-2 text-sm text-ink">{shareCode}</span>
                            <p className="mt-3 break-all text-sm leading-6 text-ink/56">{shareLink}</p>
                          </div>
                          <div className="flex flex-col gap-3 sm:items-end">
                            <Button variant="secondary" className="px-5" onClick={handleCopyShareCode}>
                              {shareCopied ? "已复制链接" : "复制分享链接"}
                            </Button>
                            <Link href={`/share/${shareCode}`} target="_blank">
                              <Button className="px-5">打开分享页</Button>
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-5 rounded-[18px] bg-[#fbf7f8] px-5 py-4 text-base font-medium text-ink/72">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        {activeNotice === "post" ? <span>{activeNoticeData.footer}</span> : null}
                        {activeNotice === "invite" ? (
                          <div className="flex flex-wrap items-center gap-3">
                            <span className="text-sm text-ink/58">查看我的邀请码</span>
                            <span className="rounded-full bg-[#eadbe7] px-4 py-2 text-sm text-ink">{inviteCode}</span>
                            <Button variant="secondary" className="px-5" onClick={handleCopyInviteCode}>
                              {inviteCopied ? "已复制" : "一键复制"}
                            </Button>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </Card>
        </div>
      </div>

      {paymentOpen ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-[rgba(91,75,90,0.28)] px-4 py-6 backdrop-blur-sm">
          <Card className="w-full max-w-xl p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.22em] text-ink/42">Payment</p>
                <h2 className="font-editorial mt-2 text-[30px] text-ink">选择支付方式</h2>
                <p className="mt-2 text-sm leading-6 text-ink/58">确认付款后才会把金额与奖励发放到当前账户余额。</p>
              </div>
              <button
                type="button"
                className="rounded-full bg-white/72 p-2 text-ink/54 transition hover:bg-white hover:text-ink"
                onClick={() => setPaymentOpen(false)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-6 rounded-[22px] bg-mist p-5">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-sm text-ink/54">本次到账</p>
                  <p className="font-editorial mt-2 text-[34px] leading-none text-ink">¥{paymentTotal.toFixed(2)}</p>
                </div>
                <div className="text-right text-sm text-ink/56">
                  <p>充值金额：¥{rechargeAmount.toFixed(2)}</p>
                  <p className="mt-1">赠送奖励：¥{rechargeBonus.toFixed(2)}</p>
                </div>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {paymentMethods.map((method) => {
                const selected = paymentMethod === method.id;
                return (
                  <button
                    key={method.id}
                    type="button"
                    className={`w-full rounded-[20px] border px-5 py-4 text-left transition ${
                      selected
                        ? "border-[#d8caed] bg-[#f6eef6] shadow-[0_10px_24px_rgba(126,110,135,0.08)]"
                        : "border-line bg-white hover:border-[#e6d3dc] hover:bg-[#fcf7fa]"
                    }`}
                    onClick={() => setPaymentMethod(method.id)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-base font-semibold text-ink">{method.label}</h3>
                        <p className="mt-1 text-sm leading-6 text-ink/56">{method.hint}</p>
                      </div>
                      <span className={`mt-1 h-5 w-5 rounded-full border ${selected ? "border-sage bg-sage" : "border-line bg-white"}`} />
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Button variant="secondary" className="sm:min-w-28" onClick={() => setPaymentOpen(false)}>
                取消
              </Button>
              <Button
                className="sm:min-w-36"
                onClick={() => {
                  recharge(rechargeAmount, rechargeBonus);
                  setPaidPlanId(customAmount ? "custom" : selectedPlan.id);
                  setPaymentOpen(false);
                  setCustomAmount("");
                }}
              >
                确认付款
              </Button>
            </div>
          </Card>
        </div>
      ) : null}
    </AppShell>
  );
}
