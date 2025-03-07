import { db } from "@/server/db";
import { NextRequest, NextResponse } from "next/server";

export const POST = async (req:NextRequest)=>{
    const {data} = await req.json();

    const emailAddress = data.email_addresses[0].email_address;
    const firstName = data.first_name;
    const lastName = data.last_name || "prototype";
    const imageUrl = data.image_url;
    const id = data.id;
    
    await db.user.create({
        data:{
            id,
            emailAddress,
            firstName,
            lastName,
            imageUrl
        }
    })

    console.log("done");

    return new NextResponse("Webhook received", {status:200});
}