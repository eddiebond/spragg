import { NextResponse } from "next/server";
import { getAvailableSeats, TOTAL_SEATS } from "@/lib/tickets";

export async function GET() {
  try {
    const available = await getAvailableSeats();
    return NextResponse.json({ available, total: TOTAL_SEATS });
  } catch (error) {
    console.error("Error getting availability:", error);
    return NextResponse.json(
      { error: "Failed to get availability" },
      { status: 500 }
    );
  }
}
