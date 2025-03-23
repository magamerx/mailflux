"use client"

import { api } from "@/trpc/react";
import EmailEditor from "./email-editor";
import useThreads from "@/hooks/use-threads";
import { RouterOutputs } from "@/trpc/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const ReplyBox = () => {
    const { threadId,accountId } = useThreads();
    const {data:replyDetails} = api.account.getReplyDetails.useQuery({
        threadId:threadId ?? "",
        accountId
    });

    if (!replyDetails) {
        return null;
    }

    return <Components replyDetails={replyDetails}></Components>
    
}

const Components = ({replyDetails}:{replyDetails:RouterOutputs["account"]["getReplyDetails"]}) => {
    const {threadId,accountId} = useThreads();
    const [subject,setSubject] = useState(replyDetails.subject.startsWith("Re:") ? replyDetails.subject : `Re: ${replyDetails.subject}` );
    const [toValues,setToValues] = useState<{label:string,value:string}[]>(replyDetails.to.map(to => ({label:to.address,value:to.address})));
    const [ccValues,setCcValues] = useState<{label:string,value:string}[]>(replyDetails.to.map(to => ({label:to.address,value:to.address})));

    useEffect(()=>{
        if (!threadId || !replyDetails) {
            return
        }

        if (!replyDetails.subject.startsWith("Re:")) {
            setSubject(`Re: ${replyDetails.subject}`)
        }
        else{
            setSubject(replyDetails.subject);
        }

        setToValues(replyDetails.to.map(to => ({label: to.address,value:  to.address})));
        setCcValues(replyDetails.to.map(cc => ({label: cc.address,value:  cc.address})));

    },[threadId,replyDetails]);

    const sendEmail = api.account.sendEmail.useMutation();

    const handleSend = async (value:string) => {
        console.log("gg======================")
        if (!replyDetails) {
            return;
        }

        sendEmail.mutate({
            accountId,
            threadId: threadId ?? undefined,
            body: value,
            subject,
            from:replyDetails.from,
            to:replyDetails.to.map(to => ({address: to.address,name: to.name ?? ""})),
            cc:replyDetails.cc.map(cc => ({address: cc.address,name: cc.name ?? ""})),

            replyTo:replyDetails.from,
            inReplyTo:replyDetails.id
        },{
            onSuccess:() => {
                toast.success("Email Send!");
            },
            onError: (error) => {
                console.log(error);
                toast.error("Error sending email");
            }
        })
        console.log(value+"vfvfvfvffv-----------------f");
    }
    
    return (
        <EmailEditor
        subject={subject}
        setSubject={setSubject}

        toValues={toValues}
        setToValues={setToValues}

        ccValues={ccValues}
        setCcValues={setCcValues}

        to={replyDetails.to.map(to => to.address)}

        isSending={sendEmail.isPending}
        handleSend={handleSend}

        defaultToolBarExpanded={false}
        ></EmailEditor>
    )
}

export default ReplyBox;