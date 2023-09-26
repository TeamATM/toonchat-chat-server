import axios from "axios";
import assert from "assert";
import logger from "./logger";

const url = "https://api.openai.com/v1/embeddings";
const openaiKey = process.env.OPENAI_API_KEY;

assert(openaiKey);

export function generateRandomId() : string {
    return Math.random().toString(36).substring(2, 10);
}

export async function getEmbedding(query:string) {
    // openai embedding 사용
    const response = await axios.post(url, {
        input: query,
        model: "text-embedding-ada-002",
    }, {
        headers: {
            Authorization: `Bearer ${openaiKey}`,
            "Content-Type": "application/json",
        },
    });

    if (response.status === 200) {
        return response.data.data[0].embedding as Array<number>;
    }

    logger.error(`Failed to get embedding. Status code: ${response.status}`);
    return undefined;
}
