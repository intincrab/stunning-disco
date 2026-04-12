"use client";

import { useMemo } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface CommitHeatmapProps {
  commitDates: string[];
}

export function CommitHeatmap({ commitDates }: CommitHeatmapProps) {
  const { weeks, maxCount } = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const d of commitDates) {
      const key = new Date(d).toISOString().slice(0, 10);
      counts[key] = (counts[key] || 0) + 1;
    }

    const max = Math.max(1, ...Object.values(counts));

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Build a full grid — always fill 7 rows (Sun–Sat) x numWeeks columns
    const numWeeks = 20;
    // End date = end of this week (Saturday)
    const dayOfWeek = today.getDay();
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + (6 - dayOfWeek));

    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - (numWeeks * 7 - 1));

    const weeksArr: { date: Date; key: string; count: number }[][] = [];
    const current = new Date(startDate);

    while (current <= endDate) {
      const weekIdx = Math.floor((current.getTime() - startDate.getTime()) / (7 * 86400000));
      if (!weeksArr[weekIdx]) weeksArr[weekIdx] = [];
      const key = current.toISOString().slice(0, 10);
      weeksArr[weekIdx].push({
        date: new Date(current),
        key,
        count: counts[key] || 0,
      });
      current.setDate(current.getDate() + 1);
    }

    return { weeks: weeksArr, countByDate: counts, maxCount: max };
  }, [commitDates]);

  const getColor = (count: number, isFuture: boolean) => {
    if (isFuture) return "bg-transparent";
    if (count === 0) return "bg-[var(--surface-border)]";
    const ratio = count / maxCount;
    if (ratio <= 0.25) return "bg-[#0e4429] dark:bg-[#0e4429]";
    if (ratio <= 0.5) return "bg-[#006d32] dark:bg-[#006d32]";
    if (ratio <= 0.75) return "bg-[#26a641] dark:bg-[#26a641]";
    return "bg-[#3ECF8E]";
  };

  const monthLabels = useMemo(() => {
    const labels: { label: string; col: number }[] = [];
    let lastMonth = -1;
    let lastCol = -4;
    for (let i = 0; i < weeks.length; i++) {
      const firstDay = weeks[i]?.[0];
      if (firstDay) {
        const month = firstDay.date.getMonth();
        if (month !== lastMonth && (i - lastCol) >= 3) {
          labels.push({
            label: firstDay.date.toLocaleDateString("en-US", { month: "short" }),
            col: i,
          });
          lastMonth = month;
          lastCol = i;
        }
      }
    }
    return labels;
  }, [weeks]);

  const totalCommits = commitDates.length;
  const today = new Date();
  today.setHours(23, 59, 59, 999);

  return (
    <div className="bg-[var(--surface-card)] border border-[var(--surface-border)] rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-[var(--surface-text)]">Commit Activity</span>
        <span className="text-xs text-[var(--surface-text-muted)]">
          {totalCommits} commit{totalCommits !== 1 ? "s" : ""} in the last 20 weeks
        </span>
      </div>

      <div className="relative h-4 mb-1">
        {monthLabels.map((m, i) => (
          <span
            key={i}
            className="text-[10px] text-[var(--surface-text-muted)] absolute"
            style={{ left: m.col * 13 }}
          >
            {m.label}
          </span>
        ))}
      </div>

      <div className="flex gap-[3px] overflow-x-auto">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-[3px]">
            {Array.from({ length: 7 }, (_, di) => {
              const day = week?.[di];
              if (!day) {
                return <div key={di} className="w-[10px] h-[10px]" />;
              }
              const isFuture = day.date > today;
              return (
                <Tooltip key={di}>
                  <TooltipTrigger asChild>
                    <div
                      className={`w-[10px] h-[10px] rounded-[2px] ${getColor(day.count, isFuture)} transition-colors`}
                    />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs">
                    {isFuture ? "Future" : `${day.count} commit${day.count !== 1 ? "s" : ""}`} on{" "}
                    {day.date.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-1 mt-3 justify-end">
        <span className="text-[10px] text-[var(--surface-text-muted)] mr-1">Less</span>
        <div className="w-[10px] h-[10px] rounded-[2px] bg-[var(--surface-border)]" />
        <div className="w-[10px] h-[10px] rounded-[2px] bg-[#0e4429]" />
        <div className="w-[10px] h-[10px] rounded-[2px] bg-[#006d32]" />
        <div className="w-[10px] h-[10px] rounded-[2px] bg-[#26a641]" />
        <div className="w-[10px] h-[10px] rounded-[2px] bg-[#3ECF8E]" />
        <span className="text-[10px] text-[var(--surface-text-muted)] ml-1">More</span>
      </div>
    </div>
  );
}
