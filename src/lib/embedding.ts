import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function getEmbeddings(text:string) {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-embedding-exp-03-07"});        
        const result = await model.embedContent(text);
        return result.embedding.values;
    } catch (error) {
        console.error("Error calling Gemini embeddings API", error);
        throw error;
    }
}
