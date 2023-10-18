import mongoose from "mongoose";
import {
    embeddingSchema, historySchema, messageSchema, characterSchema,
} from "./schema";
import {
    EmbeddingDocument, HistoryDocument, MessageDocument, CharacterDocument,
} from "./types";

export const MessageModel = mongoose.model<MessageDocument>("message", messageSchema);
export const HistoryModel = mongoose.model<HistoryDocument>("history", historySchema);
export const EmbeddingModel = mongoose.model<EmbeddingDocument>("embedding", embeddingSchema);
export const CharacterModel = mongoose.model<CharacterDocument>("persona", characterSchema);
