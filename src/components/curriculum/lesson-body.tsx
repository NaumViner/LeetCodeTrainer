import type { ComponentPropsWithoutRef } from "react";
import Markdown from "react-markdown";

import { cn } from "@/lib/utils";

export function LessonBody({ content }: { content: string }) {
  return (
    <article className="space-y-5">
      <Markdown
        components={{
          code({ className, children, ...props }) {
            return (
              <code
                className={cn(
                  "bg-surface-subtle rounded px-1.5 py-0.5 font-mono text-[0.9em]",
                  className,
                )}
                {...props}
              >
                {children}
              </code>
            );
          },
          h1: HeadingOne,
          h2: HeadingTwo,
          h3: HeadingThree,
          li({ children }) {
            return <li className="pl-1">{children}</li>;
          },
          ol({ children }) {
            return (
              <ol className="text-muted ml-6 list-decimal space-y-2 leading-7">
                {children}
              </ol>
            );
          },
          p({ children }) {
            return <p className="text-muted leading-7">{children}</p>;
          },
          pre({ children }) {
            return (
              <pre className="bg-foreground text-background overflow-x-auto rounded-xl p-4 text-sm leading-6">
                {children}
              </pre>
            );
          },
          strong({ children }) {
            return (
              <strong className="text-foreground font-semibold">
                {children}
              </strong>
            );
          },
          ul({ children }) {
            return (
              <ul className="text-muted ml-6 list-disc space-y-2 leading-7">
                {children}
              </ul>
            );
          },
        }}
        skipHtml
      >
        {content}
      </Markdown>
    </article>
  );
}

function HeadingOne({ children }: ComponentPropsWithoutRef<"h1">) {
  return <h2 className="text-2xl font-semibold tracking-tight">{children}</h2>;
}

function HeadingTwo({ children }: ComponentPropsWithoutRef<"h2">) {
  return <h3 className="pt-4 text-xl font-semibold">{children}</h3>;
}

function HeadingThree({ children }: ComponentPropsWithoutRef<"h3">) {
  return <h4 className="pt-2 text-lg font-semibold">{children}</h4>;
}
