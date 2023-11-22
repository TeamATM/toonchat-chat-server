import { Types } from "mongoose";
import { ConsumeMessage } from "amqplib";
import {
    CharacterDocument, HistoryDocument,
    ChatToClient, Chat,
} from ".";

export interface StoredChat extends Chat {
    messageId: Types.ObjectId;
    replyMessageId?: Types.ObjectId;
    createdAt: Date;
}

interface GenerationArgs {
    temperature: number;
    repetition_penalty: number;
}

interface DataForPrompt {
    greetingMessage?: string;
    persona: string;
    reference: string[];
    history: HistoryDocument;
    generationArgs: GenerationArgs;
}

export interface MessageFromInferenceServer extends ChatToClient {
    userId: string;
}

export interface MessageToInferenceServer {
    id: string;
    task: string;
    args: [DataForPrompt, boolean];
    kwargs: Map<string, string>;
}

export interface CharacterUpdateMessage extends CharacterDocument {
    op: string;
}

export type PublishMessage = MessageToInferenceServer | ChatToClient;

// eslint-disable-next-line no-unused-vars
export type ConsumeMessageCallback = (message: ConsumeMessage) => Promise<void>;

// eslint-disable-next-line no-unused-vars
export type SubscribeProcessType = (message: MessageFromInferenceServer) => Promise<boolean>;
