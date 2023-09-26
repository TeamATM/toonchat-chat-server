import { ObjectId, Schema } from "mongoose";
import { Message } from "../message_queue/types";

export const messageSchema = new Schema<Message>({
    _id: Object,
    replyMessageId: Object,
    content: String,
    userId: String,
    characterId: Number,
    fromUser: Boolean,
    createdAt: Date,
    embeddingVector: Array<number>,
});

messageSchema.index({ userId: 1, characterId: 1, createdAt: -1 });

export interface EmbeddingDocument extends Document {
    _id: ObjectId,
    sourceId: number,
    sourceDetail: string,
    text: string,
    embeddingVector: Array<number>,
}

export const embeddingSchema = new Schema({
    _id: Object,
    sourceId: Number,
    sourceDetail: String,
    text: String,
    embeddingVector: Array,
});

export interface PersonaDocument extends Document {
    _id: ObjectId,
    characterId: number,
    persona: string[],
}

export const personaSchema = new Schema<PersonaDocument>({
    _id: Object,
    characterId: Number,
    persona: Array<string>,
});
