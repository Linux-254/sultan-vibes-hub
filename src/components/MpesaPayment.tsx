import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { Smartphone, CheckCircle, XCircle, Loader2, X } from "lucide-react";

interface MpesaPaymentProps {
  amount: number;
  reference: string;
  description?: string;
  onSuccess: (paymentId: string) => void;
  onClose: () => void;
  open: boolean;
}

export function MpesaPayment({
  amount,
  reference,
  description,
  onSuccess,
  onClose,
  open,
}: MpesaPaymentProps) {
  const { user } = useAuth();
  const [phone, setPhone] = useState("");
  const [step, setStep] = useState<"form" | "sent" | "polling" | "success" | "failed">("form");
  const [checkoutId, setCheckoutId] = useState("");
  const [errMsg, setErrMsg] = useState("");

  // Prefill the M-Pesa number from the signed-in user's saved profile
  // so the cart/checkout flow doesn't ask for a number they already gave us.
  useEffect(() => {
    if (!open || !user) return;
    (async () => {
      try {
        const { data } = await supabase
          .from("profiles")
          .select("phone")
          .eq("id", user.id)
          .maybeSingle();
        if (data?.phone && !phone) setPhone(data.phone);
      } catch {
        // profile lookup is best-effort; user can still type a number
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, user]);

  const reset = useCallback(() => {
    setPhone("");
    setStep("form");
    setCheckoutId("");
    setErrMsg("");
  }, []);

  const submit = async () => {
    const cleaned = phone.replace(/[\s\-]/g, "");
    if (cleaned.length < 10) return toast.error("Enter a valid M-Pesa phone number");
    setStep("sent");
    try {
      const { mpesaStkPush } = await import("@/lib/mpesa.functions");
      const fn = await mpesaStkPush({
        data: { phone: cleaned, amount, reference, description: description ?? "Empire Payment" },
      });
      setCheckoutId(fn.checkoutRequestID);
      setStep("polling");
    } catch (e: any) {
      setErrMsg(e.message ?? "STK push failed");
      setStep("failed");
    }
  };

  useEffect(() => {
    if (step !== "polling" || !checkoutId) return;
    const interval = setInterval(async () => {
      try {
        const { mpesaQueryStatus } = await import("@/lib/mpesa.functions");
        const res = await mpesaQueryStatus({ data: { checkoutRequestID: checkoutId } });
        if (res.ResultCode === "0" || res.ResultCode === 0) {
          const receipt = res.MpesaReceiptNumber ?? res.ResultDesc ?? "";
          const { data: pay, error: payErr } = await supabase
            .from("payments")
            .insert({
              amount,
              currency: "KES",
              phone: phone.replace(/[\s\-]/g, ""),
              mpesa_receipt: receipt,
              checkout_request_id: checkoutId,
              status: "success",
            })
            .select("id")
            .single();
          if (payErr) throw payErr;
          setStep("success");
          onSuccess(pay.id);
          clearInterval(interval);
        } else if (res.ResultCode !== "1037") {
          setErrMsg(res.ResultDesc ?? "Payment failed");
          setStep("failed");
          clearInterval(interval);
        }
      } catch {}
    }, 3000);
    return () => clearInterval(interval);
  }, [step, checkoutId, amount, phone, onSuccess]);

  useEffect(() => {
    if (!open) reset();
  }, [open, reset]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="glass rounded-3xl p-6 w-full max-w-md border border-border/40 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Smartphone size={18} className="text-savanna" />
            <span className="font-display text-lg">M-Pesa</span>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 inline-flex items-center justify-center rounded-lg hover:bg-white/10"
          >
            <X size={16} className="text-foreground/50" />
          </button>
        </div>

        {step === "form" && (
          <div className="space-y-4">
            <div className="glass rounded-2xl p-4 text-center">
              <div className="text-2xl font-display text-gold">KES {amount.toLocaleString()}</div>
              <div className="text-xs text-foreground/50 mt-1">{reference}</div>
            </div>
            <div>
              <label className="eyeblock">M-Pesa phone number</label>
              <input
                name="mpesa-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 0712345678"
                maxLength={13}
                className="mt-2 w-full bg-night/60 border border-border/60 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-gold"
              />
            </div>
            <button
              onClick={submit}
              disabled={phone.length < 10}
              className="w-full rounded-2xl bg-savanna px-5 py-3 text-sm font-semibold text-white hover:opacity-90 transition disabled:opacity-50 inline-flex items-center justify-center gap-2"
            >
              <Smartphone size={16} /> Pay with M-Pesa
            </button>
          </div>
        )}

        {step === "sent" && (
          <div className="py-8 text-center space-y-3">
            <Loader2 size={32} className="mx-auto text-gold animate-spin" />
            <p className="text-sm text-foreground/70">Sending STK push to your phone...</p>
          </div>
        )}

        {step === "polling" && (
          <div className="py-8 text-center space-y-3">
            <div className="animate-pulse">
              <Smartphone size={40} className="mx-auto text-savanna" />
            </div>
            <p className="text-sm text-foreground/80 font-medium">Check your phone</p>
            <p className="text-xs text-foreground/50">
              Enter your M-Pesa PIN on the prompt that appeared on your phone.
            </p>
            <div className="flex items-center justify-center gap-1 text-xs text-foreground/40">
              <Loader2 size={12} className="animate-spin" /> Waiting for confirmation...
            </div>
          </div>
        )}

        {step === "success" && (
          <div className="py-8 text-center space-y-3">
            <CheckCircle size={40} className="mx-auto text-savanna" />
            <p className="text-sm text-foreground/80 font-medium">Payment successful!</p>
            <button onClick={onClose} className="mt-2 text-xs text-gold hover:underline">
              Close
            </button>
          </div>
        )}

        {step === "failed" && (
          <div className="py-8 text-center space-y-3">
            <XCircle size={40} className="mx-auto text-lava" />
            <p className="text-sm text-foreground/80 font-medium">Payment failed</p>
            <p className="text-xs text-foreground/50">{errMsg}</p>
            <button onClick={reset} className="mt-2 text-xs text-gold hover:underline">
              Try again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
