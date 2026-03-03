"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function TestEmailPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [ticketCode, setTicketCode] = useState("");
  const [ticketQuantity, setTicketQuantity] = useState(1);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");

  const handleSend = async () => {
    setSending(true);
    setMessage("");

    try {
      const res = await fetch("/api/test-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          ticketCode,
          ticketQuantity,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage("✅ Email sent successfully!");
      } else {
        setMessage(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      setMessage(`❌ Error: ${error}`);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-md mx-auto space-y-6">
        <h1>Test Email</h1>

        <div>
          <label htmlFor="name" className="block mb-1">
            Name
          </label>
          <Input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="John Doe"
          />
        </div>

        <div>
          <label htmlFor="email" className="block mb-1">
            Email
          </label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="john@example.com"
          />
        </div>

        <div>
          <label htmlFor="ticketCode" className="block mb-1">
            Ticket Code
          </label>
          <Input
            id="ticketCode"
            type="text"
            value={ticketCode}
            onChange={(e) => setTicketCode(e.target.value)}
            placeholder="ABC123XYZ"
          />
        </div>

        <div>
          <label htmlFor="ticketQuantity" className="block mb-1">
            Ticket Quantity
          </label>
          <Input
            id="ticketQuantity"
            type="number"
            min="1"
            value={ticketQuantity}
            onChange={(e) => setTicketQuantity(parseInt(e.target.value))}
          />
        </div>

        <Button
          onClick={handleSend}
          disabled={
            sending || !name || !email || !ticketCode || !ticketQuantity
          }
          className="w-full"
        >
          {sending ? "Sending..." : "Send Test Email"}
        </Button>

        {message && <p className="text-center">{message}</p>}
      </div>
    </div>
  );
}
