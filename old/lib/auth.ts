import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        username: { label: "Логин", type: "text" },
        password: { label: "Пароль", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null;

        const account = await prisma.account.findUnique({
          where: { username: credentials.username as string },
          include: { user: true },
        });

        if (!account) return null;

        const valid = await bcrypt.compare(
          credentials.password as string,
          account.password
        );
        if (!valid) return null;

        return {
          id: String(account.userId),
          name: [account.user.lastName, account.user.firstName]
            .filter(Boolean).join(" ") || account.username,
          email: account.user.email ?? undefined,
          role: account.user.role,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
      }
      return token;
    },
    session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        (session.user as any).role = token.role;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
});
