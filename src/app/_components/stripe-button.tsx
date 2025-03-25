import { Button } from "@/components/ui/button";
import { createBillingPoratlSession, createCheckoutSession, getSubscriptionStatus } from "@/lib/stripe-actions";
import { useEffect, useState } from "react";

const StripeButton = () => {
    const [isSubscribed, setIsSubscribed] = useState(false);

    useEffect(() => {
        (async () => {
            const subscriptionStatus = await getSubscriptionStatus();
            setIsSubscribed(subscriptionStatus);
        })
    }, []);

    const handleClick = async () => {
        if (isSubscribed) {
            await createBillingPoratlSession();
        } else {
            await createCheckoutSession();
        }
    }

    return (
        <Button variant={"outline"} size={"lg"} onClick={handleClick}>
            {isSubscribed ? "Manage Subscription" : "Upgrade Plan"}
        </Button>
    )
}

export default StripeButton;