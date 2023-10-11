/* eslint-disable import/prefer-default-export */
import { PipelineStage } from "mongoose";
import { EmbeddingModel, EmbeddingDocument, maxRefrenceLength } from "../mongo";
import logger from "../logger";

// eslint-disable-next-line no-underscore-dangle
export async function _findSimilarDocuments(vector: number[]) {
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

    try {
        return await EmbeddingModel.aggregate<EmbeddingDocument>(pipeline);
    } catch (err) {
        logger.fatal(err, "failed to perform vector search");
        return undefined;
    }
}
