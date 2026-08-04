import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";
import { rateLimit, LIMITS } from "./lib/rate-limit";
import { supabaseAdmin } from "./integrations/supabase/client.server";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m as { default?: ServerEntry }).default ?? (m as unknown as ServerEntry),
    );
  }
  return serverEntryPromise;
}

function brandedErrorResponse(): Response {
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function getClientIp(request: Request): string {
  return (
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

function rateLimitResponse(retryAfterMs: number): Response {
  const retryAfterSec = Math.ceil(retryAfterMs / 1000);
  return new Response(JSON.stringify({ error: "Too many requests. Please try again later." }), {
    status: 429,
    headers: {
      "content-type": "application/json",
      "retry-after": String(retryAfterSec),
      "X-RateLimit-Limit": "slow down",
    },
  });
}

function applyRateLimit(request: Request): Response | null {
  const url = new URL(request.url);
  const path = url.pathname;
  const ip = getClientIp(request);

  // Auth routes
  if (path === "/api/auth" || path.startsWith("/auth")) {
    const r = rateLimit(`auth:${ip}`, LIMITS.auth.limit, LIMITS.auth.windowMs);
    if (!r.allowed) return rateLimitResponse(r.retryAfterMs);
  }

  // Password reset
  if (path.includes("resetPassword") || path.includes("reset-password")) {
    const r = rateLimit(
      `pwdreset:${ip}`,
      LIMITS.passwordReset.limit,
      LIMITS.passwordReset.windowMs,
    );
    if (!r.allowed) return rateLimitResponse(r.retryAfterMs);
  }

  // SOS
  if (path === "/api/sos" || path === "/sos") {
    const r = rateLimit(`sos:${ip}`, LIMITS.sos.limit, LIMITS.sos.windowMs);
    if (!r.allowed) return rateLimitResponse(r.retryAfterMs);
  }

  // Chat
  if (path === "/api/chat" || path === "/chat") {
    const r = rateLimit(`chat:${ip}`, LIMITS.chat.limit, LIMITS.chat.windowMs);
    if (!r.allowed) return rateLimitResponse(r.retryAfterMs);
  }

  // General API catch-all
  if (path.startsWith("/api/")) {
    const r = rateLimit(`api:${ip}:${path}`, LIMITS.api.limit, LIMITS.api.windowMs);
    if (!r.allowed) return rateLimitResponse(r.retryAfterMs);
  }

  return null;
}

/**
 * Daraja STK push callback (POST /api/mpesa-callback).
 * Records the terminal result of an STK push into the payments table so a
 * payment is confirmed even if the customer closes the tab before the client
 * poll lands. Always acks with ResultCode 0 so Safaricom doesn't retry.
 */
async function handleMpesaCallback(request: Request): Promise<Response> {
  const ack = () =>
    new Response(JSON.stringify({ ResultCode: 0, ResultDesc: "Success" }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });

  try {
    let body: any;
    try {
      body = await request.json();
    } catch {
      return ack();
    }

    const stk = body?.Body?.stkCallback;
    if (!stk?.CheckoutRequestID) return ack();

    const items: { Name?: string; Value?: string | number }[] = Array.isArray(
      stk.CallbackMetadata?.Item,
    )
      ? stk.CallbackMetadata.Item
      : [];
    const getItem = (name: string) => items.find((i) => i.Name === name)?.Value;

    const receipt = getItem("MpesaReceiptNumber");
    const phone = getItem("PhoneNumber");
    const amount = getItem("Amount");
    const resultCode = String(stk.ResultCode ?? "");
    const status: "success" | "failed" = resultCode === "0" ? "success" : "failed";

    const payload = {
      checkout_request_id: stk.CheckoutRequestID,
      merchant_request_id: stk.MerchantRequestID ?? null,
      mpesa_receipt: receipt ? String(receipt) : null,
      phone: phone ? String(phone) : null,
      amount: amount != null ? Number(amount) : 0,
      currency: "KES",
      status,
      raw_callback: body,
      updated_at: new Date().toISOString(),
    };

    // The client poll may already have inserted this payment; update it if so.
    const { data: existing } = await supabaseAdmin
      .from("payments")
      .select("id")
      .eq("checkout_request_id", stk.CheckoutRequestID)
      .maybeSingle();

    if (existing) {
      const { error } = await supabaseAdmin.from("payments").update(payload).eq("id", existing.id);
      if (error) console.error("[mpesa-callback] update error", error.message);
    } else {
      const { error } = await supabaseAdmin.from("payments").insert(payload);
      if (error) console.error("[mpesa-callback] insert error", error.message);
    }
  } catch (e) {
    console.error("[mpesa-callback] handler error", e);
  }

  return ack();
}

function isCatastrophicSsrErrorBody(body: string, responseStatus: number): boolean {
  let payload: unknown;
  try {
    payload = JSON.parse(body);
  } catch {
    return false;
  }

  if (!payload || Array.isArray(payload) || typeof payload !== "object") {
    return false;
  }

  const fields = payload as Record<string, unknown>;
  const expectedKeys = new Set(["message", "status", "unhandled"]);
  if (!Object.keys(fields).every((key) => expectedKeys.has(key))) {
    return false;
  }

  return (
    fields.unhandled === true &&
    fields.message === "HTTPError" &&
    (fields.status === undefined || fields.status === responseStatus)
  );
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isCatastrophicSsrErrorBody(body, response.status)) {
    return response;
  }

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return brandedErrorResponse();
}

function addSecurityHeaders(response: Response): Response {
  const headers = new Headers(response.headers);
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("X-Frame-Options", "DENY");
  headers.set("X-XSS-Protection", "1; mode=block");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(self)");
  headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://api.fontshare.com https://cdn.fontshare.com; img-src 'self' data: blob: https:; font-src 'self' data: https://fonts.gstatic.com https://cdn.fontshare.com; connect-src 'self' https://rhdhaptcdjgnsbamgxyv.supabase.co wss://rhdhaptcdjgnsbamgxyv.supabase.co; frame-src 'self' https://www.google.com; object-src 'none'; base-uri 'self'",
  );
  // Cache static assets aggressively for repeat visits on slow networks
  try {
    const url = new URL(response.url);
    if (url.pathname.startsWith("/assets/")) {
      headers.set("Cache-Control", "public, max-age=31536000, immutable");
    } else if (url.pathname.match(/\.(js|css|webp|png|jpg|woff2?)$/)) {
      headers.set("Cache-Control", "public, max-age=31536000, immutable");
    } else if (
      url.pathname === "/" ||
      url.pathname.startsWith("/events") ||
      url.pathname.startsWith("/about") ||
      url.pathname.startsWith("/products") ||
      url.pathname.startsWith("/vibe") ||
      url.pathname.startsWith("/recap")
    ) {
      headers.set("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
    }
  } catch {}
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      const url = new URL(request.url);

      // Health check for Render
      if (url.pathname === "/health") {
        return new Response(JSON.stringify({ status: "ok", time: new Date().toISOString() }), {
          headers: { "content-type": "application/json" },
        });
      }

      // Rate limiting
      const blocked = applyRateLimit(request);
      if (blocked) return blocked;

      // M-Pesa STK push callback from Daraja — record the result server-side so
      // payments are confirmed even if the checkout tab was closed mid-poll.
      if (url.pathname === "/api/mpesa-callback") {
        return await handleMpesaCallback(request);
      }

      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      const secure = addSecurityHeaders(response);
      const normalized = await normalizeCatastrophicSsrResponse(secure);
      const ct = normalized.headers.get("content-type") ?? "";
      if (ct.includes("text/html")) {
        const body = await normalized.text();
        if (body.length > 0 && !body.startsWith("<!doctype") && !body.startsWith("<!DOCTYPE")) {
          const out = "<!DOCTYPE html>\n" + body;
          return new Response(out, {
            status: normalized.status,
            statusText: normalized.statusText,
            headers: normalized.headers,
          });
        }
        return new Response(body, {
          status: normalized.status,
          statusText: normalized.statusText,
          headers: normalized.headers,
        });
      }
      return normalized;
    } catch (error) {
      console.error(error);
      return brandedErrorResponse();
    }
  },
};
