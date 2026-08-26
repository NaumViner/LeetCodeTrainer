import Link from "next/link";

import { Button, buttonVariants } from "@/components/ui/button";
import type { ProblemFilters, ProblemTopic } from "@/features/problems/model";

type ProblemFiltersProps = {
  companies: string[];
  filters: ProblemFilters;
  tags: string[];
  topics: ProblemTopic[];
};

const controlClass =
  "bg-surface text-foreground h-10 w-full rounded-lg border px-3 text-sm";

export function ProblemFiltersForm({
  companies,
  filters,
  tags,
  topics,
}: ProblemFiltersProps) {
  return (
    <form action="/problems" className="grid gap-4" method="get">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <label className="space-y-1.5 text-sm font-medium md:col-span-2">
          Search
          <input
            className={controlClass}
            defaultValue={filters.query}
            name="query"
            placeholder="Title, ID, tag, or recognition signal"
            type="search"
          />
        </label>
        <FilterSelect
          defaultValue={filters.topic}
          label="Topic"
          name="topic"
          options={topics.map((topic) => ({
            label: topic.name,
            value: topic.slug,
          }))}
        />
        <FilterSelect
          defaultValue={filters.difficulty}
          label="Difficulty"
          name="difficulty"
          options={[
            { label: "Easy", value: "easy" },
            { label: "Medium", value: "medium" },
            { label: "Hard", value: "hard" },
          ]}
        />
        <FilterSelect
          defaultValue={filters.level}
          label="Curriculum level"
          name="level"
          options={[
            { label: "Foundation", value: "foundation" },
            { label: "Guided", value: "guided" },
            { label: "Independent", value: "independent" },
            { label: "Timed", value: "timed" },
            { label: "Interview", value: "interview" },
          ]}
        />
        <FilterSelect
          defaultValue={filters.tag}
          label="Pattern tag"
          name="tag"
          options={tags.map((tag) => ({
            label: tag.replaceAll("-", " "),
            value: tag,
          }))}
        />
        {companies.length > 0 ? (
          <FilterSelect
            defaultValue={filters.company}
            label="Company"
            name="company"
            options={companies.map((company) => ({
              label: company,
              value: company,
            }))}
          />
        ) : null}
      </div>
      <div className="flex flex-wrap gap-3">
        <Button type="submit">Apply filters</Button>
        <Link className={buttonVariants({ variant: "ghost" })} href="/problems">
          Clear
        </Link>
      </div>
    </form>
  );
}

function FilterSelect({
  defaultValue,
  label,
  name,
  options,
}: {
  defaultValue?: string;
  label: string;
  name: string;
  options: Array<{ label: string; value: string }>;
}) {
  return (
    <label className="space-y-1.5 text-sm font-medium">
      {label}
      <select className={controlClass} defaultValue={defaultValue} name={name}>
        <option value="">All</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
