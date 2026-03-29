import { PrismaAdapter } from "@auth/prisma-adapter";
import { UserRole } from "@prisma/client";
import { compare } from "bcryptjs";
import { getServerSession, type NextAuthOptions } from "next-auth";
import type { Adapter } from "next-auth/adapters";
import CredentialsProvider from "next-auth/providers/credentials";
import FacebookProvider from "next-auth/providers/facebook";
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";

import { db } from "@/lib/db";

function normalizedSuperAdminEmails() {
  const fromSuperAdminEnv = process.env.SUPERADMIN_EMAILS;
  const fallback = process.env.ADMIN_EMAILS;

  const source = fromSuperAdminEnv && fromSuperAdminEnv.trim() ? fromSuperAdminEnv : fallback;

  return new Set(
    (source ?? "")
      .split(",")
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function isSuperAdminEmail(email?: string | null) {
  if (!email) {
    return false;
  }

  return normalizedSuperAdminEmails().has(email.toLowerCase());
}

const providers: NextAuthOptions["providers"] = [
  CredentialsProvider({
    name: "Correo y contrasena",
    credentials: {
      email: { label: "Correo", type: "email" },
      password: { label: "Contrasena", type: "password" },
    },
    async authorize(credentials) {
      const email = credentials?.email;
      const password = credentials?.password;

      if (!email || !password || typeof email !== "string" || typeof password !== "string") {
        return null;
      }

      const user = await db.user.findUnique({
        where: { email: email.toLowerCase() },
      });

      if (!user?.passwordHash) {
        return null;
      }

      const isValid = await compare(password, user.passwordHash);
      if (!isValid) {
        return null;
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        role: user.role,
      };
    },
  }),
];

if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  );
}

if (process.env.AUTH_FACEBOOK_ID && process.env.AUTH_FACEBOOK_SECRET) {
  providers.push(
    FacebookProvider({
      clientId: process.env.AUTH_FACEBOOK_ID,
      clientSecret: process.env.AUTH_FACEBOOK_SECRET,
    }),
  );
}

if (process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET) {
  providers.push(
    GitHubProvider({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
    }),
  );
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db) as Adapter,
  session: {
    // Credentials provider requires JWT-based sessions.
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers,
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.role = (user.role as UserRole) ?? UserRole.CUSTOMER;
      }

      if (token.email && isSuperAdminEmail(token.email)) {
        token.role = UserRole.SUPERADMIN;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.role = (token.role as UserRole) ?? UserRole.CUSTOMER;
      }

      return session;
    },
    async signIn({ user }) {
      if (!user.email) {
        return true;
      }

      if (!isSuperAdminEmail(user.email)) {
        return true;
      }

      await db.user
        .update({
          where: { email: user.email.toLowerCase() },
          data: { role: UserRole.SUPERADMIN },
        })
        .catch(() => null);

      user.role = UserRole.SUPERADMIN;

      return true;
    },
  },
  secret: process.env.AUTH_SECRET,
};

export async function getCurrentSession() {
  return getServerSession(authOptions);
}
