import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

// Next.js 16: „middleware" wurde zu „proxy" umbenannt (nodejs-Runtime, kein edge).
/**
 * Formular-Post ohne JavaScript auf `/kontakt`: sofort beantworten, ohne die Seite zu rendern.
 *
 * Seit Oktober 2026 posten Bots das Kontaktformular direkt (ohne JavaScript, oft mit
 * zwischengespeichertem HTML eines älteren Deploys). Ein Mensch kommt auf diesem Weg ohnehin
 * nicht durch – BotID (`checkBotId` in lib/actions/submit-inquiry.ts) verlangt den Nachweis,
 * den nur das Skript im Browser anhängt. Bis zum 26.10.2026 kostete jeder solche Post bis zu
 * 300 s Rechenzeit (Render-Schleife) oder einen 500er („Failed to find Server Action"). Der
 * Browser mit JavaScript schickt den Kopf `next-action` und wird vom `matcher` unten nicht erfasst.
 */
function formularOhneJavaScript() {
  const html =
    '<!doctype html><html lang="de"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
    "<title>Anfrage nicht übermittelt</title>" +
    '<body style="font-family:system-ui,sans-serif;max-width:36rem;margin:3rem auto;padding:0 1rem;line-height:1.5">' +
    "<h1>Anfrage nicht übermittelt</h1>" +
    "<p>Das Kontaktformular braucht JavaScript. Bitte aktiviere es und versuche es noch einmal – " +
    'oder schreib direkt eine E-Mail, die Adresse steht im <a href="/impressum">Impressum</a>.</p>' +
    '<p><a href="/kontakt">Zurück zum Kontaktformular</a></p></body></html>';
  return new NextResponse(html, {
    status: 400,
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" },
  });
}

export async function proxy(request: NextRequest) {
  if (request.nextUrl.pathname === "/kontakt") {
    // Der matcher lässt hier nur Multipart-Posts ohne `next-action` durch; die Prüfung steht
    // trotzdem, damit eine Änderung am matcher nicht still jede Anfrage abweist.
    if (request.method === "POST" && !request.headers.has("next-action")) return formularOhneJavaScript();
    return NextResponse.next();
  }

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

export const config = {
  matcher: [
    "/admin/:path*",
    // Nur Formular-Posts ohne JavaScript: Seitenaufrufe (ohne Multipart-Kopf) und Server
    // Actions aus dem Browser (mit `next-action`) erreichen den Proxy gar nicht. So bleibt
    // `/kontakt` statisch ausgeliefert und kostet keinen Proxy-Aufruf.
    {
      source: "/kontakt",
      has: [{ type: "header", key: "content-type", value: "multipart/form-data.*" }],
      missing: [{ type: "header", key: "next-action" }],
    },
  ],
};
