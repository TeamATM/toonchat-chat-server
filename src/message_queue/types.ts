import { ObjectId } from "mongoose";
import { MessageToClient } from "../types";

export interface Chat {
    fromUser: boolean;
    content: string;
}

// 디비에 저장할 정보
export interface Message extends Document, Chat {
    _id: ObjectId;
    replyMessageId?: ObjectId;
    userId: string;
    characterId: number;
    createdAt: Date;
}

interface GenerationArgs {
    temperature: number;
    repetition_penalty: number;
}

interface DataForPrompt {
    userId: string;
    characterId: number;
    persona: string;
    reference: string[];
    history: Array<Chat>;
    content: string;
    generationArgs: GenerationArgs;
}

export interface MessageFromMQ extends MessageToClient {
    userId: string;
}

export interface MessageToAI {
    id: string;
    task: string;
    args: [DataForPrompt, boolean];
    kwargs: Map<string, string>;
}

export type PublishMessage = MessageToAI | MessageToClient;
