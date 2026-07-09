import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

// Next.js 16: „middleware" wurde zu „proxy" umbenannt (nodejs-Runtime, kein edge).
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (list) => {
          list.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  const { data: { user } } = await supabase.auth.getUser();
  const isLogin = request.nextUrl.pathname === "/admin/login";

  // Server Actions (z. B. Formular-Submits) laufen als POST auf dieselbe Route.
  // Ein Redirect hier würde statt der erwarteten Flight-Response ein Redirect
  // liefern -> Client wirft "An unexpected response was received from the server."
  // Darum bei Server-Action-Requests nie redirecten; RLS + Session-Cookies schützen weiterhin.
  const isServerAction = request.headers.has("next-action");
  if (isServerAction) return response;

  if (!user && !isLogin) return NextResponse.redirect(new URL("/admin/login", request.url));
  if (user && isLogin) return NextResponse.redirect(new URL("/admin", request.url));
  return response;
}

export const config = { matcher: ["/admin/:path*"] };
