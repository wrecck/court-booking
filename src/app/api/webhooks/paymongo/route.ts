import { createHmac, timingSafeEqual } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasSupabaseEnv } from "@/lib/env";

function verifySignature(rawBody: string, signatureHeader: string, secret: string, liveMode: boolean) {
  const parts = Object.fromEntries(signatureHeader.split(",").map((part) => part.trim().split("=")));
  const expected = createHmac("sha256", secret).update(`${parts.t}.${rawBody}`).digest("hex");
  const supplied = liveMode ? parts.li : parts.te;
  if (!supplied || expected.length !== supplied.length) return false;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(supplied));
}

export async function POST(request: Request) {
  if (!hasSupabaseEnv() || !process.env.PAYMONGO_WEBHOOK_SECRET) return Response.json({ error: "Webhook is not configured." }, { status: 503 });
  const rawBody = await request.text();
  const signature = request.headers.get("paymongo-signature") ?? "";
  const liveMode = process.env.PAYMONGO_LIVE_MODE === "true";
  if (!verifySignature(rawBody, signature, process.env.PAYMONGO_WEBHOOK_SECRET, liveMode)) return Response.json({ error: "Invalid signature." }, { status: 401 });

  const payload = JSON.parse(rawBody) as { data?: { id?: string; attributes?: { type?: string; data?: { id?: string; attributes?: { amount?: number; metadata?: Record<string, string>; status?: string } } } } };
  const eventId = payload.data?.id;
  const eventType = payload.data?.attributes?.type;
  if (!eventId || !eventType) return Response.json({ error: "Malformed event." }, { status: 400 });
  const supabase = createAdminClient();
  const { error } = await supabase.rpc("process_paymongo_webhook", {
    p_event_id: eventId,
    p_event_type: eventType,
    p_payload: payload,
    p_live_mode: liveMode,
  });
  if (error) return Response.json({ error: "Webhook processing failed." }, { status: 500 });
  return Response.json({ received: true });
}
