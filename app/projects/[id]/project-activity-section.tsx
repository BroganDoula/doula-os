export type ActivityItem = {
  label: string;
  detail: string;
  at: string; // ISO string
};

function relativeTime(at: string): string {
  const days = Math.floor((Date.now() - new Date(at).getTime()) / 86400000);
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

export function ProjectActivitySection({ items }: { items: ActivityItem[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">No recent activity.</p>;
  }

  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-3 text-sm">
          <span className="text-muted-foreground tabular-nums shrink-0 w-20 text-right pt-px">
            {relativeTime(item.at)}
          </span>
          <span>
            <span className="font-medium">{item.label}</span>
            {item.detail && (
              <span className="text-muted-foreground"> — {item.detail}</span>
            )}
          </span>
        </li>
      ))}
    </ul>
  );
}
