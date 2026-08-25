import type { ReactNode } from "react";

import { Card, CardContent } from "@/components/ui/card";

type EmptyStateProps = {
  action?: ReactNode;
  description: string;
  icon?: ReactNode;
  title: string;
};

export function EmptyState({
  action,
  description,
  icon,
  title,
}: EmptyStateProps) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center px-6 py-12 text-center">
        {icon ? <div className="text-primary mb-4">{icon}</div> : null}
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="text-muted mt-2 max-w-md text-sm leading-6">
          {description}
        </p>
        {action ? <div className="mt-5">{action}</div> : null}
      </CardContent>
    </Card>
  );
}
