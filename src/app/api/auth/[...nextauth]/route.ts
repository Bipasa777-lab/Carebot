import NextAuth from "next-auth";

// NextAuth configured with no OAuth providers. Local JWT-based auth
// (the application's own /api/auth/login route) will handle username/password flows.
export const authOptions = {
  providers: [],
  secret: process.env.NEXTAUTH_SECRET || undefined,
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user, account, profile }) {
      // No OAuth providers; preserve token as-is
      return token;
    },
    async session({ session, token }) {
      if (token) {
        (session as any).user = token.user || session.user;
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions as any);

export { handler as GET, handler as POST };
