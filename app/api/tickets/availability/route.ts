import { NextResponse } from "next/server";
import {
  getAvailableSeats,
  getTotalTickets,
  getSoldCount,
} from "@/lib/tickets";

export async function GET() {
  try {
    const [available, total, sold] = await Promise.all([
      getAvailableSeats(),
      getTotalTickets(),
      getSoldCount(),
    ]);

    // Not initialized yet
    if (total === null) {
      return NextResponse.json({ 
        available: null, 
        total: null, 
        sold: 0,
        initialized: false 
      });
    }

    return NextResponse.json({ available, total, sold, initialized: true });
  } catch (error) {
    console.error("Error getting availability:", error);
    return NextResponse.json(
      { error: "Failed to get availability" },
      { status: 500 }
    );
  }
}
