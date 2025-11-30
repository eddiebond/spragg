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

export async function getTotalTickets(): Promise<number | null> {
  const client = await getRedisClient();
  try {
    const total = await client.get(TOTAL_TICKETS_KEY);
    return total ? parseInt(total, 10) : null;
  } finally {
    await client.disconnect();
  }
}

export async function getAvailableSeats(): Promise<number | null> {
  const client = await getRedisClient();
  try {
    const total = await client.get(TOTAL_TICKETS_KEY);
    const soldCount = await client.get(SOLD_COUNT_KEY);
    
    if (total === null) return null; // Not initialized
    
    const totalTickets = parseInt(total, 10);
    const sold = soldCount ? parseInt(soldCount, 10) : 0;
    return Math.max(0, totalTickets - sold);
  } finally {
    await client.disconnect();
  }
}

export async function reserveTickets(quantity: number): Promise<boolean> {
  const client = await getRedisClient();
  try {
    const total = await client.get(TOTAL_TICKETS_KEY);
    const soldCount = await client.get(SOLD_COUNT_KEY);
    
    if (total === null) return false; // Not initialized
    
    const totalTickets = parseInt(total, 10);
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
    const soldCount = await client.get(SOLD_COUNT_KEY);
    return soldCount ? parseInt(soldCount, 10) : 0;
  } finally {
    await client.disconnect();
  }
}
