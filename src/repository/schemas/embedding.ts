import { Schema } from "mongoose";
import { EmbeddingDocument } from "../../types";

export const embeddingSchema = new Schema<EmbeddingDocument>({
    _id: Object,
    sourceId: Number,
    sourceDetail: String,
    text: String,
    embeddingVector: Array,
});
