import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/db";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const [existingUser] = await db
          .select()
          .from(user)
          .where(eq(user.email, credentials.email.trim().toLowerCase()))
          .limit(1);

        if (!existingUser || !existingUser.passwordHash) {
          return null;
        }

        const isValid = await bcrypt.compare(
          credentials.password,
          existingUser.passwordHash
        );

        if (!isValid) {
          return null;
        }

        return {
          id: String(existingUser.id),
          email: existingUser.email,
          name: "Admin Bappeda",
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        (session.user as any).id = token.id;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET || "dev-secret-bppddmi-videotron-2026",
};

export function getGradientAvatar(): string {
  return "from-emerald-600 to-teal-800";
}
