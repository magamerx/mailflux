"use client"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Bot } from "lucide-react"
import { useState } from "react"
import { generateEmail } from "../mail/action"
import useThreads from "@/hooks/use-threads"
import { turndown } from "@/lib/turndown"


type Props = {
    isComposing: boolean,
    onGenerate: (token: string) => void
}

const AIComposeButton = ({ isComposing, onGenerate }: Props) => {
    const [open, setOpen] = useState(false);
    const [prompt, setPrompt] = useState("");
    const { threads,threadId,account } = useThreads();
    const thread = threads?.find(t => t.id === threadId)

    const aiGenerate = async () => {
        let context = "";

        if (!isComposing) {
            for(const email of thread?.emails ?? []){
                const content = `
                Subject: ${email.subject}
                From: ${email.from}
                Sent: ${new Date(email.sentAt).toLocaleString()}
                Body: ${turndown.turndown(email.body ?? email.bodySnippet ?? "")}
                `

                context +=content;
            }
        }

        context +=`
        My name is ${account?.name} and my email is ${account?.emailAddress}.
        `;

        const { output } = await generateEmail(context,prompt);
        onGenerate(output);
    }

    return <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger>
            <Button size="icon" variant={"outline"} onClick={()=>setOpen(true)}>
                <Bot className="size-5"></Bot>
            </Button>
        </DialogTrigger>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>AI Smart Compose</DialogTitle>
                <DialogDescription>
                    AI will help you compose your email.
                </DialogDescription>
                <div className="h-2"></div>
                <Textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Enter a prompt." />
                <div className="h-2"></div>
                <Button onClick={async ()=>{
                    setOpen(false);
                    setPrompt("");
                    aiGenerate();
                }}>
                    Generate
                </Button>
            </DialogHeader>
        </DialogContent>
    </Dialog>
}

export default AIComposeButton;