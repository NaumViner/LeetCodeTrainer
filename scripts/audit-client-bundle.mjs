import { readdir, readFile } from "node:fs/promises";
import { extname, relative, resolve } from "node:path";

const bundleRoot = resolve(".next/static");
const serverOnlyNames = [
  "AI_API_KEY",
  "GEMINI_API_KEY",
  "INTERVIEW_EVALUATOR_API_KEY",
  "REALTIME_AI_API_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
];
const needles = serverOnlyNames.flatMap((name) => {
  const value = process.env[name]?.trim();
  const configured =
    value &&
    value.length >= 8 &&
    !value.toLowerCase().startsWith("replace-with-") &&
    !value.toLowerCase().startsWith("your-");
  return configured
    ? [
        { identifier: true, label: `${name} identifier`, value: name },
        { label: `${name} configured value`, value },
      ]
    : [{ identifier: true, label: `${name} identifier`, value: name }];
});

const files = await listFiles(bundleRoot);
const violations = [];
for (const file of files) {
  if (![".css", ".js", ".json", ".map"].includes(extname(file))) continue;
  const content = await readFile(file, "utf8");
  for (const needle of needles) {
    const found = needle.identifier
      ? new RegExp(`(^|[^A-Z0-9_])${needle.value}([^A-Z0-9_]|$)`).test(content)
      : content.includes(needle.value);
    if (found) {
      violations.push({
        file: relative(bundleRoot, file),
        label: needle.label,
      });
    }
  }
}

if (violations.length > 0) {
  console.error("Client bundle security audit failed:");
  for (const violation of violations) {
    console.error(`- ${violation.label} appears in ${violation.file}`);
  }
  process.exit(1);
}

console.log(
  `Client bundle security audit passed across ${files.length} static assets.`,
);

async function listFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((entry) => {
      const path = resolve(directory, entry.name);
      return entry.isDirectory() ? listFiles(path) : [path];
    }),
  );
  return nested.flat();
}
