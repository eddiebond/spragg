"use client";

import { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Clock, MapPin } from "lucide-react";

const isDev = process.env.NODE_ENV === "development";

const stripePublishableKey = isDev
  ? process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_TEST_KEY
  : process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

if (!stripePublishableKey) {
  console.error(
    isDev
      ? "Missing NEXT_PUBLIC_STRIPE_PUBLISHABLE_TEST_KEY for development"
      : "Missing NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY for production",
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
  email,
}: {
  quantity: number;
  ticketPrice: number;
  onSuccess: () => void;
  onCancel: () => void;
  paymentIntentId: string;
  email: string;
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
      <PaymentElement
        options={{
          defaultValues: {
            billingDetails: {
              email: email,
            },
          },
        }}
      />
      {error && <p className="text-red-600 mt-2">{error}</p>}
      <div className="flex gap-2 mt-4">
        <Button
          type="submit"
          disabled={!stripe || loading}
          className="flex-1 px-6 py-3"
        >
          {loading
            ? "Processing..."
            : `Pay £${(ticketPrice * quantity).toFixed(2)}`}
        </Button>
        <Button
          type="button"
          onClick={onCancel}
          disabled={loading}
          variant="secondary"
          className="px-4 py-3"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}

export default function TicketDialog() {
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
  const [nameError, setNameError] = useState("");
  const [emailError, setEmailError] = useState("");

  const ticketPrice = 4;

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

  const handleProceedToDetails = () => {
    setCheckoutStep("details");
  };

  const handleProceedToCheckout = async () => {
    setNameError("");
    setEmailError("");

    let hasError = false;

    if (!name.trim()) {
      setNameError("No you idiot! Enter a name!");
      hasError = true;
    }

    if (!email.trim()) {
      setEmailError(
        "No you idiot! Enter an email address! Otherwise how will we send you your tickets?!",
      );
      hasError = true;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setEmailError("No you idiot! Enter a REAL email address!");
      hasError = true;
    }

    if (hasError) {
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
    <Dialog>
      {soldOut ? (
        <div className="w-full max-w-md text-center py-4 px-6 bg-muted border-2 border-border">
          <span className="text-xl font-bold uppercase">SOLD OUT</span>
        </div>
      ) : (
        <DialogTrigger asChild>
          <Button
            variant="default"
            size="lg"
            className="w-full max-w-md text-xl"
          >
            Get Tickets Here
          </Button>
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mid Life High Five Deep Dive</DialogTitle>
          <DialogDescription>
            <span className="block">
              <MapPin className="inline-block mr-1" size={12} /> The Holloway,
              Norwich
            </span>
            <span className="block">
              <Clock className="inline-block mr-1" size={12} />
              Thursday 9th April 2026 at 8:00 PM
            </span>
          </DialogDescription>
        </DialogHeader>

        {initialized !== false && !soldOut && checkoutStep === "select" && (
          <div className="space-y-4">
            <div className="bg-neutral-800">
              <div className="flex items-center justify-between p-4">
                <div>
                  <div>General Admission</div>
                  <div>£{ticketPrice.toFixed(2)}</div>
                </div>
                <label htmlFor="quantity" className="sr-only">
                  Number of tickets:
                </label>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    aria-label="Decrease quantity"
                    variant="outline"
                    className="px-4 py-2 text-xl"
                  >
                    −
                  </Button>
                  <select
                    id="quantity"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value))}
                    className="w-14 text-center p-2 text-sm bg-background text-foreground border border-border"
                    aria-describedby="price-display"
                  >
                    {Array.from({ length: maxQuantity }, (_, i) => i + 1).map(
                      (num) => (
                        <option key={num} value={num}>
                          {num}
                        </option>
                      ),
                    )}
                  </select>
                  <Button
                    type="button"
                    onClick={() =>
                      setQuantity((q) => Math.min(maxQuantity, q + 1))
                    }
                    disabled={quantity >= maxQuantity}
                    aria-label="Increase quantity"
                    variant="outline"
                    className="px-4 py-2 text-xl"
                  >
                    +
                  </Button>
                </div>
              </div>
            </div>

            <p id="price-display" className="text-xl float-right">
              <strong>Total: £{(ticketPrice * quantity).toFixed(2)}</strong>
            </p>

            <Button
              onClick={handleProceedToDetails}
              disabled={available === null}
              className="w-full px-6 py-3 text-base"
            >
              Continue
            </Button>
          </div>
        )}

        {!soldOut && checkoutStep === "details" && (
          <div className="space-y-4">
            <p className="mb-4">
              {quantity} ticket{quantity > 1 ? "s" : ""} - £
              {(ticketPrice * quantity).toFixed(2)}
            </p>

            <div>
              <label htmlFor="name" className="block mb-1">
                Name
              </label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setNameError("");
                }}
                placeholder="Your name"
                required
                className={nameError ? "border-destructive" : ""}
              />
              {nameError && (
                <p className="text-destructive text-sm mt-1">{nameError}</p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block mb-1">
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setEmailError("");
                }}
                placeholder="your@email.com"
                required
                className={emailError ? "border-destructive" : ""}
              />
              {emailError && (
                <p className="text-destructive text-sm mt-1">{emailError}</p>
              )}
            </div>

            <div className="flex flex-row-reverse gap-2">
              <Button
                onClick={handleProceedToCheckout}
                disabled={loadingIntent || !name.trim() || !email.trim()}
                className="flex-1 px-6 py-3 text-base"
              >
                {loadingIntent ? "Loading..." : "Proceed to Payment"}
              </Button>{" "}
              <Button
                type="button"
                onClick={() => setCheckoutStep("select")}
                variant="ghost"
                className="px-4 py-3"
              >
                Back
              </Button>
            </div>
          </div>
        )}

        {checkoutStep === "pay" && clientSecret && paymentIntentId && (
          <Elements
            stripe={stripePromise}
            options={{
              clientSecret,
              appearance: {
                theme: "night",
                variables: {
                  fontFamily: "Helvetica, sans-serif",
                  fontSizeBase: "14px",
                  borderRadius: "0px",
                  colorPrimary: "#f882cd",
                  colorBackground: "#0d0d0d",
                  colorText: "#ffffff",
                  colorDanger: "#df2020",
                  spacingUnit: "4px",
                },
                rules: {
                  ".Input": {
                    border: "2px solid #666666",
                    backgroundColor: "#0d0d0d",
                    color: "#ffffff",
                    padding: "9px 12px",
                  },
                  ".Input:focus": {
                    border: "2px solid #f882cd",
                    outline: "none",
                  },
                  ".Input:disabled": {
                    opacity: "0.5",
                  },
                  ".Label": {
                    color: "#ffffff",
                    fontSize: "14px",
                    fontWeight: "normal",
                    marginBottom: "4px",
                  },
                  ".Tab": {
                    border: "2px solid #666666",
                    backgroundColor: "#0d0d0d",
                    padding: "9px 12px",
                  },
                  ".Tab:hover": {
                    backgroundColor: "#1a1a1a",
                  },
                  ".Tab--selected": {
                    border: "2px solid #f882cd",
                    backgroundColor: "#0d0d0d",
                  },
                  ".Block": {
                    backgroundColor: "#0d0d0d",
                    border: "none",
                  },
                },
              },
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
              email={email.trim()}
            />
          </Elements>
        )}

        {checkoutStep === "success" && (
          <div className="space-y-4">
            <p className="text-lg">
              Your payment was successful. You will receive a confirmation email
              and your tickets shortly.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
