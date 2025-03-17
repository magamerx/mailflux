import { Account } from "@/lib/account";
import { syncEmailToDatabase } from "@/lib/sync-to-db";
import { NextRequest, NextResponse } from "next/server";

export  const GET = async (req:NextRequest)=>{
    const token = "ya29.a0AeXRPp7dpzGuNIIHRV-rvj6ERdSkrWZVewiFXdfdpPbgJmzDu7uw8Uprju6XkUv4J8sKiidm84PqxC0mDpXl6JzzgDEG8xCnPgjlK9rqmFupjyxT8vl1JAwYLPIyQhD9fLy5fr3XXSIJgRocSQLDBDFADZYfKv9Zetn6Be1zaCgYKAQUSARESFQHGX2MiYuqsndnyf3TntExrifOf0g0175";
    const accountId = "110146078171179310458";

    const account = new Account(token);
    // const sync = await account.startSync();

    const email = await account.getEmailDetails("19104c4280ca4f11");
    // const save = await syncEmailToDatabase([email],accountId);

    return NextResponse.json({
        email:email
    });
}