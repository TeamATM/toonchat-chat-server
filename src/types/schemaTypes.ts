import { ObjectId } from "mongoose";
import { StoredChat } from "./messageQueue";

export interface CharacterDocument extends Document {
    _id: number;
    characterName: string;
    profileImageUrl: string;
    backgroundImageUrl: string;
    statusMessage: string;
    hashTag: string;
    persona: string[];
}

export interface ChatDocument extends Document {
    _id: ObjectId;
    userId: string;
    characterId: number;
    date: Date;
    messages: StoredChat[];
}

export interface EmbeddingDocument extends Document {
    _id: ObjectId;
    sourceId: number;
    sourceDetail: string;
    text: string;
    embeddingVector: Array<number>;
}

export interface HistoryDocument extends Document {
    _id: ObjectId;
    userId: string;
    characterId: number;
    messages: StoredChat[];
}
