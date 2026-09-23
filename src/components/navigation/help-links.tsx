import Link from "next/link";

export function HelpLinks({ hebrew = false }: { hebrew?: boolean }) {
  const suffix = hebrew ? "?lang=he" : "";
  return (
    <nav
      aria-label={hebrew ? "עזרה ופרטיות" : "Help and privacy"}
      className="text-muted flex flex-wrap justify-center gap-5 py-5 text-sm"
      dir={hebrew ? "rtl" : "ltr"}
    >
      <Link className="underline underline-offset-4" href={`/support${suffix}`}>
        {hebrew ? "עזרה ומשוב" : "Help and feedback"}
      </Link>
      <Link className="underline underline-offset-4" href={`/privacy${suffix}`}>
        {hebrew ? "פרטיות ומחיקת חשבון" : "Privacy and account deletion"}
      </Link>
    </nav>
  );
}
