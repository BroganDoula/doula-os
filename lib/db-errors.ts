export function isFKViolation(err: unknown): boolean {
  if (typeof err !== "object" || err === null) return false;
  const e = err as Record<string, unknown>;
  // Direct code (NeonDbError, pg, standard drivers)
  if (e.code === "23503") return true;
  // Wrapped in cause (some Drizzle/driver versions)
  const cause = e.cause;
  if (typeof cause === "object" && cause !== null) {
    if ((cause as Record<string, unknown>).code === "23503") return true;
  }
  // Message-text fallback — catches any remaining wrapping
  if (typeof e.message === "string" && e.message.includes("violates foreign key constraint")) return true;
  return false;
}
