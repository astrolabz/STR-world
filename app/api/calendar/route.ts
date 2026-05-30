import { NextRequest, NextResponse } from "next/server";

import { buildListingAvailabilityCalendar } from "@/src/lib/availability/calendar";

export const dynamic = "force-static";

export async function GET(request: NextRequest) {
  if (!process.env.DATABASE_URL) {
    return new NextResponse("BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//STR World//EN\r\nEND:VCALENDAR\r\n", {
      status: 200,
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": 'inline; filename="str-world-availability.ics"',
      },
    });
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
