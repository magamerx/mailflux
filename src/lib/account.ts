import axios from "axios";
import {
  EmailMessage,
  SyncResponse,
  SyncUpdatedResponse,
  EmailAttachment,
} from "./type";
import { db } from "@/server/db";
import { syncEmailToDatabase } from "./sync-to-db";
import { refreshGoogleToken } from "./aurinko";

// export class Account {
//     private token: string;

//     constructor(token: string) {
//         this.token = token
//     }

//     private async startSync() {
//         console.log("startsync---------------------------------------------------------------");
//         const response = await axios.post<SyncResponse>("https://api.aurinko.io/v1/email/sync", {}, {
//             headers: {
//                 Authorization: `Bearer ${this.token}`
//             },
//             params: {
//                 daysWithin: 2,
//                 bodyType: "html"
//             }
//         })

//         console.log(response.data);

//         return response.data;
//     }

//     async getUpdatedEmails({ deltaToken, pageToken }: { deltaToken?: string, pageToken?: string }) {
//         let params: Record<string, string> = {}
//         if (deltaToken) params.deltaToken = deltaToken;
//         if (pageToken) params.pageToken = pageToken;

//         const response = await axios.get<SyncUpdatedResponse>("https://api.aurinko.io/v1/email/sync/updated", {
//             headers: {
//                 Authorization: `Bearer ${this.token}`
//             },
//             params
//         })

//         return response.data;
//     }

//     async performInitialSync() {
//         try {
//             console.log("start initial sync-------------------------------------------------------------");
//             let syncResponse = await this.startSync();

//             while (!syncResponse.ready) {
//                 await new Promise(resolve => setTimeout(resolve, 1000));
//                 syncResponse = await this.startSync();
//             }

//             //get the bookmark delta token
//             let storeDeltaToken: string = syncResponse.syncUpdatedToken;
//             let updatedResponse = await this.getUpdatedEmails({ deltaToken: storeDeltaToken });

//             if (updatedResponse.nextDeltaToken) {
//                 //sync has completed
//                 storeDeltaToken = updatedResponse.nextDeltaToken
//             }

//             let allEmails: EmailMessage[] = updatedResponse.records

//             //fetch all pages if there are more
//             while (updatedResponse.nextPageToken) {
//                 updatedResponse = await this.getUpdatedEmails({ pageToken: updatedResponse.nextPageToken })
//                 allEmails = allEmails.concat(updatedResponse.records);
//                 if (updatedResponse.nextDeltaToken) {
//                     //sync have ended
//                     storeDeltaToken = updatedResponse.nextDeltaToken;
//                 }
//             }

//             console.log("initial sync completed, we have synced", allEmails.length, "emails")

//             //store the latest delta token for future incremental sync
//             return {
//                 emails: allEmails,
//                 deltaToken: storeDeltaToken
//             }
//         } catch (error) {
//             if(axios.isAxiosError(error)){
//                 console.error("Error during sync :",JSON.stringify(error.response?.data,null,2));
//             }else{
//                 console.error("Error during sync :",error);
//             }

//         }
//     }

// }

interface EmailAddress {
  name?: string;
  address: string;
}

interface EmailHeader {
  name: string;
  value: string;
}

let emailFetched = 0; 

export class Account {
  private token: string;
  private refreshToken:string;

  constructor(token: string,refreshToken:string) {
    this.token = token;
    this.refreshToken = refreshToken;
  }

  /** 1️⃣ Start Initial Sync (Fetch Emails) */
  async startSync(maxResults = 10, pageToken?: string) {
    if (!this.token) {
      throw new Error("❌ No access token found. Please authenticate.");
    }

    try {
      const response = await axios.get(
        "https://www.googleapis.com/gmail/v1/users/me/messages",
        {
          headers: { Authorization: `Bearer ${this.token}` },
          params: { maxResults, pageToken, labelIds: "IMPORTANT" },
        },
      );

      emailFetched+=10;
      console.log("Email Fetched................",emailFetched);
      // console.log("📩 Emails fetched:", response.data);
      return response.data; // { messages: [{ id, threadId }], nextPageToken }
    } catch (error) {
      console.error("❌ Error fetching emails:");
      throw error;
    }
  }

  /** 2️⃣ Fetch New Emails Since Last Sync */
  async getUpdatedEmails(historyId: string) {
    console.log(`🔄 Fetching new emails since historyId: ${historyId}`);

    const response = await axios.get(
      "https://www.googleapis.com/gmail/v1/users/me/history",
      {
        headers: { Authorization: `Bearer ${this.token}` },
        params: { startHistoryId: historyId, historyTypes: "messageAdded" }, // Get only new emails
      },
    );

    return response; // { history: [{ messages: [{ id, threadId }] }] }
  }

  /** 3️⃣ Perform Full Initial Sync */
  async performInitialSync() {
    try {
      console.log("🚀 Performing initial email sync...");
      let syncResponse = await this.startSync();
      let allEmails: any[] = [];

      // Fetch full email details
      if (syncResponse.messages) {
        for (const msg of syncResponse.messages) {
          const emailData = await this.getEmailDetails(msg.id);
          allEmails.push(emailData);
        }
      }

      // Handle pagination (fetch more pages if needed)
      while (syncResponse.nextPageToken) {
        syncResponse = await this.startSync(10, syncResponse.nextPageToken);

        for (const msg of syncResponse.messages) {
          const emailData = await this.getEmailDetails(msg.id);
          allEmails.push(emailData);
        }
      }

      // Store the last `historyId` for incremental updates
      const latestHistoryId = await this.getLatestHistoryId();
      console.log(
        "✅ Initial sync complete. Total emails synced:",
        allEmails.length,
      );

      return {
        emails: allEmails,
        historyId: latestHistoryId, // Save this for future incremental syncs
      };
    } catch (error) {
      console.error("❌ Error during email sync:", error);
    }
  }


  async syncEmails(): Promise<{ emails: EmailMessage[]; historyId: string } | undefined> {
    try {
      // Retrieve the last stored historyId
      const account = await db.account.findUnique({
        where: { token: this.token }
      });
  
      if (!account || !account.nextDeltaToken) {
        throw new Error("⚠️ No previous historyId found. Perform an initial sync first.");
      }
  
      console.log(`🔄 Syncing important emails since historyId: ${account.nextDeltaToken}`);
  
      // Fetch updates from Gmail API
      const response = await this.getUpdatedEmails(account.nextDeltaToken);
  
      if (!response.data.history) {
        console.log("✅ No new important emails to sync.");
        return { emails: [], historyId: account.nextDeltaToken };
      }
  
      let importantEmails: EmailMessage[] = [];
      let newHistoryId = response.data.historyId;
  
      // Process new emails
      for (const history of response.data.history) {
        if (history.messagesAdded) {
          for (const messageObj of history.messagesAdded) {
            const message = messageObj.message;
  
            // ✅ Pre-check "IMPORTANT" label before fetching full email data
            if (message.labelIds?.includes("IMPORTANT")) {
              console.log(`📩 Important Email Found: ${message.id}`);
  
              // Fetch detailed email data only if it's important
              const emailData = await this.getEmailDetails(message.id);
              importantEmails.push(emailData);
            }
          }
        }
      }
  
      console.log(`📥 Synced ${importantEmails.length} important emails`);
  
      // Save important emails to the database
      if (importantEmails.length > 0) {
        await syncEmailToDatabase(importantEmails, account.id);
      }
  
      // Update historyId in the database
      await db.account.update({
        where: { id: account.id },
        data: { nextDeltaToken: newHistoryId }
      });
  
      return { emails: importantEmails, historyId: newHistoryId };
  
    } catch (error) {
      if (error.response?.status === 401) {
        console.log("Access token expired. Refreshing...");
        const newTokens = await refreshGoogleToken(this.refreshToken);

        if (newTokens.access_token) {
          // Store new access_token and use it
          await db.account.update({
            where: {
              token:this.token
            },
            data:{
              token:newTokens.access_token
            }
          });

          return await this.syncEmails();
        }
      }
    }
  }



  /** 🔍 Fetch Full Email Details */
  async getEmailDetails(messageId: string) {
    const response = await axios.get(
      `https://www.googleapis.com/gmail/v1/users/me/messages/${messageId}`,
      {
        headers: { Authorization: `Bearer ${this.token}` },
      },
    );

    // console.log(JSON.stringify(response.data, null, 2));

    const data = await this.mapGmailMessageToEmailMessage(response.data);

    return data as EmailMessage;
  }

  /** 🔄 Get Latest `historyId` */
  private async getLatestHistoryId() {
    const response = await axios.get(
      "https://www.googleapis.com/gmail/v1/users/me/profile",
      {
        headers: { Authorization: `Bearer ${this.token}` },
      },
    );

    return response.data.historyId; // Save this for future incremental syncs
  }

  /*  Map gamil message to EmailMessage type */
  private async mapGmailMessageToEmailMessage(
    gmailMessage: any,
  ): Promise<EmailMessage> {
    const headers = gmailMessage.payload.headers.reduce(
      (acc: Record<string, string>, header: any) => {
        acc[header.name.toLowerCase()] = header.value;
        return acc;
      },
      {},
    );

    const extractEmailAddress = (headerValue?: string): EmailAddress | null => {
      if (!headerValue) return null;
      const match = headerValue.match(/(.*)<(.+)>/);
      return match
        ? { name: match[1]?.trim(), address: match[2]?.trim() || "" }
        : { address: headerValue.trim() };
    };

    const extractEmailAddresses = (headerValue?: string): EmailAddress[] =>
      headerValue
        ? headerValue
            .split(",")
            .map((email) => extractEmailAddress(email)!)
            .filter(Boolean)
        : [];

        const extractBody = (gmailMessage: any, preferHtml = true): string | undefined => {
          if (!gmailMessage.payload) {
            console.error("❌ Error: Missing payload in Gmail message");
            return undefined;
          }
        
          let textPlain: string | undefined;
          let textHtml: string | undefined;
        
          // Check if the email body is directly in payload.body
          if (gmailMessage.payload.body && gmailMessage.payload.body.size !== 0) {
            if (gmailMessage.payload.mimeType === "text/html" && gmailMessage.payload.body?.data) {
              textHtml = Buffer.from(gmailMessage.payload.body.data, "base64").toString("utf-8");
            }
            if (gmailMessage.payload.mimeType === "text/plain" && gmailMessage.payload.body?.data) {
              textPlain = Buffer.from(gmailMessage.payload.body.data, "base64").toString("utf-8");
            }
            return preferHtml && textHtml ? textHtml : textPlain;
          }
        
          // If the message has multiple parts, iterate through them
          if (gmailMessage.payload.parts) {
            for (const part of gmailMessage.payload.parts) {
              if (part.mimeType === "text/plain" && part.body?.data) {
                textPlain = Buffer.from(part.body.data, "base64").toString("utf-8");
              }
              if (part.mimeType === "text/html" && part.body?.data) {
                textHtml = Buffer.from(part.body.data, "base64").toString("utf-8");
              }
              
              // Recursively check nested parts if they exist
              if (part.parts) {
                const nestedBody = extractBody({ payload: { parts: part.parts } }, preferHtml);
                if (nestedBody) return nestedBody;
              }
            }
          }
        
          // Prioritize HTML if preferHtml is true, otherwise use plain text
          return preferHtml && textHtml ? textHtml : textPlain;
        };
        

    const extractAttachments = (parts: any[]): EmailAttachment[] => {
      return parts
        .filter((part) => part.filename && part.body && part.body.attachmentId)
        .map((part) => ({
          id: part.body.attachmentId, // Unique attachment identifier
          name: part.filename, // File name
          mimeType: part.mimeType, // File type
          size: part.body.size || 0, // File size (default to 0 if missing)
          inline: !!part.headers?.find(
            (h: any) =>
              h.name.toLowerCase() === "content-disposition" &&
              h.value.includes("inline"),
          ),
          contentId: part.headers
            ?.find((h: any) => h.name.toLowerCase() === "content-id")
            ?.value.replace(/[<>]/g, ""),
          contentLocation: part.filename, // Keeping this for consistency
        }));
    };

    return {
      id: gmailMessage.id,
      threadId: gmailMessage.threadId,
      createdTime: headers["date"] || "",
      lastModifiedTime: headers["date"] || "",
      sentAt: headers["date"] || "",
      receivedAt: headers["date"] || "",
      internetMessageId: headers["message-id"] || "",
      subject: headers["subject"] || "No Subject",
      keywords: [],
      sysLabels: gmailMessage.labelIds
        .map((label: string) => {
          switch (label) {
            case "INBOX":
              return "inbox";
            case "UNREAD":
              return "unread";
            case "SENT":
              return "sent";
            case "TRASH":
              return "trash";
            case "SPAM":
              return "junk";
            case "DRAFT":
              return "draft";
            default:
              return null;
          }
        })
        .filter(Boolean) as EmailMessage["sysLabels"],
      sysClassifications: gmailMessage.labelIds.includes("CATEGORY_PROMOTIONS")
        ? ["promotions"]
        : gmailMessage.labelIds.includes("CATEGORY_SOCIAL")
          ? ["social"]
          : [],
      sensitivity: "normal",
      from: extractEmailAddress(headers["from"])!,
      to: extractEmailAddresses(headers["to"]),
      cc: extractEmailAddresses(headers["cc"]),
      bcc: extractEmailAddresses(headers["bcc"]),
      replyTo: extractEmailAddresses(headers["reply-to"]),
      hasAttachments: !!gmailMessage.payload.parts?.some(
        (part: any) => !!part.body?.attachmentId,
      ),
      body: extractBody(gmailMessage),
      bodySnippet: gmailMessage.snippet,
      attachments: extractAttachments(gmailMessage.payload.parts || []),
      inReplyTo: headers["in-reply-to"] || undefined,
      references: headers["references"] || undefined,
      threadIndex: undefined, // Not available in Gmail API
      internetHeaders: gmailMessage.payload.headers.map((h: any) => ({
        name: h.name,
        value: h.value,
      })),
      nativeProperties: {}, // You can add additional Gmail-specific properties here
      folderId: undefined, // Not available in Gmail API
      omitted: gmailMessage["omitted"] || [],
    };
  }

  
async sendEmail({
  from,
  subject,
  body,
  inReplyTo,
  references,
  threadId,
  to,
  cc,
  bcc,
  replyTo,
}: {
  from: EmailAddress;
  subject: string;
  body: string;
  inReplyTo?: string;
  references?: string;
  threadId?: string;
  to: EmailAddress[];
  cc?: EmailAddress[];
  bcc?: EmailAddress[];
  replyTo?: EmailAddress;
}) {
  try {
    if (!this.token) {
      throw new Error("❌ No access token found. Please authenticate.");
    }

    const formatEmail = (email: EmailAddress) =>
      email.name ? `${email.name} <${email.address}>` : email.address;

    const emailLines = [];
    emailLines.push(`From: ${formatEmail(from)}`);
    emailLines.push(`To: ${to.map(formatEmail).join(", ")}`);
    if (cc?.length) emailLines.push(`Cc: ${cc.map(formatEmail).join(", ")}`);
    if (bcc?.length) emailLines.push(`Bcc: ${bcc.map(formatEmail).join(", ")}`);
    emailLines.push(`Subject: ${subject}`);
    if (replyTo) emailLines.push(`Reply-To: ${formatEmail(replyTo)}`);
    if (inReplyTo) emailLines.push(`In-Reply-To: ${inReplyTo}`);
    if (references) emailLines.push(`References: ${references}`);
    emailLines.push("Content-Type: text/html; charset=UTF-8");
    emailLines.push("");
    emailLines.push(body);

    const rawMessage = Buffer.from(emailLines.join("\r\n"))
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");

    const response = await axios.post(
      `https://www.googleapis.com/gmail/v1/users/me/messages/send`,
      { raw: rawMessage, threadId },
      {
        headers: {
          Authorization: `Bearer ${this.token}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("📩 Email sent:", response.data);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("❌ Error sending email:", JSON.stringify(error.response?.data, null, 2));
    } else {
      console.error("❌ Unexpected error:", error);
    }
  }
}
}
