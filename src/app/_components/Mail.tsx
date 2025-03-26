"use client";

import { TooltipProvider } from "@/components/ui/tooltip"
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import { cn } from "@/lib/utils"
import { useState } from "react"
import { Separator } from "@/components/ui/separator";
import { Tabs } from "@/components/ui/tabs";
import { TabsList } from "@/components/ui/tabs";
import { TabsTrigger } from "@/components/ui/tabs";
import { TabsContent } from "@/components/ui/tabs";
import { AccountSwitcher } from "./account-switcher";
import Sidebar from "./Sidebar";
import ThreadList from "./Thread-List";
import ThreadDisplay from "./Thread-Display";
import SearchBar from "./search-bar";
import AskAI from "./ask-ai";

type props = {
    defaultLayout: number[] | undefined,
    navCollapsedSize: number,
    defaultCollapsed: boolean
}

export default function Mail({ defaultLayout = [20, 32, 48], navCollapsedSize, defaultCollapsed }: props) {
    const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

    return (<div>
        <TooltipProvider delayDuration={0}>
            <ResizablePanelGroup direction="horizontal" onLayout={(sizes: number[]) => {
                console.log(sizes);

            }} className="items-stretch h-full min-h-screen">
                <ResizablePanel defaultSize={defaultLayout[0]} collapsedSize={navCollapsedSize}
                    collapsible={true}
                    minSize={15}
                    maxSize={40}
                    onCollapse={() => {
                        setIsCollapsed(true);
                    }}
                    onResize={() => {
                        setIsCollapsed(false);
                    }}
                    className={cn(isCollapsed && "min-w-[50px] translate-all duration-300 ease-in-out")}
                >
                    <div className="flex flex-col h-full flex-1">
                        <div className={cn("flex h-[52px] items-center justify-between", isCollapsed ? "h-[52px]" : "px-2")}>
                            {/* {Account Switcher} */}
                            <AccountSwitcher isCollapsed={isCollapsed}></AccountSwitcher>
                        </div>
                        <Separator></Separator>
                        {/* {Sidebar} */}
                        <Sidebar isCollapsed={isCollapsed}></Sidebar>

                        <div className="flex-1">
                        </div>
                        {/* {Ai} */}
                        <AskAI />
                    </div>

                </ResizablePanel>
                <ResizableHandle withHandle></ResizableHandle>
                <ResizablePanel defaultSize={defaultLayout[1]} minSize={30}>
                    <Tabs defaultValue="inbox">
                        <div className="flex items-center px-4 py-2">
                            <h1 className="text-xl font-bold">Inbox</h1>
                            <TabsList className="ml-auto">
                                <TabsTrigger value="inbox" className="text-xinc-600 dark:text-zinc-200">
                                    Inbox
                                </TabsTrigger>
                                <TabsTrigger value="inbox" className="text-xinc-600 dark:text-zinc-200">
                                    Done
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        <Separator></Separator>
                        {/* {Search Bar} */}
                        <SearchBar />
                        <TabsContent value="inbox">
                            <ThreadList></ThreadList>
                        </TabsContent>
                        <TabsContent value="done">
                            <ThreadList></ThreadList>
                        </TabsContent>
                    </Tabs>
                </ResizablePanel>
                <ResizableHandle withHandle></ResizableHandle>
                <ResizablePanel defaultSize={defaultLayout[2]} minSize={30}>
                    <ThreadDisplay></ThreadDisplay>
                </ResizablePanel>
            </ResizablePanelGroup>
        </TooltipProvider>
    </div>
    )
}