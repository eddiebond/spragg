import { createClient } from "redis";

async function initializeTickets() {
  const client = createClient({
    url: process.env.REDIS_URL,
  });

  await client.connect();

  // Set initial sold count to 0
  await client.set("tickets:soldCount", "0");

  const value = await client.get("tickets:soldCount");
  console.log("tickets:soldCount =", value);

  await client.disconnect();
  console.log("Done! Check Redis Insight now.");
}

initializeTickets();
