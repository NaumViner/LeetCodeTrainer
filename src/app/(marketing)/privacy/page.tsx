import Link from "next/link";
import { HelpLinks } from "@/components/navigation/help-links";
import { operator, supportEmailHref } from "@/lib/operator";

export const metadata = { title: "Privacy and account deletion" };

export default async function PrivacyPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const hebrew = (await searchParams).lang === "he";
  const sections = hebrew
    ? [
        [
          "המידע שמשמש לתרגול",
          "המערכת שומרת פרטי חשבון ופרופיל, העדפות, קוד והערות, תמלול שיחה, הגשות, משוב ונתוני התקדמות. אלה משמשים לניהול החשבון, המשך התרגול, הצגת היסטוריה והפקת משוב. המערכת משתמשת גם ברשומות שימוש וחיבור להגבלת שימוש ולתפעול.",
        ],
        [
          "קול וספקי AI",
          "במהלך ראיון קולי האודיו מועבר לספק ה-AI שמוגדר לשיחה: Google Gemini או OpenAI. Gemini משמש גם להפקת משוב מהקוד והתמלול. המימוש הנוכחי אינו שומר קובצי הקלטה גולמיים במסד הנתונים של האפליקציה; הוא כן שומר תמלול. עיבוד ושמירה אצל ספקי השירות כפופים להגדרות ולתנאים שלהם, ואין כאן הבטחה למחיקה מיידית אצלם.",
        ],
        [
          "תשתית ואחסון בדפדפן",
          "Supabase משמש להזדהות ולמסד הנתונים; Vercel נבחר לאירוח הגרסה המקוונת. הדפדפן מחזיק עוגיות לצורך התחברות והעברת עבודה מחשבון אורח, ואת בחירת ערכת הצבעים באחסון מקומי. השירותים עשויים להחזיק גם יומני תפעול וגיבויים. אל תזינו מידע סודי או קוד שאין לכם רשות לשתף עם ספקי ה-AI.",
        ],
        [
          "שמירת נתוני אורחים",
          "מנגנון הניקוי מסמן תוכן של ראיונות אורח שהסתיימו למחיקה לאחר שבעה ימים, וכן ראיונות פעילים שהתיישנו. ראיון שלא הופעל בו הקול עשוי להימחק מוקדם יותר לאחר פקיעת חלון ההפעלה. המחיקה תלויה בהרצת משימת הניקוי ואינה מובטחת בדיוק בתום שבעה ימים. זהות האורח והרישום על ניצול הניסיון נשמרים בנפרד כדי למנוע איפוס הניסיון.",
        ],
        [
          "שמירת חשבונות ומחיקה",
          "כרגע אין מחיקה אוטומטית לפי גיל הנתונים עבור חשבון רשום. ניתן לבקש מחיקת חשבון ונתונים בכתובת למטה. הבקשה מטופלת ידנית ולאחר אימות הבעלות; שליחת מייל אינה מוחקת דבר מיד. מחיקה מהמערכת הפעילה אינה מבטיחה מחיקה מיידית מיומנים, מגיבויים או אצל ספקים חיצוניים.",
        ],
      ]
    : [
        [
          "Data used for practice",
          "The application stores account and profile details, preferences, code and notes, conversation transcripts, submissions, feedback and progress. These support account access, resuming practice, history and feedback. Usage and connection records also support limits and operation.",
        ],
        [
          "Audio and AI providers",
          "During voice interviews, audio is sent to the configured conversation provider: Google Gemini or OpenAI. Gemini also generates feedback from code and transcripts. The current implementation does not save raw recording files in the application database; it does save transcripts. Provider processing and retention depend on their settings and terms; this page does not promise immediate deletion at those providers.",
        ],
        [
          "Infrastructure and browser storage",
          "Supabase provides authentication and the database; Vercel is the selected host for the online deployment. Your browser holds cookies for sign-in and guest-work transfer, and stores your theme preference locally. Service providers may also hold operational logs and backups. Do not enter confidential information or code you are not allowed to share with AI providers.",
        ],
        [
          "Guest data retention",
          "The cleanup mechanism makes completed guest interview content eligible for deletion after seven days, and also handles stale active interviews. Interviews whose voice session never starts can be deleted earlier after their activation window expires. Deletion depends on the cleanup job running and is not guaranteed exactly at seven days. Anonymous identity and consumed-trial records are retained separately to prevent resetting the trial.",
        ],
        [
          "Member retention and deletion",
          "There is currently no automatic age-based deletion for registered account data. Request account and data deletion using the address below. Requests are handled manually after ownership verification; sending an email does not delete anything immediately. Removal from the active application does not promise immediate removal from logs, backups or external providers.",
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
          href={hebrew ? "/privacy" : "/privacy?lang=he"}
          lang={hebrew ? "en" : "he"}
        >
          {hebrew ? "English" : "עברית"}
        </Link>
      </nav>
      <h1 className="text-3xl font-semibold">
        {hebrew ? "פרטיות ומחיקת חשבון" : "Privacy and account deletion"}
      </h1>
      <p className="text-muted text-sm">
        {hebrew ? "עודכן: 22 בספטמבר 2026" : "Updated September 22, 2026"}
      </p>
      {sections.map(([title, body]) => (
        <section key={title} className="space-y-2">
          <h2 className="text-xl font-semibold">{title}</h2>
          <p className="text-muted leading-7">{body}</p>
        </section>
      ))}
      <section className="bg-surface space-y-3 rounded-xl border p-5">
        <h2 className="text-xl font-semibold">
          {hebrew ? "בקשת מחיקה" : "Request deletion"}
        </h2>
        <p>
          {hebrew ? "מפעיל האפליקציה:" : "Operator:"} <bdi>{operator.name}</bdi>
        </p>
        <p>
          {hebrew
            ? "פנו מהכתובת המשויכת לחשבון, אם אפשר. אל תצרפו סיסמה או קישור התחברות. לבקשת אורח, שמרו את הדפדפן המקורי וציינו שמדובר בחשבון אורח; מזהה ראיון לבדו אינו הוכחת בעלות."
            : "Use the address associated with your account where possible. Do not include a password or sign-in link. For guest requests, keep the original browser and mention that this is a guest account; an interview identifier alone is not proof of ownership."}
        </p>
        <a className="text-primary underline" href={supportEmailHref(true)}>
          <bdi>{operator.email}</bdi>
        </a>
      </section>
      <HelpLinks hebrew={hebrew} />
    </main>
  );
}
