"use client"

import { Action, KBarAnimator, KBarPortal, KBarPositioner, KBarProvider, KBarSearch, Priority } from "kbar";
import RenderResults from "./render-results";
import { useLocalStorage } from "usehooks-ts";

export default function KBar({ children }: { children: React.ReactNode }) {
    const [tab,setTab] = useLocalStorage("tab","inbox");
    const [done,setDone] = useLocalStorage("done",false);

    const actions: Action[] = [
        {
            id: "inboxAction",
            name: "Inbox",
            shortcut: ["g", "i"],
            keywords:"inbox",
            priority:Priority.HIGH,
            subtitle: "View your inbox",
            section: "Naviagion",
            perform: () => {
                setTab("inbox")
            }
        },
        {
            id: "draftsAction",
            name: "Drafts",
            shortcut: ["g", "d"],
            keywords:"drafts",
            priority:Priority.HIGH,
            subtitle: "View your drafts",
            section: "Naviagion",
            perform: () => {
                setTab("drafts")
            }
        },
        {
            id: "sentAction",
            name: "Sent",
            shortcut: ["g", "s"],
            keywords:"sent",
            priority:Priority.HIGH,
            section: "Naviagion",
            subtitle: "View your sent",
            perform: () => {
                setTab("sent")
            }
        }
    ];

    return <KBarProvider actions={actions}>
        <ActualComponent>
            {children}
        </ActualComponent>
    </KBarProvider>
}

const ActualComponent = ({ children }: { children: React.ReactNode }) => {
    return <>
        <KBarPortal>
            <KBarPositioner className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm scrollbar-hide !p-0 z-[999]">
                <KBarAnimator className="max-w-[600px] !mt-64 w-full bg-white dark:bg-gray-800 text-foreground dark:text-gray-200 shadow-lg border dark:border-gray-600 rounded-lg overflow-hidden relative !-translate-y-12">
                    <div className="bg-white dark:bg-gray-800">
                        <div className="border-x-0 border-b-2 dark:border-gray-50-700">
                            <KBarSearch className="py-4 px-6 text-lg w-full bg-white dark:bg-gray-800 outline-none border-none focus:outline-none focus:ring-0 focus:ring-offset-0"></KBarSearch>
                        </div>
                        <RenderResults />
                    </div>
                </KBarAnimator>
            </KBarPositioner>
        </KBarPortal>
        {children}
    </>
}