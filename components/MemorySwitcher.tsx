"use client";

import { BrainCircuit } from "lucide-react";
import { useAppState } from "@/lib/store";

export function MemorySwitcher({
  compact = false,
  onBeforeChange
}: {
  compact?: boolean;
  onBeforeChange?: (nextId: string) => boolean;
}) {
  const { memorySpaces, currentMemoryId, setCurrentMemoryId } = useAppState();

  return (
    <label className={compact ? "block" : "flex flex-col gap-2 sm:min-w-72"}>
      {!compact ? (
        <span className="flex items-center gap-2 text-sm font-medium text-ink/70">
          <BrainCircuit className="h-4 w-4 text-sage" />
          当前记忆体
        </span>
      ) : null}
      <select
        className="min-h-10 w-full rounded-[18px] border border-line bg-white/94 px-3 py-2 text-sm text-ink outline-none focus:border-sage focus:ring-2 focus:ring-sage/15"
        value={currentMemoryId}
        onChange={(event) => {
          const nextId = event.target.value;
          if (onBeforeChange && !onBeforeChange(nextId)) {
            return;
          }
          setCurrentMemoryId(nextId);
        }}
      >
        {memorySpaces.map((memory) => (
          <option key={memory.id} value={memory.id}>
            {memory.name}
          </option>
        ))}
      </select>
    </label>
  );
}
