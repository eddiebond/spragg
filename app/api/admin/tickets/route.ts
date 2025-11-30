import { NextRequest, NextResponse } from "next/server";
import { createClient } from "redis";

const TOTAL_TICKETS_KEY = "tickets:total";
const SOLD_COUNT_KEY = "tickets:soldCount";

async function getRedisClient() {
  const client = createClient({
    url: process.env.REDIS_URL,
  });
  await client.connect();
  return client;
}

// POST /api/admin/tickets - Initialize or update ticket settings
export async function POST(request: NextRequest) {
  try {
    const { totalTickets, soldCount } = await request.json();

    const client = await getRedisClient();
    try {
      if (totalTickets !== undefined) {
        await client.set(TOTAL_TICKETS_KEY, totalTickets.toString());
      }
      if (soldCount !== undefined) {
        await client.set(SOLD_COUNT_KEY, soldCount.toString());
      }

      const total = await client.get(TOTAL_TICKETS_KEY);
      const sold = await client.get(SOLD_COUNT_KEY);

      return NextResponse.json({
        success: true,
        total: total ? parseInt(total, 10) : null,
        sold: sold ? parseInt(sold, 10) : null,
      });
    } finally {
      await client.disconnect();
    }
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
    const client = await getRedisClient();
    try {
      const total = await client.get(TOTAL_TICKETS_KEY);
      const sold = await client.get(SOLD_COUNT_KEY);

      return NextResponse.json({
        total: total ? parseInt(total, 10) : null,
        sold: sold ? parseInt(sold, 10) : null,
        initialized: total !== null,
      });
    } finally {
      await client.disconnect();
    }
  } catch (error) {
    console.error("Admin error:", error);
    return NextResponse.json(
      { error: "Failed to get tickets" },
      { status: 500 }
    );
  }
}
