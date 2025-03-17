import { KBarProvider } from "kbar";

export default function KBar({children}:{children:React.ReactNode}){
    return <KBarProvider>
        <ActualComponent>
            {children}
        </ActualComponent>
    </KBarProvider>
}

const ActualComponent = ({children}:{children:React.ReactNode}) => {
    return <>
    
    </>
}