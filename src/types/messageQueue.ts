import { Types } from "mongoose";
import { Channel, ConsumeMessage } from "amqplib";
import {
    CharacterDocument, HistoryDocument,
    MessageToClient, Chat,
} from ".";

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

export interface MessageFromInferenceServer extends MessageToClient {
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

export type PublishMessage = MessageToInferenceServer | MessageToClient;

// eslint-disable-next-line no-unused-vars
export type ConsumeMessageCallback = (channel: Channel, message: ConsumeMessage | null) => Promise<void>;

// eslint-disable-next-line no-unused-vars
export type SubscribeProcessType = (message: MessageFromInferenceServer) => Promise<boolean>;
