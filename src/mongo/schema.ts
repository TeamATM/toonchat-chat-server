/* eslint-disable import/prefer-default-export */
import { Schema } from "mongoose";
import { Message } from "../message_queue/types";

export const messageSchema = new Schema<Message>({
    _id: String,
    replyMessageId: String,
    content: String,
    userId: String,
    characterId: Number,
    fromUser: Boolean,
    createdAt: Date,
});

messageSchema.index({ userId: 1, characterId: 1, createdAt: -1 });

// export const viewSchema = new Schema({
//     _id:{
//         userId: String,
//         characterName: String,
//     },
//     messages: [ String ],
// })
