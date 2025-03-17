import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import axios from "axios";

export async function GET(req: NextRequest) {
    const { sessionId, getToken } = await auth();

    if (!sessionId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const token = await getToken(); // Get Clerk authentication token

        // Axios expects headers separately
        const response = await axios.post(
            "http://localhost:3000/api/hello",
            { message: "Hello from GET" }, // Body goes here
            {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`, // Include Clerk token
                },
                withCredentials: true, // Ensure cookies are sent
            }
        );

        return NextResponse.json({ message: response.data });
    } catch (error) {
        console.error("Axios error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const { sessionId } = await auth();

    if (!sessionId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    return NextResponse.json({ message: `Received: ${body.message}`, userId: sessionId });
}
