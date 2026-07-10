import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

const googleClientId = process.env.AUTH_GOOGLE_ID?.trim();
const googleClientSecret = process.env.AUTH_GOOGLE_SECRET?.trim();
const authSecret = process.env.AUTH_SECRET?.trim();

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: authSecret,
  providers: [
    Google({
      clientId: googleClientId,
      clientSecret: googleClientSecret,
    }),
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  trustHost: true,
  callbacks: {
    jwt({ token, account }) {
      if (account?.provider === "google" && account.providerAccountId) {
        token.sub = account.providerAccountId;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
});
