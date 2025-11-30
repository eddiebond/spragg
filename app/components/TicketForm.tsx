"use client";

import { useState, useEffect } from "react";

export default function TicketForm() {
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [available, setAvailable] = useState<number | null>(null);
  const [initialized, setInitialized] = useState<boolean | null>(null);

  const ticketPrice = 7.5; // Price per ticket in GBP

  // Fetch availability on mount
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

  // Adjust quantity if it exceeds available
  useEffect(() => {
    if (available !== null && quantity > available) {
      setQuantity(Math.max(1, available));
    }
  }, [available, quantity]);

  const maxQuantity = available !== null ? Math.min(10, available) : 10;
  const soldOut = available === 0;

  // Not initialized - tickets not set up yet
  if (initialized === false) {
    return (
      <div style={{ marginTop: "2rem", padding: "1rem", border: "1px solid #ccc" }}>
        <h2>Tickets</h2>
        <p>Tickets are not yet available. Check back soon!</p>
      </div>
    );
  }

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Checkout error:", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{ marginTop: "2rem", padding: "1rem", border: "1px solid #ccc" }}
    >
      <h2>Get Tickets</h2>

      {available !== null && (
        <p style={{ marginBottom: "1rem" }}>
          {soldOut ? (
            <strong>Sold out!</strong>
          ) : (
            <>{available} tickets remaining</>
          )}
        </p>
      )}

      {!soldOut && (
        <>
          <div style={{ marginTop: "1rem" }}>
            <label
              htmlFor="quantity"
              style={{ display: "block", marginBottom: "0.5rem" }}
            >
              Number of tickets:
            </label>
            <div
              style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1}
                aria-label="Decrease quantity"
                style={{ padding: "0.5rem 1rem", fontSize: "1.25rem" }}
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
                style={{
                  width: "3rem",
                  textAlign: "center",
                  padding: "0.5rem",
                  fontSize: "1rem",
                }}
                aria-describedby="price-display"
              />
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.min(maxQuantity, q + 1))}
                disabled={quantity >= maxQuantity}
                aria-label="Increase quantity"
                style={{ padding: "0.5rem 1rem", fontSize: "1.25rem" }}
              >
                +
              </button>
            </div>
          </div>

          <p
            id="price-display"
            style={{ marginTop: "1rem", fontSize: "1.25rem" }}
          >
            <strong>Total: £{(ticketPrice * quantity).toFixed(2)}</strong>
          </p>

          <button
            onClick={handleCheckout}
            disabled={loading || available === null}
            style={{
              marginTop: "1rem",
              padding: "0.75rem 1.5rem",
              fontSize: "1rem",
              cursor: loading ? "wait" : "pointer",
            }}
          >
            {loading ? "Loading..." : "Proceed to Checkout"}
          </button>
        </>
      )}
    </div>
  );
}
