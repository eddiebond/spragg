import { createClient } from "redis";

const TOTAL_TICKETS_KEY = "tickets:total";
const SOLD_COUNT_KEY = "tickets:soldCount";
const DEFAULT_TOTAL_TICKETS = 35;

async function getRedisClient() {
  const client = createClient({
    url: process.env.REDIS_URL,
  });
  await client.connect();
  return client;
}

async function ensureInitialized(client: ReturnType<typeof createClient>) {
  const total = await client.get(TOTAL_TICKETS_KEY);
  if (total === null) {
    await client.set(TOTAL_TICKETS_KEY, DEFAULT_TOTAL_TICKETS.toString());
    await client.set(SOLD_COUNT_KEY, "0");
  }
}

export async function getTotalTickets(): Promise<number> {
  const client = await getRedisClient();
  try {
    await ensureInitialized(client);
    const total = await client.get(TOTAL_TICKETS_KEY);
    return total ? parseInt(total, 10) : DEFAULT_TOTAL_TICKETS;
  } finally {
    await client.disconnect();
  }
}

export async function getAvailableSeats(): Promise<number> {
  const client = await getRedisClient();
  try {
    await ensureInitialized(client);
    const total = await client.get(TOTAL_TICKETS_KEY);
    const soldCount = await client.get(SOLD_COUNT_KEY);
    const totalTickets = total ? parseInt(total, 10) : DEFAULT_TOTAL_TICKETS;
    const sold = soldCount ? parseInt(soldCount, 10) : 0;
    return Math.max(0, totalTickets - sold);
  } finally {
    await client.disconnect();
  }
}

export async function reserveTickets(quantity: number): Promise<boolean> {
  const client = await getRedisClient();
  try {
    await ensureInitialized(client);
    const total = await client.get(TOTAL_TICKETS_KEY);
    const soldCount = await client.get(SOLD_COUNT_KEY);
    const totalTickets = total ? parseInt(total, 10) : DEFAULT_TOTAL_TICKETS;
    const sold = soldCount ? parseInt(soldCount, 10) : 0;
    const available = totalTickets - sold;

    if (quantity > available) {
      return false;
    }

    await client.set(SOLD_COUNT_KEY, (sold + quantity).toString());
    return true;
  } finally {
    await client.disconnect();
  }
}

export async function getSoldCount(): Promise<number> {
  const client = await getRedisClient();
  try {
    await ensureInitialized(client);
    const soldCount = await client.get(SOLD_COUNT_KEY);
    return soldCount ? parseInt(soldCount, 10) : 0;
  } finally {
    await client.disconnect();
  }
}
