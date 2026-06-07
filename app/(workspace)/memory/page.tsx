"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Clock3 } from "lucide-react";
import { MemorySwitcher } from "@/components/MemorySwitcher";
import { Badge, Card, SectionHeader } from "@/components/ui";
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

export default function MemoryPage() {
  const { currentMemoryId } = useAppState();
  const items = memoryItems.filter((item) => item.memorySpaceId === currentMemoryId);

  const dates = useMemo(() => Array.from(new Set(items.map((item) => item.date))).sort(), [items]);
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
          description="左侧选择日期查看当天的记忆总结，右侧按日期展开当天沉淀下来的记忆文字条。"
          action={<MemorySwitcher compact />}
        />

        <div className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
          <Card className="p-5">
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
                  <p className="font-editorial text-[30px] text-ink">{monthLabel}</p>
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
              <div className="mt-6 grid grid-cols-7 gap-y-4 text-center text-[17px] font-semibold text-ink/56">
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
                  <div key={`week-${weekIndex}`} className="grid grid-cols-7 gap-y-3 text-center">
                    {week.map((cell) => {
                      if (!cell.day || !cell.fullDate) {
                        return <div key={cell.key} className="h-14" />;
                      }

                      const isActive = cell.fullDate === selectedDate;
                      const hasItems = cell.hasItems;

                      return (
                        <div key={cell.key} className="flex justify-center">
                          <button
                            type="button"
                            onClick={() => setSelectedDate(cell.fullDate!)}
                            className={[
                              "flex h-14 w-14 items-center justify-center rounded-[18px] text-[18px] font-semibold transition",
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

          <Card className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-semibold text-ink">
                  <Clock3 className="h-5 w-5 text-sage" />
                  记忆文字条
                </h2>
              </div>
              <Badge tone="neutral">{itemsForSelectedDate.length} 条</Badge>
            </div>

            <div className="mt-5 space-y-3">
              {itemsForSelectedDate.map((item) => (
                <article
                  key={item.id}
                  className="max-w-[560px] rounded-[18px] border border-line bg-white px-4 py-3 shadow-sm"
                >
                  <p className="text-sm leading-7 text-ink/68">{item.summary}</p>
                </article>
              ))}

              {itemsForSelectedDate.length === 0 ? (
                <div className="rounded-[22px] border border-dashed border-line bg-mist px-5 py-8 text-sm leading-7 text-ink/48">
                  这一天还没有出现新的记忆条目，可以切换到其他日期查看。
                </div>
              ) : null}
            </div>
          </Card>
        </div>
    </div>
  );
}
