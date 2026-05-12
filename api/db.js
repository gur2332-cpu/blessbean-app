import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const { action, payload } = req.body || {};

  try {
    // 발주 저장
    if (req.method === "POST" && action === "save_order") {
      const { data: order, error } = await supabase
        .from("orders")
        .insert(payload.order)
        .select()
        .single();

      if (error) return res.status(400).json({ error });

      if (payload.items && payload.items.length > 0) {
        const itemRows = payload.items.map(it => ({ ...it, order_id: order.id }));
        const { error: itemErr } = await supabase.from("order_items").insert(itemRows);
        if (itemErr) console.error("order_items 오류:", itemErr);
      }

      return res.status(200).json({ success: true, order });
    }

    // 거래처 이력 조회
    if (req.method === "POST" && action === "get_client_history") {
      const { data, error } = await supabase
        .from("orders")
        .select("id, created_at, order_no, group_type, total_qty, total_price, items, sms_text")
        .eq("client_name", payload.client_name)
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) return res.status(400).json({ error });
      return res.status(200).json({ data });
    }

    // 연결 테스트
    if (req.method === "POST" && action === "test") {
      const { data, error } = await supabase.from("orders").select("id").limit(1);
      if (error) return res.status(400).json({ error });
      return res.status(200).json({ success: true });
    }

    return res.status(400).json({ error: "Unknown action" });

  } catch (e) {
    return res.status(500).json({ error: { message: e.message } });
  }
}
