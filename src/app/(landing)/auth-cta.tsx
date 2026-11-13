import Link from "next/link";
import { cookies } from "next/headers";
import { Suspense, type ComponentProps } from "react";
import { ArrowRightIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { AUTH_BYPASS, SESSION_COOKIE } from "@/lib/auth";
import { cn } from "@/lib/utils";

type Props = Pick<ComponentProps<typeof Button>, "size" | "variant" | "className"> & {
  /** Button text for a visitor / for someone already signed in. */
  signedOutLabel?: string;
  signedInLabel?: string;
};

/**
 * "Sign in" for visitors, "Dashboard" for someone who already has a session.
 * Same optimistic check as the proxy: it only looks for the session cookie.
 * Reading cookies is request-time work, so the visitor version is the instant
 * fallback and the real one streams in.
 */
export function AuthCta(props: Props) {
  return (
    <Suspense fallback={<Cta signedIn={false} {...props} />}>
      <ResolvedCta {...props} />
    </Suspense>
  );
}

async function ResolvedCta(props: Props) {
  const signedIn = AUTH_BYPASS || (await cookies()).has(SESSION_COOKIE);
  return <Cta signedIn={signedIn} {...props} />;
}

function Cta({
  signedIn,
  signedOutLabel = "Sign in",
  signedInLabel = "Dashboard",
  className,
  ...button
}: Props & { signedIn: boolean }) {
  return (
    // The page's main action gives a little when pressed, so it feels like it heard the click.
    <Button asChild className={cn("active:scale-[0.97]", className)} {...button}>
      <Link href={signedIn ? "/dashboard" : "/login"}>
        {signedIn ? signedInLabel : signedOutLabel}
        <ArrowRightIcon />
      </Link>
    </Button>
  );
}
