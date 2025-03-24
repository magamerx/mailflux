import { Account } from "@/lib/account";
import { syncEmailToDatabase } from "@/lib/sync-to-db";
import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";
import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export  const GET = async (req:NextRequest)=>{
    const token = "ya29.a0AeXRPp6RD9dJscoiU0a03MEZtlY3mBhU7yrRUZ2fkcokUmKXieCwNC77UUHhwqdi9ztM29i2cI8EoFQ-gvqOpaq0LWAl82i6NoH0zYJnC0ryPeh5Gdc8LEXWGUvUgNQf7ht2T4BicKUhY-LZAWVjmSJN4llyUQ00z0BsiKHXaCgYKARQSARESFQHGX2MilYoqzT-GZWX6cpJnX_DRug0175";
    const nextDeltaToken="";

    const account = new Account(token);
    // const sync = await account.startSync();

    const email = await account.getUpdatedEmails("475960");
    // const save = await syncEmailToDatabase([email],accountId);

    return NextResponse.json({
        email:email.data
    });
}

// async function main() {
//     const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
//     const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
//     const prompt = "How does AI work?";
  
//     const result = await model.generateContent(prompt);
//     console.log(result.response.text());
//   }


// export  const GET = async (req:NextRequest)=>{

//     main();
//     return NextResponse.json({
//         msg:"success"
//     })
    
// }