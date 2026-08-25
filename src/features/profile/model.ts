export const codingLanguages = [
  { label: "Python", value: "python" },
  { label: "Java", value: "java" },
  { label: "C++", value: "cpp" },
  { label: "JavaScript", value: "javascript" },
  { label: "TypeScript", value: "typescript" },
] as const;

export const targetRoles = [
  { label: "Internship", value: "intern" },
  { label: "New graduate", value: "new_grad" },
  { label: "Junior engineer", value: "junior" },
  { label: "Mid-level engineer", value: "mid_level" },
  { label: "Senior engineer", value: "senior" },
] as const;

export const experienceLevels = [
  { label: "Complete beginner", value: "complete_beginner" },
  { label: "Basic programming", value: "basic_programming" },
  { label: "Some LeetCode", value: "some_leetcode" },
  { label: "Active interview preparation", value: "active_interview_prep" },
  { label: "Experienced", value: "experienced" },
] as const;

export const targetCompanies = [
  "Google",
  "Amazon",
  "Microsoft",
  "Meta",
  "Apple",
  "Uber",
  "Stripe",
] as const;

export type CodingLanguage = (typeof codingLanguages)[number]["value"];
export type TargetRole = (typeof targetRoles)[number]["value"];
export type ExperienceLevel = (typeof experienceLevels)[number]["value"];
