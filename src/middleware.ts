import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const locales = ["id", "en"];
const defaultLocale = "id";

function getLocale(request: NextRequest) {
  const acceptLanguage = request.headers.get("accept-language");
  if (acceptLanguage && acceptLanguage.toLowerCase().includes("en")) {
    return "en";
  }
  return "id";
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Exclude static files and api
  if (
    pathname.startsWith('/_next') ||
    pathname.includes('/api/') ||
    pathname.includes('.')
  ) {
    return;
  }

  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (pathnameHasLocale) return;

  const locale = getLocale(request);
  request.nextUrl.pathname = `/${locale}${pathname}`;
  return NextResponse.redirect(request.nextUrl);
}

export const config = {
  matcher: ['/((?!_next|favicon.ico|api|.*\\.).*)'],
};
