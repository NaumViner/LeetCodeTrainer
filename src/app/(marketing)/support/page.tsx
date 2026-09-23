import Link from "next/link";
import { HelpLinks } from "@/components/navigation/help-links";
import { operator, supportEmailHref } from "@/lib/operator";

export const metadata = { title: "Help and feedback" };

export default async function SupportPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const hebrew = (await searchParams).lang === "he";
  const sections = hebrew
    ? [
        [
          "מיקרופון וחיבור",
          "זהו ראיון קולי ונדרש מיקרופון. אשרו גישה למיקרופון בדפדפן ובמערכת ההפעלה. אם ההרשאה נחסמה, אפשר לשנות אותה בהגדרות האתר בדפדפן ולנסות שוב. לאחר ניתוק, השתמשו באפשרות החיבור מחדש שמופיעה בראיון. אין כרגע מסלול ראיון מלא בהתכתבות.",
        ],
        [
          "שמירת העבודה",
          "אם השמירה או ההגשה נכשלות, השאירו את העמוד פתוח והשתמשו באפשרות הניסיון החוזר. אם מופיעה התנגשות בין גרסאות, העתיקו את הקוד וההערות לפני רענון. שינויים שטרם נשמרו עלולים ללכת לאיבוד בסגירה או ברענון.",
        ],
        [
          "משוב וגרסת בטא",
          "משוב AI עשוי להיות שגוי או לא זמין. הוא נועד לתרגול ואינו מנבא קבלה לעבודה. ספריית השאלות מוגבלת ושאלות עשויות לחזור. אפשר לראיין בעברית או באנגלית; חלק מממשק החשבון עדיין באנגלית.",
        ],
        [
          "פנייה לתמיכה",
          "אפשר לציין בקצרה את סוג הבעיה, מה קרה וסוג הדפדפן. ניתן להוסיף מזהה ראיון מתוך הכתובת, לפי בחירתכם. אין צורך לצרף קוד, תמלול או הקלטה. אל תשלחו סיסמאות, מפתחות או קישורי התחברות ושחזור. הקישור למייל פותח טיוטה אצלכם ואינו שולח דבר אוטומטית.",
        ],
      ]
    : [
        [
          "Microphone and connection",
          "This is a voice interview and requires a microphone. Allow microphone access in your browser and operating system. If permission is blocked, change it in the browser's site settings and try again. After a disconnection, use the reconnect option shown in the interview. A complete text-only interview is not currently available.",
        ],
        [
          "Saving your work",
          "If saving or submitting fails, keep the page open and use its retry action. If a version conflict appears, copy your code and notes before refreshing. Unsaved changes can be lost when closing or reloading the page.",
        ],
        [
          "Feedback and beta limitations",
          "AI feedback can be incorrect or unavailable. It is for practice and does not predict hiring outcomes. The question library is limited and prompts can repeat. Interviews support English and Hebrew; parts of the account interface remain in English.",
        ],
        [
          "Contact support",
          "Briefly describe the problem category, what happened, and your browser. You may include the interview identifier from its address if you choose. Code, transcripts and recordings are not required. Never send passwords, API keys, sign-in links or recovery links. The email link opens your own draft and sends nothing automatically.",
        ],
      ];
  return (
    <main
      className="mx-auto w-full max-w-3xl space-y-7 px-5 py-10"
      dir={hebrew ? "rtl" : "ltr"}
      lang={hebrew ? "he" : "en"}
    >
      <nav className="flex flex-wrap justify-between gap-4 text-sm underline">
        <Link href="/">{hebrew ? "חזרה לאפליקציה" : "Back to the app"}</Link>
        <Link
          href={hebrew ? "/support" : "/support?lang=he"}
          lang={hebrew ? "en" : "he"}
        >
          {hebrew ? "English" : "עברית"}
        </Link>
      </nav>
      <h1 className="text-3xl font-semibold">
        {hebrew ? "עזרה ומשוב" : "Help and feedback"}
      </h1>
      {sections.map(([title, body]) => (
        <section key={title} className="space-y-2">
          <h2 className="text-xl font-semibold">{title}</h2>
          <p className="text-muted leading-7">{body}</p>
        </section>
      ))}
      <p>
        {hebrew ? "מפעיל האפליקציה:" : "Operator:"} <bdi>{operator.name}</bdi>
        <br />
        <a className="text-primary underline" href={supportEmailHref()}>
          <bdi>{operator.email}</bdi>
        </a>
      </p>
      <p className="text-sm">
        {hebrew
          ? "אם לא נפתחת תוכנת מייל, העתיקו את הכתובת למייל שלכם."
          : "If no email app opens, copy the address into your email service."}
      </p>
      <Link
        className="text-primary inline-block underline"
        href="/forgot-password"
      >
        {hebrew ? "שחזור סיסמה" : "Recover your password"}
      </Link>
      <HelpLinks hebrew={hebrew} />
    </main>
  );
}
