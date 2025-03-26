"use client"

import dynamic from "next/dynamic";

const MailDashboard = dynamic(()=>{
    return import("./mail/page");
},{
    ssr:false
})

export default function Home() {

  return (
    <MailDashboard />
  );
}
