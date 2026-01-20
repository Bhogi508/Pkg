import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

serve(async (req) => {

  // ---------- CORS ----------
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
      }
    });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ success: false, message: "Only POST allowed" }),
      { status: 405 }
    );
  }

  // ---------- BODY ----------
  let body;
  try {
    body = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ success: false, message: "Invalid JSON body" }),
      { status: 400 }
    );
  }

  const msisdn = body.msisdn;
  const otp = body.otp;

  if (!msisdn || !otp) {
    return new Response(
      JSON.stringify({ success: false, message: "msisdn and otp required" }),
      { status: 400 }
    );
  }

  // ---------- FORM DATA ----------
  const form = new URLSearchParams();
  form.append("action", "wptp_mydjuice_products_activation");
  form.append("security", Deno.env.get("TELENOR_NONCE"));
  form.append("tp_activation_obj[msisdn]", msisdn);
  form.append("tp_activation_obj[tp_offer_product_id]", "M81C165GU5O");
  form.append("tp_activation_obj[tp_activation_action]", "tp-mydjuice");
  form.append("tp_activation_obj[tp_offer_name]", "");
  form.append("tp_activation_obj[tp_loading]", "true");
  form.append("tp_activation_obj[tp_otp]", otp);

  // ---------- REQUEST ----------
  let response;
  try {
    response = await fetch(
      "https://www.telenor.com.pk/wp-admin/admin-ajax.php",
      {
        method: "POST",
        headers: {
          "accept": "application/json, text/javascript, */*; q=0.01",
          "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
          "x-requested-with": "XMLHttpRequest",
          "origin": "https://www.telenor.com.pk",
          "referer": "https://www.telenor.com.pk/my-offer/",
          "user-agent": "Mozilla/5.0 (Linux; Android 10)",
          "cookie": Deno.env.get("TELENOR_COOKIE")
        },
        body: form
      }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, message: "Fetch failed", error: err.message }),
      { status: 500 }
    );
  }

  // ---------- RESPONSE ----------
  let data;
  try {
    data = await response.json();
  } catch {
    data = { raw: await response.text() };
  }

  return new Response(
    JSON.stringify({ success: true, telenor_response: data }),
    {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    }
  );
});
