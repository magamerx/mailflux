import { Prisma } from "@prisma/client";
import { createTRPCRouter, privateProcedure } from "../trpc";
import { z } from "zod";
import { db } from "@/server/db";
import { a } from "node_modules/framer-motion/dist/types.d-B50aGbjN";

export const authoriseAccountAccess = async (
  accountId: string,
  userId: string,
) => {
  const account = await db.account.findFirst({
    where: { id: accountId, userId },
    select: { id: true, emailAddress: true, name: true, token: true },
  });

  if (!account) {
    throw new Error("Account not found");
  }

  return account;
};

export const accountRouter = createTRPCRouter({
  getAccounts: privateProcedure.query(async ({ ctx }) => {
    return await ctx.db.account.findMany({
      where: {
        userId: ctx.auth.userId,
      },
      select: {
        id: true,
        emailAddress: true,
        name: true,
      },
    });
  }),
  getNumThreads: privateProcedure
    .input(
      z.object({
        accountId: z.string(),
        tab: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const account = await authoriseAccountAccess(
        input.accountId,
        ctx.auth.userId,
      );

      let filter: Prisma.ThreadWhereInput = {};
      if (input.tab === "inbox") {
        filter.inboxStatus = true;
      } else if (input.tab === "draft") {
        filter.draftStatus = true;
      } else if (input.tab === "sent") {
        filter.sentStatus = true;
      }

      return await ctx.db.thread.count({
        where: {
          accountId: account.id,
          ...filter,
        },
      });
    }),
  getThreads: privateProcedure
    .input(
      z.object({
        accountId: z.string(),
        tab: z.string(),
        done: z.boolean(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const account = await authoriseAccountAccess(
        input.accountId,
        ctx.auth.userId,
      );

      let filter: Prisma.ThreadWhereInput = {
        accountId:input.accountId
      };
      if (input.tab === "inbox") {
        filter.inboxStatus = true;
      } else if (input.tab === "draft") {
        filter.draftStatus = true;
      } else if (input.tab === "sent") {
        filter.sentStatus = true;
      }

      filter.done = {
        equals: input.done,
      };

      return await ctx.db.thread.findMany({
        where: filter,
        include: {
          emails: {
            orderBy: {
              sentAt: "asc",
            },
            select: {
              from: true,
              subject: true,
              sentAt: true,
              bodySnippet: true,
              body: true,
              emailLabel: true,
              sysLabels: true,
              id: true,
            },
          },
        },
        take: 15,
        orderBy: {
          lastMessageDate: "desc",
        },
      });
    }),
    getSuggestions:privateProcedure.input(z.object({
      accountId:z.string()
    })).query(async ({ctx,input})=>{
      const account = await authoriseAccountAccess(input.accountId,ctx.auth.userId);

      return await ctx.db.emailAddress.findMany({
        where:{
          accountId:account.id
        },
        select:{
          address:true,
          name:true
        }
      })
    }),
    getReplyDetails:privateProcedure.input(z.object({
      accountId:z.string(),
      threadId:z.string()
    })).query(async ({ctx,input})=>{
      const account = await authoriseAccountAccess(input.accountId,ctx.auth.userId);

      const thread = await ctx.db.thread.findFirst({
        where:{
          id:input.threadId
        },
        include:{
          emails:{
            orderBy:{sentAt:"asc"},
            select:{
              from:true,
              to:true,
              cc:true,
              bcc:true,
              sentAt:true,
              subject:true,
              internetMessageId:true
            }
          }
        }
      })

      if (!thread || thread.emails.length === 0 ) {
        throw new Error("Thread not found");
      }

      const lastExternalEmail = thread.emails.reverse().find(email => email.from.address !== account.emailAddress);
      if (!lastExternalEmail) {
        throw new Error("No external email found");
      }

      return {
        subject:lastExternalEmail.subject,
        to:[lastExternalEmail.from,...lastExternalEmail.to.filter(to => to.address != account.emailAddress)],
        cc:lastExternalEmail.cc.filter(to => to.address != account.emailAddress),
        from:{name:account.name,address:account.emailAddress},
        id:lastExternalEmail.internetMessageId
      }
    })
});
