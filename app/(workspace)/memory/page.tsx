"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Clock3, GitBranch, Save, WandSparkles, X } from "lucide-react";
import { MemorySwitcher } from "@/components/MemorySwitcher";
import { Badge, Button, Card, SectionHeader, textareaClass } from "@/components/ui";
import { memoryItems } from "@/lib/mock-data";
import { useAppState } from "@/lib/store";

function formatDateLabel(date: string) {
  if (!date) return "暂无日期";
  const [, month, day] = date.split("-");
  return `${Number(month)} 月 ${Number(day)} 日`;
}

function buildSummary(date: string, count: number, items: typeof memoryItems) {
  if (!date) {
    return "当前记忆体还没有可查看的日期记录，后续沉淀的记忆会按天展示在这里。";
  }

  if (count === 0) {
    return `${formatDateLabel(date)} 还没有沉淀新的记忆，适合继续观察这一天的情绪、节奏和关系变化。`;
  }

  const keywords = items.map((item) => item.title).join("、");
  return `${formatDateLabel(date)} 共记录 ${count} 条记忆，主要围绕 ${keywords} 展开。`;
}

function toMonthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function parseDateString(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function getMonthMatrix(monthDate: Date, datesWithItems: Set<string>) {
  if (!monthDate) return { monthLabel: "暂无日期", weeks: [] as Array<Array<{ key: string; day?: number; fullDate?: string; hasItems?: boolean }>> };

  const year = monthDate.getFullYear();
  const month = monthDate.getMonth() + 1;
  const firstDay = new Date(year, month - 1, 1);
  const daysInMonth = new Date(year, month, 0).getDate();
  const leading = (firstDay.getDay() + 6) % 7;
  const cells: Array<{ key: string; day?: number; fullDate?: string; hasItems?: boolean }> = [];

  for (let index = 0; index < leading; index += 1) {
    cells.push({ key: `empty-${index}` });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const fullDate = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    cells.push({
      key: fullDate,
      day,
      fullDate,
      hasItems: datesWithItems.has(fullDate)
    });
  }

  while (cells.length % 7 !== 0) {
    cells.push({ key: `tail-${cells.length}` });
  }

  const weeks = [];
  for (let index = 0; index < cells.length; index += 7) {
    weeks.push(cells.slice(index, index + 7));
  }

  return {
    monthLabel: `${month} 月`,
    weeks
  };
}

function buildGraphGroups(items: typeof memoryItems) {
  const map = new Map(items.map((item) => [item.id, item]));
  const groups = Array.from(new Set(items.map((item) => item.date)))
    .sort()
    .reverse()
    .map((date) => {
      const nodes = items
        .filter((item) => item.date === date)
        .map((item) => ({
          ...item,
          relatedTitles: item.connections
            .map((connectionId) => map.get(connectionId)?.title)
            .filter((value): value is string => Boolean(value))
        }));

      return {
        date,
        label: formatDateLabel(date),
        nodes
      };
    });

  return groups;
}

export default function MemoryPage() {
  const {
    currentMemoryId,
    currentMemoryId: memorySpaceId,
    memorySpaces,
    memoryAssistantDrafts,
    hiddenMemoryEntryIds,
    updateMemorySummary,
    deleteMemoryEntry
  } = useAppState();
  const hiddenEntryIds = hiddenMemoryEntryIds[memorySpaceId] ?? [];
  const items = memoryItems.filter((item) => item.memorySpaceId === currentMemoryId && !hiddenEntryIds.includes(item.id));
  const [viewMode, setViewMode] = useState<"calendar" | "text" | "graph">("calendar");
  const [assistantMode, setAssistantMode] = useState<"idle" | "editing">("idle");
  const [assistantDraft, setAssistantDraft] = useState("");
  const [assistantFeedback, setAssistantFeedback] = useState("");

  const dates = useMemo(() => Array.from(new Set(items.map((item) => item.date))).sort(), [items]);
  const currentMemoryName = memorySpaces.find((item) => item.id === currentMemoryId)?.name ?? "当前记忆体";
  const [selectedDate, setSelectedDate] = useState(dates[dates.length - 1] ?? "");
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const fallback = dates[dates.length - 1] ? parseDateString(dates[dates.length - 1]) : new Date();
    return new Date(fallback.getFullYear(), fallback.getMonth(), 1);
  });
  const dateSet = useMemo(() => new Set(dates), [dates]);
  const { monthLabel, weeks } = useMemo(() => getMonthMatrix(visibleMonth, dateSet), [dateSet, visibleMonth]);
  const weekLabels = ["一", "二", "三", "四", "五", "六", "日"];

  useEffect(() => {
    const nextSelected = dates[dates.length - 1] ?? "";
    setSelectedDate(nextSelected);
    if (nextSelected) {
      const nextDate = parseDateString(nextSelected);
      setVisibleMonth(new Date(nextDate.getFullYear(), nextDate.getMonth(), 1));
    }
  }, [dates]);

  const visibleMonthKey = toMonthKey(visibleMonth);
  const monthDates = dates.filter((date) => date.startsWith(visibleMonthKey));
  const itemsForSelectedDate = items.filter((item) => item.date === selectedDate);
  const assistantOverride = selectedDate ? memoryAssistantDrafts[memorySpaceId]?.find((item) => item.date === selectedDate) : undefined;
  const displayedItems = assistantOverride
    ? [
        {
          id: `${memorySpaceId}-${selectedDate}-assistant`,
          summary: assistantOverride.summary,
          deletable: false
        }
      ]
    : itemsForSelectedDate.map((item) => ({ id: item.id, summary: item.summary, deletable: true }));
  const selectedSummary = assistantOverride?.summary ?? itemsForSelectedDate.map((item) => item.summary).join("\n\n");
  const textViewGroups = useMemo(
    () =>
      dates
        .slice()
        .reverse()
        .map((date) => {
          const dayItems = items.filter((item) => item.date === date);
          const override = memoryAssistantDrafts[memorySpaceId]?.find((item) => item.date === date);

          return {
            date,
            label: formatDateLabel(date),
            summary: buildSummary(date, dayItems.length, dayItems),
            entries: override
              ? [{ id: `${memorySpaceId}-${date}-assistant-text`, summary: override.summary, deletable: false }]
              : dayItems.map((item) => ({ id: item.id, summary: item.summary, deletable: true }))
          };
        }),
    [dates, items, memoryAssistantDrafts, memorySpaceId]
  );
  const graphGroups = useMemo(() => buildGraphGroups(items), [items]);

  useEffect(() => {
    setAssistantDraft(selectedSummary);
    setAssistantFeedback("");
  }, [selectedDate, selectedSummary]);

  function switchMonth(offset: number) {
    const next = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + offset, 1);
    const nextMonthKey = toMonthKey(next);
    const firstDateInMonth = dates.find((date) => date.startsWith(nextMonthKey));

    setVisibleMonth(next);
    setSelectedDate(firstDateInMonth ?? "");
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <SectionHeader
        eyebrow="Memory"
        title="记忆查看"
        description="支持按当前记忆体切换查看。你可以使用日历视图按天筛选，也可以切到文本视图连续浏览整份记忆。"
        action={<MemorySwitcher compact />}
      />

      <div className="flex flex-wrap gap-2">
        <Button
          variant={viewMode === "calendar" ? "primary" : "secondary"}
          className="min-h-9 px-4 text-xs sm:text-sm"
          onClick={() => setViewMode("calendar")}
        >
          <CalendarDays className="h-4 w-4" />
          日历视图
        </Button>
        <Button
          variant={viewMode === "text" ? "primary" : "secondary"}
          className="min-h-9 px-4 text-xs sm:text-sm"
          onClick={() => setViewMode("text")}
        >
          <Clock3 className="h-4 w-4" />
          文本视图
        </Button>
        <Button
          variant={viewMode === "graph" ? "primary" : "secondary"}
          className="min-h-9 px-4 text-xs sm:text-sm"
          onClick={() => setViewMode("graph")}
        >
          <GitBranch className="h-4 w-4" />
          图谱视图
        </Button>
      </div>

      {viewMode === "text" ? (
        <Card className="p-4 sm:p-5">
          <div className="flex flex-col gap-2 border-b border-line/80 pb-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-semibold text-ink">
                <Clock3 className="h-5 w-5 text-sage" />
                非日历文本视图
              </h2>
              <p className="mt-1 text-sm leading-6 text-ink/56">当前按「{currentMemoryName}」这份记忆体连续展开，适合顺着浏览完整记忆脉络。</p>
            </div>
            <Badge tone="info">{textViewGroups.length} 天记录</Badge>
          </div>

          <div className="mt-5 space-y-4">
            {textViewGroups.map((group) => (
              <section key={group.date} className="rounded-[22px] border border-line bg-white/92 p-4 sm:p-5">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="font-editorial text-[24px] text-ink">{group.label}</h3>
                    <p className="mt-1 text-sm leading-6 text-ink/56">{group.summary}</p>
                  </div>
                  <Badge tone="neutral">{group.entries.length} 条</Badge>
                </div>
                <div className="mt-4 space-y-3">
                  {group.entries.map((entry) => (
                    <article key={entry.id} className="relative rounded-[18px] bg-mist px-4 py-3">
                      {entry.deletable ? (
                        <button
                          type="button"
                          aria-label="删除记忆条"
                          className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-ink/42 transition hover:text-[#b86474]"
                          onClick={() => deleteMemoryEntry({ memorySpaceId, entryId: entry.id })}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      ) : null}
                      <p className="whitespace-pre-line text-sm leading-7 text-ink/68">{entry.summary}</p>
                    </article>
                  ))}
                </div>
              </section>
            ))}

            {textViewGroups.length === 0 ? (
              <div className="rounded-[22px] border border-dashed border-line bg-mist px-5 py-8 text-sm leading-7 text-ink/48">
                当前记忆体还没有可展开的文本记录，切换其他记忆体后会同步查看对应内容。
              </div>
            ) : null}
          </div>
        </Card>
      ) : null}

      {viewMode === "graph" ? (
        <Card className="p-4 sm:p-5">
          <div className="flex flex-col gap-2 border-b border-line/80 pb-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-semibold text-ink">
                <GitBranch className="h-5 w-5 text-sage" />
                记忆树状图谱
              </h2>
              <p className="mt-1 text-sm leading-6 text-ink/56">按“记忆体 → 日期 → 记忆节点”展开，适合查看当前记忆体的沉淀路径与关联关系。</p>
            </div>
            <Badge tone="info">{graphGroups.length} 个日期分支</Badge>
          </div>

          <div className="mt-5 space-y-5">
            {graphGroups.map((group) => (
              <section key={group.date} className="rounded-[22px] border border-line bg-white/92 p-4 sm:p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f6eaf1] text-sage">
                    <GitBranch className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-editorial text-[22px] text-ink">{group.label}</p>
                    <p className="text-xs text-ink/46">{currentMemoryName} · {group.nodes.length} 个记忆节点</p>
                  </div>
                </div>

                <div className="mt-4 ml-5 border-l border-dashed border-[#e4cfda] pl-5 sm:ml-6 sm:pl-6">
                  {group.nodes.map((node, index) => (
                    <div key={node.id} className={index === group.nodes.length - 1 ? "relative" : "relative pb-5"}>
                      <span className="absolute -left-[1.72rem] top-3 h-3 w-3 rounded-full bg-[#d9a8bf] ring-4 ring-[#fbf3f7]" />
                      <article className="rounded-[18px] bg-mist px-4 py-4 shadow-sm">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge tone="neutral">{node.emotion}</Badge>
                          <h3 className="text-sm font-semibold text-ink">{node.title}</h3>
                        </div>
                        <p className="mt-3 text-sm leading-7 text-ink/68">{node.summary}</p>
                        {node.relatedTitles.length > 0 ? (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {node.relatedTitles.map((title) => (
                              <span
                                key={`${node.id}-${title}`}
                                className="inline-flex items-center rounded-full bg-white px-3 py-1 text-xs text-ink/60 shadow-[0_6px_18px_rgba(154,116,138,0.06)]"
                              >
                                关联：{title}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="mt-3 text-xs text-ink/42">当前节点还没有额外关联分支。</p>
                        )}
                      </article>
                    </div>
                  ))}
                </div>
              </section>
            ))}

            {graphGroups.length === 0 ? (
              <div className="rounded-[22px] border border-dashed border-line bg-mist px-5 py-8 text-sm leading-7 text-ink/48">
                当前记忆体还没有可生成图谱的节点，切换到其他记忆体后会同步查看对应图谱。
              </div>
            ) : null}
          </div>
        </Card>
      ) : null}

      {viewMode === "calendar" ? (
      <div className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
        <Card className="p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-semibold text-ink">
                <CalendarDays className="h-5 w-5 text-sage" />
                日历视图
              </h2>
            </div>
          </div>

          <div className="mt-6">
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-[#fcf4f8] text-sage transition hover:bg-[#f6eef5]"
                onClick={() => switchMonth(-1)}
                title="上个月"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <div className="flex items-center gap-3">
                <CalendarDays className="h-5 w-5 text-sage" />
                <p className="font-editorial text-[24px] text-ink sm:text-[30px]">{monthLabel}</p>
              </div>
              <button
                type="button"
                className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-[#fcf4f8] text-sage transition hover:bg-[#f6eef5]"
                onClick={() => switchMonth(1)}
                title="下个月"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-6 grid grid-cols-7 gap-y-3 text-center text-sm font-semibold text-ink/56 sm:text-[17px]">
              {weekLabels.map((label) => (
                <div key={label}>{label}</div>
              ))}
            </div>

            <div className="mt-5 space-y-3">
              {!monthDates.length ? (
                <div className="rounded-[18px] border border-dashed border-line bg-mist px-4 py-4 text-sm leading-7 text-ink/50">
                  当前月份暂无记忆，日历仍可切换到其他月份继续查看。
                </div>
              ) : null}
              {weeks.map((week, weekIndex) => (
                <div key={`week-${weekIndex}`} className="grid grid-cols-7 gap-y-2 sm:gap-y-3 text-center">
                  {week.map((cell) => {
                    if (!cell.day || !cell.fullDate) {
                      return <div key={cell.key} className="h-11 sm:h-14" />;
                    }

                    const isActive = cell.fullDate === selectedDate;
                    const hasItems = cell.hasItems;

                    return (
                      <div key={cell.key} className="flex justify-center">
                        <button
                          type="button"
                          onClick={() => setSelectedDate(cell.fullDate!)}
                          className={[
                            "flex h-11 w-11 items-center justify-center rounded-[14px] text-sm font-semibold transition sm:h-14 sm:w-14 sm:rounded-[18px] sm:text-[18px]",
                            isActive
                              ? "border border-[#efbfd3] bg-white text-ink shadow-[0_10px_24px_rgba(154,116,138,0.12)]"
                              : hasItems
                                ? "bg-white text-ink shadow-[0_6px_18px_rgba(154,116,138,0.08)]"
                                : "text-ink/34 hover:bg-white/60"
                          ].join(" ")}
                        >
                          {cell.day}
                        </button>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card className="p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-semibold text-ink">
                <Clock3 className="h-5 w-5 text-sage" />
                记忆文字条
              </h2>
              <p className="mt-2 text-sm leading-6 text-ink/56">AI 助手可以基于当前内容帮你补充、整理或改写记忆，再回到提示词调试页继续使用。</p>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <Badge tone="neutral">{displayedItems.length} 条</Badge>
              <Button
                variant={assistantMode === "editing" ? "primary" : "secondary"}
                className="min-h-8 px-3 text-xs"
                onClick={() => {
                  setAssistantMode((current) => (current === "editing" ? "idle" : "editing"));
                  setAssistantFeedback("");
                }}
              >
                <WandSparkles className="h-3.5 w-3.5" />
                AI 助手改记忆
              </Button>
            </div>
          </div>

          {assistantMode === "editing" ? (
            <div className="mt-4 space-y-4 rounded-[20px] bg-mist px-4 py-4">
              <div className="text-sm leading-7 text-ink/62">
                AI 助手已进入改记忆模式。你可以直接重写这一天的记忆摘要，保存后会覆盖当前智能体这一天的展示内容。
              </div>
              <textarea
                className={`${textareaClass} min-h-[150px] bg-white`}
                value={assistantDraft}
                onChange={(event) => {
                  setAssistantDraft(event.target.value);
                  setAssistantFeedback("");
                }}
                placeholder="输入整理后的记忆内容"
              />
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs leading-6 text-ink/46">当前日期：{selectedDate ? formatDateLabel(selectedDate) : "暂无可编辑日期"}</p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="secondary"
                    className="min-h-9 px-4 text-xs"
                    onClick={() => {
                      setAssistantDraft(selectedSummary);
                      setAssistantFeedback("已恢复到当前记录内容。");
                    }}
                  >
                    恢复原文
                  </Button>
                  <Button
                    className="min-h-9 px-4 text-xs"
                    disabled={!selectedDate || !assistantDraft.trim()}
                    onClick={() => {
                      if (!selectedDate || !assistantDraft.trim()) return;
                      updateMemorySummary({
                        memorySpaceId,
                        date: selectedDate,
                        summary: assistantDraft
                      });
                      setAssistantFeedback("记忆内容已更新，当前智能体会优先使用这份改写结果。");
                    }}
                  >
                    <Save className="h-3.5 w-3.5" />
                    保存记忆
                  </Button>
                </div>
              </div>
              {assistantFeedback ? <p className="text-sm text-sage">{assistantFeedback}</p> : null}
            </div>
          ) : null}

          <div className="mt-5 space-y-3">
            {displayedItems.map((item) => (
              <article
                key={item.id}
                className="relative max-w-full rounded-[18px] border border-line bg-white px-4 py-3 shadow-sm sm:max-w-[560px]"
              >
                {item.deletable ? (
                  <button
                    type="button"
                    aria-label="删除记忆条"
                    className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-mist text-ink/42 transition hover:text-[#b86474]"
                    onClick={() => deleteMemoryEntry({ memorySpaceId, entryId: item.id })}
                  >
                    <X className="h-4 w-4" />
                  </button>
                ) : null}
                <p className="text-sm leading-7 text-ink/68 whitespace-pre-line">{item.summary}</p>
              </article>
            ))}

            {displayedItems.length === 0 ? (
              <div className="rounded-[22px] border border-dashed border-line bg-mist px-5 py-8 text-sm leading-7 text-ink/48">
                这一天还没有出现新的记忆条目，可以切换到其他日期查看。
              </div>
            ) : null}
          </div>
        </Card>
      </div>
      ) : null}
    </div>
  );
}
