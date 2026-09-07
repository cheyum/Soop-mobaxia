// app/api/live/[id]/route.ts

import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  const url = new URL(request.url);

  const parts = url.pathname
    .split("/")
    .filter(Boolean);

  const streamerId =
    parts[parts.length - 1] || "";

  return NextResponse.json({
    ok: true,
    streamerId,
    route: "/api/live/[id]",
    message: "API ROUTE WORKING",
  });
}