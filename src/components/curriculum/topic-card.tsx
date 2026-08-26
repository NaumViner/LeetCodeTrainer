import {
  ArrowRight,
  CheckCircle2,
  CircleDashed,
  LockKeyhole,
} from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import type { CurriculumTopic } from "@/features/curriculum/model";

export function TopicCard({ topic }: { topic: CurriculumTopic }) {
  const completed =
    topic.totalLessons > 0 && topic.completedLessons === topic.totalLessons;

  return (
    <Card className="h-full transition-transform hover:-translate-y-0.5">
      <CardContent className="flex h-full flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <Badge>Topic {topic.curriculum_order}</Badge>
          {completed ? (
            <Badge variant="success">
              <CheckCircle2 aria-hidden="true" className="size-3.5" />
              Complete
            </Badge>
          ) : topic.prerequisitesComplete ? (
            <Badge variant="primary">
              <CircleDashed aria-hidden="true" className="size-3.5" />
              Ready
            </Badge>
          ) : (
            <Badge>
              <LockKeyhole aria-hidden="true" className="size-3.5" />
              Prerequisites ahead
            </Badge>
          )}
        </div>
        <h3 className="mt-5 text-lg font-semibold">{topic.name}</h3>
        <p className="text-muted mt-2 flex-1 text-sm leading-6">
          {topic.short_description}
        </p>
        <ProgressBar
          className="mt-5"
          label={topic.totalLessons === 1 ? "Lesson progress" : "Lessons"}
          value={topic.progressPercent}
        />
        <Link
          className="text-primary mt-5 inline-flex items-center gap-2 text-sm font-semibold"
          href={"/learn/" + topic.slug}
        >
          Open topic
          <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      </CardContent>
    </Card>
  );
}
