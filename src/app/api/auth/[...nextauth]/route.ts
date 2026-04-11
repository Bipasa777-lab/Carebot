import NextAuth from "next-auth";
import { authOptions as NEXT_AUTH_OPTIONS } from "@/lib/auth";

// This route file only exports the NextAuth handlers.
const handler = NextAuth(NEXT_AUTH_OPTIONS as any);

export { handler as GET, handler as POST };
