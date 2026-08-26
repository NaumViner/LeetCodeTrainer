import type { ReactNode } from "react";

import { Card, CardContent } from "@/components/ui/card";

export function MetricCard({
  icon,
  label,
  note,
  value,
}: {
  icon?: ReactNode;
  label: string;
  note?: string;
  value: string;
}) {
  return (
    <Card className="shadow-none">
      <CardContent className="p-5">
        <div className="text-primary">{icon}</div>
        <p className="text-muted mt-3 text-xs font-semibold tracking-wide uppercase">
          {label}
        </p>
        <p className="mt-1 text-2xl font-bold">{value}</p>
        {note ? <p className="text-muted mt-1 text-xs">{note}</p> : null}
      </CardContent>
    </Card>
  );
}
