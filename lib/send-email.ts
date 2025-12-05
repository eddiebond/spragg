import * as nodemailer from "nodemailer";
import { render } from "@react-email/render";
import MidlifeHighFiveTicket from "./email-template";
import * as React from "react";
import * as QRCode from "qrcode";
import { v4 as uuidv4 } from "uuid";

export async function sendTicketEmail(
  name: string,
  email: string,
  ticketCode: string,
  ticketQuantity: number
) {
  // Generate QR code as a buffer
  const qrCodeBuffer = await QRCode.toBuffer(ticketCode);

  // Generate a unique content ID for embedding the QR code
  const qrCodeContentId = `${uuidv4()}@midlifehighfive`;

  // Render the email content
  const htmlContent = await render(
    React.createElement(MidlifeHighFiveTicket, {
      name,
      ticketCode,
      ticketQuantity,
      qrCodeContentId,
    })
  );

  const subject = `Your Midlife High Five Deep Dive ticket${ticketQuantity > 1 ? "s" : ""} 🎟️`;

  // Create a transporter object using SMTP
  const transporter = nodemailer.createTransport({
    service: "gmail",
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  // Send the email with the QR code embedded and attached
  await transporter.sendMail({
    from: `"Midlife High Five Deep Dive" <${process.env.EMAIL_USER}>`,
    replyTo: "beardybollocks@googlemail.com",
    to: email,
    subject,
    html: htmlContent,
    attachments: [
      {
        filename: "qr-code.png",
        content: qrCodeBuffer,
        contentType: "image/png",
        cid: qrCodeContentId,
      },
    ],
  });

  console.log(`Email sent successfully to ${email}`);
}
