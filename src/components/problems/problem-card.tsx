import { ArrowRight, Clock3, Crown } from "lucide-react";
import Link from "next/link";

import { DifficultyBadge } from "@/components/problems/difficulty-badge";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { Problem } from "@/features/problems/model";

export function ProblemCard({ problem }: { problem: Problem }) {
  return (
    <Card className="h-full">
      <CardContent className="flex h-full flex-col p-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge>#{problem.external_id}</Badge>
          <DifficultyBadge
            difficulty={problem.difficulty as "easy" | "hard" | "medium"}
          />
          {problem.premium ? (
            <Badge variant="primary">
              <Crown aria-hidden="true" className="size-3.5" />
              Premium
            </Badge>
          ) : null}
        </div>
        <h2 className="mt-4 text-lg font-semibold">{problem.title}</h2>
        <p className="text-primary mt-2 text-sm font-medium">
          {problem.primaryTopic.name}
        </p>
        <p className="text-muted mt-3 flex items-center gap-1.5 text-sm">
          <Clock3 aria-hidden="true" className="size-3.5" />
          {problem.estimated_minutes} minutes ·{" "}
          <span className="capitalize">
            {problem.curriculum_level.replaceAll("_", " ")}
          </span>
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {problem.pattern_tags.slice(0, 3).map((tag) => (
            <Badge key={tag}>{tag.replaceAll("-", " ")}</Badge>
          ))}
        </div>
        <Link
          className="text-primary mt-5 inline-flex items-center gap-2 text-sm font-semibold"
          href={"/problems/" + problem.external_id}
        >
          View metadata
          <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      </CardContent>
    </Card>
  );
}
