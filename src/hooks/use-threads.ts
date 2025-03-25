import { api } from "@/trpc/react";
import { useLocalStorage } from "usehooks-ts";
import {atom, useAtom} from "jotai";

export const threadIdAtom = atom<string | null>(null);

const useThreads = () => {
    const {data:accounts} = api.account.getAccounts.useQuery();
    const [accountId] = useLocalStorage('accountId', '');
    const [tab] = useLocalStorage("tab", "inbox");
    const [done] = useLocalStorage("done", false);
    const [threadId,setThreadId] = useAtom(threadIdAtom);
    

    const {data:threads,isFetching,refetch} = api.account.getThreads.useQuery({accountId,tab,done},
        {enabled: !!accountId && !!tab,placeholderData:e=>e,refetchInterval:5000});

        return {
            threads,
            isFetching,
            refetch,
            accountId,
            threadId,
            setThreadId,
            account:accounts?.find((account:any)=>account.id === accountId)
        }
}

export default useThreads;