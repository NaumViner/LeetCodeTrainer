import { Badge } from "@/components/ui/badge";

const variants = {
  easy: "success",
  hard: "danger",
  medium: "warning",
} as const;

export function DifficultyBadge({
  difficulty,
}: {
  difficulty: "easy" | "hard" | "medium";
}) {
  return (
    <Badge className="capitalize" variant={variants[difficulty]}>
      {difficulty}
    </Badge>
  );
}
