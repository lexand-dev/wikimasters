import { getSessionCookie } from "better-auth/cookies";
import { type NextRequest, NextResponse } from "next/server";

const publicAuthRoutes = ["/sign-in", "/sign-up"];
const protectedPrefixes = ["/wiki"];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const hasSession = Boolean(getSessionCookie(req));

  const isProtected = protectedPrefixes.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
  const isAuthPage = publicAuthRoutes.includes(pathname);

  // Optimistic: no cookie on protected route → send to sign-in
  if (isProtected && !hasSession) {
    return NextResponse.redirect(new URL("/sign-in", req.nextUrl));
  }

  // Logged-in users bouncing off auth pages → /wiki
  if (isAuthPage && hasSession) {
    return NextResponse.redirect(new URL("/wiki", req.nextUrl));
  }

  return NextResponse.next();
}

// Skip Better Auth endpoints, static assets, Next internals, images
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$).*)"],
};
