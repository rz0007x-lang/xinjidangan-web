"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Button, Card, SectionHeader, inputClass } from "@/components/ui";
import { useAppState } from "@/lib/store";

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

export default function GrowthPage() {
  const { currentMemoryId, memorySpaces, templates, promptDrafts, shareCampaigns, ensureShareCampaign, submitReviewLink } = useAppState();
  const [postLink, setPostLink] = useState("");
  const [postSubmitted, setPostSubmitted] = useState(false);
  const [postError, setPostError] = useState("");
  const [shareCopied, setShareCopied] = useState(false);
  const [inviteCopied, setInviteCopied] = useState(false);
  const [copyError, setCopyError] = useState("");
  const [selectedShareTemplateId, setSelectedShareTemplateId] = useState("");
  const [activeShareCampaignCode, setActiveShareCampaignCode] = useState("");

  const inviteCode = "US-2026-12";
  const currentMemory = memorySpaces.find((item) => item.id === currentMemoryId) ?? memorySpaces[0];
  const currentDraft = promptDrafts.find((item) => item.memorySpaceId === currentMemory.id) ?? promptDrafts[0];
  const shareableTemplates = useMemo(() => {
    const activeTemplate = templates.find((item) => item.name === currentDraft.personaName && item.systemPrompt === currentDraft.backstory);
    const ranked = activeTemplate ? [activeTemplate, ...templates.filter((item) => item.id !== activeTemplate.id)] : templates;
    return ranked.filter((item) => item.auditStatus === "approved" || item.source === "user");
  }, [currentDraft.backstory, currentDraft.personaName, templates]);
  const selectedShareTemplate = shareableTemplates.find((item) => item.id === selectedShareTemplateId) ?? shareableTemplates[0] ?? null;
  const existingShareCampaign = selectedShareTemplate
    ? shareCampaigns.find((item) => item.memorySpaceId === currentMemory.id && item.templateId === selectedShareTemplate.id)
    : null;
  const shareCampaign = existingShareCampaign ?? shareCampaigns.find((item) => item.code === activeShareCampaignCode) ?? null;
  const shareCode = shareCampaign?.code ?? "";
  const shareLink = shareCode ? `http://localhost:3000/share/${shareCode}` : "";

  useEffect(() => {
    if (!selectedShareTemplateId && shareableTemplates[0]?.id) {
      setSelectedShareTemplateId(shareableTemplates[0].id);
    }
  }, [selectedShareTemplateId, shareableTemplates]);

  useEffect(() => {
    if (!selectedShareTemplate) return;
    const campaign = ensureShareCampaign(currentMemory.id, selectedShareTemplate.id);
    setActiveShareCampaignCode(campaign.code);
  }, [currentMemory.id, ensureShareCampaign, selectedShareTemplate]);

  async function handleCopyInviteCode() {
    try {
      await navigator.clipboard.writeText(inviteCode);
      setInviteCopied(true);
      setCopyError("");
    } catch {
      setCopyError("邀请码复制失败，请手动长按或复制显示内容。");
    }
  }

  async function handleCopyShareLink() {
    try {
      await navigator.clipboard.writeText(shareLink);
      setShareCopied(true);
      setCopyError("");
    } catch {
      setCopyError("分享链接复制失败，请手动复制。");
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <SectionHeader
        eyebrow="Growth"
        title="邀请与分享"
        description="这里统一处理邀请码、发帖活动、创作分享码和奖励进度，不再和充值中心混在一起。"
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-5">
          <Card className="p-6">
            <h2 className="font-editorial text-[28px] text-ink">邀请码</h2>
            <p className="mt-2 text-sm leading-6 text-ink/58">邀请码属于增长激励链路，用于邀请新用户绑定并记录奖励。</p>
            <div className="mt-5 rounded-[22px] bg-mist p-5">
              <p className="text-sm text-ink/54">我的邀请码</p>
              <p className="mt-3 inline-flex rounded-full bg-white px-4 py-2 text-sm font-medium text-ink">{inviteCode}</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Button variant="secondary" onClick={handleCopyInviteCode}>
                  {inviteCopied ? "已复制邀请码" : "复制邀请码"}
                </Button>
                <span className="text-sm text-ink/54">已邀请用户人数 10 人</span>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="font-editorial text-[28px] text-ink">发帖活动</h2>
            <p className="mt-2 text-sm leading-6 text-ink/58">发帖链接提交后会进入审核队列，审核结果会通过收件箱通知。</p>
            <div className="mt-5 rounded-[22px] bg-mist p-5">
              <ul className="space-y-3 text-sm leading-7 text-ink/66">
                <li>发帖即送 50 轮对话奖励</li>
                <li>每月点赞数大于 100 的作品，按点赞数统计前 10 名赠送 189 元 tokens</li>
                <li>当月第一名若点赞破万，再额外赠送 999 元 tokens</li>
              </ul>
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
                      title: "发帖活动",
                      link: postLink.trim()
                    });
                    setPostSubmitted(true);
                    setPostError("");
                    setPostLink("");
                  }}
                >
                  提交链接
                </Button>
              </div>
              {postError ? <p className="mt-3 text-sm text-red-500">{postError}</p> : null}
              {postSubmitted ? <p className="mt-3 text-sm text-sage">帖子链接已提交，审核结果会通过收件箱同步通知。</p> : null}
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="font-editorial text-[28px] text-ink">创作分享码</h2>
            <p className="mt-2 text-sm leading-6 text-ink/58">模板是可导入的设定方案；分享链路会基于当前记忆体和选中的模板生成专属体验链接。</p>
            <div className="mt-5 rounded-[22px] bg-mist p-5">
              <div>
                <p className="text-sm text-ink/58">选择模板</p>
                <select
                  className={`${inputClass} mt-2 min-h-12 rounded-[16px]`}
                  value={selectedShareTemplate?.id ?? ""}
                  onChange={(event) => {
                    setSelectedShareTemplateId(event.target.value);
                    setShareCopied(false);
                    setCopyError("");
                  }}
                >
                  {shareableTemplates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name} · {template.source === "official" ? "官方模板" : template.source === "user" ? "我的模板" : "社区模板"}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-ink/58">当前记忆体</p>
                  <p className="mt-1 text-lg font-semibold text-ink">{currentMemory.name}</p>
                  <p className="mt-2 text-sm leading-6 text-ink/56">智能体设定：{currentDraft.personaName}</p>
                  <p className="mt-2 text-sm leading-6 text-ink/56">模板：{selectedShareTemplate?.name ?? "未选择"}</p>
                </div>
                <div>
                  <p className="text-sm text-ink/58">分享码</p>
                  <span className="mt-2 inline-flex rounded-full bg-white px-4 py-2 text-sm text-ink">{shareCode || "生成中"}</span>
                  <p className="mt-3 break-all text-sm leading-6 text-ink/56">{shareLink}</p>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <Button variant="secondary" onClick={handleCopyShareLink} disabled={!shareLink}>
                  {shareCopied ? "已复制分享链接" : "复制分享链接"}
                </Button>
                {shareCode ? (
                  <Link href={`/share/${shareCode}`} target="_blank">
                    <Button>打开分享页</Button>
                  </Link>
                ) : null}
              </div>
            </div>
          </Card>
        </div>

        <Card className="p-6">
          <h2 className="font-editorial text-[28px] text-ink">奖励进度</h2>
          <p className="mt-2 text-sm leading-6 text-ink/58">这里显示当前分享链路的真实进度口径：浏览、开始体验、有效体验。</p>

          <div className="mt-5 space-y-4">
            <div className="rounded-[20px] bg-mist p-4">
              <p className="text-sm text-ink/54">浏览量</p>
              <p className="font-editorial mt-2 text-[30px] text-ink">{shareCampaign?.visits ?? 0}</p>
            </div>
            <div className="rounded-[20px] bg-mist p-4">
              <p className="text-sm text-ink/54">开始体验人数</p>
              <p className="font-editorial mt-2 text-[30px] text-ink">{shareCampaign?.activatedVisitorIds.length ?? 0}</p>
            </div>
            <div className="rounded-[20px] bg-mist p-4">
              <p className="text-sm text-ink/54">有效体验人数</p>
              <p className="font-editorial mt-2 text-[30px] text-ink">{shareCampaign?.effectiveVisitorIds.length ?? 0}</p>
            </div>
          </div>

          <div className="mt-5 rounded-[20px] border border-dashed border-line bg-white px-4 py-4 text-sm leading-7 text-ink/58">
            有效体验的口径已收紧为：至少完成一轮真实输入、停留时长达标、并触发一次实际对话返回。
          </div>

          {copyError ? <p className="mt-4 text-sm text-red-500">{copyError}</p> : null}
        </Card>
      </div>
    </div>
  );
}
