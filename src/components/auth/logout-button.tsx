import { LogOut } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { logoutAction } from "@/features/auth/actions";

export function LogoutButton() {
  return (
    <form action={logoutAction}>
      <button
        className={buttonVariants({ size: "sm", variant: "secondary" })}
        type="submit"
      >
        <LogOut aria-hidden="true" className="size-4" />
        Sign out
      </button>
    </form>
  );
}
