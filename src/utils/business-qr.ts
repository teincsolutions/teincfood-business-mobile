/**
 * Business QR helpers.
 *
 * QR codes encode the universal business URL
 * (<frontend-domain>/biz/<BUSINESS_NUMBER>) so buyers and riders share one
 * code. The frontend domain comes from EXPO_PUBLIC_FRONTEND_URL so test and
 * production builds point at their own environment. Rider join needs only
 * the business number — these helpers extract it from any scanned content.
 */

const rawFrontendUrl =
  process.env.EXPO_PUBLIC_FRONTEND_URL?.trim() || "https://food.teincsolutions.com";

export const FRONTEND_URL = rawFrontendUrl.replace(/\/+$/, "");

export const BUSINESS_LINK_BASE = `${FRONTEND_URL}/biz`;

export function businessQrUrl(businessNumber: string): string {
  return `${BUSINESS_LINK_BASE}/${businessNumber.trim().toUpperCase()}`;
}

/**
 * Extract a business number from scanned QR content. Accepts:
 * - https://food.teincsolutions.com/biz/ABC-1234 (any host, /biz/ path)
 * - teincfood://biz/ABC-1234 style deep links
 * - raw ABC-1234
 * Returns the uppercased number or null when unparseable.
 */
export function extractBusinessNumber(input: string): string | null {
  const raw = (input || "").trim();
  if (!raw) return null;

  let candidate = raw;
  const pathMatch = raw.match(/\/biz\/([^/?#]+)/i);
  if (pathMatch) {
    candidate = pathMatch[1];
  } else {
    // Bare URL without /biz/ path carries no business identity.
    if (/^[a-z][a-z0-9+.-]*:\/\//i.test(raw)) return null;
  }

  try {
    candidate = decodeURIComponent(candidate);
  } catch {
    // keep raw candidate
  }

  const cleaned = candidate.trim().toUpperCase();
  if (!/^[A-Z0-9-]{3,32}$/.test(cleaned)) return null;
  return cleaned;
}
