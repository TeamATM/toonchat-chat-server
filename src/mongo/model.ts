import mongoose from "mongoose";
import { Message } from "../message_queue/types";
import {
    EmbeddingDocument, PersonaDocument, embeddingSchema, messageSchema, personaSchema,
} from "./schema";

export const MessageModel = mongoose.model<Message>("message", messageSchema);
export const EmbeddingModel = mongoose.model<EmbeddingDocument>("embedding", embeddingSchema);
export const PersonaModel = mongoose.model<PersonaDocument>("persona", personaSchema);
