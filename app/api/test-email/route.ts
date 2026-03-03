import { NextRequest, NextResponse } from "next/server";
import { sendTicketEmail } from "@/lib/send-email";

export async function POST(req: NextRequest) {
  try {
    const { name, email, ticketCode, ticketQuantity } = await req.json();

    if (!name || !email || !ticketCode || !ticketQuantity) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    await sendTicketEmail(name, email, ticketCode, ticketQuantity);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Test email error:", error);
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 },
    );
  }
}
