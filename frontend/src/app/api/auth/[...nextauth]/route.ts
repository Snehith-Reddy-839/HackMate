import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const rawApiUrl = process.env.INTERNAL_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
const BACKEND_API_URL = rawApiUrl.replace(/\/+$/, '');

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: (process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_CLIENT_ID || '') as string,
      clientSecret: (process.env.AUTH_GOOGLE_SECRET || process.env.GOOGLE_CLIENT_SECRET || '') as string,
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account?.provider === 'google' && profile) {
        try {
          const res = await fetch(`${BACKEND_API_URL}/auth/google`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: profile.email, name: profile.name })
          });
          const data = await res.json();
          if (res.ok) {
            token.accessToken = data.access_token;
          }
        } catch (e) {
          console.error("Error exchanging Google token with backend:", e);
        }
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string;
      return session;
    }
  },
  pages: {
    signIn: '/login',
  },
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };
