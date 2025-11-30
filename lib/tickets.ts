import { createClient } from "redis";

export const TOTAL_SEATS = 35;
const SOLD_COUNT_KEY = "tickets:soldCount";

async function getRedisClient() {
  const client = createClient({
    url: process.env.REDIS_URL,
  });
  await client.connect();
  return client;
}

export async function getAvailableSeats(): Promise<number> {
  const client = await getRedisClient();
  try {
    const soldCount = await client.get(SOLD_COUNT_KEY);
    const sold = soldCount ? parseInt(soldCount, 10) : 0;
    return Math.max(0, TOTAL_SEATS - sold);
  } finally {
    await client.disconnect();
  }
}

export async function reserveTickets(quantity: number): Promise<boolean> {
  const client = await getRedisClient();
  try {
    const soldCount = await client.get(SOLD_COUNT_KEY);
    const sold = soldCount ? parseInt(soldCount, 10) : 0;
    const available = TOTAL_SEATS - sold;

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
