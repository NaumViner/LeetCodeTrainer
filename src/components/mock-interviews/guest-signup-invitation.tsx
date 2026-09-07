"use client";

import Link from "next/link";
import { useState } from "react";
import { buttonVariants } from "@/components/ui/button";

export function GuestSignupInvitation({
  hebrew = false,
  ended = false,
  required = false,
}: {
  hebrew?: boolean;
  ended?: boolean;
  required?: boolean;
}) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed && !required) return null;
  return (
    <section
      className="bg-primary-soft rounded-2xl border p-6"
      dir={hebrew ? "rtl" : "ltr"}
      aria-label={hebrew ? "שמירת הראיון" : "Save your interview"}
    >
      <h2 className="text-xl font-semibold">
        {hebrew
          ? ended
            ? "רוצה לשמור את מה שעשית?"
            : "שומרים את הראיון שלך?"
          : ended
            ? "Keep the work you did"
            : "Keep your interview and feedback"}
      </h2>
      <p className="text-muted mt-2 text-sm leading-6">
        {hebrew
          ? "צור חשבון כדי לשמור את הראיון ולהמשיך להתראיין. הערכת יכולות היא לבחירתך בלבד."
          : "Create an account to keep this interview and continue practicing. A skills assessment is entirely optional."}
      </p>
      <p className="text-muted mt-2 text-xs leading-5">
        {hebrew
          ? "ללא חשבון, החזרה לראיון תלויה באותו דפדפן. נתוני אורח נשמרים זמנית."
          : "Without an account, returning to this interview depends on this browser. Guest work is stored temporarily."}
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Link href="/signup" className={buttonVariants()}>
          {hebrew
            ? "שמירת הראיון ויצירת חשבון"
            : "Save interview & create account"}
        </Link>
        <Link
          href="/login"
          className={buttonVariants({ variant: "secondary" })}
        >
          {hebrew ? "יש לי חשבון" : "I have an account"}
        </Link>
        {!required ? (
          <button
            type="button"
            className="text-muted rounded px-2 py-2 text-sm underline"
            onClick={() => setDismissed(true)}
          >
            {hebrew ? "אולי אחר כך" : "Maybe later"}
          </button>
        ) : null}
      </div>
    </section>
  );
}
