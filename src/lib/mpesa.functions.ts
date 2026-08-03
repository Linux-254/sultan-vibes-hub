import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const CONSUMER_KEY =
  process.env.MPESA_CONSUMER_KEY ?? "fLBJ3szAG4Z4RfPHV7Bpx3EgekBpzA0GcXtwssqiraAH2njP";
const CONSUMER_SECRET =
  process.env.MPESA_CONSUMER_SECRET ??
  "dDORASu9wp4PARVYwH8PJU7DqrVHSGTgKmPpkOLPhCRLCQW4qgIAEeRphw1tKjmy";
// Daraja sandbox defaults — 174379 is the standard test till and the passkey is
// Safaricom's public sandbox passkey. Override with real credentials via env.
const PASSKEY =
  process.env.MPESA_PASSKEY ?? "bfb279f9aa9bdbcf158e97dd9a467552e2d03a9931ed85d6daaf27f11d3e5c8";
const SHORTCODE = process.env.MPESA_SHORTCODE ?? "174379";
const MPESA_API_BASE = process.env.MPESA_API_BASE ?? "https://sandbox.safaricom.co.ke";
const CALLBACK_URL =
  process.env.MPESA_CALLBACK_URL ?? "https://empirekwasultan.co.ke/api/mpesa-callback";

let cachedToken: { token: string; expires: number } | null = null;

async function getToken() {
  if (cachedToken && Date.now() < cachedToken.expires) return cachedToken.token;
  const auth = btoa(`${CONSUMER_KEY}:${CONSUMER_SECRET}`);
  const res = await fetch(`${MPESA_API_BASE}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: { Authorization: `Basic ${auth}` },
  });
  const data = await res.json();
  if (!data.access_token) throw new Error("Failed to get M-Pesa token: " + JSON.stringify(data));
  cachedToken = { token: data.access_token, expires: Date.now() + (data.expires_in - 60) * 1000 };
  return data.access_token;
}

function getTimestamp() {
  const d = new Date();
  return (
    d.getFullYear().toString() +
    String(d.getMonth() + 1).padStart(2, "0") +
    String(d.getDate()).padStart(2, "0") +
    String(d.getHours()).padStart(2, "0") +
    String(d.getMinutes()).padStart(2, "0") +
    String(d.getSeconds()).padStart(2, "0")
  );
}

export const mpesaStkPush = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d) =>
    z
      .object({
        phone: z.string().min(10).max(13),
        amount: z.number().positive(),
        reference: z.string().max(20),
        description: z.string().max(30).default("Empire Payment"),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const token = await getToken();
    const timestamp = getTimestamp();
    const password = btoa(SHORTCODE + PASSKEY + timestamp);
    const phoneClean = data.phone.replace(/^0+/, "254").replace(/^\+/, "");

    const res = await fetch(`${MPESA_API_BASE}/mpesa/stkpush/v1/processrequest`, {
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
    });
    const result = await res.json();
    if (result.errorCode) throw new Error(result.errorMessage ?? "M-Pesa error");
    return {
      checkoutRequestID: result.CheckoutRequestID,
      merchantRequestID: result.MerchantRequestID,
    };
  });

export const mpesaQueryStatus = createServerFn({ method: "POST" })
  .validator((d) => z.object({ checkoutRequestID: z.string() }).parse(d))
  .handler(async ({ data }) => {
    const token = await getToken();
    const timestamp = getTimestamp();
    const password = btoa(SHORTCODE + PASSKEY + timestamp);
    const res = await fetch(`${MPESA_API_BASE}/mpesa/stkpushquery/v1/query`, {
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
    });
    return await res.json();
  });
