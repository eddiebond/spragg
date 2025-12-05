import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { google } from "googleapis";
import { formatInTimeZone } from "date-fns-tz";

// --- Environment and Client Setup ---

function getSupabaseClient(): SupabaseClient {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    throw new Error("SUPABASE_URL is not defined in environment variables");
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not defined in environment variables"
    );
  }
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

function getSheetsClient() {
  const privateKey =
    "-----BEGIN PRIVATE KEY-----\nMIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQC+iZkHL4W/gJlO\nKN5Tzz6hzLRsJljcknjycU57Wf8imo2jGbLPc6cBCbMP5lQkgRcJw9DgL6wmaw5B\n+7dAX5Rpi9czasO4MFPno/wSXjrwrmMBqoorSJP0uVRWsLcM5eidjyaLh+0KtEDQ\n5Lz6WldM1zEYG4D247/HvuTooMvrRhrjLK7Ciu93kipO92u2TLNi3mKCEEIixkva\nIrmzH669yPaU4TTeePmKJdIPUil2+7CeGUWXWxurvWCX/Z29ZvC4GwSGWNLDINiU\nVqbwegW5Q6L2Xbvknk1ncdICdG6rfLf2G3agpzjkZg3i20TW1GDcL0hkiNtE+CNH\npzzkNrMDAgMBAAECggEARfn45qewYj2TkB34USVq5jdtB88pkZCFtNyiKzFJP2ct\nn3n/rqrV6c6rIarAuktir6Zn3v4DJnTo3pjYm16+/ehq16pdSRcOqaMTH5fV47DY\nEbOVXQIhvJ4X+GKcR7NkNAFv8YyxJN5Ac7eeI//r0f+yOx1WxtWsCGr2XO05FyWc\nLFBkbchcTQlP29IUXqj2uhqNInXD+Aom9f3eWLJS/6X6qLV8v8P9VuqFu2yRw1fX\nLxA5V4rf3N22iw+4Rx1ahJNr9Wi8bkh+5AnYb+gPwXZ3ei6CHktl+Kj1WXqpTNcv\nrYx2JMNg89ijSWkkO+Vo84vFGTI3tIbc/oJJ5dnxgQKBgQDyS9iwFp90fslQvsyR\nBZmIFGV/ccGA88j1ibkCYByT9ng1HhL7AGYRqxshtO1VRBfc19BLz8QJFchbNYD6\nS/hWiBO3LCfWEGfFCW0Kyx3qA7V7w/DYQVRI/U0uC5vmWdDP8at1Rupk8lcHRKuS\nILLLStg/CSRYRwDDNXLwT7IlwwKBgQDJUFj0NuSpZ53hlNOgLFn7QIEK1PhPgdJ5\nRf3Me+wJxZJFT/YFe2fYLGOL5187eePaghp4bRBnn8HpCAN1OG0xDPZEoeykLHxU\n8DEyRuaVQ3LvndQm3CpZzO6OTfSM4GcTHhnVwDX0Z4ydiGjhqKNFjYu9/XOKoakI\n8muwA/QpwQKBgQC4vmAgE3/NYYa6TGDKCsz/1x10yRXT7w3BOhuY1hO0Ne9+AMpU\nG/+3ZRGw57U2mE7hkqQ9ydMdYkB8WxVWw2o9AFCYD9DoBWY59G/yFOFgNye/kK0p\nFtbfOFQK0cszHjR6+TfUmhfKlIULA68WIlxxaUXs+ll9/dV1AmH7Hakl5QKBgQC+\nQvy/Wr4DyVUy5QiZojEswAr1pNBFvGmiil7TCu/LUHnsniTji31alqFCkVq1CH8r\nfbjsxg8yEJAg4Jz8BWdVa2248dyIUS70y8mDPfUhbwzKoDzouT4hfwibX9vX5SIl\ntFYwaafUpKUGIe0WEN62lo9S8Z5okF8EgLD8OtBhQQKBgQDF8fpteY+oorGkoPVi\nZag8RVDUhZschn8+xuejWpMwWFtOIY6wEjf8EHVc3S4wlJx0bweZZOhZsCmoMQ3K\nuucuSqlJTPGXgXwFCwF+qjKnK2/TGBzQst5/FzZ0yEyeUCp2nduebp3Of+JCX7QA\nw8VtGt8rEaGJ5/ldMnFtx8o6iA==\n-----END PRIVATE KEY-----\n";
  const credentials = {
    type: "service_account",
    project_id: process.env.GOOGLE_PROJECT_ID,
    private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
    private_key: privateKey.replace(/\\n/g, "\n"),
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    client_id: process.env.GOOGLE_CLIENT_ID,
    auth_uri: process.env.GOOGLE_AUTH_URI,
    token_uri: process.env.GOOGLE_TOKEN_URI,
    auth_provider_x509_cert_url: process.env.GOOGLE_AUTH_PROVIDER_CERT_URL,
    client_x509_cert_url: process.env.GOOGLE_CLIENT_CERT_URL,
  };
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  return google.sheets({ version: "v4", auth });
}

// --- Sheet Formatting Helpers ---

function formatHeaderRow(sheetId: number) {
  return [
    {
      repeatCell: {
        range: {
          sheetId,
          startRowIndex: 0,
          endRowIndex: 1,
          startColumnIndex: 0,
          endColumnIndex: 4,
        },
        cell: {
          userEnteredFormat: {
            textFormat: { bold: true, fontFamily: "Helvetica" },
            backgroundColor: { red: 0.9, green: 0.9, blue: 0.9 },
          },
        },
        fields: "userEnteredFormat(textFormat,backgroundColor)",
      },
    },
    {
      updateBorders: {
        range: {
          sheetId,
          startRowIndex: 0,
          endRowIndex: 1,
          startColumnIndex: 0,
          endColumnIndex: 4,
        },
        bottom: {
          style: "SOLID",
          width: 1,
          color: { red: 0, green: 0, blue: 0 },
        },
      },
    },
  ];
}

function formatTotalRow(sheetId: number, totalRowIndex: number) {
  return [
    {
      repeatCell: {
        range: {
          sheetId,
          startRowIndex: totalRowIndex,
          endRowIndex: totalRowIndex + 1,
          startColumnIndex: 0,
          endColumnIndex: 4,
        },
        cell: {
          userEnteredFormat: {
            textFormat: { bold: true },
          },
        },
        fields: "userEnteredFormat.textFormat.bold",
      },
    },
    {
      updateBorders: {
        range: {
          sheetId,
          startRowIndex: totalRowIndex,
          endRowIndex: totalRowIndex + 1,
          startColumnIndex: 0,
          endColumnIndex: 4,
        },
        top: {
          style: "SOLID",
          width: 1,
          color: { red: 0, green: 0, blue: 0 },
        },
      },
    },
  ];
}

function setOverflowCell(sheetId: number, rowCount: number) {
  return {
    repeatCell: {
      range: {
        sheetId,
        startRowIndex: 0,
        endRowIndex: rowCount,
        startColumnIndex: 0,
        endColumnIndex: 4,
      },
      cell: {
        userEnteredFormat: {
          wrapStrategy: "OVERFLOW_CELL",
        },
      },
      fields: "userEnteredFormat.wrapStrategy",
    },
  };
}

function autoResizeColumns(sheetId: number, startCol: number, endCol: number) {
  return {
    autoResizeDimensions: {
      dimensions: {
        sheetId,
        dimension: "COLUMNS",
        startIndex: startCol,
        endIndex: endCol,
      },
    },
  };
}

function addBorders(sheetId: number) {
  return {
    updateBorders: {
      range: {
        sheetId,
        startRowIndex: 0,
        endRowIndex: 1000,
        startColumnIndex: 0,
        endColumnIndex: 26,
      },
      top: { style: "NONE" },
      bottom: { style: "NONE" },
      left: { style: "NONE" },
      right: { style: "NONE" },
      innerHorizontal: { style: "NONE" },
      innerVertical: { style: "NONE" },
    },
  };
}

// --- Utility ---

function getSheetId(): number {
  // For now, always use 0. If you want to dynamically fetch the sheetId, implement here.
  return 0;
}

// --- Main Sheet Operations ---

async function clearSheetEverything(
  spreadsheetId: string,
  sheetId: number = 0
) {
  const sheets = getSheetsClient();
  // Clear values
  await sheets.spreadsheets.values.clear({
    spreadsheetId,
    range: "Sheet1",
  });

  // Clear borders
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [addBorders(sheetId)],
    },
  });

  // Reset formatting
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [
        {
          repeatCell: {
            range: {
              sheetId,
              startRowIndex: 0,
              endRowIndex: 1000,
              startColumnIndex: 0,
              endColumnIndex: 26,
            },
            cell: {
              userEnteredFormat: {
                textFormat: {
                  bold: false,
                  italic: false,
                  underline: false,
                  strikethrough: false,
                  fontSize: 10,
                  fontFamily: "Helvetica",
                },
              },
            },
            fields: "userEnteredFormat.textFormat",
          },
        },
      ],
    },
  });
}

export async function sendToSheet(spreadsheetId: string) {
  const supabase = getSupabaseClient();
  const sheets = getSheetsClient();
  const sheetId = getSheetId();

  // Fetch data from Supabase
  const { data: midlifehighfivedeepdive, error } = await supabase
    .from("midlifehighfivedeepdive")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`Error fetching data from Supabase: ${error.message}`);
  }

  // Prepare rows for Google Sheets
  const rows = midlifehighfivedeepdive.map((ticket) => [
    ticket.customer_name,
    ticket.tickets_sold,
    ticket.tickets_code,
    formatInTimeZone(
      new Date(ticket.created_at),
      "Europe/London",
      "yyyy-MM-dd HH:mm"
    ),
  ]);
  const totalTicketsSold = midlifehighfivedeepdive.reduce(
    (sum, ticket) => sum + ticket.tickets_sold,
    0
  );
  rows.push(["Total", totalTicketsSold, "", ""]);

  try {
    // Clear everything in the sheet
    await clearSheetEverything(spreadsheetId, sheetId);

    // Write data to Google Sheets
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: "Sheet1!A1",
      valueInputOption: "RAW",
      requestBody: {
        values: [
          ["Customer Name", "Quantity", "Tickets Code", "Date and Time"],
          ...rows,
        ],
      },
    });

    // Format header, total row, overflow, and auto-resize columns
    const requests = [
      ...formatHeaderRow(sheetId),
      ...formatTotalRow(sheetId, rows.length),
      setOverflowCell(sheetId, rows.length + 1),
      autoResizeColumns(sheetId, 0, 4),
    ];

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: { requests },
    });

    console.log("Header row and total row formatted successfully.");
  } catch (error: unknown) {
    console.error(
      "Error writing to Google Sheets:",
      error instanceof Error ? error.message : "Unknown error"
    );
    throw new Error("Failed to write data to Google Sheets.");
  }
}
