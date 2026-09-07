export const INTERVIEW_DIFFICULTY_RANGES = {
  easy: ["easy"],
  medium: ["medium"],
  hard: ["hard"],
  easy_medium: ["easy", "medium"],
  medium_hard: ["medium", "hard"],
  easy_hard: ["easy", "medium", "hard"],
} as const;

export type InterviewDifficultyRange = keyof typeof INTERVIEW_DIFFICULTY_RANGES;

export const interviewDifficultyRangeLabels: Record<
  InterviewDifficultyRange,
  string
> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
  easy_medium: "Easy–Medium",
  medium_hard: "Medium–Hard",
  easy_hard: "Easy–Hard",
};

export type InterviewPreferences = {
  codingLanguage: "python" | "java";
  difficultyRange: InterviewDifficultyRange;
  durationMinutes: 30 | 45 | 60;
  interviewLanguage: "english" | "hebrew";
  interviewerLevel: "beginner" | "faang_tough";
};

export const defaultInterviewPreferences: InterviewPreferences = {
  codingLanguage: "python",
  difficultyRange: "easy_medium",
  durationMinutes: 30,
  interviewLanguage: "english",
  interviewerLevel: "beginner",
};
