import Link from "next/link";

export default function Success() {
  return (
    <div style={{ padding: "2rem" }}>
      <h1>Thank you!</h1>
      <p>Your ticket purchase was successful.</p>
      <p>You will receive a confirmation email shortly.</p>
      <Link href="/">← Back to home</Link>
    </div>
  );
}
