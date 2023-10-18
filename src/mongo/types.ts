import { ObjectId } from "mongoose";
import { Message } from "../message_queue/types";

export interface MessageDocument extends Document {
    _id: ObjectId,
    userId: string,
    characterId: number,
    date: Date,
    messages: Message[],
}

export interface HistoryDocument extends Document {
    _id: ObjectId,
    userId: string,
    characterId: number,
    messages: Message[],
}

export interface EmbeddingDocument extends Document {
    _id: ObjectId,
    sourceId: number,
    sourceDetail: string,
    text: string,
    embeddingVector: Array<number>,
}

export interface CharacterDocument extends Document {
    _id: number,
    characterName: string
    profileImageUrl: string,
    backgroundImageUrl: string,
    statusMessage: string,
    hashTag: string,
    persona: string[],
}
