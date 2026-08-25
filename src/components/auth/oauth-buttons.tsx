import { AtSign, CodeXml } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { signInWithOAuthAction } from "@/features/auth/actions";

type OAuthButtonsProps = {
  configured: boolean;
};

export function OAuthButtons({ configured }: OAuthButtonsProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <form action={signInWithOAuthAction.bind(null, "google")}>
        <button
          className={buttonVariants({ variant: "secondary" }) + " w-full"}
          disabled={!configured}
          type="submit"
        >
          <AtSign aria-hidden="true" className="size-4" />
          Google
        </button>
      </form>
      <form action={signInWithOAuthAction.bind(null, "github")}>
        <button
          className={buttonVariants({ variant: "secondary" }) + " w-full"}
          disabled={!configured}
          type="submit"
        >
          <CodeXml aria-hidden="true" className="size-4" />
          GitHub
        </button>
      </form>
    </div>
  );
}
