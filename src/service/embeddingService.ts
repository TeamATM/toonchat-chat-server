/* eslint-disable import/prefer-default-export */
import assert from "assert";
import axios from "axios";
import fs from "fs";
import { PipelineStage } from "mongoose";
import { EmbeddingDocument } from "../types";
import { maxRefrenceLength, EmbeddingModel } from "../mongo";
import { EmbeddingRequestError } from "../exceptions";

const url = "https://api.openai.com/v1/embeddings";
const openaiKey = process.env.OPENAI_API_KEY;

assert(openaiKey);

async function vectorSearch(vector: number[]) {
    const pipeline: PipelineStage[] = [
        {
            $search: {
                index: "embeddingIndex",
                knnBeta: {
                    vector,
                    path: "embeddingVector",
                    k: maxRefrenceLength,
                },
            },
        },
    ];
    return EmbeddingModel.aggregate<EmbeddingDocument>(pipeline);
}

async function getEmbedding(query: string) {
    if (process.env.PROFILE !== "prod") return JSON.parse(fs.readFileSync("mockEmbedding.txt", { encoding: "utf-8" }));
    // openai embedding 사용
    const response = await axios.post(url, {
        input: query,
        model: "text-embedding-ada-002",
    }, {
        headers: {
            Authorization: `Bearer ${openaiKey}`,
            "Content-Type": "application/json",
        },
        timeout: 1000, // 1s
    });

    if (response.status !== 200) {
        throw new EmbeddingRequestError("요청을 처리하던 중 오류가 발생하였습니다.");
    }

    return response.data.data[0].embedding as Array<number>;
}

export async function searchSimilarDocuments(userInput: string) {
    return getEmbedding(userInput)
        .then(vectorSearch);
}
