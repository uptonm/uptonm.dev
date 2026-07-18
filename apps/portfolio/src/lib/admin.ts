import { auth } from "@clerk/nextjs/server";

/** Gate the private dashboard — any signed-in Clerk session. */
export async function requireAdmin() {
  await auth.protect();
}
