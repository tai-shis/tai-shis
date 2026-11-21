import { headers } from "next/headers";
import { auth } from "@/app/lib/auth";

/** For server functions, which are reachable by direct POST and so must check the role themselves. */
export async function isAdmin(): Promise<boolean> {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user.role === "admin";
}
