import { Schema } from "mongoose";
import { Message } from "../message_queue";
import {
    EmbeddingDocument, HistoryDocument, MessageDocument, CharacterDocument,
} from "./types";

export const messageSchema = new Schema<MessageDocument>({
    _id: Object,
    userId: String,
    characterId: Number,
    date: Date,
    messages: Array<Message>,
});

export const historySchema = new Schema<HistoryDocument>({
    _id: Object,
    userId: String,
    characterId: Number,
    messages: Array<Message>,
});

export const embeddingSchema = new Schema<EmbeddingDocument>({
    _id: Object,
    sourceId: Number,
    sourceDetail: String,
    text: String,
    embeddingVector: Array,
});

export const characterSchema = new Schema<CharacterDocument>({
    _id: Number,
    characterName: String,
    profileImageUrl: String,
    backgroundImageUrl: String,
    statusMessage: String,
    hashTag: String,
    persona: Array<string>,
});

messageSchema.index({ userId: 1, characterId: 1, date: 1 });
historySchema.index({ userId: 1, characterId: 1 });
embeddingSchema.index({ sourceId: 1 });

// async function applyIndex() {
//     MessageModel.syncIndexes();
//     HistoryModel.syncIndexes();
// }

// applyIndex();
