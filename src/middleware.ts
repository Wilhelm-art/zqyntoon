/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // We're removing strict i18n URL prefixes to keep urls clean. 
  // e.g. zynqtoon.vercel.app instead of zynqtoon.vercel.app/id
  // We will handle localization strictly through headers/cookies/client-state later if needed.
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next|favicon.ico|api|.*\.).*)'],
};
