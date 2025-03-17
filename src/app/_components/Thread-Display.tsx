"use client"

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import useThreads from "@/hooks/use-threads";
import { Archive, ArchiveX, Trash2 } from "lucide-react";

const ThreadDisplay = () => {
    const {threadId,threads} = useThreads();
    const thread = threads?.find(thread=>thread.id === threadId);

    return <div className="flex flex-col h-full">
        <div className="flex items-center p-2">
            <div className="flex items-center p-2">
                <Button variant={"ghost"} size="icon" disabled={!thread}>
                    <Archive className="size-4" />                
                </Button>
                <Button variant={"ghost"} size="icon" disabled={!thread}>
                    <ArchiveX className="size-4" />                
                </Button>
                <Button variant={"ghost"} size="icon" disabled={!thread}>
                    <Trash2 className="size-4" />                
                </Button>
            </div>
            <Separator orientation="vertical"></Separator>
        </div>
    </div>
}

export default ThreadDisplay;