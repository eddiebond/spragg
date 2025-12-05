import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// HARDCODED DEFAULT VALUES - edit these!
const DEFAULTS = {
  title: "Midlife High Five Deep Dive",
  description: "An unforgettable evening of connection and discovery",
  body: "",
  venue: "The Grand Hall, Austin TX",
  start_time: "2025-01-23T19:00:00",
  doors_open: "2025-01-23T18:30:00",
  capacity: 35,
};

// GET /api/admin/seed - Seeds Supabase with default values
export async function GET() {
  // Only allow in development
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json(
      { error: "Only available in development mode" },
      { status: 403 }
    );
  }

  try {
    // Check if event already exists
    const { data: existingEvent } = await supabase
      .from("event")
      .select("id")
      .limit(1)
      .single();

    let result;
    if (existingEvent) {
      // Update existing event
      const { data, error } = await supabase
        .from("event")
        .update(DEFAULTS)
        .eq("id", existingEvent.id)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      // Insert new event
      const { data, error } = await supabase
        .from("event")
        .insert(DEFAULTS)
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    return NextResponse.json({
      success: true,
      message: "Seeded Supabase with default values",
      data: result,
    });
  } catch (error) {
    console.error("Seed error:", error);
    return NextResponse.json({ error: "Failed to seed data" }, { status: 500 });
  }
}
