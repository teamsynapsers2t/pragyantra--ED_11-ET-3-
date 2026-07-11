/**
 * Admin gate. Only Clerk user IDs listed in ADMIN_CLERK_IDS (comma-separated)
 * may reach admin/debug endpoints. If the env var is unset, NOBODY is admin —
 * fail closed. Never trust a client-supplied flag for this.
 */
const ADMIN_USER_IDS = (process.env.ADMIN_CLERK_IDS || "").split(",").map(s => s.trim()).filter(Boolean);

export function isAdmin(userId: string | null | undefined): boolean {
  if (!userId || ADMIN_USER_IDS.length === 0) return false;
  return ADMIN_USER_IDS.includes(userId);
}
