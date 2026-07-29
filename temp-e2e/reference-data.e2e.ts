/**
 * Temporary reference-data E2E test.
 *
 * Verifies the three new offline-first endpoints:
 *   - GET /businesses/:business_id/reference-versions
 *   - GET /businesses/:business_id/reference-data
 *   - GET /businesses/:business_id/reference-changes
 *
 * Pre-requisites: backend running, valid seller credentials.
 */

const API_URL = process.env.E2E_API_URL || "http://localhost:4000";
const EMAIL = process.env.E2E_EMAIL || "seller@teincfood.local";
const PASSWORD = process.env.E2E_PASSWORD || "password123";
let BUSINESS_ID = process.env.E2E_BUSINESS_ID || "";

async function request(method: string, path: string, body?: unknown, token?: string) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_URL}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
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
  const result = await request("POST", "/api/v1/auth/login", { email: EMAIL, password: PASSWORD });
  const token = result.access_token;
  if (!token) throw new Error("Login did not return access_token");
  return token;
}

async function discoverBusiness(token: string): Promise<string> {
  if (BUSINESS_ID) return BUSINESS_ID;
  const result = await request("GET", "/api/v1/businesses/me", undefined, token);
  const businesses = result.data as Array<{ id: string }>;
  if (!businesses || businesses.length === 0) {
    throw new Error("No businesses found for user; set E2E_BUSINESS_ID");
  }
  BUSINESS_ID = businesses[0].id;
  console.log("[Reference E2E] Discovered business", BUSINESS_ID);
  return BUSINESS_ID;
}

async function main() {
  if (!EMAIL || !PASSWORD) {
    console.error("Set E2E_EMAIL and E2E_PASSWORD");
    process.exit(1);
  }

  const token = await login();
  await discoverBusiness(token);

  console.log("[Reference E2E] Fetching versions");
  const versions = await request("GET", `/api/v1/businesses/${BUSINESS_ID}/reference-versions`, undefined, token);
  const keys = (versions.data as Array<{ key: string; version: string }>).map((v) => v.key);
  if (!keys.includes("menu:items") || !keys.includes("menu:categories")) {
    throw new Error(`Missing keys: ${keys.join(", ")}`);
  }

  console.log("[Reference E2E] Fetching data");
  const data = await request(
    "GET",
    `/api/v1/businesses/${BUSINESS_ID}/reference-data?keys=menu:items,menu:categories`,
    undefined,
    token,
  );
  if (!data.data["menu:items"] || !data.data["menu:categories"]) {
    throw new Error("Reference data missing expected keys");
  }

  console.log("[Reference E2E] Fetching changes");
  const changes = await request(
    "GET",
    `/api/v1/businesses/${BUSINESS_ID}/reference-changes?key=menu:items&from_version=0`,
    undefined,
    token,
  );
  if (changes.data.key !== "menu:items") {
    throw new Error("Change set key mismatch");
  }

  console.log("[Reference E2E] PASS");
}

main().catch((error) => {
  console.error("[Reference E2E] FAIL", error);
  process.exit(1);
});
