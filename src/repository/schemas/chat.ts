import { Schema } from "mongoose";
import { ChatDocument, StoredChat } from "../../types";

export const chatSchema = new Schema<ChatDocument>({
    _id: Object,
    userId: String,
    characterId: Number,
    date: Date,
    messages: (Array<StoredChat>),
});
