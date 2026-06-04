"use client";

import { CheckCircle2, CreditCard, WalletCards, X } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { Button, Card, inputClass } from "@/components/ui";
import { rechargePlans } from "@/lib/mock-data";
import { useAppState } from "@/lib/store";

const paymentMethods = [
  { id: "wechat", label: "微信支付", hint: "推荐使用微信扫码完成付款", discount: 0, fee: 0 },
  { id: "alipay", label: "支付宝", hint: "适合使用支付宝余额或花呗，满 100 立减 2 元", discount: 2, fee: 0 },
  { id: "bank", label: "银行卡", hint: "支持储蓄卡与信用卡支付，需收取 1.5 元通道费", discount: 0, fee: 1.5 }
] as const;

const coupons = [
  { id: "coupon-10", label: "新人券", amount: 10, minAmount: 100, description: "满 100 可减 10 元" },
  { id: "coupon-25", label: "加赠券", amount: 25, minAmount: 300, description: "满 300 可减 25 元" }
] as const;

type PaymentRecord = {
  orderId: string;
  transactionId?: string;
  amount: number;
  bonus: number;
  couponAmount: number;
  methodDiscount: number;
  methodFee: number;
  payable: number;
  methodLabel: string;
  status: "success" | "cancelled" | "failed";
  createdAt: string;
  note: string;
};

function getCustomBonus(amount: number) {
  if (amount >= 698) return 188;
  if (amount >= 328) return 68;
  if (amount >= 128) return 20;
  if (amount >= 50) return 5;
  return 0;
}

function buildOrderId() {
  return `US${Date.now().toString().slice(-10)}`;
}

function buildTransactionId() {
  return `TX${Date.now().toString().slice(-8)}${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

function isValidSubmissionLink(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return false;

  try {
    const url = new URL(trimmed);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export default function RechargePage() {
  const { user, recharge, submitReviewLink, currentMemoryId, memorySpaces, shareCampaigns } = useAppState();
  const [selectedPlanId, setSelectedPlanId] = useState(rechargePlans[1].id);
  const [paidPlanId, setPaidPlanId] = useState<string | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [activeNotice, setActiveNotice] = useState<"post" | "invite" | "share" | null>(null);
  const [postLink, setPostLink] = useState("");
  const [postSubmitted, setPostSubmitted] = useState(false);
  const [postError, setPostError] = useState("");
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<(typeof paymentMethods)[number]["id"]>("wechat");
  const [selectedCouponId, setSelectedCouponId] = useState<(typeof coupons)[number]["id"] | null>("coupon-10");
  const [shareCopied, setShareCopied] = useState(false);
  const [inviteCopied, setInviteCopied] = useState(false);
  const [copyError, setCopyError] = useState("");
  const [paymentError, setPaymentError] = useState("");
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentRecords, setPaymentRecords] = useState<PaymentRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<PaymentRecord | null>(null);
  const [failedPayment, setFailedPayment] = useState<{
    orderId: string;
    payable: number;
    methodLabel: string;
    reason: string;
  } | null>(null);
  const [retryOrderId, setRetryOrderId] = useState<string | null>(null);
  const [lastPaymentResult, setLastPaymentResult] = useState<{
    orderId: string;
    transactionId: string;
    amount: number;
    bonus: number;
    payable: number;
    couponAmount: number;
    methodLabel: string;
  } | null>(null);
  const [cancelledPayment, setCancelledPayment] = useState<{
    orderId: string;
    payable: number;
    methodLabel: string;
  } | null>(null);
  const selectedPlan = rechargePlans.find((plan) => plan.id === selectedPlanId) ?? rechargePlans[0];
  const selectedPaymentMethod = paymentMethods.find((method) => method.id === paymentMethod) ?? paymentMethods[0];
  const selectedCoupon = coupons.find((coupon) => coupon.id === selectedCouponId) ?? null;
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
  const rechargeBonus = customAmount ? getCustomBonus(rechargeAmount) : selectedPlan.bonus;
  const methodDiscount = rechargeAmount >= 100 ? selectedPaymentMethod.discount : 0;
  const methodFee = selectedPaymentMethod.fee;
  const couponDiscount = selectedCoupon && rechargeAmount >= selectedCoupon.minAmount ? selectedCoupon.amount : 0;
  const paymentTotal = Math.max(rechargeAmount - couponDiscount - methodDiscount + methodFee, 0);
  const creditedBalance = rechargeAmount + rechargeBonus;
  const maxCustomAmount = 2000;
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
  const successfulPaymentRecords = paymentRecords.filter((record) => record.status === "success");

  async function handleCopyInviteCode() {
    try {
      await navigator.clipboard.writeText(inviteCode);
      setInviteCopied(true);
      setCopyError("");
    } catch {
      setCopyError("邀请码复制失败，请手动长按或复制显示的内容。");
    }
  }

  async function handleCopyShareCode() {
    try {
      await navigator.clipboard.writeText(shareLink);
      setShareCopied(true);
      setCopyError("");
    } catch {
      setCopyError("分享链接复制失败，请手动复制下方链接。");
    }
  }

  function handleClosePayment() {
    if (paymentProcessing) return;

    if (!rechargeAmount) {
      setPaymentOpen(false);
      return;
    }

    const orderId = retryOrderId ?? buildOrderId();

    setCancelledPayment({
      orderId,
      payable: paymentTotal,
      methodLabel: selectedPaymentMethod.label
    });
    setPaymentRecords((current) => [
      {
        orderId,
        amount: rechargeAmount,
        bonus: rechargeBonus,
        couponAmount: couponDiscount,
        methodDiscount,
        methodFee,
        payable: paymentTotal,
        methodLabel: selectedPaymentMethod.label,
        status: "cancelled",
        createdAt: new Date().toLocaleString("zh-CN"),
        note: "用户取消支付，订单已保留 15 分钟。"
      },
      ...current
    ]);
    setPaymentOpen(false);
  }

  function handleConfirmPayment() {
    if (paymentOpen === false || paymentProcessing || paidPlanId === (customAmount ? "custom" : selectedPlan.id)) {
      return;
    }

    if (rechargeAmount <= 0 || rechargeAmount > maxCustomAmount) {
      setPaymentError(`单次充值金额需在 1 到 ${maxCustomAmount} 元之间。`);
      return;
    }

    const orderId = retryOrderId ?? buildOrderId();

    setPaymentProcessing(true);
    setPaymentError("");

    window.setTimeout(() => {
      const transactionId = buildTransactionId();

      if (selectedPaymentMethod.id === "bank" && !retryOrderId) {
        setFailedPayment({
          orderId,
          payable: paymentTotal,
          methodLabel: selectedPaymentMethod.label,
          reason: "银行卡通道验证超时，请重试付款或切换支付方式。"
        });
        setPaymentRecords((current) => [
          {
            orderId,
            amount: rechargeAmount,
            bonus: rechargeBonus,
            couponAmount: couponDiscount,
            methodDiscount,
            methodFee,
            payable: paymentTotal,
            methodLabel: selectedPaymentMethod.label,
            status: "failed",
            createdAt: new Date().toLocaleString("zh-CN"),
            note: "支付失败，可重试或切换支付方式。"
          },
          ...current
        ]);
        setPaymentProcessing(false);
        setPaymentOpen(false);
        return;
      }

      recharge(rechargeAmount, rechargeBonus);
      setPaidPlanId(customAmount ? "custom" : selectedPlan.id);
      setLastPaymentResult({
        orderId,
        transactionId,
        amount: rechargeAmount,
        bonus: rechargeBonus,
        payable: paymentTotal,
        couponAmount: couponDiscount,
        methodLabel: selectedPaymentMethod.label
      });
      setPaymentRecords((current) => [
        {
          orderId,
          transactionId,
          amount: rechargeAmount,
          bonus: rechargeBonus,
          couponAmount: couponDiscount,
          methodDiscount,
          methodFee,
          payable: paymentTotal,
          methodLabel: selectedPaymentMethod.label,
          status: "success",
          createdAt: new Date().toLocaleString("zh-CN"),
          note: "支付成功，余额已更新。"
        },
        ...current
      ]);
      setCancelledPayment(null);
      setFailedPayment(null);
      setRetryOrderId(null);
      setPaymentProcessing(false);
      setPaymentOpen(false);
      setCustomAmount("");
      setPaymentError("");
    }, 1200);
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
          <Card className="p-6">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="font-editorial text-[30px] text-ink">余额</p>
                <p className="mt-2 text-sm text-ink/54">当前会员状态：{user.membership} · 1 元 = 1000 tokens</p>
              </div>
              <div className="text-right">
                <p className="font-editorial text-[44px] leading-none text-ink">{tokenBalance.toLocaleString()}</p>
                <p className="mt-2 text-sm font-medium uppercase tracking-[0.14em] text-ink/48">tokens</p>
                <p className="mt-2 text-xs text-ink/42">账户余额折合 ¥{user.balance.toFixed(2)}</p>
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
                  placeholder={`输入 1-${maxCustomAmount} 元`}
                  value={customAmount}
                  onChange={(event) => {
                    const nextValue = event.target.value.replace(/[^\d]/g, "");
                    const trimmedValue = nextValue ? String(Math.min(Number(nextValue), maxCustomAmount)) : "";
                    setCustomAmount(trimmedValue);
                    setPaymentError("");
                  }}
                />
                <p className="mt-3 text-sm text-ink/54">
                  自定义充值也会按档位赠送奖励：满 50 送 5，满 128 送 20，满 328 送 68，满 698 送 188。
                </p>
                {Number(customAmount) > maxCustomAmount ? (
                  <p className="mt-2 text-sm text-red-500">自定义充值最高支持 {maxCustomAmount} 元。</p>
                ) : null}
              </div>
            </div>

            <Button
              className="mt-8 min-h-16 w-full text-lg font-semibold"
              onClick={() => {
                if (!rechargeAmount) return;
                if (rechargeAmount > maxCustomAmount) {
                  setPaymentError(`单次充值金额需在 1 到 ${maxCustomAmount} 元之间。`);
                  return;
                }
                setPaymentOpen(true);
                setPaymentError("");
              }}
            >
              <CreditCard className="h-5 w-5" />
              确认充值
            </Button>
            {paymentError ? <p className="mt-3 text-sm text-red-500">{paymentError}</p> : null}
            {copyError ? <p className="mt-3 text-sm text-red-500">{copyError}</p> : null}

            {lastPaymentResult ? (
              <div className="mt-4 rounded-[18px] bg-white p-4 text-sm text-sage">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                  <div>
                    <p className="font-medium text-sage">支付成功，余额已更新。</p>
                    <p className="mt-1 text-ink/58">
                      订单号 {lastPaymentResult.orderId} · 流水号 {lastPaymentResult.transactionId}
                    </p>
                    <p className="mt-1 text-ink/58">
                      实付 ¥{lastPaymentResult.payable.toFixed(2)}，到账 ¥{(lastPaymentResult.amount + lastPaymentResult.bonus).toFixed(2)}，优惠券抵扣 ¥{lastPaymentResult.couponAmount.toFixed(2)}，支付方式 {lastPaymentResult.methodLabel}
                    </p>
                  </div>
                </div>
              </div>
            ) : null}

            {cancelledPayment ? (
              <div className="mt-4 rounded-[18px] border border-dashed border-line bg-[#fffafc] p-4 text-sm text-ink/64">
                <p>你已取消本次支付，订单 {cancelledPayment.orderId} 已为你保留 15 分钟。</p>
                <p className="mt-1">待支付金额 ¥{cancelledPayment.payable.toFixed(2)} · 支付方式 {cancelledPayment.methodLabel}</p>
                <div className="mt-3 flex flex-wrap gap-3">
                  <Button
                    variant="secondary"
                    className="px-5"
                    onClick={() => {
                      setRetryOrderId(cancelledPayment.orderId);
                      setPaymentOpen(true);
                    }}
                  >
                    继续支付
                  </Button>
                  <Button variant="ghost" className="px-5" onClick={() => setCancelledPayment(null)}>
                    取消提醒
                  </Button>
                </div>
              </div>
            ) : null}

            {failedPayment ? (
              <div className="mt-4 rounded-[18px] border border-[#f3d2d7] bg-[#fff6f7] p-4 text-sm text-ink/64">
                <p className="font-medium text-[#b86474]">支付失败：{failedPayment.reason}</p>
                <p className="mt-1">订单 {failedPayment.orderId} · 待支付金额 ¥{failedPayment.payable.toFixed(2)} · 支付方式 {failedPayment.methodLabel}</p>
                <div className="mt-3 flex flex-wrap gap-3">
                  <Button
                    variant="secondary"
                    className="px-5"
                    onClick={() => {
                      setRetryOrderId(failedPayment.orderId);
                      setPaymentOpen(true);
                    }}
                  >
                    重试付款
                  </Button>
                  <Button variant="ghost" className="px-5" onClick={() => setFailedPayment(null)}>
                    关闭提示
                  </Button>
                </div>
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
                          setPostError("");
                        }}
                      />
                      <Button
                        className="min-h-14 px-6 text-base font-semibold"
                        onClick={() => {
                          if (!postLink.trim()) return;
                          if (!isValidSubmissionLink(postLink)) {
                            setPostError("投稿链接格式不正确，请输入完整的 http:// 或 https:// 地址。");
                            setPostSubmitted(false);
                            return;
                          }
                          submitReviewLink({
                            type: "post",
                            title: "发帖征集",
                            link: postLink.trim()
                          });
                          setPostSubmitted(true);
                          setPostError("");
                          setPostLink("");
                        }}
                      >
                        提交
                      </Button>
                    </div>
                  ) : null}
                  {activeNotice === "post" && postError ? (
                    <p className="mt-3 text-sm text-red-500">{postError}</p>
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

        <div className="grid gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <Card className="p-6">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h2 className="font-editorial text-[28px] text-ink">可用优惠券</h2>
                <p className="mt-2 text-sm leading-6 text-ink/56">支付前可选择优惠券，系统会按金额门槛自动抵扣。</p>
              </div>
            </div>

            <div className="space-y-4">
                {coupons.map((coupon) => {
                  const available = rechargeAmount >= coupon.minAmount;
                  const selected = selectedCouponId === coupon.id;

                  return (
                    <button
                    key={coupon.id}
                    type="button"
                      className={`w-full rounded-[22px] border p-4 text-left transition ${
                      !available
                        ? "border-dashed border-[#e8dde3] bg-[#faf6f7] text-ink/42"
                        : ""
                    } ${
                      selected
                        ? "border-[#d8caed] bg-[#f5eef8] shadow-[0_10px_24px_rgba(126,110,135,0.08)]"
                        : "border-line bg-white hover:border-[#d8caed]"
                    }`}
                    onClick={() => {
                      if (!available) return;
                      setSelectedCouponId(selected ? null : coupon.id);
                    }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-base font-semibold text-ink">{coupon.label}</h3>
                        <p className="mt-2 text-sm text-ink/58">{coupon.description}</p>
                        {!available ? (
                          <p className="mt-2 text-xs text-[#b27a87]">当前金额未达门槛，还差 ¥{(coupon.minAmount - rechargeAmount).toFixed(2)}</p>
                        ) : null}
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          !available
                            ? "bg-[#f3eaee] text-[#b27a87]"
                            : selected
                              ? "bg-[#eadbe7] text-ink"
                              : "bg-[#eef4f4] text-sage"
                        }`}
                      >
                        {!available ? `满 ¥${coupon.minAmount} 可用` : selected ? "已选中" : "可使用"}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>

          <Card className="p-6">
            <div className="mb-5">
              <h2 className="font-editorial text-[28px] text-ink">订单记录</h2>
              <p className="mt-2 text-sm leading-6 text-ink/56">最近的支付成功、失败和取消状态会同步记录在这里。</p>
            </div>

            <div className="space-y-4">
              {paymentRecords.length > 0 ? (
                paymentRecords.map((record) => (
                  <button
                    key={`${record.orderId}-${record.status}-${record.createdAt}`}
                    type="button"
                    className="w-full rounded-[22px] border border-line bg-white p-4 text-left shadow-sm transition hover:border-[#d8caed] hover:shadow-[0_10px_24px_rgba(126,110,135,0.08)]"
                    onClick={() => setSelectedRecord(record)}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        variant={record.status === "success" ? "primary" : record.status === "failed" ? "danger" : "secondary"}
                        className="pointer-events-none min-h-0 px-3 py-1 text-xs"
                      >
                        {record.status === "success" ? "支付成功" : record.status === "failed" ? "支付失败" : "已取消"}
                      </Button>
                      <span className="text-xs text-ink/42">{record.createdAt}</span>
                    </div>
                    <p className="mt-3 text-sm font-medium text-ink">订单号 {record.orderId}</p>
                    {record.transactionId ? <p className="mt-1 text-xs text-ink/46">流水号 {record.transactionId}</p> : null}
                    <p className="mt-2 text-sm leading-6 text-ink/58">
                      充值 ¥{record.amount.toFixed(2)}，赠送 ¥{record.bonus.toFixed(2)}，优惠券抵扣 ¥{record.couponAmount.toFixed(2)}，实付 ¥{record.payable.toFixed(2)}，方式 {record.methodLabel}
                    </p>
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <p className="text-xs text-ink/46">{record.note}</p>
                      <span className="text-xs font-medium text-ink/54">查看详情</span>
                    </div>
                  </button>
                ))
              ) : (
                <div className="rounded-[22px] border border-dashed border-line bg-white px-5 py-8 text-sm leading-7 text-ink/48">
                  暂无订单记录。完成支付、取消或失败后，记录会显示在这里。
                </div>
              )}
            </div>
          </Card>
        </div>

        <Card className="p-6">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h2 className="font-editorial text-[28px] text-ink">token 到账明细</h2>
              <p className="mt-2 text-sm leading-6 text-ink/56">成功支付后会记录实际到账金额、赠送奖励和折算后的 tokens 数量。</p>
            </div>
            <div className="rounded-[20px] bg-[#f6f0f2] px-4 py-3 text-right">
              <p className="text-xs uppercase tracking-[0.16em] text-ink/42">累计到账</p>
              <p className="mt-2 font-editorial text-[28px] leading-none text-ink">
                {successfulPaymentRecords
                  .reduce((sum, record) => sum + record.amount + record.bonus, 0)
                  .toFixed(2)}
              </p>
              <p className="mt-1 text-xs text-ink/46">约 {successfulPaymentRecords.reduce((sum, record) => sum + (record.amount + record.bonus) * 1000, 0).toLocaleString()} tokens</p>
            </div>
          </div>

          <div className="space-y-4">
            {successfulPaymentRecords.length > 0 ? (
              successfulPaymentRecords.map((record) => {
                const creditedAmount = record.amount + record.bonus;
                return (
                  <div key={`${record.orderId}-ledger`} className="rounded-[22px] border border-line bg-white p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-ink">订单 {record.orderId}</p>
                        <p className="mt-1 text-xs text-ink/46">{record.createdAt} · {record.methodLabel}</p>
                      </div>
                      <div className="grid gap-3 text-sm text-ink/62 sm:grid-cols-3">
                        <div>
                          <p className="text-xs text-ink/42">实际支付</p>
                          <p className="mt-1 font-semibold text-ink">¥{record.payable.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-ink/42">到账余额</p>
                          <p className="mt-1 font-semibold text-sage">¥{creditedAmount.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-ink/42">折算 tokens</p>
                          <p className="mt-1 font-semibold text-ink">{Math.round(creditedAmount * 1000).toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="rounded-[22px] border border-dashed border-line bg-white px-5 py-8 text-sm leading-7 text-ink/48">
                暂无到账账单。完成一笔成功充值后，这里会展示 token 到账明细。
              </div>
            )}
          </div>
        </Card>
      </div>

      {paymentOpen ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-[rgba(91,75,90,0.28)] px-4 py-6 backdrop-blur-sm">
          <Card className="w-full max-w-xl p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.22em] text-ink/42">Payment</p>
                <h2 className="font-editorial mt-2 text-[30px] text-ink">选择支付方式</h2>
                <p className="mt-2 text-sm leading-6 text-ink/58">确认付款后才会把金额与奖励发放到当前账户余额，并生成订单号和支付流水。</p>
              </div>
              <button
                type="button"
                className="rounded-full bg-white/72 p-2 text-ink/54 transition hover:bg-white hover:text-ink"
                onClick={handleClosePayment}
                disabled={paymentProcessing}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-6 rounded-[22px] bg-mist p-5">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-sm text-ink/54">本次实付</p>
                  <p className="font-editorial mt-2 text-[34px] leading-none text-ink">¥{paymentTotal.toFixed(2)}</p>
                </div>
                <div className="text-right text-sm text-ink/56">
                  <p>充值金额：¥{rechargeAmount.toFixed(2)}</p>
                  <p className="mt-1">赠送奖励：¥{rechargeBonus.toFixed(2)}</p>
                  <p className="mt-1">优惠券抵扣：-¥{couponDiscount.toFixed(2)}</p>
                  <p className="mt-1">支付优惠：-¥{methodDiscount.toFixed(2)}</p>
                  <p className="mt-1">通道费用：+¥{methodFee.toFixed(2)}</p>
                  <p className="mt-2 font-medium text-ink">到账余额：¥{creditedBalance.toFixed(2)}</p>
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
              <Button variant="secondary" className="sm:min-w-28" disabled={paymentProcessing} onClick={handleClosePayment}>
                取消
              </Button>
              <Button
                className="sm:min-w-36"
                disabled={paymentProcessing || paidPlanId === (customAmount ? "custom" : selectedPlan.id)}
                onClick={handleConfirmPayment}
              >
                {paymentProcessing ? "支付处理中..." : "确认付款"}
              </Button>
            </div>
          </Card>
        </div>
      ) : null}

      {selectedRecord ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-[rgba(91,75,90,0.24)] px-4 py-6 backdrop-blur-sm">
          <Card className="w-full max-w-2xl p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.22em] text-ink/42">Order Detail</p>
                <h2 className="font-editorial mt-2 text-[30px] text-ink">订单详情</h2>
                <p className="mt-2 text-sm leading-6 text-ink/58">这里展示这笔充值的订单、支付方式、优惠抵扣与到账信息。</p>
              </div>
              <button
                type="button"
                className="rounded-full bg-white/72 p-2 text-ink/54 transition hover:bg-white hover:text-ink"
                onClick={() => setSelectedRecord(null)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-6 grid gap-4 rounded-[22px] bg-mist p-5 md:grid-cols-2">
              <div className="space-y-3 text-sm text-ink/62">
                <p><span className="text-ink/42">订单号：</span>{selectedRecord.orderId}</p>
                <p><span className="text-ink/42">流水号：</span>{selectedRecord.transactionId ?? "未生成"}</p>
                <p><span className="text-ink/42">创建时间：</span>{selectedRecord.createdAt}</p>
                <p><span className="text-ink/42">支付方式：</span>{selectedRecord.methodLabel}</p>
              </div>
              <div className="space-y-3 text-sm text-ink/62">
                <p><span className="text-ink/42">订单状态：</span>{selectedRecord.status === "success" ? "支付成功" : selectedRecord.status === "failed" ? "支付失败" : "已取消"}</p>
                <p><span className="text-ink/42">充值金额：</span>¥{selectedRecord.amount.toFixed(2)}</p>
                <p><span className="text-ink/42">赠送奖励：</span>¥{selectedRecord.bonus.toFixed(2)}</p>
                <p><span className="text-ink/42">到账余额：</span>¥{(selectedRecord.amount + selectedRecord.bonus).toFixed(2)}</p>
              </div>
            </div>

            <div className="mt-5 rounded-[22px] border border-line bg-white p-5">
              <div className="grid gap-4 text-sm text-ink/62 sm:grid-cols-2">
                <p><span className="text-ink/42">优惠券抵扣：</span>-¥{selectedRecord.couponAmount.toFixed(2)}</p>
                <p><span className="text-ink/42">支付优惠：</span>-¥{selectedRecord.methodDiscount.toFixed(2)}</p>
                <p><span className="text-ink/42">通道费用：</span>+¥{selectedRecord.methodFee.toFixed(2)}</p>
                <p><span className="text-ink/42">最终实付：</span>¥{selectedRecord.payable.toFixed(2)}</p>
                <p><span className="text-ink/42">到账 tokens：</span>{Math.round((selectedRecord.amount + selectedRecord.bonus) * 1000).toLocaleString()}</p>
                <p><span className="text-ink/42">备注：</span>{selectedRecord.note}</p>
              </div>
            </div>
          </Card>
        </div>
      ) : null}
    </AppShell>
  );
}
