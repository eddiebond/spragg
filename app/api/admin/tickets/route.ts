import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const DEFAULT_EVENT_ID = 2;

// Helper to get sold count from customer_event
async function getSoldCountForEvent(eventId: number): Promise<number> {
  const { data, error } = await supabase
    .from("customer_event")
    .select("tickets_sold")
    .eq("event_id", eventId);

  if (error) {
    console.error("Error fetching sold tickets:", error);
    return 0;
  }

  return data?.reduce((sum, row) => sum + (row.tickets_sold ?? 0), 0) ?? 0;
}

// POST /api/admin/tickets - Update ticket capacity
export async function POST(request: NextRequest) {
  try {
    const { capacity } = await request.json();

    const updateData: Record<string, unknown> = {};
    if (capacity !== undefined) updateData.capacity = capacity;

    // Get event with id 2
    const { data: existingEvent } = await supabase
      .from("event")
      .select("id")
      .eq("id", DEFAULT_EVENT_ID)
      .single();

    if (!existingEvent) {
      return NextResponse.json(
        { error: "No event found. Create an event first." },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("event")
      .update(updateData)
      .eq("id", existingEvent.id)
      .select("id, capacity")
      .single();

    if (error) throw error;

    const sold = await getSoldCountForEvent(data.id);

    return NextResponse.json({
      success: true,
      capacity: data.capacity,
      sold,
    });
  } catch (error) {
    console.error("Admin error:", error);
    return NextResponse.json(
      { error: "Failed to update tickets" },
      { status: 500 }
    );
  }
}

// GET /api/admin/tickets - Get current settings
export async function GET() {
  try {
    const { data, error } = await supabase
      .from("event")
      .select("id, capacity")
      .eq("id", DEFAULT_EVENT_ID)
      .single();

    if (error && error.code !== "PGRST116") {
      throw error;
    }

    if (!data) {
      return NextResponse.json({
        capacity: null,
        sold: 0,
        initialized: false,
      });
    }

    const sold = await getSoldCountForEvent(data.id);

    return NextResponse.json({
      capacity: data.capacity,
      sold,
      initialized: data.capacity !== null,
    });
  } catch (error) {
    console.error("Admin error:", error);
    return NextResponse.json(
      { error: "Failed to get tickets" },
      { status: 500 }
    );
  }
}
