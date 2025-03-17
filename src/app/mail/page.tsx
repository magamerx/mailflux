"use client"

import ThemeToggle from "@/components/theme-toggle";
import dynamic from "next/dynamic";

// import { Mail } from "../_components/Mail";

const Mail =  dynamic(()=>{
    return import("../_components/Mail")
},{
    ssr:false
})

export default function MailDashboard(){
    return <div>
        <div className="absolute bottom-4 left-4">
            <ThemeToggle></ThemeToggle>
        </div>
        <Mail
            defaultLayout={[20,32,48]}
            navCollapsedSize={4}
            defaultCollapsed={false}>

        </Mail>
    </div>
}