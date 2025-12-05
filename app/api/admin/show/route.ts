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

// POST /api/admin/show - Initialize or update all show data
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    // Map incoming data to database column names
    const updateData: Record<string, unknown> = {};

    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined)
      updateData.description = data.description;
    if (data.body !== undefined) updateData.body = data.body;
    if (data.venue !== undefined) updateData.venue = data.venue;
    if (data.startTime !== undefined) updateData.start_time = data.startTime;
    if (data.doorsOpen !== undefined) updateData.doors_open = data.doorsOpen;
    if (data.capacity !== undefined) updateData.capacity = data.capacity;

    // Get event with id 2
    const { data: existingEvent } = await supabase
      .from("event")
      .select("id")
      .eq("id", DEFAULT_EVENT_ID)
      .single();

    let result;
    if (existingEvent) {
      // Update existing event
      const { data: updated, error } = await supabase
        .from("event")
        .update(updateData)
        .eq("id", existingEvent.id)
        .select()
        .single();

      if (error) throw error;
      result = updated;
    } else {
      // Insert new event
      const { data: inserted, error } = await supabase
        .from("event")
        .insert(updateData)
        .select()
        .single();

      if (error) throw error;
      result = inserted;
    }

    const soldCount = await getSoldCountForEvent(result.id);

    return NextResponse.json({
      success: true,
      id: result.id,
      title: result.title,
      description: result.description,
      body: result.body,
      venue: result.venue,
      startTime: result.start_time,
      doorsOpen: result.doors_open,
      capacity: result.capacity,
      soldCount,
      initialized: result.title !== null && result.capacity !== null,
    });
  } catch (error) {
    console.error("Admin error:", error);
    return NextResponse.json(
      { error: "Failed to update show data" },
      { status: 500 }
    );
  }
}

// GET /api/admin/show - Get all show data
export async function GET() {
  try {
    const { data, error } = await supabase
      .from("event")
      .select("*")
      .eq("id", DEFAULT_EVENT_ID)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 = no rows returned
      throw error;
    }

    if (!data) {
      return NextResponse.json({
        id: null,
        title: null,
        description: null,
        body: null,
        venue: null,
        startTime: null,
        doorsOpen: null,
        capacity: null,
        soldCount: 0,
        initialized: false,
      });
    }

    const soldCount = await getSoldCountForEvent(data.id);

    return NextResponse.json({
      id: data.id,
      title: data.title,
      description: data.description,
      body: data.body,
      venue: data.venue,
      startTime: data.start_time,
      doorsOpen: data.doors_open,
      capacity: data.capacity,
      soldCount,
      initialized: data.title !== null && data.capacity !== null,
    });
  } catch (error) {
    console.error("Admin error:", error);
    return NextResponse.json(
      { error: "Failed to get show data" },
      { status: 500 }
    );
  }
}
