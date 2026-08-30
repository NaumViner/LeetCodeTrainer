import { execFileSync } from "node:child_process";
import { resolve } from "node:path";

type LocalStatus = {
  API_URL: string;
  SECRET_KEY?: string;
  SERVICE_ROLE_KEY?: string;
};

export default function globalSetup() {
  const cliPath = resolve(
    process.cwd(),
    "node_modules/supabase/dist/supabase.js",
  );
  const output = execFileSync(
    process.execPath,
    [cliPath, "status", "-o", "json"],
    {
      cwd: process.cwd(),
      encoding: "utf8",
    },
  );
  const status = JSON.parse(output) as LocalStatus;
  const secretKey = status.SECRET_KEY ?? status.SERVICE_ROLE_KEY;
  if (!status.API_URL || !secretKey) {
    throw new Error("Local Supabase cleanup credentials are unavailable.");
  }
  process.env.E2E_SUPABASE_API_URL = status.API_URL;
  process.env.E2E_SUPABASE_SECRET_KEY = secretKey;
}
