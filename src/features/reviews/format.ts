export function formatReviewDate(value: string, timeZone: string) {
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    timeZone,
  }).format(new Date(value));
}

export function formatInterval(days: number) {
  return days === 1 ? "1 day" : `${days} days`;
}
