import { auth, currentUser } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";

/**
 * Gate the private dashboard.
 *
 * - Always requires a signed-in Clerk session (`auth.protect()`).
 * - If `ADMIN_ALLOWED_EMAILS` is set (comma-separated), only those addresses
 *   may enter; everyone else gets a 404 so the surface stays unadvertised.
 * - If the allowlist is unset, any signed-in user can enter (useful in local
 *   development before production keys / invite-only are wired).
 */
export async function requireAdmin() {
  await auth.protect();

  const allowlist = (process.env.ADMIN_ALLOWED_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

  if (allowlist.length === 0) {
    return;
  }

  const user = await currentUser();
  const emails =
    user?.emailAddresses.map((entry) => entry.emailAddress.toLowerCase()) ??
    [];

  if (!emails.some((email) => allowlist.includes(email))) {
    notFound();
  }
}
