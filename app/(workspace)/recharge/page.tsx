"use client";

import { CheckCircle2, CreditCard, WalletCards, X } from "lucide-react";
import { useState } from "react";
import { Button, Card, SectionHeader, inputClass } from "@/components/ui";
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

export default function RechargePage() {
  const { user, recharge } = useAppState();
  const [selectedPlanId, setSelectedPlanId] = useState(rechargePlans[1].id);
  const [customAmount, setCustomAmount] = useState("");
  const [paidPlanId, setPaidPlanId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<(typeof paymentMethods)[number]["id"]>("wechat");
  const [selectedCouponId, setSelectedCouponId] = useState<(typeof coupons)[number]["id"] | null>("coupon-10");
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [paymentRecords, setPaymentRecords] = useState<PaymentRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<PaymentRecord | null>(null);
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
  const [failedPayment, setFailedPayment] = useState<{
    orderId: string;
    payable: number;
    methodLabel: string;
    reason: string;
  } | null>(null);
  const [retryOrderId, setRetryOrderId] = useState<string | null>(null);

  const selectedPlan = rechargePlans.find((plan) => plan.id === selectedPlanId) ?? rechargePlans[0];
  const selectedPaymentMethod = paymentMethods.find((method) => method.id === paymentMethod) ?? paymentMethods[0];
  const selectedCoupon = coupons.find((coupon) => coupon.id === selectedCouponId) ?? null;
  const maxCustomAmount = 2000;
  const rechargeAmount = customAmount ? Number(customAmount) || 0 : selectedPlan.amount;
  const rechargeBonus = customAmount ? getCustomBonus(rechargeAmount) : selectedPlan.bonus;
  const methodDiscount = rechargeAmount >= 100 ? selectedPaymentMethod.discount : 0;
  const methodFee = selectedPaymentMethod.fee;
  const couponDiscount = selectedCoupon && rechargeAmount >= selectedCoupon.minAmount ? selectedCoupon.amount : 0;
  const paymentTotal = Math.max(rechargeAmount - couponDiscount - methodDiscount + methodFee, 0);
  const creditedTokenAmount = (rechargeAmount + rechargeBonus) * 1000;
  const usage = [
    { label: "提示词调试", value: 48, color: "bg-[#d7a9c2]" },
    { label: "聊天模拟", value: 32, color: "bg-[#cfe4e8]" },
    { label: "记忆整理", value: 20, color: "bg-[#d8caed]" }
  ];

  function handleClosePayment() {
    if (paymentProcessing) return;

    if (!rechargeAmount) {
      setPaymentOpen(false);
      return;
    }

    const orderId = retryOrderId ?? buildOrderId();
    const cancelledRecord: PaymentRecord = {
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
    };

    setCancelledPayment({
      orderId,
      payable: paymentTotal,
      methodLabel: selectedPaymentMethod.label
    });
    setPaymentRecords((current) => [cancelledRecord, ...current]);
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
          note: "支付成功，现金账户与 Token 账户已更新。"
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
    <>
      <div className="mx-auto max-w-7xl space-y-6">
        <SectionHeader
          eyebrow="Billing"
          title="充值中心"
          description="这里专门处理账户余额、套餐、优惠券和支付记录。现金账户与 Token 账户会分开展示。"
        />

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
          <Card className="p-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-[22px] bg-mist p-5">
                <p className="text-sm text-ink/54">现金账户</p>
                <p className="font-editorial mt-3 text-[40px] leading-none text-ink">¥{user.cashBalance.toFixed(2)}</p>
                <p className="mt-3 text-sm leading-6 text-ink/56">表示累计充值到账的现金余额，不包含赠送部分。</p>
              </div>
              <div className="rounded-[22px] bg-mist p-5">
                <p className="text-sm text-ink/54">Token 账户</p>
                <p className="font-editorial mt-3 text-[40px] leading-none text-ink">{user.tokenBalance.toLocaleString()}</p>
                <p className="mt-3 text-sm leading-6 text-ink/56">表示可消费额度，充值金额与赠送奖励都会累积到这里。</p>
              </div>
            </div>

            <div className="mt-7">
              <div className="mb-3 flex items-center justify-between gap-4">
                <div>
                  <p className="font-editorial text-[28px] text-ink">使用分布</p>
                  <p className="mt-1 text-sm text-ink/54">当前会员状态：{user.membership} · 1 元 = 1000 tokens</p>
                </div>
                <WalletCards className="h-6 w-6 text-sage" />
              </div>
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
              <h2 className="font-editorial text-[28px] text-ink">充值套餐</h2>
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
              <h2 className="font-editorial text-[28px] text-ink">自定义充值</h2>
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

            {lastPaymentResult ? (
              <div className="mt-4 rounded-[18px] bg-white p-4 text-sm text-sage">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                  <div>
                    <p className="font-medium text-sage">支付成功，账户已更新。</p>
                    <p className="mt-1 text-ink/58">
                      订单号 {lastPaymentResult.orderId} · 流水号 {lastPaymentResult.transactionId}
                    </p>
                    <p className="mt-1 text-ink/58">
                      实付 ¥{lastPaymentResult.payable.toFixed(2)}，现金账户新增 ¥{lastPaymentResult.amount.toFixed(2)}，Token 账户新增 {Math.round((lastPaymentResult.amount + lastPaymentResult.bonus) * 1000).toLocaleString()}。
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

          <Card className="p-6">
            <div>
              <h2 className="font-editorial text-[30px] text-ink">优惠券</h2>
              <p className="mt-2 text-sm leading-6 text-ink/58">优惠券只在充值中心处理，不再和邀请奖励、分享活动混在一起。</p>
            </div>

            <div className="mt-6 space-y-3">
              {coupons.map((coupon) => {
                const available = rechargeAmount >= coupon.minAmount;
                const selected = selectedCouponId === coupon.id;

                return (
                  <button
                    key={coupon.id}
                    type="button"
                    className={`w-full rounded-[20px] border px-5 py-4 text-left transition ${
                      !available
                        ? "border-dashed border-[#e8dde3] bg-[#faf6f7] text-ink/42"
                        : selected
                          ? "border-[#d8caed] bg-[#f6eef6] shadow-[0_10px_24px_rgba(126,110,135,0.08)]"
                          : "border-line bg-white hover:border-[#e6d3dc] hover:bg-[#fcf7fa]"
                    }`}
                    onClick={() => {
                      if (!available) return;
                      setSelectedCouponId(selected ? null : coupon.id);
                    }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-base font-semibold text-ink">{coupon.label}</h3>
                        <p className="mt-1 text-sm leading-6 text-ink/58">{coupon.description}</p>
                        {!available ? (
                          <p className="mt-2 text-xs text-[#b27a87]">当前金额未达门槛，还差 ¥{(coupon.minAmount - rechargeAmount).toFixed(2)}</p>
                        ) : null}
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          !available ? "bg-[#f3eaee] text-[#b27a87]" : selected ? "bg-[#eadbe7] text-ink" : "bg-[#eef4f4] text-sage"
                        }`}
                      >
                        {!available ? `满 ¥${coupon.minAmount} 可用` : selected ? "已勾选" : "可使用"}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-6 rounded-[20px] bg-mist p-5 text-sm leading-7 text-ink/62">
              <p>当前结算预估：</p>
              <p className="mt-2">充值金额 ¥{rechargeAmount.toFixed(2)}</p>
              <p>赠送奖励 ¥{rechargeBonus.toFixed(2)}</p>
              <p>优惠券抵扣 -¥{couponDiscount.toFixed(2)}</p>
              <p>支付优惠 -¥{methodDiscount.toFixed(2)}</p>
              <p>通道费用 +¥{methodFee.toFixed(2)}</p>
              <p className="mt-2 font-medium text-ink">本次可获得 {creditedTokenAmount.toLocaleString()} tokens</p>
            </div>
          </Card>
        </div>

        <Card className="p-6">
          <div className="mb-5">
            <h2 className="font-editorial text-[28px] text-ink">支付记录</h2>
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
                    充值 ¥{record.amount.toFixed(2)}，赠送 ¥{record.bonus.toFixed(2)}，优惠券抵扣 ¥{record.couponAmount.toFixed(2)}，实付 ¥{record.payable.toFixed(2)}，到账 tokens {Math.round((record.amount + record.bonus) * 1000).toLocaleString()}
                  </p>
                </button>
              ))
            ) : (
              <div className="rounded-[22px] border border-dashed border-line bg-white px-5 py-8 text-sm leading-7 text-ink/48">
                暂无支付记录。完成支付、取消或失败后，记录会显示在这里。
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
                <p className="mt-2 text-sm leading-6 text-ink/58">付款后会分别更新现金账户与 Token 账户。</p>
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
                  <p className="mt-2 font-medium text-ink">到账 tokens：{creditedTokenAmount.toLocaleString()}</p>
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
                <h2 className="font-editorial mt-2 text-[30px] text-ink">支付详情</h2>
                <p className="mt-2 text-sm leading-6 text-ink/58">这里展示订单、支付方式、优惠抵扣与到账信息。</p>
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
                <p><span className="text-ink/42">到账 tokens：</span>{Math.round((selectedRecord.amount + selectedRecord.bonus) * 1000).toLocaleString()}</p>
              </div>
            </div>
          </Card>
        </div>
      ) : null}
    </>
  );
}
