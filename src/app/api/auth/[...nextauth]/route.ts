import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

// This route file intentionally only exports the NextAuth handlers.
// Auth options live in `src/lib/auth.ts` so they can be re-used across
// server functions and keep the route handler minimal.
const handler = NextAuth(authOptions as any);

export const GET = handler;
export const POST = handler;
