import { sendToSheet } from "@/lib/sendtosheet";
export async function GET() {
  await sendToSheet(process.env.GOOGLE_SHEET_ID as string);

  return new Response(
    JSON.stringify({ message: "Data sent to Google Sheets successfully." }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
    }
  );
}
