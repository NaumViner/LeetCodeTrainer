import { Card, CardContent } from "@/components/ui/card";

export function InterviewQuestionPanel({ prompt }: { prompt: string }) {
  return (
    <Card>
      <CardContent className="p-6 sm:p-8" dir="ltr">
        <h1 className="sr-only">Interview question</h1>
        <p className="text-base leading-8 whitespace-pre-wrap sm:text-lg">
          {prompt}
        </p>
      </CardContent>
    </Card>
  );
}
