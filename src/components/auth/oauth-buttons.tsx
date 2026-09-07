import { buttonVariants } from "@/components/ui/button";
import { signInWithOAuthAction } from "@/features/auth/actions";
import { configuredOAuthProviders } from "@/features/auth/providers";
export function OAuthButtons({
  configured,
  intent = "signup",
}: {
  configured: boolean;
  intent?: "login" | "signup";
}) {
  const providers = configured ? configuredOAuthProviders() : [];
  if (!providers.length) return null;
  return (
    <div className="mb-6 flex gap-3">
      {providers.map((provider) => (
        <form
          key={provider}
          action={signInWithOAuthAction.bind(null, provider)}
          className="flex-1"
        >
          <input type="hidden" name="intent" value={intent} />
          <button
            className={buttonVariants({ variant: "secondary" }) + " w-full"}
            type="submit"
          >
            {provider === "google" ? "Google" : "GitHub"}
          </button>
        </form>
      ))}
    </div>
  );
}
