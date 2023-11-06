/* eslint-disable import/prefer-default-export */

import { PipelineStage } from "mongoose";
import { Service } from "typedi";
import { EmbeddingDocument } from "../types";
import { EmbeddingModel } from "../repository";
import { EnvConfig } from "../config";
import { EmbeddingService } from "./embeddingService";

@Service()
export class VectorSearchService {
    private maxReferenceLength;

    // eslint-disable-next-line no-unused-vars
    constructor(private embeddingService:EmbeddingService, envConfig:EnvConfig) {
        this.maxReferenceLength = envConfig.maxReferenceLength;
    }

    // eslint-disable-next-line arrow-body-style
    searchSimilarDocuments = async (userInput: string) => {
        return this.embeddingService.getEmbedding(userInput)
            .then(this.vectorSearch);
    };

    private vectorSearch = async (vector: number[]) => {
        const pipeline: PipelineStage[] = [
            {
                $search: {
                    index: "embeddingIndex",
                    knnBeta: {
                        vector,
                        path: "embeddingVector",
                        k: this.maxReferenceLength,
                    },
                },
            },
        ];
        return EmbeddingModel.aggregate<EmbeddingDocument>(pipeline);
    };
}
