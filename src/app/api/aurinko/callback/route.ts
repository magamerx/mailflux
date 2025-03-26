import { getAccountDetails, getGoogleToken } from "@/lib/aurinko";
import { db } from "@/server/db";
import { auth } from "@clerk/nextjs/server";
import axios from "axios";
import { error } from "console";
import { NextRequest, NextResponse } from "next/server";
import { URL } from "url";
import { waitUntil } from "@vercel/functions";

export const GET = async (req: NextRequest) => {
  try {
    // Authenticate user
    const { userId, getToken } = await auth();
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const url = req.nextUrl.searchParams;
    const code = url.get("code");
    if (!code) {
      return NextResponse.json({
        message: "Authorization code is missing",
      });
    }

    const data = await getGoogleToken(code as string);

    if (!data) {
      return NextResponse.json({
        message: "did't exchange token with code",
      });
    }

    console.log(JSON.stringify(data));

    const userData = await getAccountDetails(data.access_token);


    await db.account.upsert({
      where: {
        id: userData.sub.toString(),
      },
      update: {
        token: data.access_token,
        refreshToken:data.refresh_token
      },
      create: {
        id: userData.sub.toString(),
        userId,
        emailAddress: userData.email,
        name: userData.name,
        token: data.access_token,
        provider:"Google",
        refreshToken:data.refresh_token
      },
    });

    const token = await getToken(); // Get Clerk authentication token

    waitUntil(
      // Axios expects headers separately
    axios
    .post(
      `${process.env.NEXT_PUBLIC_URL}/api/initial-sync`,
      {
        userId,
        accountId: userData.sub.toString(),
      }, // Body goes here
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // Include Clerk token
        },
        withCredentials: true, // Ensure cookies are sent
      },
    )
    .then((response) => {
      console.log("Initial sync triggered", response.data);
    })
    .catch((error) => {
      console.error("Failed to trigger initial-sync", error);
    })
    )

    return NextResponse.redirect(new URL("/mail", req.url));
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
};

// /////aurinko

// export const GET = async (req: NextRequest) => {
//   try {
//     // Authenticate user
//     const { userId } = await auth();
//     if (!userId) {
//       return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
//     }

//     // const url = req.nextUrl.searchParams;
//     // const code = url.get("code");

//     // if (!code) {
//     //   return NextResponse.json({
//     //     message: "Authorization code is missing",
//     //   });
//     // }

// //    const data = exchangeCodeForAccessToken(code);
//     // return NextResponse.json({
//     //   data:data
//     // });

//   } catch (error) {
//     console.log(error);
//     return NextResponse.json(
//       { message: "Internal server error" },
//       { status: 500 },
//     );
//   }
// };
