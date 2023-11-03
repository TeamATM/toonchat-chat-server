import { ObjectId } from "mongoose";

export interface EmbeddingDocument extends Document {
    _id: ObjectId;
    sourceId: number;
    sourceDetail: string;
    text: string;
    embeddingVector: Array<number>;
}
