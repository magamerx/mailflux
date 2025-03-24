"use client"

import { Button } from "@/components/ui/button";
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from "@/components/ui/drawer"
import { Pencil } from "lucide-react";
import EmailEditor from "./email-editor";
import { useState } from "react";
import { api } from "@/trpc/react";
import useThreads from "@/hooks/use-threads";
import { toast } from "sonner";


const ComposeButton = () => {
    const [toValues,setToValues] = useState<{label:string,value:string}[]>([]);
    const [ccValues,setCcValues] = useState<{label:string,value:string}[]>([]);

    const [subject,setSubject] = useState<string>("");
    const {account} = useThreads();

    const sendEmail = api.account.sendEmail.useMutation();
    const handleSend = async (value:string) => {
        if (!account) {
            return;
        }
        sendEmail.mutate({
            accountId:account.id,
            threadId:undefined,
            body:value,
            from:{name:account?.name ?? "Me",address:account.emailAddress ?? "me@example.com"},
            to: toValues.map(to => ({name: to.value,address:to.value})),
            cc: toValues.map(cc => ({name: cc.value,address:cc.value})),
            replyTo:{name:account?.name ?? "Me" , address:account.emailAddress ?? "me@example.com"},
            subject:subject,
            inReplyTo:undefined
        },{
            onSuccess:() => {
                toast.success("Email sent");
            },
            onError:(error) => {
                console.log(error);
                toast.error("Error sending email");
            }
        })
    }

    return <Drawer>
        <DrawerTrigger>
            <Button>
                <Pencil className="size-4 mr-1" />
                Compose
            </Button>
        </DrawerTrigger>
        <DrawerContent>
            <DrawerHeader>
                <DrawerTitle>Compose Email</DrawerTitle>
            </DrawerHeader>
            <EmailEditor 
            toValues={toValues}
            setToValues={setToValues}

            ccValues={ccValues}
            setCcValues={setCcValues}

            subject={subject}
            setSubject={setSubject}

            to={toValues.map(to => to.value)}
            defaultToolBarExpanded={true}

            handleSend={handleSend}
            isSending={sendEmail.isPending}
            />
        </DrawerContent>
    </Drawer>

}

export default ComposeButton;