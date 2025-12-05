import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { sendToSheet } from "@/lib/sendtosheet";

const isDev = process.env.NODE_ENV === "development";

const stripeSecretKey = isDev
  ? process.env.STRIPE_SECRET_TEST_KEY
  : process.env.STRIPE_SECRET_KEY;

const webhookSecret = isDev
  ? process.env.STRIPE_WEBHOOK_SECRET_TEST
  : process.env.STRIPE_WEBHOOK_SECRET;

if (!stripeSecretKey) {
  throw new Error(
    isDev
      ? "Missing STRIPE_SECRET_TEST_KEY for development"
      : "Missing STRIPE_SECRET_KEY for production"
  );
}

const stripe = new Stripe(stripeSecretKey);

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature || !webhookSecret) {
    return NextResponse.json(
      { error: "Missing signature or webhook secret" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Handle the event
  if (event.type === "payment_intent.succeeded") {
    console.log("Payment succeeded, updating Google Sheet...");

    try {
      const spreadsheetId = process.env.GOOGLE_SHEET_ID;
      if (spreadsheetId) {
        await sendToSheet(spreadsheetId);
        console.log("Google Sheet updated successfully");
      }
    } catch (sheetError) {
      console.error("Failed to update Google Sheet:", sheetError);
      // Still return 200 so Stripe doesn't retry
    }
  }

  return NextResponse.json({ received: true });
}
