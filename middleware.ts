import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  // Firebase auth is client-side; route protection handled in components
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icons|manifest.json|sw.js).*)"],
};
