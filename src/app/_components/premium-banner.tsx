import { FREE_CREDITS_PER_DAY } from "@/constants";
import StripeButton from "./stripe-button";
import { useEffect, useState } from "react";
import { getSubscriptionStatus } from "@/lib/stripe-actions";
import { api } from "@/trpc/react";
import useThreads from "@/hooks/use-threads";

const PremiumBanner = () => {
    const [isSubscribed, setIsSubscribed] = useState(false);
    const {accountId} = useThreads();
    const {data} = api.account.getChatbotInteraction.useQuery({
        accountId
    })

    useEffect(() => {
        (async () => {
            const subscriptionStatus = await getSubscriptionStatus();
            setIsSubscribed(subscriptionStatus);
        })
    }, []);
    
    // const remainingCredits = 5;

    if (!isSubscribed) {
        return <div className="bg-gray-900 relative p-4 rounded-lg border overflow-hidden flex flex-col md:flex-row gap-4">
            <img src="/bot.webp" className="md:absolute md:-bottom-6 md:-right-10 h-[180px] w-auto" />
            <div>
                <div className="flex items-center gap-2">
                    <h1 className="text-white text-xl font-bold">Basic Plan</h1>
                    <p className="text-gray-400 text-sm md:max-w-full]">
                        {data} / {FREE_CREDITS_PER_DAY} messages remaining
                    </p>
                </div>
                <div className="h-4"></div>
                <p className="text-gray-400 text-sm md:max-w-[calc(100%-150px)]">
                    Upgrade to pro to ask as many questions as you want!
                </p>
                <div className="h-4"></div>
                <StripeButton />
            </div>
        </div>
    }

    if (isSubscribed) {
        <div className="bg-gray-900 relative p-4 rounded-lg border overflow-hidden flex flex-col md:flex-row gap-4">
            <img src="/bot.webp" className="md:absolute md:-bottom-6 md:-right-10 h-[180px] w-auto" />
            <div>
                <div className="flex items-center gap-2">
                    <h1 className="text-white text-xl font-bold">Premium Plan</h1>
                </div>
                <div className="h-4"></div>
                <p className="text-gray-400 text-sm md:max-w-[calc(100%-150px)]">
                        Ask as many questions as you want!
                </p>
                <div className="h-4"></div>
                <StripeButton />
            </div>
        </div>
    }

return <div></div>
}

export default PremiumBanner;