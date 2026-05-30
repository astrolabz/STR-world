import { NextRequest, NextResponse } from "next/server";

import { buildListingAvailabilityCalendar } from "@/src/lib/availability/ical";

export async function GET(request: NextRequest) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "DATABASE_URL is required" }, { status: 503 });
  }

  const platform = request.nextUrl.searchParams.get("platform");
  const sourceListingId = request.nextUrl.searchParams.get("sourceListingId");

  if (!platform || !sourceListingId) {
    return NextResponse.json({ error: "platform and sourceListingId are required" }, { status: 400 });
  }

  const calendar = await buildListingAvailabilityCalendar(platform, sourceListingId);

  return new NextResponse(calendar.content, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `inline; filename="${encodeURIComponent(calendar.calendarName)}.ics"`,
    },
  });
}
