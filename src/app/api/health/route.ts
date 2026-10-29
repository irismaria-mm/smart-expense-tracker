import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Lightweight liveness check for Railway; does not touch the database.
export function GET() {
  return NextResponse.json({ status: "ok" });
}
