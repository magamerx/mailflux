"use client"

import { Button } from "@/components/ui/button"
import { getGoogleCode } from "@/lib/aurinko"

export const LinkAccountButton = ()=>{
    return (
        <Button onClick={async ()=>{
            const authUrl = await getGoogleCode();
            // const authUrl = await getAurinkoCode();
            window.location.href=authUrl;
        }}>Link Account</Button>
    )
}