type OperationalValue = boolean | number | string | null;

const sensitiveFieldNames = new Set([
  "apikey",
  "codesnapshot",
  "content",
  "displayname",
  "email",
  "notes",
  "profile",
  "prompt",
  "scratchpad",
  "secret",
  "token",
  "transcript",
]);

export function recordOperationalEvent(
  event: string,
  fields: Record<string, OperationalValue> = {},
) {
  const safeFields = Object.fromEntries(
    Object.entries(fields)
      .filter(([key]) => !sensitiveFieldNames.has(normalizeFieldName(key)))
      .map(([key, value]) => [
        key.slice(0, 64),
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

function normalizeFieldName(value: string) {
  return value.toLowerCase().replaceAll(/[^a-z0-9]/g, "");
}
