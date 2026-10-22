/**
 * URL Security & Validation Utility for NagrikSetu
 * Prevents XSS via malicious URI schemes: javascript:, data:, vbscript:, file:
 */

const ALLOWED_PROTOCOLS = new Set(["http:", "https:"]);

export function isSafeUrl(urlString: string | null | undefined): boolean {
  if (!urlString || typeof urlString !== "string") return false;

  const trimmed = urlString.trim();
  if (!trimmed) return false;

  // Reject explicit script/data patterns immediately
  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith("javascript:") ||
    lower.startsWith("data:") ||
    lower.startsWith("vbscript:") ||
    lower.startsWith("file:")
  ) {
    return false;
  }

  try {
    const parsed = new URL(trimmed);
    return ALLOWED_PROTOCOLS.has(parsed.protocol);
  } catch {
    // If relative path starting with '/', consider safe for internal links
    if (trimmed.startsWith("/") && !trimmed.startsWith("//")) {
      return true;
    }
    return false;
  }
}

export function sanitizeUrl(urlString: string | null | undefined, fallback: string = "#"): string {
  if (!urlString) return fallback;
  return isSafeUrl(urlString) ? urlString.trim() : fallback;
}
