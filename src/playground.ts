import { create,insert,search,type AnyOrama } from "@orama/orama";
import { db } from "./server/db";
import { OramaClient } from "./lib/orama";
import { turndown } from "./lib/turndown";
import { raw } from "@prisma/client/runtime/library";
import { getEmbeddings } from "./lib/embedding";

const orama = new OramaClient("107522701006355562124");
await orama.initialize();

// const emails = await db.email.findMany({
//     select:{
//         subject: true,
//         body: true,
//         from: true,
//         to: true,
//         sentAt: true,
//         threadId: true,
//         bodySnippet:true
//     }
// })

// for(const email of emails){
//     const body = turndown.turndown(email.body ?? email.bodySnippet ?? "")
//     const embeddings = await getEmbeddings(body);
//     console.log(embeddings.length);

//     await orama.insert({
//         subject:email.subject,
//         body:body || undefined,
//         rawBody:email.bodySnippet ?? "",
//         from:email.from.address,
//         to:email.to.map(to => to.address),
//         sentAt:email.sentAt.toLocaleString(),
//         threadId:email.threadId,
//         embeddings
//     })
// }

// await orama.saveIndex();

const searchResult = await orama.vectorSearch({
    term:"github"
})

for(const hit of searchResult.hits){
    console.log(hit.document.subject);
}

