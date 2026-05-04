import NextAuth from "next-auth";
import { DrizzleAdapter } from "@auth/drizzle-adapter"
import { db } from "@/db";
import { accounts, authenticators, sessions, users } from "@/db/schema";
import dotenv from 'dotenv';
import Google from "next-auth/providers/google";

dotenv.config({ path: ".env.local" });

export const { handlers, signIn, signOut, auth } = NextAuth({
    providers: [Google],
    callbacks: {
        authorized: async ({ auth }) => {
            return !!auth
        },
        jwt({ token, user }) {
            if (user) {
                token.id = user.id; // Store user ID in the token
            }

            return token;
        },
        session({ session, token }) {
            if (token?.id) {
                //@ts-expect-error type
                session.user.id = token.id; // Pass the user ID to the session
            }

            return session;
        }
    },
    adapter: DrizzleAdapter(db, {
        usersTable: users,
        accountsTable: accounts,
        sessionsTable: sessions,
        authenticatorsTable: authenticators
    }),
})