import { Socket } from "socket.io";

export type TypeSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>

export interface ServerToClientEvents {
    subscribe: (message: MessageFromMQ) => void;
}

export interface ClientToServerEvents {
    publish: (message: string) => void;
}

export interface InterServerEvents {
    ping: () => void;
}

export interface SocketData {
    username: string;
    role: string;
    consumerTag: string;
}

export interface MessageFromMQ {
    messageId:string,
    replyMessageId?:string,
    status?:string,
    content:string,
    messageFrom:string,
    messageTo:string,
    characterName:string,
    createdAt:Date,
}

export interface Chat {
    id: string,
    userId: string,
    messageId: string,
    replyMessageId: string,
    status: string,
    content: string,
    messageFrom: string,
    messageTo: string,
    characterName: string,
    createdAt: string,
    doStream: boolean,
}

interface GenerationArgs {
    temperature: number,
    repetition_penalty: number,
}

interface CeleryArgs {
    history: Array<Chat>,
    userId: string,
    content: string,
    messageFrom: string,
    messageTo: string,
    characterName: string,
    generationArgs: GenerationArgs
}

export interface MessageToMQ {
    id: string,
    task: string,
    args: [CeleryArgs, boolean]
    kwargs: Map<string, string>
}