"use client"

import { Button } from "@/components/ui/button"
import { getAurinkoAuthUrl } from "@/lib/aurinko"

export const LinkAccountButton = ()=>{
    return (
        <Button onClick={async ()=>{
            const authUrl = await getAurinkoAuthUrl('Google');
            window.location.href=authUrl;
        }}>Link Account</Button>
    )
}