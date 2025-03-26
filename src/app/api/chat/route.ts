import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { auth } from "@clerk/nextjs/server";
import { OramaClient } from "@/lib/orama";
import { getSubscriptionStatus } from "@/lib/stripe-actions";
import { FREE_CREDITS_PER_DAY } from "@/constants";

// Initialize Google Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
    const today = new Date().toDateString();

    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        // Extract user message and accountId
        const { messages, accountId } = await req.json();

        const orama = new OramaClient(accountId);
        await orama.initialize();

        // Retrieve context from vector search
        const lastMessage = messages[messages.length - 1];
        const context = await orama.vectorSearch({ term: lastMessage.content });
        console.log(context.hits.length + " hits found");

        // Create prompt
        const prompt = `
        You are an AI email assistant embedded in an email client app. 
        Your purpose is to help the user compose emails by answering questions, providing suggestions, 
        and offering relevant information based on the context of their previous emails.

        THE TIME NOW IS ${new Date().toLocaleString()}
        
        START CONTEXT BLOCK
        ${context.hits.map((hit) => JSON.stringify(hit.document)).join("\n")}
        END OF CONTEXT BLOCK
        
        When resconditionponding:
        - Be helpful, clever, and articulate.
        - Use the provided email context to inform your response.
        - If the context lacks enough information, politely indicate that.
        - Do not speculate or invent details beyond the given context.
        - Keep responses concise and relevant to the email being composed.
        `;

        // Generate AI response using Gemini 2 Flash
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
        const result = await model.generateContentStream(prompt);

        // Create a readable stream to return to the client
        const encoder = new TextEncoder();
        const stream = new ReadableStream({
            async start(controller) {
                for await (const chunk of result.stream) {
                    controller.enqueue(encoder.encode(chunk.text())); // Send chunked response
                }
                controller.close(); // Close stream when done
            }
        });

        /// Return streaming response
        return new Response(stream, {
            headers: { "Content-Type": "text/plain" },
        });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "error" }, { status: 500 });
    }
}
