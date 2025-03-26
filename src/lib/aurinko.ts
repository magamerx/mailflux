"use server"

import { auth } from "@clerk/nextjs/server"
import axios from "axios";
import { error } from "console";
import exp from "constants";
import { access } from "fs";
import { NextResponse } from "next/server";
import { URLSearchParams } from "url";
import { getSubscriptionStatus } from "./stripe-actions";
import { db } from "@/server/db";
import { FREE_ACCOUNTS_PER_USER, PRO_ACCOUNTS_PER_USER } from "@/constants";

export const getGoogleCode = async ()=> {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("unauthorised");
  }

  if (!process.env.GOOGLE_CLIENT_ID || !process.env.NEXT_PUBLIC_URL) {
    return "not configured";
  }

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: `${process.env.NEXT_PUBLIC_URL}/api/aurinko/callback`,
    response_type: "code",
    scope: [
      "openid",
      "email",
      "profile",
      "https://www.googleapis.com/auth/gmail.readonly",
      "https://www.googleapis.com/auth/gmail.send", // ✅ Read-only Gmail access
      "https://www.googleapis.com/auth/gmail.modify"    // ✅ Modify Gmail (optional)
    ].join(" "),
    access_type: "offline",  // ✅ Required for refresh token
    prompt: "consent"        // ✅ Ensures refresh token is issued
  });

  return `https://accounts.google.com/o/oauth2/auth?${params.toString()}`;
}

export const getGoogleToken = async (code:string)=>{
  try {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      return NextResponse.json({
          message:"not configured"
        })
  }

      const params = {
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: `${process.env.NEXT_PUBLIC_URL}/api/aurinko/callback`,
        grant_type: "authorization_code",
        code,
      };
  
      // Exchange authorization code for access & refresh tokens
      const { data } = await axios.post("https://oauth2.googleapis.com/token", null, {
        params
        // headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });

      return data;
  } catch (error) {
    console.log(error);
    return NextResponse.json({
      message:"can't get token"
    })
  }
}

export const getAccountDetails = async (access_token:string) =>{
  try{
    const { data } = await axios.get("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${access_token}`,Accept:"application/json" },
    });

    console.log("Emails:",data);
    return data;
  }catch(error){
    console.log(error);
    NextResponse.json({
      message:"can't get user details"
    })
  }
}


export const refreshGoogleToken = async (refreshToken: string) => {
  try {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      return NextResponse.json({ message: "Not configured" });
    }

    const params = {
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    };

    const { data } = await axios.post("https://oauth2.googleapis.com/token", null, { params });

    return data;
  } catch (error) {
    console.error("Error refreshing Google token:", error);
    return NextResponse.json({ message: "Can't refresh token" });
  }
};

////////aurinko


// "use server"

// import axios from "axios";

// export const getAurinkoCode = async () => {
//   if (!process.env.AURINKO_CLIENT_ID || !process.env.NEXT_PUBLIC_URL) {
//     return "not configured";
//   }

//   const params = new URLSearchParams({
//     clientId: process.env.AURINKO_CLIENT_ID as string, 
//     serviceType: "Google", // or another service you need
//     responseType: "token",
//     returnUrl: `${process.env.NEXT_PUBLIC_URL}/api/aurinko/callback`, // Must be registered in Aurinko portal
//     scopes: "Mail.Read Mail.ReadWrite Mail.Send Mail.Drafts Mail.All", // Update scopes based on Aurinko.io
//     state:"CustomStateString"
//   });

//   return `https://api.aurinko.io/v1/auth/authorize?${params.toString()}`;
// }


// export const exchangeCodeForAccessToken = async (code:string)=>{
//   try {
//     console.log(code);
//     const response = await axios.post(`https://api.aurinko.io/v1/auth/token/${code}`, {}, {
//       auth: {
//           username: process.env.AURINKO_CLIENT_ID as string,
//           password: process.env.AURINKO_CLIENT_SECRET as string
//       }
//   })
//   console.log('EXCHAnged TOKEN:');
  
//   console.log(response.data);

//   return response.data as {
//       accountId: number,
//       accessToken: string,
//       userId: string,
//       userSession: string
//   }
//   } catch (error) {
//     if(axios.isAxiosError(error)){
//       console.error(error.response?.data);
//     }
//     console.error(error);
//   }
// }