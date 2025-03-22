"use client"

import  { EditorContent, useEditor } from "@tiptap/react";
import { StarterKit } from "@tiptap/starter-kit";
import { Text } from "@tiptap/extension-text";
import React, { useEffect, useState } from "react";
import EditorMenuBar from "./editor-menubar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import TagInput from "./tag-input";
import { Input } from "@/components/ui/input";
import AIComposeButton from "./ai-compose-button";
import { generate } from "../mail/action";

type Props = {
    subject:string,
    setSubject:(value:string) => void

    toValues:{label:string,value:string}[]
    setToValues:(value:{label:string,value:string}[]) => void

    ccValues:{label:string,value:string}[]
    setCcValues:(value:{label:string,value:string}[]) => void

    to:string[]

    handleSend: (value:string) => void,
    isSending:boolean

    defaultToolBarExpanded:boolean
}

const EmailEditor = ({subject,setSubject,toValues,setToValues,ccValues,setCcValues,to,handleSend,isSending,defaultToolBarExpanded}:Props) => {
    const [value,setValue] = useState<string>("");
    const [expanded,setExpanded] = React.useState<boolean>(defaultToolBarExpanded);
    const [token,setToken] = useState<string>("");

    const aiGenerate = async  (value:string) => {
        const { output } = await generate(value);

        setToken(output);
    } 

    
    const CustomText = Text.extend({
        addKeyboardShortcuts(){
            return {
                "Meta-j":() => {
                    aiGenerate(this.editor.getText());
                    return true;
                }
            }
        }
    })
    
    const editor = useEditor({
        autofocus:false,
        extensions:[StarterKit,CustomText],
        onUpdate:({editor}) => {
            setValue(editor.getHTML());
        }
    });

    useEffect(()=>{
        editor?.commands.insertContent(token);
    },[editor,token]);
    
    const onGenerate = (token:string) => {
        editor?.commands.insertContent(token);
    }

    if (!editor) {
        return null;
    }

    return (
        <div>
            <div className="flex p-4 py-2 border-b">
            <EditorMenuBar editor={editor}></EditorMenuBar>
            </div>

            <div className="p-4 pb-0 space-y-2">
                {expanded && (
                    <>
                    <TagInput
                    label="To"
                    onChange={setToValues}
                    placeholder="Add Recipients"
                    value={toValues}>

                    </TagInput>

                    <TagInput
                    label="Cc"
                    onChange={setCcValues}
                    placeholder="Add Recipients"
                    value={ccValues}>

                    </TagInput>

                    <Input id="subject" placeholder="subject" value={subject} onChange={(e) => setSubject(e.target.value)}></Input>
                    </>
                )}
                
                <div className="flex items-center gap-2">
                    <div className="cursor-pointer" onClick={()=> setExpanded(!expanded)}>
                        <span className="text-green-600 font-medium">
                            Draft {" "}
                        </span>
                        <span>
                            to {to.join(",")}
                        </span>
                    </div>
                    <AIComposeButton isComposing={defaultToolBarExpanded} onGenerate={onGenerate} />
                </div>
            </div>

            <div className="prose w-full px-4">
                <EditorContent editor={editor} value={value} />
            </div>
            <Separator></Separator>
            <div className="py-3 px-4 flex items-center justify-between">
                <span className="text-sm">  
                    Tip: Press {" "}
                    <kbd className="px-2 py-1.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg">
                        Cmd + J
                    </kbd>{" "}
                    for AI autocomplete
                </span>
                <Button onClick={async ()=>{
                    editor?.commands?.clearContent();
                    handleSend(value);
                }} disabled={isSending}>
                    Send
                </Button>
            </div>
        </div>
    )
}

export default EmailEditor;