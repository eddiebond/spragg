# Spragg — Event Ticketing Platform

A [Next.js](https://nextjs.org) application for selling and managing event tickets. It integrates Stripe for payment processing, Supabase (PostgreSQL) for data storage, Gmail SMTP for ticket confirmation emails, and Google Sheets for real-time sales reporting.

---

## Features

- **Ticket purchasing** — real-time availability checking and secure Stripe checkout
- **Stripe integration** — supports both Stripe Checkout Sessions and Payment Intents, with separate test/production keys
- **Webhook processing** — handles `payment_intent.succeeded` events with idempotency checking; records the Stripe fee from the Balance Transactions API
- **Unique ticket codes** — auto-generated adjective-animal codes (e.g. `happy-tiger`)
- **QR code generation** — each ticket includes an embedded QR code for entry scanning
- **Email confirmations** — HTML email with ticket details and QR code sent via Gmail SMTP
- **Admin endpoints** — configure event details (title, venue, capacity, start/doors-open time)
- **Google Sheets sync** — automatic push of all sales data, totals, and Stripe fee breakdown after each purchase
- **Customer management** — tracks purchasers by email; preserves newsletter preference on repeat purchases

---

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project
- A [Stripe](https://stripe.com) account (test and production keys)
- A Google Cloud service account with Sheets API access
- A Gmail account with an [App Password](https://support.google.com/accounts/answer/185833) configured

### Install dependencies

```bash
npm install
```

### Configure environment variables

Copy the table in the [Environment Variables](#environment-variables) section below into a `.env.local` file and fill in the values.

### Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. The app automatically uses Stripe **test** keys when `NODE_ENV=development`.

### Other scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Next.js development server |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |

---

## Environment Variables

Create a `.env.local` file in the project root with the following variables:

### Stripe

| Variable | Description |
|----------|-------------|
| `STRIPE_SECRET_KEY` | Production secret key |
| `STRIPE_SECRET_TEST_KEY` | Test-mode secret key |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Production publishable key |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_TEST_KEY` | Test-mode publishable key |
| `STRIPE_WEBHOOK_SECRET` | Production webhook signing secret |
| `STRIPE_WEBHOOK_SECRET_TEST` | Test webhook signing secret |

### Supabase

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key |

### Email (Gmail SMTP)

| Variable | Description |
|----------|-------------|
| `EMAIL_USER` | Gmail address used to send confirmation emails |
| `EMAIL_PASSWORD` | Gmail App Password |

### Google Sheets

| Variable | Description |
|----------|-------------|
| `GOOGLE_SHEET_ID` | ID of the target Google Sheets document |
| `GOOGLE_PROJECT_ID` | Google Cloud project ID |
| `GOOGLE_PRIVATE_KEY_ID` | Service account private key ID |
| `GOOGLE_CLIENT_EMAIL` | Service account email |
| `GOOGLE_CLIENT_ID` | Service account client ID |
| `GOOGLE_AUTH_URI` | Auth URI (usually `https://accounts.google.com/o/oauth2/auth`) |
| `GOOGLE_TOKEN_URI` | Token URI (usually `https://oauth2.googleapis.com/token`) |
| `GOOGLE_AUTH_PROVIDER_CERT_URL` | Auth provider cert URL |
| `GOOGLE_CLIENT_CERT_URL` | Client cert URL |

### Application

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_BASE_URL` | Base URL for Stripe success/cancel redirects (e.g. `https://example.com`) |

---

## API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/checkout` | POST | Create a Stripe Checkout Session and return the redirect URL |
| `/api/create-payment-intent` | POST | Create a Stripe Payment Intent and return the client secret |
| `/api/confirm-purchase` | POST | Verify a completed payment on the client side |
| `/api/stripe-webhook` | POST | Stripe webhook — creates customer/ticket records, sends email, updates Google Sheets |
| `/api/tickets/availability` | GET | Return available, sold, and total ticket counts |
| `/api/admin/show` | GET / POST | Get or update event details (title, venue, capacity, start time, doors open) |
| `/api/admin/tickets` | GET / POST | Get or update ticket capacity |
| `/api/admin/seed` | GET | Seed the database with default event values (development only) |
| `/api/test-email` | POST | Send a test confirmation email |
| `/api/sendtosheet` | POST | Manually trigger a Google Sheets sync |

---

## Database Schema

The application uses three main Supabase tables:

### `event`

| Column | Type | Description |
|--------|------|-------------|
| `id` | integer (PK) | |
| `title` | text | Event name |
| `description` | text | Short description |
| `body` | text | Full event details |
| `venue` | text | Venue name/address |
| `start_time` | timestamp | Event start time |
| `doors_open` | timestamp | Doors open time |
| `capacity` | integer | Total ticket capacity |

### `customer`

| Column | Type | Description |
|--------|------|-------------|
| `id` | integer (PK) | |
| `name` | text | Customer name |
| `email` | text (unique) | Customer email |
| `newsletter` | boolean | Newsletter opt-in |
| `created_at` | timestamp | |

### `customer_event`

| Column | Type | Description |
|--------|------|-------------|
| `id` | integer (PK) | |
| `customer_id` | integer (FK → customer) | |
| `event_id` | integer (FK → event) | |
| `tickets_sold` | integer | Number of tickets purchased |
| `price_per_ticket` | integer | Price in pence (e.g. 400 = £4.00) |
| `tickets_code` | text | Unique ticket code |
| `stripe_payment_intent_id` | text | Stripe Payment Intent ID |
| `stripe_fee_amount` | integer | Stripe processing fee in pence |
| `created_at` | timestamp | |

> **Note on `stripe_fee_amount`:** Stripe's Balance Transactions API returns fee amounts in the smallest currency unit for the charge currency. This value is stored as-is — no additional unit conversion is applied.

---

## Pricing

Ticket price is defined in `lib/config.ts`:

```ts
export const PRICE_PER_TICKET = 400; // £4.00 in pence
```

All monetary values throughout the application (amounts sent to Stripe, prices stored in the database, fee amounts retrieved from Stripe) are in pence.

---

## Deployment

The recommended deployment platform is [Vercel](https://vercel.com/new). Add all environment variables listed above to your Vercel project settings.

For Stripe webhooks, create a webhook endpoint in the Stripe dashboard pointing to `https://<your-domain>/api/stripe-webhook` and subscribe to the `payment_intent.succeeded` event.

See the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
