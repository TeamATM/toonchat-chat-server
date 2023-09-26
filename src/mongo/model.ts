import mongoose from "mongoose";
import {
    embeddingSchema, historySchema, messageSchema, personaSchema,
} from "./schema";
import {
    EmbeddingDocument, HistoryDocument, MessageDocument, PersonaDocument,
} from "./types";

export const MessageModel = mongoose.model<MessageDocument>("message", messageSchema);
export const HistoryModel = mongoose.model<HistoryDocument>("history", historySchema);
export const EmbeddingModel = mongoose.model<EmbeddingDocument>("embedding", embeddingSchema);
export const PersonaModel = mongoose.model<PersonaDocument>("persona", personaSchema);
