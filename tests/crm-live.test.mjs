import test from "node:test";
import assert from "node:assert/strict";

const config = {
  url: process.env.CRM_TEST_SUPABASE_URL,
  anonKey: process.env.CRM_TEST_SUPABASE_ANON_KEY,
  email: process.env.CRM_TEST_USER_EMAIL,
  password: process.env.CRM_TEST_USER_PASSWORD,
};
const configured = Object.values(config).every(Boolean);

test("live CRM login, RLS read and performance RPC", { skip: !configured }, async () => {
  const auth = await fetch(`${config.url}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: config.anonKey, "Content-Type": "application/json" },
    body: JSON.stringify({ email: config.email, password: config.password }),
  });
  assert.equal(auth.status, 200, await auth.text());
  const session = await auth.json();
  assert.ok(session.access_token);
  const headers = { apikey: config.anonKey, Authorization: `Bearer ${session.access_token}` };

  const opportunities = await fetch(`${config.url}/rest/v1/crm_opportunities?select=id,assigned_to&limit=5`, { headers });
  assert.equal(opportunities.status, 200, await opportunities.text());
  assert.ok(Array.isArray(await opportunities.json()));

  const report = await fetch(`${config.url}/rest/v1/rpc/rex_crm_performance`, {
    method: "POST", headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({ p_from: new Date().toISOString().slice(0, 10), p_to: new Date().toISOString().slice(0, 10) }),
  });
  assert.equal(report.status, 200, await report.text());
  assert.ok(Array.isArray(await report.json()));
});
