import { Schema } from "mongoose";
import { Message } from "../types";

export const messageSchema = new Schema<Message>({
    _id: String,
    replyMessageId: String,
    content: String,
    userId: String,
    characterId: Number,
    fromUser: Boolean,
    createdAt: Date,
    /**
     * TODO: status 제거
     */
    status: String,
});
messageSchema.index({userId: 1, characterId: 1, createdAt: -1});

// export const viewSchema = new Schema({
//     _id:{
//         userId: String,
//         characterName: String,
//     },
//     messages: [ String ],
// })