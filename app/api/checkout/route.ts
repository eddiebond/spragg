import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getAvailableSeats, reserveTickets } from "@/lib/tickets";

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

export async function POST(request: NextRequest) {
  try {
    const { quantity } = await request.json();

    // Check availability
    const available = (await getAvailableSeats()) ?? 0;
    if (quantity > available) {
      return NextResponse.json(
        { error: `Only ${available} tickets available` },
        { status: 400 }
      );
    }

    // Reserve tickets
    const reserved = await reserveTickets(quantity);
    if (!reserved) {
      return NextResponse.json(
        { error: "Could not reserve tickets" },
        { status: 400 }
      );
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "gbp",
            product_data: {
              name: "Event Ticket",
              description: "Midlife High Five Deep Dive",
            },
            unit_amount: 350, // £3.50 in pence
          },
          quantity: quantity,
        },
      ],
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/success`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/`,
      metadata: {
        quantity: quantity.toString(),
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
