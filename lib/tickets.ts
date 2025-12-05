import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const DEFAULT_EVENT_ID = 2;

// Helper to get the event with id 2
async function getEvent() {
  const { data, error } = await supabase
    .from("event")
    .select("id, capacity")
    .eq("id", DEFAULT_EVENT_ID)
    .single();

  if (error) {
    console.error("Error fetching event:", error);
    return null;
  }
  return data;
}

// Get total tickets sold from customer_event table
async function getTicketsSoldForEvent(eventId: number): Promise<number> {
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

export async function getTotalTickets(): Promise<number | null> {
  const event = await getEvent();
  return event?.capacity ?? null;
}

export async function getAvailableSeats(): Promise<number | null> {
  const event = await getEvent();
  if (!event || event.capacity === null) return null;

  const sold = await getTicketsSoldForEvent(event.id);
  return Math.max(0, event.capacity - sold);
}

export async function getSoldCount(): Promise<number> {
  const event = await getEvent();
  if (!event) return 0;
  return getTicketsSoldForEvent(event.id);
}

// Note: reserveTickets is no longer needed here - ticket reservation
// should happen by inserting into customer_event table after payment
export async function reserveTickets(quantity: number): Promise<boolean> {
  const available = await getAvailableSeats();
  if (available === null || quantity > available) {
    return false;
  }
  // Actual reservation happens via customer_event insert after payment
  return true;
}
