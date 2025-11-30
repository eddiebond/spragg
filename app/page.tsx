"use client";

import TicketForm from "./components/TicketForm";
import { useShow } from "./context/ShowContext";

export default function Home() {
  const show = useShow();

  return (
    <div style={{ padding: "2rem", maxWidth: "600px" }}>
      <h1>{show.title}</h1>
      <p>{show.description}</p>
      <p>
        <strong>Location:</strong> {show.location}
      </p>
      <p>
        <strong>Time:</strong> {show.startTime} - {show.endTime}
      </p>

      <TicketForm />
    </div>
  );
}
