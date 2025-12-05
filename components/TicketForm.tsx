"use client";

import { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";

const isDev = process.env.NODE_ENV === "development";

const stripePublishableKey = isDev
  ? process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_TEST_KEY
  : process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

if (!stripePublishableKey) {
  console.error(
    isDev
      ? "Missing NEXT_PUBLIC_STRIPE_PUBLISHABLE_TEST_KEY for development"
      : "Missing NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY for production"
  );
}

const stripePromise = stripePublishableKey
  ? loadStripe(stripePublishableKey)
  : null;

function CheckoutForm({
  quantity,
  ticketPrice,
  onSuccess,
  onCancel,
  paymentIntentId,
}: {
  quantity: number;
  ticketPrice: number;
  onSuccess: () => void;
  onCancel: () => void;
  paymentIntentId: string;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setError(null);

    const { error: submitError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/success`,
      },
      redirect: "if_required",
    });

    if (submitError) {
      setError(submitError.message || "Payment failed");
      setLoading(false);
    } else {
      // Payment succeeded - now confirm purchase and create ticket
      try {
        const res = await fetch("/api/confirm-purchase", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paymentIntentId }),
        });
        const data = await res.json();
        if (!res.ok) {
          console.error("Confirm purchase error:", data.error);
        }
      } catch (err) {
        console.error("Failed to confirm purchase:", err);
      }
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4">
      <PaymentElement />
      {error && <p className="text-red-600 mt-2">{error}</p>}
      <div className="flex gap-2 mt-4">
        <button
          type="submit"
          disabled={!stripe || loading}
          className="flex-1 px-6 py-3"
        >
          {loading
            ? "Processing..."
            : `Pay £${(ticketPrice * quantity).toFixed(2)}`}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="px-4 py-3 bg-gray-200 text-black hover:bg-gray-300"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

export default function TicketForm() {
  const [quantity, setQuantity] = useState(1);
  const [available, setAvailable] = useState<number | null>(null);
  const [initialized, setInitialized] = useState<boolean | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [checkoutStep, setCheckoutStep] = useState<
    "select" | "details" | "pay" | "success"
  >("select");
  const [loadingIntent, setLoadingIntent] = useState(false);

  // Customer info
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const ticketPrice = 3.5;

  useEffect(() => {
    async function fetchAvailability() {
      try {
        const res = await fetch("/api/tickets/availability");
        const data = await res.json();
        setAvailable(data.available);
        setInitialized(data.initialized);
      } catch (error) {
        console.error("Failed to fetch availability:", error);
      }
    }
    fetchAvailability();
  }, []);

  useEffect(() => {
    if (available !== null && quantity > available) {
      setQuantity(Math.max(1, available));
    }
  }, [available, quantity]);

  const maxQuantity = available !== null ? Math.min(10, available) : 10;
  const soldOut = available === 0;

  if (initialized === false) {
    return (
      <div className="mt-8 p-4 border border-gray-300 rounded">
        <h2>Tickets</h2>
        <p>Tickets are not yet available. Check back soon!</p>
      </div>
    );
  }

  if (checkoutStep === "success") {
    return (
      <div className="mt-8 p-4 border border-gray-800 bg-white/50">
        <h2>Success!</h2>
        <p>
          Your payment was successful. You will receive a confirmation email and
          your tickets shortly.
        </p>
      </div>
    );
  }

  const handleProceedToDetails = () => {
    setCheckoutStep("details");
  };

  const handleProceedToCheckout = async () => {
    if (!name.trim() || !email.trim()) {
      alert("Please enter your name and email");
      return;
    }

    setLoadingIntent(true);
    try {
      const res = await fetch("/api/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quantity,
          name: name.trim(),
          email: email.trim(),
        }),
      });
      const data = await res.json();
      if (data.clientSecret && data.paymentIntentId) {
        setClientSecret(data.clientSecret);
        setPaymentIntentId(data.paymentIntentId);
        setCheckoutStep("pay");
      } else {
        alert(data.error || "Failed to start checkout");
      }
    } catch (error) {
      console.error("Checkout error:", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setLoadingIntent(false);
    }
  };

  return (
    <div className="mt-8 p-4 border border-gray-800 bg-white/50">
      <h2>Get Tickets Here</h2>

      {available !== null && (
        <p className="mb-4">
          {soldOut ? (
            <strong>Sold out!</strong>
          ) : available <= 8 ? (
            <>{available} tickets remaining</>
          ) : null}
        </p>
      )}

      {!soldOut && checkoutStep === "select" && (
        <>
          <div className="mt-4">
            <label htmlFor="quantity" className="block mb-2">
              Number of tickets:
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1}
                aria-label="Decrease quantity"
                className="px-4 py-2 text-xl"
              >
                −
              </button>
              <input
                id="quantity"
                type="number"
                min="1"
                max={maxQuantity}
                value={quantity}
                onChange={(e) =>
                  setQuantity(
                    Math.max(
                      1,
                      Math.min(maxQuantity, parseInt(e.target.value) || 1)
                    )
                  )
                }
                className="w-20 text-center p-2 text-base"
                aria-describedby="price-display"
              />
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.min(maxQuantity, q + 1))}
                disabled={quantity >= maxQuantity}
                aria-label="Increase quantity"
                className="px-4 py-2 text-xl"
              >
                +
              </button>
            </div>
          </div>

          <p id="price-display" className="mt-4 text-xl">
            <strong>Total: £{(ticketPrice * quantity).toFixed(2)}</strong>
          </p>

          <button
            onClick={handleProceedToDetails}
            disabled={available === null}
            className="mt-4 px-6 py-3 text-base"
          >
            Continue
          </button>
        </>
      )}

      {!soldOut && checkoutStep === "details" && (
        <>
          <p className="mb-4">
            {quantity} ticket{quantity > 1 ? "s" : ""} - £
            {(ticketPrice * quantity).toFixed(2)}
          </p>

          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block mb-1">
                Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="w-full p-2 border border-gray-300"
                required
              />
            </div>

            <div>
              <label htmlFor="email" className="block mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full p-2 border border-gray-300"
                required
              />
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <button
              onClick={handleProceedToCheckout}
              disabled={loadingIntent || !name.trim() || !email.trim()}
              className="flex-1 px-6 py-3 text-base"
            >
              {loadingIntent ? "Loading..." : "Proceed to Payment"}
            </button>
            <button
              type="button"
              onClick={() => setCheckoutStep("select")}
              className="px-4 py-3 bg-gray-200 text-black hover:bg-gray-300"
            >
              Back
            </button>
          </div>
        </>
      )}

      {checkoutStep === "pay" && clientSecret && paymentIntentId && (
        <Elements
          stripe={stripePromise}
          options={{
            clientSecret,
            appearance: { theme: "stripe" },
          }}
        >
          <p className="mt-2">
            Buying {quantity} ticket{quantity > 1 ? "s" : ""} for £
            {(ticketPrice * quantity).toFixed(2)}
          </p>
          <CheckoutForm
            quantity={quantity}
            ticketPrice={ticketPrice}
            onSuccess={() => setCheckoutStep("success")}
            onCancel={() => {
              setCheckoutStep("details");
              setClientSecret(null);
              setPaymentIntentId(null);
            }}
            paymentIntentId={paymentIntentId}
          />
        </Elements>
      )}
    </div>
  );
}
