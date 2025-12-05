import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import {
  uniqueNamesGenerator,
  adjectives,
  animals,
} from "unique-names-generator";
import { sendTicketEmail } from "@/lib/send-email";

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
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const DEFAULT_EVENT_ID = 2;

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

    const metadata = paymentIntent.metadata;

    if (!metadata?.email || !metadata?.name) {
      return NextResponse.json(
        { error: "Missing required metadata" },
        { status: 400 }
      );
    }

    const { name, email, quantity } = metadata;
    const eventId = parseInt(metadata.event_id || String(DEFAULT_EVENT_ID), 10);
    const ticketQuantity = parseInt(quantity, 10);

    // Check if we've already processed this payment (idempotency)
    const { data: existingTicket } = await supabase
      .from("customer_event")
      .select("id")
      .eq("stripe_payment_intent_id", paymentIntentId)
      .maybeSingle();

    if (existingTicket) {
      // Already processed - return success without re-creating
      return NextResponse.json({
        success: true,
        message: "Already processed",
      });
    }

    // Check/create customer
    const { data: existingCustomer, error: fetchError } = await supabase
      .from("customer")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (fetchError) {
      console.error("Error fetching customer:", fetchError);
      throw fetchError;
    }

    let customerId: number;

    if (existingCustomer) {
      // Update existing customer name only, preserve newsletter preference
      const { error: updateError } = await supabase
        .from("customer")
        .update({
          name,
        })
        .eq("id", existingCustomer.id);

      if (updateError) {
        console.error("Error updating customer:", updateError);
        throw updateError;
      }
      customerId = existingCustomer.id;
    } else {
      // Create new customer with newsletter set to false
      const { data: newCustomer, error: insertError } = await supabase
        .from("customer")
        .insert({
          name,
          email,
          newsletter: false,
        })
        .select("id")
        .single();

      if (insertError || !newCustomer) {
        console.error("Error creating customer:", insertError);
        throw insertError;
      }
      customerId = newCustomer.id;
    }

    // Generate ticket code
    const ticketCode = uniqueNamesGenerator({
      dictionaries: [adjectives, animals],
      separator: "-",
      length: 2,
    });

    // Create customer_event record
    const { error: eventError } = await supabase.from("customer_event").insert({
      customer_id: customerId,
      event_id: eventId,
      tickets_sold: ticketQuantity,
      price_per_ticket: 350, // £3.50 in pence
      tickets_code: ticketCode,
      stripe_payment_intent_id: paymentIntentId,
    });

    if (eventError) {
      console.error("Error creating customer_event:", eventError);
      throw eventError;
    }

    // Send confirmation email
    try {
      await sendTicketEmail(name, email, ticketCode, ticketQuantity);
      console.log(`Ticket email sent to ${email}`);
    } catch (emailError) {
      console.error("Failed to send email:", emailError);
      // Don't fail the whole request if email fails
    }

    return NextResponse.json({
      success: true,
      ticketCode,
    });
  } catch (error) {
    console.error("Error confirming purchase:", error);
    return NextResponse.json(
      { error: "Failed to confirm purchase" },
      { status: 500 }
    );
  }
}
