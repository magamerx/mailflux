"use client"

import { api } from "@/trpc/react";
import EmailEditor from "./email-editor";
import useThreads from "@/hooks/use-threads";
import { RouterOutputs } from "@/trpc/react";
import { useEffect, useState } from "react";

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

    const handleSend = async (value:string) => {
        console.log(value);
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

        isSending={false}
        handleSend={handleSend}

        defaultToolBarExpanded={false}
        ></EmailEditor>
    )
}

export default ReplyBox;