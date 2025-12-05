import type { Metadata } from "next";
import { Schoolbell } from "next/font/google";
import "./globals.css";

const schoolbell = Schoolbell({
  variable: "--font-schoolbell",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "Midlife Highfive Deepdive",
  description: "23rd January 2026 - The Holloway, Norwich",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${schoolbell.variable}  antialiased relative min-h-screen`}
      >
        <div
          className="fixed inset-0 -z-10"
          style={{
            backgroundImage: "url('/paperbg.jpg')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            opacity: 0.8,
          }}
        />
        {children}
      </body>
    </html>
  );
}
