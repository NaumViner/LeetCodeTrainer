import Link from "next/link";

type TopicMasteryItem = {
  href: string;
  name: string;
  value: number;
};

export function TopicMasteryChart({ items }: { items: TopicMasteryItem[] }) {
  return <CardlessFigure items={items.slice(0, 8)} />;
}

function CardlessFigure({ items }: { items: TopicMasteryItem[] }) {
  return (
    <figure aria-labelledby="mastery-chart-title">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold" id="mastery-chart-title">
            Mastery at a glance
          </h2>
          <p className="text-muted mt-1 text-sm">
            Strongest practiced topics, ranked by current evidence.
          </p>
        </div>
        <span className="text-muted text-xs">Score / 100</span>
      </div>
      <ol className="mt-6 space-y-4">
        {items.map((item) => (
          <li key={item.href}>
            <div className="mb-1.5 flex items-center justify-between gap-4 text-sm">
              <Link className="hover:text-primary font-medium" href={item.href}>
                {item.name}
              </Link>
              <strong>{Math.round(item.value)}</strong>
            </div>
            <div
              aria-label={`${item.name}: ${Math.round(item.value)} out of 100`}
              aria-valuemax={100}
              aria-valuemin={0}
              aria-valuenow={Math.round(item.value)}
              className="bg-surface-subtle h-2.5 overflow-hidden rounded-full"
              role="progressbar"
            >
              <div
                className="bg-primary h-full rounded-full"
                style={{ width: `${Math.max(0, Math.min(100, item.value))}%` }}
              />
            </div>
          </li>
        ))}
      </ol>
    </figure>
  );
}
