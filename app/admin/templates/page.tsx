"use client";

import { useMemo, useState } from "react";
import { Check, Eye, ShieldCheck, X } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Badge, Button, Card, SectionHeader } from "@/components/ui";
import { useAppState } from "@/lib/store";
import type { AuditStatus, PromptTemplate } from "@/lib/types";

const statusCopy: Record<AuditStatus, { label: string; tone: "success" | "warning" | "danger" }> = {
  approved: { label: "已通过", tone: "success" },
  pending: { label: "待审核", tone: "warning" },
  rejected: { label: "已拒绝", tone: "danger" }
};

export default function AdminTemplatesPage() {
  const { templates, updateTemplateStatus } = useAppState();
  const [activeStatus, setActiveStatus] = useState<AuditStatus | "all">("all");
  const [detail, setDetail] = useState<PromptTemplate | null>(null);
  const counts = useMemo(
    () => ({
      all: templates.length,
      pending: templates.filter((template) => template.auditStatus === "pending").length,
      approved: templates.filter((template) => template.auditStatus === "approved").length,
      rejected: templates.filter((template) => template.auditStatus === "rejected").length
    }),
    [templates]
  );
  const filtered = activeStatus === "all" ? templates : templates.filter((template) => template.auditStatus === activeStatus);

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl space-y-6">
        <SectionHeader
          eyebrow="Admin"
          title="模板审核"
          description="管理员视图展示所有用户上传的模板，支持查看详情、通过和拒绝。通过后模板会出现在社区公开列表。"
        />

        <div className="grid gap-3 sm:grid-cols-4">
          {[
            ["all", "全部"],
            ["pending", "待审核"],
            ["approved", "已通过"],
            ["rejected", "已拒绝"]
          ].map(([key, label]) => (
            <button
              key={key}
              className={`rounded-lg border p-4 text-left transition ${
                activeStatus === key ? "border-sage bg-sage/8" : "border-line bg-white hover:border-sage/50"
              }`}
              onClick={() => setActiveStatus(key as AuditStatus | "all")}
            >
              <p className="text-sm text-ink/50">{label}</p>
              <p className="mt-2 text-2xl font-semibold text-ink">{counts[key as keyof typeof counts]}</p>
            </button>
          ))}
        </div>

        <Card className="overflow-hidden">
          <div className="border-b border-line p-5">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-ink">
              <ShieldCheck className="h-5 w-5 text-sage" />
              模板列表
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[840px] border-collapse text-left text-sm">
              <thead className="bg-mist text-xs font-semibold uppercase tracking-[0.12em] text-ink/46">
                <tr>
                  <th className="px-5 py-3">模板</th>
                  <th className="px-5 py-3">作者</th>
                  <th className="px-5 py-3">标签</th>
                  <th className="px-5 py-3">状态</th>
                  <th className="px-5 py-3">使用次数</th>
                  <th className="px-5 py-3 text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filtered.map((template) => {
                  const status = statusCopy[template.auditStatus];
                  return (
                    <tr key={template.id} className="bg-white">
                      <td className="px-5 py-4">
                        <p className="font-medium text-ink">{template.name}</p>
                        <p className="mt-1 max-w-xs truncate text-xs text-ink/52">{template.description}</p>
                      </td>
                      <td className="px-5 py-4 text-ink/62">{template.author}</td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-1">
                          {template.tags.map((tag) => (
                            <Badge key={tag}>{tag}</Badge>
                          ))}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <Badge tone={status.tone}>{status.label}</Badge>
                      </td>
                      <td className="px-5 py-4 text-ink/62">{template.usageCount.toLocaleString()}</td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <Button variant="secondary" className="h-9 px-3" onClick={() => setDetail(template)}>
                            <Eye className="h-4 w-4" />
                            查看
                          </Button>
                          <Button
                            className="h-9 px-3"
                            disabled={template.auditStatus === "approved"}
                            onClick={() => updateTemplateStatus(template.id, "approved")}
                          >
                            <Check className="h-4 w-4" />
                            通过
                          </Button>
                          <Button
                            variant="danger"
                            className="h-9 px-3"
                            disabled={template.auditStatus === "rejected"}
                            onClick={() => updateTemplateStatus(template.id, "rejected")}
                          >
                            <X className="h-4 w-4" />
                            拒绝
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {detail ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 px-4 py-6 backdrop-blur-sm">
          <Card className="max-h-[90vh] w-full max-w-3xl overflow-y-auto p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-ink">{detail.name}</h2>
                <p className="mt-1 text-sm text-ink/52">作者：{detail.author}</p>
              </div>
              <Button variant="ghost" className="h-9 w-9 px-0" onClick={() => setDetail(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <p className="mt-4 text-sm leading-6 text-ink/64">{detail.description}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {detail.tags.map((tag) => (
                <Badge key={tag}>{tag}</Badge>
              ))}
              <Badge tone={statusCopy[detail.auditStatus].tone}>{statusCopy[detail.auditStatus].label}</Badge>
            </div>
            <div className="mt-5 grid gap-4">
              <div className="rounded-lg bg-mist p-4">
                <p className="mb-2 text-sm font-semibold text-ink">系统提示词</p>
                <p className="whitespace-pre-wrap text-sm leading-6 text-ink/68">{detail.systemPrompt}</p>
              </div>
              <div className="rounded-lg bg-mist p-4">
                <p className="mb-2 text-sm font-semibold text-ink">人设提示词</p>
                <p className="whitespace-pre-wrap text-sm leading-6 text-ink/68">{detail.personaPrompt}</p>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button
                disabled={detail.auditStatus === "approved"}
                onClick={() => {
                  updateTemplateStatus(detail.id, "approved");
                  setDetail({ ...detail, auditStatus: "approved" });
                }}
              >
                <Check className="h-4 w-4" />
                通过
              </Button>
              <Button
                variant="danger"
                disabled={detail.auditStatus === "rejected"}
                onClick={() => {
                  updateTemplateStatus(detail.id, "rejected");
                  setDetail({ ...detail, auditStatus: "rejected" });
                }}
              >
                <X className="h-4 w-4" />
                拒绝
              </Button>
            </div>
          </Card>
        </div>
      ) : null}
    </AppShell>
  );
}
