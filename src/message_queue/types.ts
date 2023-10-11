import { Types } from "mongoose";
import { MessageToClient } from "../socket/types";
import { HistoryDocument } from "../mongo/types";

export interface Chat {
    fromUser: boolean;
    content: string;
}

export interface Message extends Chat {
    messageId: Types.ObjectId;
    replyMessageId?: Types.ObjectId;
    createdAt: Date;
}

interface GenerationArgs {
    temperature: number;
    repetition_penalty: number;
}

interface DataForPrompt {
    persona: string;
    reference: string[];
    history: HistoryDocument;
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
