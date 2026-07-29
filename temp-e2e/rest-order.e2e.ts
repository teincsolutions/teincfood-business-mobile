/**
 * Temporary REST E2E test for offline-first POS command reconciliation.
 *
 * Pre-requisites:
 *   - Backend running at the URL in E2E_API_URL (default: http://localhost:4000)
 *   - A seller account with an owned business and at least one menu item.
 *
 * Environment variables:
 *   E2E_API_URL      - backend base URL
 *   E2E_EMAIL        - test account email
 *   E2E_PASSWORD     - test account password
 *   E2E_BUSINESS_ID  - business UUID
 *   E2E_MENU_ITEM_ID - menu item UUID (optional; first item is used otherwise)
 */

const API_URL = process.env.E2E_API_URL || "http://localhost:4000";
const EMAIL = process.env.E2E_EMAIL || "";
const PASSWORD = process.env.E2E_PASSWORD || "";
const BUSINESS_ID = process.env.E2E_BUSINESS_ID || "";
const MENU_ITEM_ID = process.env.E2E_MENU_ITEM_ID || "";

async function request(method: string, path: string, body?: unknown, token?: string) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await response.text();
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} ${path}: ${JSON.stringify(data)}`);
  }

  return data as Record<string, any>;
}

async function login(): Promise<string> {
  const result = await request("POST", "/api/v1/auth/login", {
    email: EMAIL,
    password: PASSWORD,
  });
  return result.data.access_token;
}

async function getMenuItem(token: string): Promise<string> {
  if (MENU_ITEM_ID) return MENU_ITEM_ID;
  const result = await request("GET", `/api/v1/businesses/${BUSINESS_ID}/menu/items`, undefined, token);
  const items = result.data as Array<{ id: string }>;
  if (!items || items.length === 0) {
    throw new Error("No menu items found for business; set E2E_MENU_ITEM_ID");
  }
  return items[0].id;
}

async function main() {
  if (!EMAIL || !PASSWORD || !BUSINESS_ID) {
    console.error("Set E2E_EMAIL, E2E_PASSWORD and E2E_BUSINESS_ID");
    process.exit(1);
  }

  const token = await login();
  const menuItemId = await getMenuItem(token);
  const commandId = `cmd_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const localOrderNumber = `TFL-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-0001`;

  const payload = {
    order_type: "takeout",
    pos_payment_method: "cash",
    customer_name: "E2E Customer",
    command_id: commandId,
    local_order_number: localOrderNumber,
    items: [{ menu_item_id: menuItemId, quantity: 1 }],
  };

  console.log("[REST E2E] Creating order with command_id", commandId);
  const first = await request("POST", `/api/v1/businesses/${BUSINESS_ID}/pos/orders`, payload, token);
  const firstId = first.data.id;
  const firstLocal = first.data.local_order_number;
  const firstOrderNumber = first.data.order_number;

  console.log("[REST E2E] Created order", firstId, "order_number", firstOrderNumber, "local", firstLocal);

  if (firstLocal !== localOrderNumber) {
    throw new Error(`local_order_number mismatch: ${firstLocal} !== ${localOrderNumber}`);
  }

  console.log("[REST E2E] Replaying same command_id");
  const second = await request("POST", `/api/v1/businesses/${BUSINESS_ID}/pos/orders`, payload, token);
  const secondId = second.data.id;

  if (secondId !== firstId) {
    throw new Error(`Idempotency failed: ${secondId} !== ${firstId}`);
  }

  console.log("[REST E2E] PASS: same order returned for duplicate command_id");
}

main().catch((error) => {
  console.error("[REST E2E] FAIL", error);
  process.exit(1);
});
