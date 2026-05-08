"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, Eye, Search, UploadCloud, X } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Badge, Button, Card, SectionHeader, inputClass, textareaClass } from "@/components/ui";
import { useAppState } from "@/lib/store";
import type { PromptTemplate } from "@/lib/types";

const sortOptions = [
  { value: "usage", label: "使用次数" },
  { value: "newest", label: "最新上传" },
  { value: "name", label: "名称" }
];

export default function CommunityPage() {
  const router = useRouter();
  const { templates, uploadTemplate } = useAppState();
  const [query, setQuery] = useState("");
  const [tag, setTag] = useState("全部");
  const [sort, setSort] = useState("usage");
  const [detail, setDetail] = useState<PromptTemplate | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadedName, setUploadedName] = useState("");

  const approvedTemplates = templates.filter((template) => template.auditStatus === "approved");
  const tags = ["全部", ...Array.from(new Set(approvedTemplates.flatMap((template) => template.tags)))];
  const filteredTemplates = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return approvedTemplates
      .filter((template) => {
        const matchQuery =
          !normalized ||
          template.name.toLowerCase().includes(normalized) ||
          template.description.toLowerCase().includes(normalized) ||
          template.author.toLowerCase().includes(normalized);
        const matchTag = tag === "全部" || template.tags.includes(tag);
        return matchQuery && matchTag;
      })
      .sort((a, b) => {
        if (sort === "usage") return b.usageCount - a.usageCount;
        if (sort === "newest") return b.createdAt.localeCompare(a.createdAt);
        return a.name.localeCompare(b.name, "zh-CN");
      });
  }, [approvedTemplates, query, sort, tag]);

  function handleImport(template: PromptTemplate) {
    router.push(`/prompt-debug?template=${template.id}`);
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl space-y-6">
        <SectionHeader
          eyebrow="Community"
          title="智能体模板社区"
          description="社区为账号级公共功能。公开列表只展示审核通过的模板，导入后会写入当前记忆体的提示词草稿。"
          action={
            <Button onClick={() => setUploadOpen(true)}>
              <UploadCloud className="h-4 w-4" />
              上传模板
            </Button>
          }
        />

        <Card className="p-4">
          <div className="grid gap-3 lg:grid-cols-[1fr_220px_180px]">
            <label className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/36" />
              <input
                className={`${inputClass} pl-9`}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="搜索模板名称、作者或简介"
              />
            </label>
            <select
              className={inputClass}
              value={tag}
              onChange={(event) => setTag(event.target.value)}
            >
              {tags.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <select
              className={inputClass}
              value={sort}
              onChange={(event) => setSort(event.target.value)}
            >
              {sortOptions.map((item) => (
                <option key={item.value} value={item.value}>
                  按{item.label}排序
                </option>
              ))}
            </select>
          </div>
        </Card>

        {uploadedName ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            「{uploadedName}」已上传，当前状态为待审核。管理员通过后会出现在公开社区。
          </div>
        ) : null}

        <div className="grid gap-4 lg:grid-cols-3">
          {filteredTemplates.map((template) => (
            <Card key={template.id} className="flex flex-col p-5">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-ink">{template.name}</h2>
                  <p className="mt-1 text-sm text-ink/50">作者：{template.author}</p>
                </div>
                <Badge tone="success">已通过</Badge>
              </div>
              <p className="min-h-16 text-sm leading-6 text-ink/62">{template.description}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {template.tags.map((item) => (
                  <Badge key={item}>{item}</Badge>
                ))}
              </div>
              <div className="mt-5 flex items-center justify-between border-t border-line pt-4 text-sm text-ink/52">
                <span>使用 {template.usageCount.toLocaleString()} 次</span>
                <span>{template.createdAt}</span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <Button variant="secondary" onClick={() => setDetail(template)}>
                  <Eye className="h-4 w-4" />
                  详情
                </Button>
                <Button onClick={() => handleImport(template)}>
                  <Download className="h-4 w-4" />
                  导入
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {filteredTemplates.length === 0 ? (
          <Card className="p-10 text-center text-sm text-ink/56">没有找到符合条件的已审核模板。</Card>
        ) : null}
      </div>

      {detail ? (
        <TemplateDetailModal template={detail} onClose={() => setDetail(null)} onImport={() => handleImport(detail)} />
      ) : null}

      {uploadOpen ? (
        <UploadModal
          onClose={() => setUploadOpen(false)}
          onSubmit={(template) => {
            const created = uploadTemplate(template);
            setUploadedName(created.name);
            setUploadOpen(false);
          }}
        />
      ) : null}
    </AppShell>
  );
}

function TemplateDetailModal({
  template,
  onClose,
  onImport
}: {
  template: PromptTemplate;
  onClose: () => void;
  onImport: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 px-4 py-6 backdrop-blur-sm">
      <Card className="max-h-[90vh] w-full max-w-3xl overflow-y-auto p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-ink">{template.name}</h2>
            <p className="mt-1 text-sm text-ink/52">作者：{template.author}</p>
          </div>
          <Button variant="ghost" className="h-9 w-9 px-0" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <p className="mt-4 text-sm leading-6 text-ink/64">{template.description}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {template.tags.map((tag) => (
            <Badge key={tag}>{tag}</Badge>
          ))}
          <Badge tone="success">审核通过</Badge>
        </div>
        <div className="mt-5 grid gap-4">
          <div className="rounded-lg bg-mist p-4">
            <p className="mb-2 text-sm font-semibold text-ink">系统提示词</p>
            <p className="whitespace-pre-wrap text-sm leading-6 text-ink/68">{template.systemPrompt}</p>
          </div>
          <div className="rounded-lg bg-mist p-4">
            <p className="mb-2 text-sm font-semibold text-ink">人设提示词</p>
            <p className="whitespace-pre-wrap text-sm leading-6 text-ink/68">{template.personaPrompt}</p>
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            关闭
          </Button>
          <Button onClick={onImport}>
            <Download className="h-4 w-4" />
            导入到提示词调试
          </Button>
        </div>
      </Card>
    </div>
  );
}

function UploadModal({
  onClose,
  onSubmit
}: {
  onClose: () => void;
  onSubmit: (template: {
    name: string;
    description: string;
    tags: string[];
    systemPrompt: string;
    personaPrompt: string;
  }) => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("长期陪伴, 温和");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [personaPrompt, setPersonaPrompt] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit({
      name,
      description,
      tags: tags
        .split(/[,，]/)
        .map((item) => item.trim())
        .filter(Boolean),
      systemPrompt,
      personaPrompt
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 px-4 py-6 backdrop-blur-sm">
      <Card className="max-h-[90vh] w-full max-w-3xl overflow-y-auto p-5">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-ink">上传智能体模板</h2>
            <p className="mt-1 text-sm text-ink/56">提交后进入待审核状态。</p>
          </div>
          <Button variant="ghost" className="h-9 w-9 px-0" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <label>
            <span className="mb-2 block text-sm font-medium text-ink/72">模板名称</span>
            <input className={inputClass} value={name} onChange={(event) => setName(event.target.value)} required />
          </label>
          <label>
            <span className="mb-2 block text-sm font-medium text-ink/72">简介</span>
            <textarea
              className={`${textareaClass} min-h-24`}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              required
            />
          </label>
          <label>
            <span className="mb-2 block text-sm font-medium text-ink/72">标签</span>
            <input className={inputClass} value={tags} onChange={(event) => setTags(event.target.value)} required />
          </label>
          <label>
            <span className="mb-2 block text-sm font-medium text-ink/72">系统提示词内容</span>
            <textarea
              className={`${textareaClass} min-h-28`}
              value={systemPrompt}
              onChange={(event) => setSystemPrompt(event.target.value)}
              required
            />
          </label>
          <label>
            <span className="mb-2 block text-sm font-medium text-ink/72">人设提示词内容</span>
            <textarea
              className={`${textareaClass} min-h-28`}
              value={personaPrompt}
              onChange={(event) => setPersonaPrompt(event.target.value)}
              required
            />
          </label>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" type="button" onClick={onClose}>
              取消
            </Button>
            <Button type="submit">提交审核</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
