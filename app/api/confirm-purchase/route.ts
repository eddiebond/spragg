import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";

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

const stripe = new Stripe(stripeSecretKey);

export async function POST(req: NextRequest) {
  try {
    const { paymentIntentId } = await req.json();

    if (!paymentIntentId) {
      return NextResponse.json(
        { error: "Missing paymentIntentId" },
        { status: 400 }
      );
    }

    // Verify payment was successful with Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== "succeeded") {
      return NextResponse.json(
        { error: "Payment not successful" },
        { status: 400 }
      );
    }

    // The webhook will handle database creation, email, and sheet update
    // This endpoint just confirms the payment succeeded for the client
    return NextResponse.json({
      success: true,
      message: "Payment successful",
    });
  } catch (error) {
    console.error("Error confirming purchase:", error);
    return NextResponse.json(
      { error: "Failed to confirm purchase" },
      { status: 500 }
    );
  }
}
