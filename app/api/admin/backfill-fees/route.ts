import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { sendToSheet } from "@/lib/sendtosheet";

const isDev = process.env.NODE_ENV === "development";

const stripeSecretKey = isDev
  ? process.env.STRIPE_SECRET_TEST_KEY
  : process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  throw new Error("Missing Stripe secret key");
}

const stripe = new Stripe(stripeSecretKey);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

async function runBackfill() {
  // Fetch all records missing a fee
  const { data: records, error: fetchError } = await supabase
    .from("customer_event")
    .select("id, stripe_payment_intent_id")
    .or("stripe_fee_amount.is.null,stripe_fee_amount.eq.0")
    .not("stripe_payment_intent_id", "is", null);

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  if (!records || records.length === 0) {
    return NextResponse.json({
      message: "No records need updating",
      updated: 0,
    });
  }

  const results: {
    id: number;
    paymentIntentId: string;
    fee: number | null;
    error?: string;
  }[] = [];

  for (const record of records) {
    try {
      // Retrieve the payment intent and check it succeeded
      const pi = await stripe.paymentIntents.retrieve(
        record.stripe_payment_intent_id,
        { expand: ["latest_charge.balance_transaction"] },
      );

      if (pi.status !== "succeeded") {
        results.push({
          id: record.id,
          paymentIntentId: record.stripe_payment_intent_id,
          fee: null,
          error: `Payment intent status: ${pi.status} (skipped)`,
        });
        continue;
      }

      const charge = pi.latest_charge as Stripe.Charge | null;

      if (!charge?.balance_transaction) {
        results.push({
          id: record.id,
          paymentIntentId: record.stripe_payment_intent_id,
          fee: null,
          error: "No balance_transaction on charge",
        });
        continue;
      }

      const bt = charge.balance_transaction as Stripe.BalanceTransaction;
      const fee = bt.fee;

      const { error: updateError } = await supabase
        .from("customer_event")
        .update({ stripe_fee_amount: fee })
        .eq("id", record.id);

      if (updateError) {
        results.push({
          id: record.id,
          paymentIntentId: record.stripe_payment_intent_id,
          fee,
          error: updateError.message,
        });
      } else {
        results.push({
          id: record.id,
          paymentIntentId: record.stripe_payment_intent_id,
          fee,
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      results.push({
        id: record.id,
        paymentIntentId: record.stripe_payment_intent_id,
        fee: null,
        error: message,
      });
    }
  }

  const updated = results.filter((r) => !r.error).length;

  // Refresh the Google Sheet if anything was updated
  if (updated > 0) {
    try {
      const spreadsheetId = process.env.GOOGLE_SHEET_ID;
      if (spreadsheetId) {
        await sendToSheet(spreadsheetId);
      }
    } catch (sheetError) {
      console.error("Failed to update Google Sheet:", sheetError);
    }
  }

  return NextResponse.json({ updated, total: records.length, results });
}

export async function GET() {
  return runBackfill();
}

export async function POST() {
  return runBackfill();
}
