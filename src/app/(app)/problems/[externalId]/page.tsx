import {
  ArrowLeft,
  Clock3,
  Crown,
  ExternalLink,
  Lightbulb,
  Route,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { DifficultyBadge } from "@/components/problems/difficulty-badge";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { getProblem } from "@/features/problems/queries";

type ProblemPageProps = {
  params: Promise<{ externalId: string }>;
};

export default async function ProblemPage({ params }: ProblemPageProps) {
  const { externalId } = await params;
  if (!/^\d+$/.test(externalId)) {
    notFound();
  }

  const problem = await getProblem(externalId);
  if (!problem) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <nav aria-label="Breadcrumb" className="text-muted text-sm">
        <Link className="hover:text-foreground" href="/problems">
          Problem library
        </Link>
        <span aria-hidden="true" className="mx-2">
          /
        </span>
        <span>#{problem.external_id}</span>
      </nav>

      <PageHeader
        actions={
          <a
            className={buttonVariants()}
            href={problem.external_url ?? "#"}
            rel="noreferrer"
            target="_blank"
          >
            Open on LeetCode
            <ExternalLink aria-hidden="true" className="size-4" />
          </a>
        }
        description="Use the recognition signals to predict the pattern before opening the original prompt."
        eyebrow={"Problem #" + problem.external_id}
        title={problem.title}
      />

      <div className="flex flex-wrap gap-2">
        <DifficultyBadge
          difficulty={problem.difficulty as "easy" | "hard" | "medium"}
        />
        <Badge variant="primary">{problem.primaryTopic.name}</Badge>
        <Badge className="capitalize">
          {problem.curriculum_level.replaceAll("_", " ")}
        </Badge>
        <Badge>
          <Clock3 aria-hidden="true" className="size-3.5" />
          {problem.estimated_minutes} minutes
        </Badge>
        {problem.premium ? (
          <Badge variant="primary">
            <Crown aria-hidden="true" className="size-3.5" />
            Source subscription may be required
          </Badge>
        ) : null}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardContent className="p-6">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <Lightbulb aria-hidden="true" className="text-primary size-5" />
              Recognition signals
            </h2>
            <ul className="text-muted mt-4 space-y-3 leading-6">
              {problem.recognition_signals.map((signal) => (
                <li className="flex gap-2" key={signal}>
                  <span aria-hidden="true" className="text-primary">
                    •
                  </span>
                  {signal}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <Route aria-hidden="true" className="text-primary size-5" />
              Curriculum placement
            </h2>
            <dl className="mt-4 space-y-4 text-sm">
              <div>
                <dt className="text-muted">Primary topic</dt>
                <dd className="mt-1 font-medium">
                  <Link
                    className="text-primary"
                    href={"/learn/" + problem.primaryTopic.slug}
                  >
                    {problem.primaryTopic.name}
                  </Link>
                </dd>
              </div>
              <div>
                <dt className="text-muted">Secondary topics</dt>
                <dd className="mt-2 flex flex-wrap gap-2">
                  {problem.secondaryTopics.length > 0
                    ? problem.secondaryTopics.map((topic) => (
                        <Badge key={topic.id}>{topic.name}</Badge>
                      ))
                    : "None"}
                </dd>
              </div>
              <div>
                <dt className="text-muted">Prerequisites</dt>
                <dd className="mt-2 flex flex-wrap gap-2">
                  {problem.prerequisiteTopics.map((topic) => (
                    <Link href={"/learn/" + topic.slug} key={topic.id}>
                      <Badge>{topic.name}</Badge>
                    </Link>
                  ))}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-none">
        <CardContent className="p-6">
          <h2 className="font-semibold">Pattern tags</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {problem.pattern_tags.map((tag) => (
              <Badge key={tag}>{tag.replaceAll("-", " ")}</Badge>
            ))}
          </div>
          <p className="text-muted mt-5 border-t pt-5 text-sm leading-6">
            No statement or solution is reproduced here. Open the source to read
            and solve the original problem.
          </p>
        </CardContent>
      </Card>

      <Link className={buttonVariants({ variant: "ghost" })} href="/problems">
        <ArrowLeft aria-hidden="true" className="size-4" />
        Back to problem library
      </Link>
    </div>
  );
}
