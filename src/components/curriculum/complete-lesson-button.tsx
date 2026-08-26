import { CheckCircle2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { SubmitButton } from "@/components/ui/submit-button";
import { completeLessonAction } from "@/features/curriculum/actions";

type CompleteLessonButtonProps = {
  completed: boolean;
  lessonId: string;
};

export function CompleteLessonButton({
  completed,
  lessonId,
}: CompleteLessonButtonProps) {
  if (completed) {
    return (
      <Badge className="px-4 py-2" variant="success">
        <CheckCircle2 aria-hidden="true" className="size-4" />
        Lesson completed
      </Badge>
    );
  }

  return (
    <form action={completeLessonAction}>
      <input name="lessonId" type="hidden" value={lessonId} />
      <SubmitButton
        label="Mark lesson complete"
        pendingLabel="Saving progress…"
      />
    </form>
  );
}
