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


const ComposeButton = () => {
    const [toValues,setToValues] = useState<{label:string,value:string}[]>([]);
    const [ccValues,setCcValues] = useState<{label:string,value:string}[]>([]);

    const [subject,setSubject] = useState<string>("");
    const handleSend = async (value:string) => {
        console.log("value",value);
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
            isSending={false}
            />
        </DrawerContent>
    </Drawer>

}

export default ComposeButton;