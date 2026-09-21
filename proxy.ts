import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { renderCurl } from "@/app/lib/curl";

export function proxy(request: NextRequest) {
  const ua = request.headers.get("user-agent") ?? "";

  if (/^curl\//i.test(ua)) {
    const slug = request.nextUrl.pathname.replace(/^\/|\/$/g, "");
    return new NextResponse(renderCurl(slug), {
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }

  return NextResponse.next();
}

export const config = {
  // Everything except _next internals and real files (robots.txt, pdfs, images...).
  matcher: "/((?!_next|.*\\..*).*)",
};
