import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import {
  uniqueNamesGenerator,
  adjectives,
  animals,
} from "unique-names-generator";
import { sendToSheet } from "@/lib/sendtosheet";
import { sendTicketEmail } from "@/lib/send-email";

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
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const DEFAULT_EVENT_ID = 2;

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
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const paymentIntentId = paymentIntent.id;
    const metadata = paymentIntent.metadata;

    console.log("Payment succeeded:", paymentIntentId);

    if (!metadata?.email || !metadata?.name || !metadata?.quantity) {
      console.error("Missing required metadata");
      return NextResponse.json({ received: true });
    }

    const { name, email, quantity } = metadata;
    const eventId = parseInt(metadata.event_id || String(DEFAULT_EVENT_ID), 10);
    const ticketQuantity = parseInt(quantity, 10);

    try {
      // Check if we've already processed this payment (idempotency)
      const { data: existingTicket } = await supabase
        .from("customer_event")
        .select("id")
        .eq("stripe_payment_intent_id", paymentIntentId)
        .maybeSingle();

      if (existingTicket) {
        console.log("Payment already processed:", paymentIntentId);
        return NextResponse.json({ received: true });
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
      const { error: eventError } = await supabase
        .from("customer_event")
        .insert({
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
      }

      // Update Google Sheet
      try {
        const spreadsheetId = process.env.GOOGLE_SHEET_ID;
        if (spreadsheetId) {
          await sendToSheet(spreadsheetId);
          console.log("Google Sheet updated successfully");
        }
      } catch (sheetError) {
        console.error("Failed to update Google Sheet:", sheetError);
      }
    } catch (error) {
      console.error("Error processing payment:", error);
      // Still return 200 so Stripe doesn't retry
    }
  }

  return NextResponse.json({ received: true });
}
