import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const DEFAULT_EVENT_ID = 2;

export interface ShowData {
  id: number;
  title: string | null;
  description: string | null;
  body: string | null;
  venue: string | null;
  startTime: string | null;
  doorsOpen: string | null;
  capacity: number | null;
}

export async function getShowData(): Promise<ShowData | null> {
  const { data, error } = await supabase
    .from("event")
    .select("*")
    .eq("id", DEFAULT_EVENT_ID)
    .single();

  if (error || !data) {
    console.error("Error fetching show data:", error);
    return null;
  }

  return {
    id: data.id,
    title: data.title,
    description: data.description,
    body: data.body,
    venue: data.venue,
    startTime: data.start_time,
    doorsOpen: data.doors_open,
    capacity: data.capacity,
  };
}
