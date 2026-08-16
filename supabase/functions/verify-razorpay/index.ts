import { createClient } from "npm:@supabase/supabase-js@2";
import { createHmac } from "node:crypto";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, order_id, amount } = await req.json();

    const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET");
    if (!keySecret) {
      return json({ error: "Razorpay secret not configured" }, 500);
    }

    // Verify the signature: HMAC_SHA256(razorpay_order_id + "|" + razorpay_payment_id, key_secret)
    const expected = createHmac("sha256", keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expected !== razorpay_signature) {
      return json({ error: "Signature verification failed" }, 400);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Idempotency: if this payment is already verified, don't double-confirm.
    const { data: existing } = await supabase
      .from("payments")
      .select("id, status")
      .eq("razorpay_payment_id", razorpay_payment_id)
      .maybeSingle();

    if (existing && existing.status === "verified") {
      return json({ verified: true, duplicate: true });
    }

    // Record the verified payment.
    if (existing) {
      await supabase.from("payments").update({
        status: "verified", verified_at: new Date().toISOString(),
      }).eq("id", existing.id);
    } else {
      await supabase.from("payments").insert({
        order_id, razorpay_order_id, razorpay_payment_id, razorpay_signature,
        amount, method: "razorpay", status: "verified", verified_at: new Date().toISOString(),
      });
    }

    return json({ verified: true });
  } catch (err) {
    return json({ error: err.message }, 500);
  }
});
