type OperationalValue = boolean | number | string | null;

export function recordOperationalEvent(
  event: string,
  fields: Record<string, OperationalValue> = {},
) {
  const safeFields = Object.fromEntries(
    Object.entries(fields).map(([key, value]) => [
      key,
      typeof value === "string" ? value.slice(0, 120) : value,
    ]),
  );
  console.info(
    JSON.stringify({
      event: event.slice(0, 80),
      ...safeFields,
      timestamp: new Date().toISOString(),
    }),
  );
}
