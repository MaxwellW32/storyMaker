"use server";
import { auth } from "@/auth/auth";

export async function sessionCheck() {
    const session = await auth();

    if (session === null) throw new Error("No session found");

    return session;
}
