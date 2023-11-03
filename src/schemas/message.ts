import { Schema } from "mongoose";
import { MessageDocument, Message } from "../types";

export const messageSchema = new Schema<MessageDocument>({
    _id: Object,
    userId: String,
    characterId: Number,
    date: Date,
    messages: (Array<Message>),
});
