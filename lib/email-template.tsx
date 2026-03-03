import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Text,
} from "@react-email/components";
import * as React from "react";

interface TicketProps {
  name: string;
  ticketCode: string;
  ticketQuantity: number;
  qrCodeContentId?: string;
}

const MidlifeHighFiveTicket = ({
  name,
  ticketCode,
  ticketQuantity,
  qrCodeContentId,
}: TicketProps) => (
  <Html>
    <Head />
    <Preview>
      Your {ticketQuantity.toString()}{" "}
      {ticketQuantity === 1 ? "ticket" : "tickets"} for Midlife High Five Deep
      Dive
    </Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>
          Your {ticketQuantity.toString()}{" "}
          {ticketQuantity === 1 ? "ticket" : "tickets"} for Midlife High Five
          Deep Dive
        </Heading>

        <Text style={text}>Hi {name},</Text>

        <Text style={text}>
          Thank you for your purchase. I&apos;m excited to see you at the show.
        </Text>

        <Text style={text}>
          Please find your QR code with your ticket
          {ticketQuantity > 1 ? "s" : ""} below.
        </Text>

        <Container style={{ textAlign: "center", marginTop: "20px" }}>
          {qrCodeContentId && (
            <Img
              src={`cid:${qrCodeContentId}`}
              alt="QR Code"
              width="128"
              height="128"
              style={{
                display: "block",
                margin: "0 auto",
                border: "2px solid #dddddd",
              }}
            />
          )}
          <Text
            style={{
              ...text,
              fontFamily: "monospace",
              fontSize: "16px",
              color: "#00ffff",
              fontWeight: "700",
            }}
          >
            {ticketCode}
          </Text>
        </Container>

        <Container style={{ marginTop: "30px", textAlign: "left" }}>
          <Heading style={h2}>When is this again?</Heading>
          <Text style={{ ...text, marginBottom: "16px" }}>
            Thursday, 9th April 2026 at 8:00 PM
            <br />
            Doors open at 7:30 PM
          </Text>

          <Heading style={h2}>And where?</Heading>
          <Text style={{ ...text, marginBottom: "16px" }}>
            The Holloway, St Benedicts Street, Norwich
          </Text>
        </Container>
      </Container>
    </Body>
  </Html>
);

const main = {
  backgroundColor: "#000000",
  fontFamily: "Helvetica, Arial, sans-serif",
};

const container = {
  backgroundColor: "#0a0a0a",
  margin: "0 auto",
  padding: "40px 20px",
  maxWidth: "600px",
  border: "2px solid #ff00ff",
};

const h1 = {
  color: "#ffff00",
  fontSize: "24px",
  fontWeight: "700",
  lineHeight: "1.3",
  margin: "0 0 20px",
  textTransform: "uppercase" as const,
};

const h2 = {
  color: "#ff00ff",
  fontSize: "18px",
  fontWeight: "700",
  lineHeight: "1.3",
  margin: "0 0 8px",
  textTransform: "uppercase" as const,
};

const text = {
  color: "#ffffff",
  fontSize: "16px",
  lineHeight: "1.6",
  margin: "0 0 16px",
};

export default MidlifeHighFiveTicket;
