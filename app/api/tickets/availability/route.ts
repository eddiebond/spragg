import { NextResponse } from "next/server";
import { getAvailableSeats, getTotalTickets, getSoldCount } from "@/lib/tickets";

export async function GET() {
  try {
    const [available, total, sold] = await Promise.all([
      getAvailableSeats(),
      getTotalTickets(),
      getSoldCount(),
    ]);
    return NextResponse.json({ available, total, sold });
  } catch (error) {
    console.error("Error getting availability:", error);
    return NextResponse.json(
      { error: "Failed to get availability" },
      { status: 500 }
    );
  }
}
