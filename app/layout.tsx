import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Midlife Highfive Deepdive",
  description: "9th April 2026 - The Holloway, Norwich",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`antialiased relative min-h-vh `}>
        <div
          className="fixed inset-0 max-w-4xl -z-10  w-full m-auto"
          style={{
            backgroundImage: "url('/fuckubg.jpeg')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            opacity: 0.7,
          }}
        />
        {children}
      </body>
    </html>
  );
}
