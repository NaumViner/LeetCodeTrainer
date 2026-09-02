import { MessageSquareText } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import type { RealtimeTranscriptEntry } from "@/features/realtime-interviews/model";

export function RecentInterviewConversation({
  entries,
}: {
  entries: RealtimeTranscriptEntry[];
}) {
  return (
    <Card aria-labelledby="recent-interview-conversation-title">
      <CardContent className="p-5 sm:p-6">
        <div className="flex items-center gap-2">
          <MessageSquareText
            aria-hidden="true"
            className="text-primary size-4"
          />
          <h2
            className="font-semibold"
            id="recent-interview-conversation-title"
          >
            Recent conversation
          </h2>
        </div>
        <p className="text-muted mt-1 text-sm">
          The six most recent completed spoken turns stay available while you
          code.
        </p>

        {entries.length ? (
          <ol
            aria-label="Recent interview conversation"
            aria-live="polite"
            className="mt-4 max-h-56 space-y-2 overflow-y-auto"
          >
            {entries.map((entry) => (
              <li
                className="bg-surface-subtle rounded-lg border px-3 py-2.5 text-sm leading-6"
                key={entry.id}
              >
                <span className="text-primary me-2 font-semibold">
                  {entry.role === "interviewer" ? "Interviewer" : "You"}:
                </span>
                <span dir="auto">{entry.text}</span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-muted bg-surface-subtle mt-4 rounded-lg border px-3 py-3 text-sm">
            The latest spoken lines will appear here when the conversation
            begins.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
