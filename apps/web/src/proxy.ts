import { NextResponse, type NextRequest } from "next/server";
export function proxy(request: NextRequest) {
  const headers = new Headers(request.headers);
  headers.set(
    "x-242places-locale",
    request.nextUrl.pathname.split("/")[1] === "fr" ? "fr" : "en",
  );
  return NextResponse.next({ request: { headers } });
}
export const config = {
  matcher: ["/((?!_next|v1|docs|health|images|favicon|openapi).*)"],
};
