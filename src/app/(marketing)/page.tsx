import {
  ArrowRight,
  BrainCircuit,
  Check,
  Clock3,
  RefreshCcw,
  Sparkles,
  Target,
} from "lucide-react";

import { Brand } from "@/components/navigation/brand";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const learningLoop = [
  {
    icon: BrainCircuit,
    title: "Recognize",
    description: "Learn the signals that reveal an interview pattern.",
  },
  {
    icon: Target,
    title: "Attempt",
    description:
      "Practice independently while help and confidence are tracked.",
  },
  {
    icon: RefreshCcw,
    title: "Retain",
    description: "Review mistakes at the moment they are most useful.",
  },
] as const;

const foundationItems = [
  "Strict TypeScript and modular App Router structure",
  "Responsive, accessible design primitives",
  "Deterministic unit and browser-test foundations",
  "Environment validation with no required credentials",
] as const;

export default function HomePage() {
  return (
    <main>
      <header className="bg-surface/90 border-b">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
          <Brand />
          <nav
            aria-label="Primary navigation"
            className="hidden items-center gap-6 sm:flex"
          >
            <a
              className="text-muted hover:text-foreground text-sm font-medium"
              href="#learning-loop"
            >
              How it works
            </a>
            <a
              className="text-muted hover:text-foreground text-sm font-medium"
              href="#foundation"
            >
              Foundation
            </a>
          </nav>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl gap-12 px-5 py-20 sm:px-8 sm:py-28 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div>
          <Badge className="mb-6" variant="primary">
            <Sparkles aria-hidden="true" className="size-3.5" />
            Adaptive interview preparation
          </Badge>
          <h1 className="max-w-3xl text-4xl leading-[1.08] font-semibold tracking-[-0.04em] sm:text-6xl">
            Know exactly what to practice next.
          </h1>
          <p className="text-muted mt-6 max-w-2xl text-lg leading-8 sm:text-xl">
            Build interview skill through a guided loop of pattern recognition,
            independent problem solving, reflection, and well-timed review.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <a className={buttonVariants({ size: "lg" })} href="#learning-loop">
              Explore the learning loop
              <ArrowRight aria-hidden="true" className="size-4" />
            </a>
            <a
              className={buttonVariants({ size: "lg", variant: "secondary" })}
              href="#foundation"
            >
              View the foundation
            </a>
          </div>
        </div>

        <Card
          className="overflow-hidden"
          aria-label="Adaptive study loop preview"
        >
          <div className="bg-surface-subtle flex items-center justify-between border-b px-6 py-4">
            <div>
              <p className="text-sm font-semibold">Your learning loop</p>
              <p className="text-muted mt-1 text-xs">
                Designed around independent performance
              </p>
            </div>
            <Badge variant="success">Always adapting</Badge>
          </div>
          <CardContent className="space-y-3 p-6">
            {[
              ["01", "Learn the recognition signals", "Foundation"],
              ["02", "Solve with measured independence", "Practice"],
              ["03", "Turn mistakes into future review", "Retention"],
            ].map(([step, title, label]) => (
              <div
                className="bg-surface flex items-center gap-4 rounded-xl border p-4"
                key={step}
              >
                <span className="text-primary font-mono text-xs font-semibold">
                  {step}
                </span>
                <span className="min-w-0 flex-1 text-sm font-medium">
                  {title}
                </span>
                <span className="text-muted text-xs">{label}</span>
              </div>
            ))}
            <div className="text-muted mt-5 flex items-center gap-2 text-sm">
              <Clock3 aria-hidden="true" className="text-primary size-4" />
              Daily plans will fit the learner&apos;s available time.
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="bg-surface border-y" id="learning-loop">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
          <p className="text-primary text-sm font-semibold tracking-wide uppercase">
            The core loop
          </p>
          <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
            Progress means more than an accepted solution.
          </h2>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {learningLoop.map(({ icon: Icon, title, description }) => (
              <Card key={title}>
                <CardContent className="p-6">
                  <div className="bg-primary-soft text-primary flex size-10 items-center justify-center rounded-xl">
                    <Icon aria-hidden="true" className="size-5" />
                  </div>
                  <h3 className="mt-5 text-lg font-semibold">{title}</h3>
                  <p className="text-muted mt-2 leading-7">{description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-20 sm:px-8" id="foundation">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <Badge variant="neutral">Phase 1 foundation</Badge>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
              Ready for real product workflows.
            </h2>
            <p className="text-muted mt-4 max-w-xl leading-7">
              The repository starts with maintainable boundaries and automated
              quality checks, so authentication and learning data can be added
              without rebuilding the base.
            </p>
          </div>
          <ul className="space-y-3" aria-label="Foundation capabilities">
            {foundationItems.map((item) => (
              <li
                className="bg-surface flex items-start gap-3 rounded-xl border px-4 py-3"
                key={item}
              >
                <span className="bg-success-soft text-success mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full">
                  <Check
                    aria-hidden="true"
                    className="size-3.5"
                    strokeWidth={2.5}
                  />
                </span>
                <span className="text-sm leading-6">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <footer className="bg-surface border-t">
        <div className="text-muted mx-auto flex max-w-6xl flex-col gap-3 px-5 py-8 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <Brand compact />
          <p>
            Built around independent interview performance and lasting
            retention.
          </p>
        </div>
      </footer>
    </main>
  );
}
