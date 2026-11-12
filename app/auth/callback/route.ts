import { NextResponse } from "next/server";
import { signSessionToken } from "@/lib/auth-token";
import { createClient } from "@/utils/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data?.user) {
      const user = data.user;
      const meta = user.user_metadata || {};
      const name =
        meta.full_name ||
        meta.name ||
        user.email?.split("@")[0] ||
        "Candidate";
      const picture = meta.avatar_url || meta.picture || undefined;

      // Sync with local session HMAC token for middleware compatibility
      try {
        const { token } = await signSessionToken({
          sub: user.id,
          email: user.email || "candidate@ieltsnova.com",
          name,
          picture,
        });

        const forwardedHost = request.headers.get("x-forwarded-host");
        const isLocalEnv = process.env.NODE_ENV === "development";
        const redirectUrl = isLocalEnv
          ? `${origin}${next}`
          : forwardedHost
            ? `https://${forwardedHost}${next}`
            : `${origin}${next}`;

        const response = NextResponse.redirect(redirectUrl);
        response.cookies.set("ielts_nova_session", token, {
          path: "/",
          httpOnly: true,
          sameSite: "lax",
          maxAge: 60 * 60 * 24 * 7,
        });

        return response;
      } catch {
        // Fallback redirect if token sign fails
      }
    }
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(`${origin}${next}`);
}
