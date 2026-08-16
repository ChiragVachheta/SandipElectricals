import { createClient } from "npm:@supabase/supabase-js@2";

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

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "").trim();

    if (!token) return json({ error: "Unauthorized" }, 401);

    // Verify the admin session token is valid and not expired.
    const { data: session, error: sessionErr } = await supabase
      .from("admin_sessions")
      .select("token, expires_at, revoked")
      .eq("token", token)
      .maybeSingle();

    if (sessionErr || !session || session.revoked) {
      return json({ error: "Unauthorized" }, 401);
    }
    if (new Date(session.expires_at).getTime() < Date.now()) {
      return json({ error: "Session expired" }, 401);
    }

    const url = new URL(req.url);
    const path = url.pathname.replace("/functions/v1/admin-api", "");
    const method = req.method;

    // ---------- CATEGORIES ----------
    if (path === "/categories" && method === "GET") {
      const { data } = await supabase.from("categories").select("*").order("sort_order");
      return json(data);
    }
    if (path === "/categories" && method === "POST") {
      const body = await req.json();
      const { data, error } = await supabase.from("categories").insert(body).select().single();
      if (error) return json({ error: error.message }, 400);
      return json(data);
    }
    if (path.startsWith("/categories/") && method === "PUT") {
      const id = path.split("/")[2];
      const body = await req.json();
      const { data, error } = await supabase.from("categories").update(body).eq("id", id).select().single();
      if (error) return json({ error: error.message }, 400);
      return json(data);
    }
    if (path.startsWith("/categories/") && method === "DELETE") {
      const id = path.split("/")[2];
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) return json({ error: error.message }, 400);
      return json({ success: true });
    }

    // ---------- BRANDS ----------
    if (path === "/brands" && method === "GET") {
      const { data } = await supabase.from("brands").select("*").order("name");
      return json(data);
    }
    if (path === "/brands" && method === "POST") {
      const body = await req.json();
      const { data, error } = await supabase.from("brands").insert(body).select().single();
      if (error) return json({ error: error.message }, 400);
      return json(data);
    }
    if (path.startsWith("/brands/") && method === "PUT") {
      const id = path.split("/")[2];
      const body = await req.json();
      const { data, error } = await supabase.from("brands").update(body).eq("id", id).select().single();
      if (error) return json({ error: error.message }, 400);
      return json(data);
    }
    if (path.startsWith("/brands/") && method === "DELETE") {
      const id = path.split("/")[2];
      const { error } = await supabase.from("brands").delete().eq("id", id);
      if (error) return json({ error: error.message }, 400);
      return json({ success: true });
    }

    // ---------- PRODUCTS ----------
    if (path === "/products" && method === "GET") {
      const { data } = await supabase
        .from("products")
        .select("*, category:categories(id,name,slug), brand:brands(id,name,slug)")
        .order("created_at", { ascending: false });
      return json(data);
    }
    if (path === "/products" && method === "POST") {
      const body = await req.json();
      const { images, specifications, ...productFields } = body;
      const { data: prod, error } = await supabase
        .from("products").insert(productFields).select().single();
      if (error) return json({ error: error.message }, 400);

      if (images && images.length) {
        const imgs = images.map((u: string, i: number) => ({
          product_id: prod.id, image_url: u, sort_order: i,
        }));
        await supabase.from("product_images").insert(imgs);
      }
      if (specifications && specifications.length) {
        const specs = specifications.map((s: { spec_name: string; spec_value: string }, i: number) => ({
          product_id: prod.id, spec_name: s.spec_name, spec_value: s.spec_value, sort_order: i,
        }));
        await supabase.from("product_specifications").insert(specs);
      }
      return json(prod);
    }
    if (path.startsWith("/products/") && method === "PUT") {
      const id = path.split("/")[2];
      const body = await req.json();
      const { images, specifications, ...productFields } = body;
      const { data: prod, error } = await supabase
        .from("products").update(productFields).eq("id", id).select().single();
      if (error) return json({ error: error.message }, 400);

      if (images) {
        await supabase.from("product_images").delete().eq("product_id", id);
        if (images.length) {
          const imgs = images.map((u: string, i: number) => ({
            product_id: id, image_url: u, sort_order: i,
          }));
          await supabase.from("product_images").insert(imgs);
        }
      }
      if (specifications) {
        await supabase.from("product_specifications").delete().eq("product_id", id);
        if (specifications.length) {
          const specs = specifications.map((s: { spec_name: string; spec_value: string }, i: number) => ({
            product_id: id, spec_name: s.spec_name, spec_value: s.spec_value, sort_order: i,
          }));
          await supabase.from("product_specifications").insert(specs);
        }
      }
      return json(prod);
    }
    if (path.startsWith("/products/") && method === "DELETE") {
      const id = path.split("/")[2];
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) return json({ error: error.message }, 400);
      return json({ success: true });
    }

    // ---------- ORDERS ----------
    if (path === "/orders" && method === "GET") {
      const status = url.searchParams.get("status");
      const q = url.searchParams.get("q");
      let query = supabase
        .from("orders")
        .select("*, order_items(*), payments(*), address:addresses(*)")
        .order("created_at", { ascending: false });
      if (status) query = query.eq("status", status);
      if (q) query = query.ilike("order_number", `%${q}%`);
      const { data } = await query;
      return json(data);
    }
    if (path.startsWith("/orders/") && method === "PUT") {
      const id = path.split("/")[2];
      const body = await req.json();
      const { status, note } = body;
      const { data, error } = await supabase
        .from("orders").update({ status, updated_at: new Date().toISOString() }).eq("id", id)
        .select().single();
      if (error) return json({ error: error.message }, 400);
      await supabase.from("order_status_history").insert({
        order_id: id, status, note: note || null,
      });
      return json(data);
    }

    // ---------- CANCELLATION REQUESTS ----------
    if (path === "/cancellation-requests" && method === "GET") {
      const { data } = await supabase
        .from("cancellation_requests")
        .select("*, order:orders(*)")
        .order("created_at", { ascending: false });
      return json(data);
    }
    if (path.startsWith("/cancellation-requests/") && method === "PUT") {
      const id = path.split("/")[2];
      const body = await req.json();
      const { status, admin_remark } = body;
      const { data, error } = await supabase
        .from("cancellation_requests")
        .update({ status, admin_remark, resolved_at: new Date().toISOString() })
        .eq("id", id).select().single();
      if (error) return json({ error: error.message }, 400);
      // If approved, cancel the order.
      if (status === "approved") {
        await supabase.from("orders").update({
          status: "cancelled", updated_at: new Date().toISOString(),
        }).eq("id", data.order_id);
        await supabase.from("order_status_history").insert({
          order_id: data.order_id, status: "cancelled", note: "Cancellation approved by admin",
        });
      }
      return json(data);
    }

    // ---------- REPLACEMENT REQUESTS ----------
    if (path === "/replacement-requests" && method === "GET") {
      const { data } = await supabase
        .from("replacement_requests")
        .select("*, order:orders(*)")
        .order("created_at", { ascending: false });
      return json(data);
    }
    if (path.startsWith("/replacement-requests/") && method === "PUT") {
      const id = path.split("/")[2];
      const body = await req.json();
      const { status, admin_remark } = body;
      const { data, error } = await supabase
        .from("replacement_requests")
        .update({ status, admin_remark, resolved_at: new Date().toISOString() })
        .eq("id", id).select().single();
      if (error) return json({ error: error.message }, 400);
      return json(data);
    }

    // ---------- DASHBOARD STATS ----------
    if (path === "/stats" && method === "GET") {
      const [{ data: orders }, { data: products }, { data: cancellations }, { data: replacements }] = await Promise.all([
        supabase.from("orders").select("total, status"),
        supabase.from("products").select("id, status"),
        supabase.from("cancellation_requests").select("id, status"),
        supabase.from("replacement_requests").select("id, status"),
      ]);
      const revenue = (orders || []).reduce((s: number, o: any) => s + Number(o.total || 0), 0);
      return json({
        revenue,
        orderCount: orders?.length || 0,
        productCount: products?.length || 0,
        pendingCancellations: (cancellations || []).filter((c: any) => c.status === "pending").length,
        pendingReplacements: (replacements || []).filter((r: any) => r.status === "pending").length,
      });
    }

    // ---------- LOGOUT ----------
    if (path === "/logout" && method === "POST") {
      await supabase.from("admin_sessions").update({ revoked: true }).eq("token", token);
      return json({ success: true });
    }

    return json({ error: "Not found" }, 404);
  } catch (err) {
    return json({ error: err.message }, 500);
  }
});
