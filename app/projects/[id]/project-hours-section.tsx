import Link from "next/link";

export function ProjectHoursSection({
  totalHours,
  thisWeekHours,
  last4WeeksHours,
  engagementId,
}: {
  totalHours: number;
  thisWeekHours: number;
  last4WeeksHours: number;
  engagementId: string;
}) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-4">
        <div className="border rounded-md p-3">
          <div className="text-xs text-muted-foreground mb-1">All time</div>
          <div className="text-lg font-semibold tabular-nums">{totalHours.toFixed(1)}h</div>
        </div>
        <div className="border rounded-md p-3">
          <div className="text-xs text-muted-foreground mb-1">This week</div>
          <div className="text-lg font-semibold tabular-nums">{thisWeekHours.toFixed(1)}h</div>
        </div>
        <div className="border rounded-md p-3">
          <div className="text-xs text-muted-foreground mb-1">Last 4 weeks</div>
          <div className="text-lg font-semibold tabular-nums">{last4WeeksHours.toFixed(1)}h</div>
        </div>
      </div>
      <Link
        href={`/hours?engagementId=${engagementId}`}
        className="text-xs text-muted-foreground hover:text-foreground"
      >
        → View full hours log
      </Link>
    </div>
  );
}
