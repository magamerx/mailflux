"use client"

import ThemeToggle from "@/components/theme-toggle";
import { UserButton } from "@clerk/nextjs";
import dynamic from "next/dynamic";
// import ComposeButton from "../_components/compose-button";

// import { Mail } from "../_components/Mail";

const ComposeButton = dynamic(()=>{
    return import("../_components/compose-button");
},{
    ssr:false
})

const Mail =  dynamic(()=>{
    return import("../_components/Mail")
},{
    ssr:false
})

export default function MailDashboard(){
    return <div className="relative">
        <div className="absolute bottom-4 left-4">
            <div className="flex items-center gap-2">
            <UserButton />
            <ThemeToggle />
            <ComposeButton />
            </div>
        </div>
        <Mail
            defaultLayout={[20,32,48]}
            navCollapsedSize={4}
            defaultCollapsed={false}>

        </Mail>
    </div>
}