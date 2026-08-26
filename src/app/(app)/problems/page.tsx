import { Database, SearchX } from "lucide-react";
import Link from "next/link";

import { ProblemFiltersForm } from "@/components/problems/problem-filters";
import { ProblemCard } from "@/components/problems/problem-card";
import { EmptyState } from "@/components/feedback/empty-state";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import {
  filterProblems,
  problemFilterOptions,
  type ProblemFilters,
} from "@/features/problems/model";
import { getProblemCatalog } from "@/features/problems/queries";

const PAGE_SIZE = 24;

type ProblemLibraryPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ProblemLibraryPage({
  searchParams,
}: ProblemLibraryPageProps) {
  const params = await searchParams;
  const filters: ProblemFilters = {
    company: scalar(params.company),
    difficulty: scalar(params.difficulty),
    level: scalar(params.level),
    query: scalar(params.query),
    tag: scalar(params.tag),
    topic: scalar(params.topic),
  };
  const requestedPage = Number.parseInt(scalar(params.page) ?? "1", 10);
  const catalog = await getProblemCatalog();
  const filtered = filterProblems(catalog, filters);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const page = Math.min(
    pageCount,
    Number.isFinite(requestedPage) ? Math.max(1, requestedPage) : 1,
  );
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const options = problemFilterOptions(catalog);

  return (
    <div className="space-y-8">
      <PageHeader
        actions={
          <span className="text-muted text-sm">
            {catalog.length} curated problems
          </span>
        }
        description="Browse educational metadata and source links. Personalized recommendations remain the primary practice path."
        eyebrow="Practice catalog"
        title="Problem library"
      />

      <Card>
        <CardContent className="p-5 sm:p-6">
          <ProblemFiltersForm
            companies={options.companies}
            filters={filters}
            tags={options.tags}
            topics={options.topics}
          />
        </CardContent>
      </Card>

      <div className="bg-primary-soft flex items-start gap-3 rounded-xl border p-4 text-sm">
        <Database
          aria-hidden="true"
          className="text-primary mt-0.5 size-4 shrink-0"
        />
        <p>
          This library stores titles, identifiers, difficulty, educational
          categorization, and links only. Problem statements stay with their
          original source.
        </p>
      </div>

      <section aria-labelledby="problem-results">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold" id="problem-results">
              {filtered.length} {filtered.length === 1 ? "result" : "results"}
            </h2>
            <p className="text-muted mt-1 text-sm">
              Page {page} of {pageCount}
            </p>
          </div>
        </div>

        {visible.length === 0 ? (
          <EmptyState
            action={
              <Link
                className={buttonVariants({ variant: "secondary" })}
                href="/problems"
              >
                Clear filters
              </Link>
            }
            description="Try a broader title, topic, difficulty, level, or pattern tag."
            icon={<SearchX aria-hidden="true" className="size-7" />}
            title="No problems match"
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {visible.map((problem) => (
              <ProblemCard key={problem.id} problem={problem} />
            ))}
          </div>
        )}
      </section>

      {pageCount > 1 ? (
        <nav
          aria-label="Problem result pages"
          className="flex items-center justify-center gap-3 border-t pt-6"
        >
          {page > 1 ? (
            <Link
              className={buttonVariants({ variant: "secondary" })}
              href={pageHref(filters, page - 1)}
            >
              Previous
            </Link>
          ) : null}
          <span className="text-muted text-sm">
            {page} / {pageCount}
          </span>
          {page < pageCount ? (
            <Link
              className={buttonVariants({ variant: "secondary" })}
              href={pageHref(filters, page + 1)}
            >
              Next
            </Link>
          ) : null}
        </nav>
      ) : null}
    </div>
  );
}

function scalar(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function pageHref(filters: ProblemFilters, page: number) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value) params.set(key, value);
  }
  params.set("page", String(page));
  return "/problems?" + params.toString();
}
