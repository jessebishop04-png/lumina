import type { CSSProperties, ReactNode } from "react";
import { signInWithGoogleAction } from "@/lib/auth/actions";

interface GoogleSignInButtonProps {
  redirectTo?: string;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}

export function GoogleSignInButton({ redirectTo = "/", className, style, children }: GoogleSignInButtonProps) {
  const signIn = signInWithGoogleAction.bind(null, redirectTo);

  return (
    <form action={signIn} style={{ width: "100%", margin: 0 }}>
      <button type="submit" className={className} style={style}>
        {children}
      </button>
    </form>
  );
}
