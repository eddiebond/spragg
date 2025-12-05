import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getAvailableSeats } from "@/lib/tickets";

const isDev = process.env.NODE_ENV === "development";
const stripeSecretKey = isDev
  ? process.env.STRIPE_SECRET_TEST_KEY
  : process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  throw new Error(
    isDev
      ? "Missing STRIPE_SECRET_TEST_KEY for development"
      : "Missing STRIPE_SECRET_KEY for production"
  );
}

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2025-11-17.clover",
});

const DEFAULT_EVENT_ID = 2;

export async function POST(request: NextRequest) {
  try {
    const { quantity, name, email } = await request.json();

    if (!name || !email) {
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 }
      );
    }

    // Check availability
    const available = await getAvailableSeats();
    if (available === null) {
      return NextResponse.json(
        { error: "Tickets not initialized" },
        { status: 400 }
      );
    }
    if (quantity > available) {
      return NextResponse.json(
        { error: `Only ${available} tickets available` },
        { status: 400 }
      );
    }

    const amount = quantity * 350; // £3.50 per ticket in pence

    // Create a PaymentIntent with customer metadata
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "gbp",
      metadata: {
        quantity: quantity.toString(),
        name,
        email,
        event_id: DEFAULT_EVENT_ID.toString(),
      },
      receipt_email: email,
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    console.error("Payment intent error:", error);
    return NextResponse.json(
      { error: "Failed to create payment intent" },
      { status: 500 }
    );
  }
}
