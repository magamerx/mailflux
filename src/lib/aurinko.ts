"use server"

import { auth } from "@clerk/nextjs/server"

export const getAurinkoAuthUrl = async (
  serviceType: 
    | "Google" | "Office365"
) => {
  const { userId } = await auth();
  if (!userId) throw new Error("unauthorized");

  // Check if required env variables are defined
  if (!process.env.AURINKO_CLIENT_ID || !process.env.NEXT_PUBLIC_URL) {
    throw new Error("Missing required environment variables");
  }

  const params = new URLSearchParams({
    clientId: process.env.AURINKO_CLIENT_ID as string,
    serviceType,
    scopes: "Mail.Read Mail.ReadWrite Mail.Send Mail.Drafts Mail.All",
    responseType: "code",
    returnUrl: `${process.env.NEXT_PUBLIC_URL}/api/aurinko/callback`,
    ensureAccess: "true", // Ensures permissions are granted
    state: userId, // Optional: Helps track requests
  });

  return `https://api.aurinko.io/v1/auth/authorize?${params.toString()}`;
};
