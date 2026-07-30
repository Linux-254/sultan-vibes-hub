import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const CONSUMER_KEY = "fLBJ3szAG4Z4RfPHV7Bpx3EgekBpzA0GcXtwssqiraAH2njP";
const CONSUMER_SECRET = "dDORASu9wp4PARVYwH8PJU7DqrVHSGTgKmPpkOLPhCRLCQW4qgIAEeRphw1tKjmy";
const PASSKEY = ""; // Set via env or admin UI when received from Safaricom
const SHORTCODE = ""; // Set via env or admin UI when received from Safaricom
const CALLBACK_URL = "https://empire-kwa-sultan.com/api/mpesa-callback";

let cachedToken: { token: string; expires: number } | null = null;

async function getToken() {
  if (cachedToken && Date.now() < cachedToken.expires) return cachedToken.token;
  const auth = btoa(`${CONSUMER_KEY}:${CONSUMER_SECRET}`);
  const res = await fetch(
    "https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
    { headers: { Authorization: `Basic ${auth}` } },
  );
  const data = await res.json();
  if (!data.access_token) throw new Error("Failed to get M-Pesa token: " + JSON.stringify(data));
  cachedToken = { token: data.access_token, expires: Date.now() + (data.expires_in - 60) * 1000 };
  return data.access_token;
}

function getTimestamp() {
  const d = new Date();
  return d.getFullYear().toString() +
    String(d.getMonth() + 1).padStart(2, "0") +
    String(d.getDate()).padStart(2, "0") +
    String(d.getHours()).padStart(2, "0") +
    String(d.getMinutes()).padStart(2, "0") +
    String(d.getSeconds()).padStart(2, "0");
}

export const mpesaStkPush = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d) =>
    z.object({
      phone: z.string().min(10).max(13),
      amount: z.number().positive(),
      reference: z.string().max(20),
      description: z.string().max(30).default("Empire Payment"),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    if (!SHORTCODE || !PASSKEY) {
      throw new Error("M-Pesa not configured yet. Set SHORTCODE and PASSKEY in environment.");
    }
    const token = await getToken();
    const timestamp = getTimestamp();
    const password = btoa(SHORTCODE + PASSKEY + timestamp);
    const phoneClean = data.phone.replace(/^0+/, "254").replace(/^\+/, "");

    const res = await fetch(
      "https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          BusinessShortCode: SHORTCODE,
          Password: password,
          Timestamp: timestamp,
          TransactionType: "CustomerPayBillOnline",
          Amount: Math.round(data.amount),
          PartyA: phoneClean,
          PartyB: SHORTCODE,
          PhoneNumber: phoneClean,
          CallBackURL: CALLBACK_URL,
          AccountReference: data.reference.slice(0, 12),
          TransactionDesc: data.description.slice(0, 30),
        }),
      },
    );
    const result = await res.json();
    if (result.errorCode) throw new Error(result.errorMessage ?? "M-Pesa error");
    return { checkoutRequestID: result.CheckoutRequestID, merchantRequestID: result.MerchantRequestID };
  });

export const mpesaQueryStatus = createServerFn({ method: "POST" })
  .validator((d) =>
    z.object({ checkoutRequestID: z.string() }).parse(d),
  )
  .handler(async ({ data }) => {
    if (!SHORTCODE || !PASSKEY) {
      throw new Error("M-Pesa not configured yet.");
    }
    const token = await getToken();
    const timestamp = getTimestamp();
    const password = btoa(SHORTCODE + PASSKEY + timestamp);
    const res = await fetch(
      "https://api.safaricom.co.ke/mpesa/stkpushquery/v1/query",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          BusinessShortCode: SHORTCODE,
          Password: password,
          Timestamp: timestamp,
          CheckoutRequestID: data.checkoutRequestID,
        }),
      },
    );
    return await res.json();
  });
