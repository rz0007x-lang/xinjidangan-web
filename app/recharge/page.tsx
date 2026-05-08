"use client";

import { CheckCircle2, CreditCard, WalletCards } from "lucide-react";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Badge, Button, Card, SectionHeader } from "@/components/ui";
import { rechargePlans } from "@/lib/mock-data";
import { useAppState } from "@/lib/store";

export default function RechargePage() {
  const { user, recharge } = useAppState();
  const [selectedPlanId, setSelectedPlanId] = useState(rechargePlans[1].id);
  const [paidPlanId, setPaidPlanId] = useState<string | null>(null);
  const selectedPlan = rechargePlans.find((plan) => plan.id === selectedPlanId) ?? rechargePlans[0];

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl space-y-6">
        <SectionHeader
          eyebrow="Billing"
          title="充值"
          description="充值为账号级功能，不与任何单个记忆体绑定。当前版本模拟支付成功并更新本地余额。"
        />

        <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
          <Card className="p-5">
            <WalletCards className="mb-5 h-7 w-7 text-sage" />
            <p className="text-sm text-ink/54">当前余额</p>
            <p className="mt-2 text-3xl font-semibold text-ink">¥{user.balance.toFixed(2)}</p>
            <div className="mt-5 rounded-lg bg-mist p-4">
              <p className="text-xs text-ink/48">会员状态</p>
              <p className="mt-1 font-semibold text-ink">{user.membership}</p>
            </div>
          </Card>

          <Card className="p-5">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {rechargePlans.map((plan) => {
                const selected = plan.id === selectedPlanId;
                return (
                  <button
                    key={plan.id}
                    className={`relative rounded-lg border p-4 text-left transition ${
                      selected ? "border-sage bg-sage/8" : "border-line bg-white hover:border-sage/50"
                    }`}
                    onClick={() => setSelectedPlanId(plan.id)}
                  >
                    {plan.badge ? <Badge tone="success">{plan.badge}</Badge> : null}
                    <h3 className="mt-3 font-semibold text-ink">{plan.name}</h3>
                    <p className="mt-2 text-2xl font-semibold text-ink">¥{plan.amount}</p>
                    <p className="mt-1 text-sm text-clay">赠送 ¥{plan.bonus}</p>
                    <p className="mt-3 text-sm leading-6 text-ink/56">{plan.description}</p>
                  </button>
                );
              })}
            </div>

            <div className="mt-6 rounded-lg border border-line bg-mist p-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-ink/54">已选择</p>
                  <p className="mt-1 font-semibold text-ink">
                    {selectedPlan.name} · 到账 ¥{selectedPlan.amount + selectedPlan.bonus}
                  </p>
                </div>
                <Button
                  onClick={() => {
                    recharge(selectedPlan.amount, selectedPlan.bonus);
                    setPaidPlanId(selectedPlan.id);
                  }}
                >
                  <CreditCard className="h-4 w-4" />
                  模拟充值
                </Button>
              </div>
              {paidPlanId ? (
                <div className="mt-4 flex items-center gap-2 rounded-lg bg-white p-3 text-sm text-sage">
                  <CheckCircle2 className="h-4 w-4" />
                  支付成功，余额已更新。
                </div>
              ) : null}
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
