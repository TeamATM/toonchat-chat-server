import { Schema } from "mongoose";
import { HistoryDocument, Message } from "../types";

export const historySchema = new Schema<HistoryDocument>({
    _id: Object,
    userId: String,
    characterId: Number,
    messages: (Array<Message>),
});
