"use client";

import { CalendarDays, Clock3, Edit3, Network } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { MemorySwitcher } from "@/components/MemorySwitcher";
import { Badge, Button, Card, SectionHeader } from "@/components/ui";
import { memoryItems } from "@/lib/mock-data";
import { useAppState, useCurrentMemory } from "@/lib/store";

const emotionTone = {
  calm: "bg-blue-100 text-blue-700 border-blue-200",
  warm: "bg-rose-100 text-rose-700 border-rose-200",
  conflict: "bg-amber-100 text-amber-700 border-amber-200",
  growth: "bg-sage/12 text-sage border-sage/20"
};

const emotionLabel = {
  calm: "平静",
  warm: "温暖",
  conflict: "冲突",
  growth: "成长"
};

export default function MemoryPage() {
  const { currentMemoryId } = useAppState();
  const currentMemory = useCurrentMemory();
  const items = memoryItems.filter((item) => item.memorySpaceId === currentMemoryId);
  const dates = Array.from(new Set(items.map((item) => item.date)));

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl space-y-6">
        <SectionHeader
          eyebrow="Memory"
          title="记忆查看"
          description="当前版本仅支持查看记忆体中的记忆条目、时间线和连接关系，编辑能力已预留但暂未开放。"
          action={<MemorySwitcher compact />}
        />

        <Card className="p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-ink">{currentMemory.name}</h2>
              <p className="mt-1 text-sm leading-6 text-ink/58">{currentMemory.description}</p>
            </div>
            <Button
              variant="secondary"
              disabled
              title="记忆编辑功能暂未开放"
            >
              <Edit3 className="h-4 w-4" />
              记忆编辑功能暂未开放
            </Button>
          </div>
        </Card>

        <div className="grid gap-5 xl:grid-cols-[1fr_320px]">
          <Card className="overflow-hidden p-5">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-semibold text-ink">
                  <Network className="h-5 w-5 text-sage" />
                  日期记忆图谱
                </h2>
                <p className="mt-1 text-sm text-ink/56">上方日期条用于定位，下方展示每个日期对应的记忆连接。</p>
              </div>
              <Badge tone="info">{items.length} 条记忆</Badge>
            </div>

            <div className="mb-6 overflow-x-auto">
              <div className="flex min-w-[620px] items-center gap-2 rounded-lg bg-mist p-2">
                {dates.map((date) => (
                  <div key={date} className="flex-1 rounded-lg bg-white px-3 py-2 text-center text-xs font-medium text-ink/62">
                    {date.slice(5)}
                  </div>
                ))}
              </div>
            </div>

            <div className="memory-graph-line relative min-h-[460px] overflow-x-auto rounded-lg border border-line bg-white p-4">
              <div className="relative min-w-[760px]">
                <svg className="absolute inset-0 h-[420px] w-full" aria-hidden="true">
                  {items.flatMap((item, index) =>
                    item.connections
                      .map((targetId) => {
                        const targetIndex = items.findIndex((target) => target.id === targetId);
                        if (targetIndex < 0 || targetIndex < index) return null;
                        const x1 = 90 + index * 180;
                        const y1 = index % 2 === 0 ? 120 : 280;
                        const x2 = 90 + targetIndex * 180;
                        const y2 = targetIndex % 2 === 0 ? 120 : 280;
                        return (
                          <path
                            key={`${item.id}-${targetId}`}
                            d={`M ${x1} ${y1} C ${(x1 + x2) / 2} ${y1}, ${(x1 + x2) / 2} ${y2}, ${x2} ${y2}`}
                            fill="none"
                            stroke="#d5dbd2"
                            strokeWidth="2"
                            strokeDasharray="5 6"
                          />
                        );
                      })
                      .filter(Boolean)
                  )}
                </svg>

                <div className="relative h-[420px]">
                  {items.map((item, index) => {
                    const top = index % 2 === 0 ? 52 : 212;
                    const left = 18 + index * 180;
                    return (
                      <article
                        key={item.id}
                        className="absolute w-36 rounded-lg border border-line bg-linen p-3 shadow-sm"
                        style={{ left, top }}
                      >
                        <div
                          className={`mb-2 inline-flex rounded-md border px-2 py-1 text-[11px] font-medium ${emotionTone[item.emotion]}`}
                        >
                          {emotionLabel[item.emotion]}
                        </div>
                        <h3 className="text-sm font-semibold leading-5 text-ink">{item.title}</h3>
                        <p className="mt-2 line-clamp-3 text-xs leading-5 text-ink/58">{item.summary}</p>
                      </article>
                    );
                  })}
                </div>
              </div>
            </div>
          </Card>

          <div className="space-y-5">
            <Card className="p-5">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-ink">
                <Clock3 className="h-5 w-5 text-sage" />
                时间线
              </h2>
              <div className="mt-4 space-y-3">
                {items.map((item) => (
                  <div key={item.id} className="rounded-lg bg-mist p-3">
                    <p className="text-xs text-ink/48">{item.date}</p>
                    <p className="mt-1 text-sm font-medium text-ink">{item.title}</p>
                    <p className="mt-1 text-xs leading-5 text-ink/56">{item.summary}</p>
                  </div>
                ))}
              </div>
            </Card>
            <Card className="p-5">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-ink">
                <CalendarDays className="h-5 w-5 text-sage" />
                预留视图
              </h2>
              <div className="mt-4 grid gap-3">
                <button className="rounded-lg border border-dashed border-line bg-white px-4 py-3 text-left text-sm text-ink/48" disabled>
                  日历视图暂未实现
                </button>
                <button className="rounded-lg border border-dashed border-line bg-white px-4 py-3 text-left text-sm text-ink/48" disabled>
                  日记视图暂未实现
                </button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
